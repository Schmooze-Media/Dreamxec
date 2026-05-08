const express = require("express");
const mentorController = require("./mentor.controller");
const { protect } = require("../../middleware/auth.middleware");
const { requirePermission, Permissions } = require("../../rbac");

const router = express.Router();

// ==========================================
// PUBLIC ROUTES (No auth required)
// ==========================================

/**
 * POST /api/mentor
 * Submit a new mentor application
 */
router.post("/", mentorController.submitMentorApplication);

// ==========================================
// PROTECTED ROUTES (Admin only)
// ==========================================

// Protect all routes below
router.use(protect);
router.use(requirePermission(Permissions.ALL));

/**
 * GET /api/mentor/stats/overview
 * Get mentor application statistics
 */
router.get("/stats/overview", mentorController.getMentorApplicationStats);

/**
 * GET /api/mentor/quality/high
 * Get high-quality mentors (approved with score >= 80)
 */
router.get("/quality/high", mentorController.getHighQualityMentors);

/**
 * GET /api/mentor
 * Get all mentor applications with filters
 * Query params: status, skip, take, sortBy, sortOrder
 */
router.get("/", mentorController.getAllMentorApplications);

/**
 * GET /api/mentor/:id
 * Get a specific mentor application
 */
router.get("/:id", mentorController.getMentorApplication);

/**
 * PATCH /api/mentor/:id/status
 * Update mentor application status
 * Body: { status: "PENDING|REVIEWED|APPROVED|REJECTED", adminNotes?: string }
 */
router.patch("/:id/status", mentorController.updateMentorApplicationStatus);

/**
 * PATCH /api/mentor/:id/approve
 * Approve mentor application and assign role
 */
router.patch("/:id/approve", mentorController.approveMentorApplication);

/**
 * PATCH /api/mentor/:id/score
 * Score a mentor application
 * Body: { score: number (0-100) }
 */
router.patch("/:id/score", mentorController.scoreMentorApplication);

/**
 * DELETE /api/mentor/:id
 * Delete a mentor application
 */
router.delete("/:id", mentorController.deleteMentorApplication);

module.exports = router;
