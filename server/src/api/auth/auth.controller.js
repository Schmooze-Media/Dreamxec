const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const EVENTS = require("../../config/events");
const { promisify } = require("util");
const prisma = require("../../config/prisma");
const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/AppError");
const sendEmail = require("../../services/email.service");
const { publishEvent } = require("../../services/eventPublisher.service");
const { Roles } = require("../../rbac");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const signVerificationToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_VERIFICATION_SECRET, {
    expiresIn: process.env.JWT_VERIFICATION_EXPIRES_IN,
  });
};

const signPasswordResetToken = (email) => {
  return jwt.sign({ email }, process.env.JWT_PASSWORD_RESET_SECRET, {
    expiresIn: process.env.JWT_PASSWORD_RESET_EXPIRES_IN,
  });
};

const createAndSendToken = (user, statusCode, res) => {
  const token = signToken(user.id);

  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

const linkDonorToUser = async (donorId) => {
  const donor = await prisma.donor.findUnique({ where: { id: donorId } });
  if (!donor) return;

  const user = await prisma.user.findUnique({ where: { email: donor.email } });
  if (!user) return;

  const roleToAdd =
    donor.subscriptionStatus === "PREMIUM" ? Roles.PREMIUM_DONOR : Roles.DONOR;

  if (!donor) return;

  if (!user) return;

  await prisma.user.update({
    where: { id: user.id },
    data: { roles: { push: roleToAdd } },
  });
};

// 1. REGISTRATION
exports.register = catchAsync(async (req, res, next) => {
  const { name, email, password, role, organizationName } = req.body;

  const hashedPassword = await bcrypt.hash(password, 12);

  let newAccount;
  let accountType;

  const verificationToken = signVerificationToken(email);
  const verificationTokenExpiry = new Date(Date.now() + 10 * 60 * 1000);

  // =========================
  // DONOR REGISTRATION
  // =========================
  if (role === "DONOR") {
    const existingDonor = await prisma.donor.findUnique({
      where: { email },
    });

    if (existingDonor) {
      return next(new AppError("Email already exists", 400));
    }

    newAccount = await prisma.donor.create({
      data: {
        name,
        email,
        password: hashedPassword,
        organizationName: organizationName || null,
        verificationToken,
        verificationTokenExpiry,
      },
    });

    accountType = "DONOR";
  } else {
    // =========================
    // USER REGISTRATION
    // =========================
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return next(new AppError("Email already exists", 400));
    }

    newAccount = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        roles: [role || "USER"],
        verificationToken,
        verificationTokenExpiry,
      },
    });

    accountType = role || "USER";
  }

  // =========================
  // AUTO LINK DONATIONS
  // =========================
  await prisma.donation.updateMany({
    where: {
      guestEmail: email,
      donorId: null,
    },
    data: {
      donorId: newAccount.id,
    },
  });

  if (accountType === "DONOR") {
    await linkDonorToUser(newAccount.id);
  } else {
    const existingDonorRecord = await prisma.donor.findUnique({
      where: { email },
    });

    if (existingDonorRecord) {
      await linkDonorToUser(existingDonorRecord.id);
    }
  }

  // =========================
  // UNIFIED ROLE OUTPUT
  // =========================
  const roles =
    accountType === "DONOR" ? ["DONOR"] : newAccount.roles || ["USER"];

  const responseAccount = {
    id: newAccount.id,
    email: newAccount.email,
    name: newAccount.name,
    roles,
  };

  try {
    await publishEvent(EVENTS.EMAIL_VERIFICATION, {
      email: newAccount.email,
      name: newAccount.name,
      verificationUrl: `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`,
    });

    return res.status(201).json({
      status: "success",
      message:
        "Registration successful! Please check your email to verify your account.",
      data: {
        account: responseAccount,
      },
    });
  } catch (err) {
    console.error("Email sending error:", err);

    return res.status(201).json({
      status: "success",
      message: "Registration successful! You can now log in.",
      data: {
        account: responseAccount,
      },
    });
  }
});

