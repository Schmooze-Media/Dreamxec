const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const prisma = require("../config/prisma");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");

exports.protect = catchAsync(async (req, res, next) => {
  let token;

  // 1. Extract token
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(new AppError("Not logged in", 401));
  }

  // 2. Verify token
  let decoded;
  try {
    decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  } catch (err) {
    return next(new AppError("Invalid or expired token", 401));
  }

  // 3. Find user
  let currentUser = await prisma.user.findUnique({
    where: { id: decoded.id },
  });

  // 4. If not found → check donor
  if (!currentUser) {
    const donor = await prisma.donor.findUnique({
      where: { id: decoded.id },
    });

    if (donor) {
      // Map donor → user-like object with role
      currentUser = {
        ...donor,
        role:
          donor.subscriptionStatus === "PREMIUM" ? "PREMIUM_DONOR" : "DONOR",
      };
    }
  }

  // 5. If still not found
  if (!currentUser) {
    return next(
      new AppError(
        "The account belonging to this token no longer exists.",
        401,
      ),
    );
  }

  // ✅ IMPORTANT: only role, NO roles[]
  req.user = currentUser;

  next();
});
exports.restrictTo = (...allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.user?.role;

    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({
        status: "error",
        message: "You do not have permission to perform this action.",
      });
    }

    next();
  };
};
