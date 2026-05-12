const express = require('express');
const router = express.Router();
const authController = require('../../middleware/auth.middleware');
const facultyVerificationController = require('./facultyVerification.controller');
const { requirePermission, Permissions } = require('../../rbac');

const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// Both routes require the user to be logged in as a normal user first
router.post('/submit-request', authController.protect, upload.single('idCard'), facultyVerificationController.submitFacultyRequest);
// NEW: Magic Link Routes
// 1. Sending is restricted to people who have the FACULTY_APPROVE permission (Admins, Presidents, Donors)
router.post(
  '/invite', 
  authController.protect, 
  requirePermission(Permissions.FACULTY_APPROVE), 
  facultyVerificationController.sendFacultyInvite
);

// 2. Accepting just requires the professor to be logged into their base USER account
router.post(
  '/accept-invite', 
  authController.protect, 
  facultyVerificationController.acceptFacultyInvite
);

module.exports = router;