// 2. EMAIL VERIFICATION
exports.verifyEmail = catchAsync(async (req, res, next) => {
  const { token } = req.query;

  if (!token) {
    return next(new AppError("Verification token is missing!", 400));
  }

  try {
    const decoded = await promisify(jwt.verify)(
      token,
      process.env.JWT_VERIFICATION_SECRET,
    );

    let account = await prisma.user.findUnique({
      where: { email: decoded.id },
    });

    let accountType = "user";

    if (!account) {
      account = await prisma.donor.findUnique({
        where: { email: decoded.id },
      });

      accountType = "donor";
    }

    if (!account) {
      return next(new AppError("Account not found.", 404));
    }

    if (
      account.verificationTokenExpiry &&
      new Date() > account.verificationTokenExpiry
    ) {
      return next(
        new AppError(
          "Verification token has expired. Please request a new one.",
          400,
        ),
      );
    }

    if (account.emailVerified) {
      return res.redirect(
        `${process.env.CLIENT_URL}/email-verified?status=already`,
      );
    }

    if (accountType === "user") {
      await prisma.user.update({
        where: { id: account.id },
        data: {
          emailVerified: true,
          verificationToken: null,
          verificationTokenExpiry: null,
        },
      });
    } else {
      await prisma.donor.update({
        where: { id: account.id },
        data: {
          emailVerified: true,
          verificationToken: null,
          verificationTokenExpiry: null,
        },
      });
    }

    await publishEvent(EVENTS.USER_WELCOME, {
      email: account.email,
      name: account.name,
      dashboardUrl: `${process.env.CLIENT_URL}/dashboard`,
    });

    res.redirect(`${process.env.CLIENT_URL}/email-verified?status=success`);
  } catch (err) {
    return next(new AppError("Invalid or expired verification token", 400));
  }
});

// 3. LOGIN
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  let account = await prisma.user.findUnique({
    where: { email },
  });

  let accountType = "user";

  if (!account) {
    account = await prisma.donor.findUnique({
      where: { email },
    });

    accountType = "donor";
  }

  if (
    !account ||
    !account.password ||
    !(await bcrypt.compare(password, account.password))
  ) {
    publishEvent(EVENTS.SECURITY_ALERT, {
      email,
      action: "LOGIN_FAILED",
      reason: "Incorrect credentials",
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    }).catch(console.error);

    return next(new AppError("Incorrect email or password", 401));
  }

  // ✅ normalize roles WITHOUT mutating DB object
  const roles = accountType === "donor" ? ["DONOR"] : account.roles || ["USER"];

  const responsePayload = {
    ...account,
    roles,
    accountType,
  };

  createAndSendToken(responsePayload, 200, res);
});

// 4. GOOGLE OAUTH CALLBACK
exports.googleCallback = catchAsync(async (req, res, next) => {
  try {
    if (!req.user) {
      console.error("Google callback: no user on req");

      return next(
        new AppError(
          "Authentication failed: no user returned from Google",
          401,
        ),
      );
    }

    console.log("Google callback user:", {
      id: req.user.id,
      email: req.user.email,
      googleId: req.user.googleId,
    });

    const token = signToken(req.user.id);

    console.log("Google callback generated token for user", req.user.id);

    res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
  } catch (err) {
    console.error("Error in googleCallback:", err);

    return next(new AppError("Authentication failed", 500));
  }
});

// 4b. LINKEDIN OAUTH CALLBACK
exports.linkedinCallback = catchAsync(async (req, res, next) => {
  try {
    if (!req.user) {
      console.error("LinkedIn callback: no user on req");

      return next(
        new AppError(
          "Authentication failed: no user returned from LinkedIn",
          401,
        ),
      );
    }

    console.log("LinkedIn callback user:", {
      id: req.user.id,
      email: req.user.email,
      linkedinId: req.user.linkedinId,
    });

    let role = "USER";

    if (req.query.state) {
      try {
        const state = JSON.parse(decodeURIComponent(req.query.state));

        role = state.role || "USER";

        console.log("LinkedIn callback: extracted role from state:", role);
      } catch (err) {
        console.warn("LinkedIn callback: failed to parse state:", err.message);
      }
    }

    // FIXED: use role not roles
    if (req.user.role !== "USER") {
      req.user.role = "USER";
    }

    const token = signToken(req.user.id);

    console.log("LinkedIn callback generated token for user", req.user.id);

    res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
  } catch (err) {
    console.error("Error in linkedinCallback:", err);

    return next(new AppError("Authentication failed", 500));
  }
});

