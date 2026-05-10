const prisma = require("../../config/prisma");
const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/AppError");

// USER: Get their own profile
exports.getMe = catchAsync(async (req, res, next) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },

    select: {
      id: true,
      email: true,
      name: true,
      roles: true, // Updated from legacy 'role'
      emailVerified: true,
      studentVerified: true,
      clubVerified: true,
      clubIds: true,

      clubs: {
        select: {
          id: true,
          name: true,
          college: true,
          description: true,
        },
      },

      createdAt: true,
    },
  });

  res.status(200).json({
    status: "success",
    data: { user },
  });
});

// ADMIN: Get all users
exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      roles: true, // Updated from legacy 'role'
      emailVerified: true,
      createdAt: true,
    },
  });

  res.status(200).json({
    status: "success",
    results: users.length,
    data: { users },
  });
});

// ADMIN: Suspend user
exports.suspendUser = catchAsync(async (req, res, next) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
  });

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  // Update accountStatus in database
  await prisma.user.update({
    where: { id: req.params.id },
    data: { accountStatus: 'SUSPENDED' }
  });

  console.log(`Admin ${req.user.id} suspended user ${req.params.id}`);

  res.status(200).json({
    status: "success",
    message: `User ${user.name} has been suspended.`,
  });
});

// ─────────────────────────────────────────────────
// POST /api/users/activate-role
// ─────────────────────────────────────────────────
exports.activateRole = catchAsync(async (req, res, next) => {
  const { role } = req.body;
  const userId = req.user.id;

  if (!['ALUMNI', 'MENTOR'].includes(role)) {
    return next(new AppError('Invalid role activation requested.', 400));
  }

  // 1. ALUMNI PATH (Instant Activation)
  if (role === 'ALUMNI') {
    const donorProfile = await prisma.donor.findUnique({ where: { id: userId } });
    if (!donorProfile) return next(new AppError('Donor profile required.', 404));

    const currentYear = new Date().getFullYear();
    const isEligible = Boolean(
      donorProfile.institution?.trim() && 
      donorProfile.graduationYear && 
      donorProfile.graduationYear < currentYear
    );

    if (!isEligible) {
      return next(new AppError('You do not meet the criteria for Alumni status.', 403));
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { roles: { push: 'ALUMNI' } } 
    });

    return res.status(200).json({
      status: 'success',
      message: 'Alumni role activated successfully.',
      roles: updatedUser.roles
    });
  }

  // 2. MENTOR PATH (Does NOT grant role, just preps the UI/Intent)
  if (role === 'MENTOR') {
    const existingApp = await prisma.mentorApplication.findUnique({ 
      where: { email: req.user.email } 
    });
    
    if (existingApp && existingApp.status === 'PENDING') {
      return next(new AppError('You already have a pending mentor application.', 400));
    }

    return res.status(200).json({
      status: 'success',
      message: 'Proceed to Mentorship application.',
      applicationStatus: existingApp?.status || 'NOT_STARTED'
    });
  }
});


// ─────────────────────────────────────────────────
// PATCH /api/users/suppress-upgrade-card
// ─────────────────────────────────────────────────
exports.suppressUpgradeCard = catchAsync(async (req, res, next) => {
  const { id } = req.user;
  const roles = req.user.roles || []; // Updated to use roles array

  if (roles.includes("ADMIN")) {
    return next(new AppError("Admins do not have a role-upgrade card.", 400));
  }

  const isDonorModel = roles.includes("DONOR") || roles.includes("ALUMNI");

  if (isDonorModel) {
    const donor = await prisma.donor.findUnique({
      where: { id },
      select: {
        id: true,
        suppressUpgradeCard: true, // Corrected to camelCase
      },
    });

    if (!donor) {
      return next(new AppError("Donor profile not found.", 404));
    }

    if (donor.suppressUpgradeCard) {
      return res.status(200).json({
        status: "success",
        message: "Upgrade card already dismissed.",
        data: { suppressUpgradeCard: true },
      });
    }

    await prisma.donor.update({
      where: { id },
      data: { suppressUpgradeCard: true },
    });

  } else {
    // Standard User Model
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        suppressUpgradeCard: true, // Corrected to camelCase
      },
    });

    if (!user) {
      return next(new AppError("User profile not found.", 404));
    }

    if (user.suppressUpgradeCard) {
      return res.status(200).json({
        status: "success",
        message: "Upgrade card already dismissed.",
        data: { suppressUpgradeCard: true },
      });
    }

    await prisma.user.update({
      where: { id },
      data: { suppressUpgradeCard: true },
    });
  }

  return res.status(200).json({
    status: "success",
    message: "Upgrade card dismissed successfully.",
    data: {
      suppressUpgradeCard: true,
    },
  });
});