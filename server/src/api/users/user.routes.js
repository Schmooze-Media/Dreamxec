const express = require("express");
const userController = require("./user.controller");
const { activateRole } = require("../../rbac//activaterole.controler");
const { suppressUpgradeCard } = require("../../api/users/suppressUpgradeCard");
const { protect, restrictTo } = require("../../middleware/auth.middleware");

const router = express.Router();

router.use(protect);

// USER routes
router.get("/me", userController.getMe);

// ── Role activation (self-service) ──
router.post("/activate-role", activateRole);

// ── Dismiss / suppress the role-upgrade prompt card ──
router.patch("/suppress-upgrade-card", suppressUpgradeCard);

// ADMIN routes
router.use(restrictTo("ADMIN"));

router.get("/", userController.getAllUsers);
router.patch("/:id/suspend", userController.suspendUser); // Example admin action

module.exports = router;
