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

// ADMIN: Suspend user
exports.suspendUser = catchAsync(async (req, res, next) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
  });

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  console.log(`Admin ${req.user.id} suspended user ${req.params.id}`);

  res.status(200).json({
    status: "success",
    message: `User ${user.name} has been suspended.`,
  });
});

// PATCH /api/users/suppress-upgrade-card
exports.suppressUpgradeCard = catchAsync(async (req, res, next) => {
  const { id, role } = req.user;

  if (role === "ADMIN") {
    return next(new AppError("Admins do not have a role-upgrade card.", 400));
  }

  const isDonorModel = role === "DONOR" || role === "ALUMNI";

  if (isDonorModel) {
    const donor = await prisma.donor.findUnique({
      where: { id },

      select: {
        id: true,
        suppressupgradecard: true,
      },
    });

    if (!donor) {
      return next(new AppError("Donor profile not found.", 404));
    }

    if (donor.suppressupgradecard) {
      return res.status(200).json({
        status: "success",
        message: "Upgrade card already dismissed.",
        data: {
          suppressupgradecard: true,
        },
      });
    }

    await prisma.donor.update({
      where: { id },

      data: {
        suppressupgradecard: true,
      },
    });
  } else {
    const user = await prisma.user.findUnique({
      where: { id },

      select: {
        id: true,
        suppressupgradecard: true,
      },
    });

    if (!user) {
      return next(new AppError("User profile not found.", 404));
    }

    if (user.suppressupgradecard) {
      return res.status(200).json({
        status: "success",
        message: "Upgrade card already dismissed.",
        data: {
          suppressupgradecard: true,
        },
      });
    }

    await prisma.user.update({
      where: { id },

      data: {
        suppressupgradecard: true,
      },
    });
  }

  return res.status(200).json({
    status: "success",
    message: "Upgrade card dismissed successfully.",
    data: {
      suppressupgradecard: true,
    },
  });
});
