const prisma = require("../../config/prisma");
const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/AppError");

// USER: Get their own profile
exports.getMe = catchAsync(async (req, res, next) => {
  // req.user is attached by the 'protect' middleware
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    // Exclude password from the result
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
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
          isVerified: true,
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
      role: true,
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

// ADMIN: Suspend a user (Example action)
// In a real app, you might add a 'status' field to the User model.
// For this example, we'll just log the action.
exports.suspendUser = catchAsync(async (req, res, next) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) {
    return next(new AppError("User not found", 404));
  }
  // Logic to suspend user goes here. For example, setting a `suspended` flag in the DB.
  console.log(`Admin ${req.user.id} suspended user ${req.params.id}`);
  res.status(200).json({
    status: "success",
    message: `User ${user.name} has been suspended.`,
  });
});

// ─────────────────────────────────────────────────────────────────
// PATCH /api/users/suppress-upgrade-card
//
// Permanently dismisses the role-upgrade prompt card on the
// ─────────────────────────────────────────────────────────────────

exports.suppressUpgradeCard = catchAsync(async (req, res, next) => {
  const { id, role } = req.user;

  // Admins don't have an upgrade card to dismiss ──
  if (role === "ADMIN") {
    return next(new AppError("Admins do not have a role-upgrade card.", 400));
  }

  // Determine which Prisma model to update ──
  // Donor model covers: DONOR, ALUMNI (donors who upgraded)
  // User model covers: USER, STUDENT_PRESIDENT, MENTOR
  const isDonorModel = role === "DONOR" || role === "ALUMNI";

  if (isDonorModel) {
    const donor = await prisma.donor.findUnique({
      where: { id },
      select: { id: true, suppressUpgradeCard: true },
    });

    if (!donor) {
      return next(new AppError("Donor profile not found.", 404));
    }

    // Idempotent — already suppressed, just return success ──
    if (donor.suppressUpgradeCard) {
      return res.status(200).json({
        status: "success",
        message: "Upgrade card is already dismissed.",
        data: { suppressUpgradeCard: true },
      });
    }

    await prisma.donor.update({
      where: { id },
      data: { suppressUpgradeCard: true },
    });
  } else {
    // USER, STUDENT_PRESIDENT, MENTOR → User table
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, suppressUpgradeCard: true },
    });

    if (!user) {
      return next(new AppError("User profile not found.", 404));
    }

    // Idempotent — already suppressed ──
    if (user.suppressUpgradeCard) {
      return res.status(200).json({
        status: "success",
        message: "Upgrade card is already dismissed.",
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
    message:
      "Upgrade card dismissed successfully. It will no longer appear on your dashboard.",
    data: { suppressUpgradeCard: true },
  });
});
