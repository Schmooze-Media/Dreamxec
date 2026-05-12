const crypto = require("crypto");
const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/AppError");
const prisma = require("../../config/prisma");
const { Roles } = require("../../rbac");
const sendEmail = require("../../services/email.service");
// Assuming you have a redis client exported, or adjust to match your redis.service.js
const redisClient = require("../../services/redis.service");
const uploadToS3 = require("../../utils/uploadToS3");

// 1. Submit Faculty Request
exports.submitFacultyRequest = catchAsync(async (req, res, next) => {
  const { institutionalEmail } = req.body;

  if (!institutionalEmail) {
    return next(new AppError("Please provide your institutional email.", 400));
  }

  if (!req.file) {
    return next(new AppError("Please upload an ID card.", 400));
  }

  const isEduDomain =
    institutionalEmail.endsWith(".edu") ||
    institutionalEmail.endsWith(".ac.in") ||
    institutionalEmail.endsWith(".edu.in");
  if (!isEduDomain) {
    return next(
      new AppError(
        "Please use a valid institutional email (.edu or .ac.in)",
        400,
      ),
    );
  }

  // Upload the ID card to S3
  const idCardUrl = await uploadToS3(req.file, "dreamxec/faculty-verification");

  // Create a pending FacultyVerification request for the Admin to approve
  await prisma.facultyVerification.upsert({
    where: { userId: req.user.id },
    update: {
      institutionalEmail,
      facultyIdCardUrl: idCardUrl || "",
      status: "PENDING",
    },
    create: {
      userId: req.user.id,
      institutionalEmail,
      facultyIdCardUrl: idCardUrl || "",
      status: "PENDING",
    },
  });

  // Log the action for security audits
  await prisma.auditLog.create({
    data: {
      action: "FACULTY_VERIFICATION_REQUESTED",
      entity: "User",
      entityId: req.user.id,
      performedBy: req.user.id,
      details: { emailUsed: institutionalEmail },
    },
  });

  res.status(200).json({
    status: "success",
    message: "Verification request submitted for admin approval!",
  });
});

// 3. Send Magic Link Invite (For Presidents & Donors)
exports.sendFacultyInvite = catchAsync(async (req, res, next) => {
  const { facultyEmail } = req.body;
  const inviter = req.user;

  if (!facultyEmail) {
    return next(
      new AppError("Please provide the faculty member's email.", 400),
    );
  }

  // Generate a secure, 64-character URL-safe magic token
  const magicToken = crypto.randomBytes(32).toString("hex");

  // Payload: We remember who sent this, and what club they belong to
  const inviteData = {
    inviterId: inviter.id,
    clubId: inviter.clubId || null,
    email: facultyEmail.toLowerCase(),
  };

  // Save to Redis (Expires in 48 hours = 172800 seconds)
  const redisKey = `faculty_invite:${magicToken}`;
  await redisClient.setEx(redisKey, 172800, JSON.stringify(inviteData));

  // Build the frontend URL
  const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
  const inviteLink = `${CLIENT_URL}/join/faculty?token=${magicToken}`;

  // Send the Email
  await sendEmail({
    email: facultyEmail,
    subject: "DreamXec - Invitation to become a Faculty Advisor",
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
    `,
  });

  res.status(200).json({
    status: "success",
    message: "Magic link invitation sent to the faculty member!",
  });
});

// 4. Consume Magic Link (For the Faculty Member)
exports.acceptFacultyInvite = catchAsync(async (req, res, next) => {
  const { token } = req.body;
  const targetUser = req.user; // The professor who is currently logged in

  if (!token) return next(new AppError("No token provided.", 400));

  // 1. Fetch token from Redis
  const redisKey = `faculty_invite:${token}`;
  const inviteDataString = await redisClient.get(redisKey);

  if (!inviteDataString) {
    return next(
      new AppError("This invitation link is invalid or has expired.", 400),
    );
  }

  const inviteData = JSON.parse(inviteDataString);

  // 2. Strict Security: Ensure they are logged in with the email that was invited!
  if (targetUser.email.toLowerCase() !== inviteData.email.toLowerCase()) {
    return next(
      new AppError(
        `Security Error: This invitation was sent to ${inviteData.email}, but you are logged in as ${targetUser.email}. Please switch accounts.`,
        403,
      ),
    );
  }

  // 3. Grant the Role & Association
  const updateData = { roles: { push: "FACULTY" } };

  // If the inviter was a Student President with a club, automatically link the professor to that club
  if (inviteData.clubId && !targetUser.clubId) {
    updateData.clubId = inviteData.clubId;
  }

  const updatedUser = await prisma.user.update({
    where: { id: targetUser.id },
    data: {
      ...updateData,
      facultyVerified: true,
    },
  });

  // 4. BURN THE TOKEN! (So it can never be used again)
  await redisClient.del(redisKey);

  // 5. Audit Log
  await prisma.auditLog.create({
    data: {
      action: "FACULTY_MAGIC_LINK_ACCEPTED",
      entity: "User",
      entityId: targetUser.id,
      performedBy: targetUser.id,
      details: {
        invitedBy: inviteData.inviterId,
        clubLinked: inviteData.clubId,
      },
    },
  });

  res.status(200).json({
    status: "success",
    message: "Welcome to the Faculty! You now have campaign approval rights.",
    role: updatedUser.role,
  });
});
