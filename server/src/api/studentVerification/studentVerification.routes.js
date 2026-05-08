const express = require("express");
const multer = require("multer");
const { protect } = require("../../middleware/auth.middleware");
const { requirePermission, Permissions } = require("../../rbac");
const {
  verify,
  createOrder,
  getAllStudentVerifications,   
  approveStudentVerification, 
  rejectStudentVerification,  
} = require("./studentverfication.controller");

const router = express.Router();

/* ────────────────────────────── */
/* Multer configuration */
/* ────────────────────────────── */
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
});

/* ────────────────────────────── */
/* All routes are protected */
/* ────────────────────────────── */
router.use(protect);

/**
 * Create Razorpay Order
 * REQUIREMENTS:
 * - User logged in
 * - Email OTP verified
 * - WhatsApp OTP verified
 */
router.post("/create-order", createOrder);

/**
 * Submit student verification
 * REQUIREMENTS:
 * - User logged in
 * - Email OTP verified
 * - WhatsApp OTP verified
 * - Payment completed
 * - Document uploaded
 */
router.post(
  "/verify",
  upload.single("document"),
  verify
);

router.get(
  "/admin/all",
  requirePermission(Permissions.WELFARE_MANAGE),
  getAllStudentVerifications
);

router.patch(
  "/admin/:id/approve",
  requirePermission(Permissions.WELFARE_MANAGE),
  approveStudentVerification
);

router.patch(
  "/admin/:id/reject",
  requirePermission(Permissions.WELFARE_MANAGE),
  rejectStudentVerification
);

module.exports = router;