// 5. FORGOT PASSWORD
exports.forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  let account = await prisma.user.findUnique({
    where: { email },
  });

  let accountType = "user";

  if (!account) {
    account = await prisma.donor.findUnique({
      where: { email },
    });

    accountType = "donor";
  }

  if (!account) {
    return next(
      new AppError("There is no account with that email address.", 404),
    );
  }

  if (!account.password) {
    return next(
      new AppError(
        "This account was created with Google. Please log in with Google.",
        400,
      ),
    );
  }

  const resetToken = signPasswordResetToken(email);

  const resetPasswordExpiry = new Date(Date.now() + 10 * 60 * 1000);

  if (accountType === "user") {
    await prisma.user.update({
      where: { id: account.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpiry,
      },
    });
  } else {
    await prisma.donor.update({
      where: { id: account.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpiry,
      },
    });
  }

  const resetURL = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

  try {
    await publishEvent(EVENTS.PASSWORD_RESET_REQUEST, {
      email: account.email,
      name: account.name,
      resetUrl: resetURL,
    });

    res.status(200).json({
      status: "success",
      message: "Password reset link sent to your email!",
    });
  } catch (err) {
    if (accountType === "user") {
      await prisma.user.update({
        where: { id: account.id },
        data: {
          resetPasswordToken: null,
          resetPasswordExpiry: null,
        },
      });
    } else {
      await prisma.donor.update({
        where: { id: account.id },
        data: {
          resetPasswordToken: null,
          resetPasswordExpiry: null,
        },
      });
    }

    console.error(err);

    return next(
      new AppError(
        "There was an error sending the email. Please try again later.",
        500,
      ),
    );
  }
});

// 6. RESET PASSWORD
exports.resetPassword = catchAsync(async (req, res, next) => {
  const { token } = req.query;
  const { password } = req.body;

  if (!token) {
    return next(new AppError("Reset token is missing!", 400));
  }

  if (!password) {
    return next(new AppError("Please provide a new password!", 400));
  }

  let decoded;

  try {
    decoded = await promisify(jwt.verify)(
      token,
      process.env.JWT_PASSWORD_RESET_SECRET,
    );
  } catch (err) {
    return next(new AppError("Invalid or expired reset token!", 400));
  }

  let account = await prisma.user.findUnique({
    where: { email: decoded.email },
  });

  let accountType = "user";

  if (!account) {
    account = await prisma.donor.findUnique({
      where: { email: decoded.email },
    });

    accountType = "donor";
  }

  if (!account) {
    return next(new AppError("Account not found.", 404));
  }

  if (account.resetPasswordToken !== token) {
    return next(new AppError("Invalid reset token!", 400));
  }

  if (
    !account.resetPasswordExpiry ||
    account.resetPasswordExpiry < new Date()
  ) {
    return next(
      new AppError("Reset token has expired. Please request a new one.", 400),
    );
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  if (accountType === "user") {
    await prisma.user.update({
      where: { id: account.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpiry: null,
      },
    });
  } else {
    await prisma.donor.update({
      where: { id: account.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpiry: null,
      },
    });
  }

  if (accountType === "user") {
    account = await prisma.user.findUnique({
      where: { id: account.id },
    });
  } else {
    account = await prisma.donor.findUnique({
      where: { id: account.id },
    });
  }

  createAndSendToken(account, 200, res);
});

// 7. GET CURRENT USER
exports.getMe = catchAsync(async (req, res, next) => {
  if (!req.user) {
    return next(new AppError("You are not logged in.", 401));
  }

  const user = { ...req.user };
  console.log("getMe - current user:", user);
  user.password = undefined;

  res.status(200).json({
    status: "success",
    data: { user },
  });
});
