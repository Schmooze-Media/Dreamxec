const express = require("express");
const router = express.Router();

const { protect } = require("../../middleware/auth.middleware");
const { requirePermission, Permissions } = require("../../rbac");
const {
  listVerifications,
  getVerification,
  approveVerification,
  rejectVerification,
} = require("./adminClubVerification.controller");

router.use(protect, requirePermission(Permissions.CLUB_VERIFY));

router.get("/verifications", listVerifications);
router.get("/verifications/:id", getVerification);
router.post("/verifications/:id/approve", approveVerification);
router.post("/verifications/:id/reject", rejectVerification);

module.exports = router;
