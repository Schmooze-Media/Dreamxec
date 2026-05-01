const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const prisma = require('../config/prisma');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

/**
 * optionalAuth — attaches req.user if a valid JWT is present,
 * but NEVER blocks the request. Use for routes that serve both
 * authenticated users and guests (e.g. guest donations).
 */
exports.optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // no token — continue as guest
    }

    const token = authHeader.split(' ')[1];
    if (!token) return next();

    let decoded;
    try {
      decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    } catch {
      return next(); // invalid/expired token — continue as guest
    }

    let currentUser = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!currentUser) {
      currentUser = await prisma.donor.findUnique({ where: { id: decoded.id } });
      if (currentUser) currentUser.role = 'DONOR';
    }

    if (currentUser) req.user = currentUser;
  } catch {
    // silently ignore any unexpected errors — always let request through
  }
  next();
};

exports.protect = catchAsync(async (req, res, next) => {
  let token;

  // Extract token
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // --- PRODUCTION SAFE FIX ---
  // Do NOT throw noisy AppError. Return silent 401 JSON.
  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'Not logged in',
    });
  }

  // Verify token
  let decoded;
  try {
    decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid or expired token',
    });
  }

  // Find user or donor
  let currentUser = await prisma.user.findUnique({ where: { id: decoded.id } });

  if (!currentUser) {
    currentUser = await prisma.donor.findUnique({ where: { id: decoded.id } });
    if (currentUser) currentUser.role = 'DONOR';
  }

  // Token valid but user deleted (use AppError — real error)
  if (!currentUser) {
    return next(
      new AppError('The account belonging to this token no longer exists.', 401)
    );
  }

  // Attach user to request
  req.user = currentUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action.', 403)
      );
    }
    next();
  };
};
