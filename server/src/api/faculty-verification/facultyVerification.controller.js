const crypto = require('crypto');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/AppError');
const prisma = require('../../config/prisma');
const { Roles } = require('../../rbac');
const sendEmail = require('../../services/email.service');
// Assuming you have a redis client exported, or adjust to match your redis.service.js
const redisClient = require('../../services/redis.service');

// 1. Send OTP
// 1. Send OTP
exports.sendFacultyOtp = catchAsync(async (req, res, next) => {
    const { institutionalEmail } = req.body;

    if (!institutionalEmail) {
        return next(new AppError('Please provide your institutional email.', 400));
    }

    const isEduDomain = institutionalEmail.endsWith('.edu') || institutionalEmail.endsWith('.ac.in') || institutionalEmail.endsWith('.edu.in');
    if (!isEduDomain) {
        return next(new AppError('Please use a valid institutional email (.edu or .ac.in)', 400));
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP in Redis (expires in 1 day / 86400 seconds)
    const redisKey = `faculty_otp:${req.user.id}:${institutionalEmail}`;
    await redisClient.setEx(redisKey, 86400, otp);

    // 🔥 DEV MODE: Print the OTP to the terminal so you can test the UI!
    console.log(`\n========================================`);
    console.log(`🎓 [DEV] FACULTY OTP: ${otp}`);
    console.log(`========================================\n`);

    try {
        // Attempt to send the email
        await sendEmail({
            email: institutionalEmail,
            subject: 'DreamXec - Verify your Faculty Account',
            message: `Your verification code is: ${otp}. It will expire in 24 hours.`,
            html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2 style="color: #003366;">DreamXec Faculty Verification</h2>
          <p>Your verification code is: <strong style="font-size: 24px; color: #FF7F00;">${otp}</strong></p>
          <p>This code will expire in <strong>24 hours</strong>.</p>
        </div>
      `
        });
    } catch (error) {
        // If SendGrid fails (like Maximum Credits Exceeded), we log it but DO NOT crash.
        console.warn("⚠️ SendGrid blocked the email, but the OTP was saved to Redis successfully.");
    }

    // Always tell the frontend it was successful so the UI moves to the OTP input box
    res.status(200).json({
        status: 'success',
        message: 'OTP processed. Check your email (or server terminal in Dev Mode).'
    });
});

// 2. Verify OTP & Upgrade Role
exports.verifyFacultyOtp = catchAsync(async (req, res, next) => {
    const { institutionalEmail, otp } = req.body;

    if (!institutionalEmail || !otp) {
        return next(new AppError('Please provide both email and OTP.', 400));
    }

    const redisKey = `faculty_otp:${req.user.id}:${institutionalEmail}`;
    const storedOtp = await redisClient.get(redisKey);

    if (!storedOtp || storedOtp !== otp) {
        return next(new AppError('Invalid or expired OTP.', 400));
    }

    // OTP is valid! Upgrade the user's role using the RBAC array
    const updatedUser = await prisma.user.update({
        where: { id: req.user.id },
        data: {
            roles: { push: Roles.FACULTY },
        }
    });

    // Log the action for security audits
    await prisma.auditLog.create({
        data: {
            action: 'FACULTY_VERIFIED',
            entity: 'User',
            entityId: req.user.id,
            performedBy: req.user.id,
            details: { emailUsed: institutionalEmail }
        }
    });

    // Clean up Redis
    await redisClient.del(redisKey);

    res.status(200).json({
        status: 'success',
        message: 'Faculty identity verified successfully!',
        roles: updatedUser.roles
    });
});

// 3. Send Magic Link Invite (For Presidents & Donors)
exports.sendFacultyInvite = catchAsync(async (req, res, next) => {
  const { facultyEmail } = req.body;
  const inviter = req.user;

  if (!facultyEmail) {
    return next(new AppError('Please provide the faculty member\'s email.', 400));
  }

  // Generate a secure, 64-character URL-safe magic token
  const magicToken = crypto.randomBytes(32).toString('hex');

  // Payload: We remember who sent this, and what club they belong to
  const inviteData = {
    inviterId: inviter.id,
    clubId: inviter.clubId || null, 
    email: facultyEmail.toLowerCase()
  };

  // Save to Redis (Expires in 48 hours = 172800 seconds)
  const redisKey = `faculty_invite:${magicToken}`;
  await redisClient.setEx(redisKey, 172800, JSON.stringify(inviteData));

  // Build the frontend URL
  const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
  const inviteLink = `${CLIENT_URL}/join/faculty?token=${magicToken}`;
  
  // Send the Email
  await sendEmail({
    email: facultyEmail,
    subject: 'DreamXec - Invitation to become a Faculty Advisor',
    message: `You have been invited to join DreamXec as a verified Faculty member. Click here to accept: ${inviteLink}`,
    html: `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2 style="color: #003366;">DreamXec Faculty Invitation</h2>
        <p>You have been invited by <strong>${inviter.name}</strong> to join DreamXec as a Verified Faculty Member.</p>
        <p>This will give you the authority to review and officially approve student fundraising campaigns.</p>
        <div style="margin: 30px 0;">
          <a href="${inviteLink}" style="background-color: #FF7F00; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 6px;">
            Accept Faculty Role
          </a>
        </div>
        <p style="font-size: 12px; color: #666;">This link expires in 48 hours.</p>
      </div>
    `
  });

  res.status(200).json({ 
    status: 'success', 
    message: 'Magic link invitation sent to the faculty member!' 
  });
});

// 4. Consume Magic Link (For the Faculty Member)
exports.acceptFacultyInvite = catchAsync(async (req, res, next) => {
  const { token } = req.body;
  const targetUser = req.user; // The professor who is currently logged in

  if (!token) return next(new AppError('No token provided.', 400));

  // 1. Fetch token from Redis
  const redisKey = `faculty_invite:${token}`;
  const inviteDataString = await redisClient.get(redisKey);

  if (!inviteDataString) {
    return next(new AppError('This invitation link is invalid or has expired.', 400));
  }

  const inviteData = JSON.parse(inviteDataString);

  // 2. Strict Security: Ensure they are logged in with the email that was invited!
  if (targetUser.email.toLowerCase() !== inviteData.email.toLowerCase()) {
    return next(new AppError(`Security Error: This invitation was sent to ${inviteData.email}, but you are logged in as ${targetUser.email}. Please switch accounts.`, 403));
  }

  // 3. Grant the Role & Association
  const updateData = { roles: { push: 'FACULTY' } };
  
  // If the inviter was a Student President with a club, automatically link the professor to that club
  if (inviteData.clubId && !targetUser.clubId) {
    updateData.clubId = inviteData.clubId;
  }

  const updatedUser = await prisma.user.update({
    where: { id: targetUser.id },
    data: updateData
  });

  // 4. BURN THE TOKEN! (So it can never be used again)
  await redisClient.del(redisKey);

  // 5. Audit Log
  await prisma.auditLog.create({
    data: { 
      action: 'FACULTY_MAGIC_LINK_ACCEPTED', 
      entity: 'User',
      entityId: targetUser.id,
      performedBy: targetUser.id,
      details: { invitedBy: inviteData.inviterId, clubLinked: inviteData.clubId }
    }
  });

  res.status(200).json({ 
    status: 'success', 
    message: 'Welcome to the Faculty! You now have campaign approval rights.',
    roles: updatedUser.roles
  });
});