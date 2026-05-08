const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/AppError");
const { validateMentorApplication } = require("./mentor.validation");
const mentorService = require("./mentor.service");
const prisma = require("../../config/prisma");
const { Roles } = require("../../rbac");

/**
 * Submit a new mentor application
 * POST /api/mentor
 */
exports.submitMentorApplication = catchAsync(async (req, res, next) => {
  console.log("📝 Mentor form submission received");
  console.log("Request body keys:", Object.keys(req.body));

  // Validate request data
  const { error, value } = validateMentorApplication(req.body);

  if (error) {
    console.error("❌ Validation error:", error.message);
    return next(
      new AppError(
        error.message || error.details?.[0]?.message || "Validation failed",
        400,
      ),
    );
  }

  console.log("✅ Validation passed");

  try {
    // Create mentor application in database
    const mentorApplication =
      await mentorService.createMentorApplication(value);

    console.log("✅ Created mentor application:", mentorApplication.id);

    // Return success response
    res.status(201).json({
      success: true,
      message: "Mentor application submitted successfully",
      data: {
        id: mentorApplication.id,
        email: mentorApplication.email,
        name: mentorApplication.name,
        status: mentorApplication.status,
        createdAt: mentorApplication.createdAt,
      },
    });
  } catch (error) {
    console.error("❌ Submission error:", error);
    if (error instanceof AppError) {
      return next(error);
    }

    return next(
      new AppError(error.message || "Failed to submit mentor application", 500),
    );
  }
});

/**
 * Get a specific mentor application (admin only)
 * GET /api/mentor/:id
 */
exports.getMentorApplication = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const mentorApplication = await mentorService.getMentorApplicationById(id);

  res.status(200).json({
    success: true,
    data: mentorApplication,
  });
});

/**
 * Get all mentor applications with filters (admin only)
 * GET /api/mentor
 */
exports.getAllMentorApplications = catchAsync(async (req, res, next) => {
  const { status, skip, take, sortBy, sortOrder } = req.query;

  const mentorApplications = await mentorService.getAllMentorApplications({
    status,
    skip,
    take,
    sortBy,
    sortOrder,
  });

  res.status(200).json({
    success: true,
    count: mentorApplications.length,
    data: mentorApplications,
  });
});

/**
 * Get mentor application statistics (admin only)
 * GET /api/mentor/stats/overview
 */
exports.getMentorApplicationStats = catchAsync(async (req, res, next) => {
  const stats = await mentorService.getMentorApplicationsStats();

  res.status(200).json({
    success: true,
    data: stats,
  });
});

/**
 * Update mentor application status (admin only)
 * PATCH /api/mentor/:id/status
 */
exports.updateMentorApplicationStatus = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { status, adminNotes } = req.body;

  if (!status) {
    return next(new AppError("Status is required", 400));
  }

  const updatedApplication = await mentorService.updateMentorApplicationStatus(
    id,
    status,
    adminNotes,
  );

  res.status(200).json({
    success: true,
    message: "Mentor application status updated",
    data: updatedApplication,
  });
});

/**
 * Approve a mentor application and assign role
 * PATCH /api/mentor/:id/approve
 */
exports.approveMentorApplication = catchAsync(async (req, res, next) => {
  const app = await prisma.mentorApplication.update({
    where: { id: req.params.id },
    data: { status: 'APPROVED' }
  });

  // Push MENTOR role onto the matching User account
  await prisma.user.updateMany({
    where: { email: app.email },
    data: { roles: { push: Roles.MENTOR } }
  });

  res.json({ success: true });
});

/**
 * Score a mentor application (admin only)
 * PATCH /api/mentor/:id/score
 */
exports.scoreMentorApplication = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { score } = req.body;

  if (score === undefined) {
    return next(new AppError("Score is required", 400));
  }

  const updatedApplication = await mentorService.scoreMentorApplication(
    id,
    score,
  );

  res.status(200).json({
    success: true,
    message: "Mentor application scored",
    data: updatedApplication,
  });
});

/**
 * Get high-quality mentors (admin only)
 * GET /api/mentor/quality/high
 */
exports.getHighQualityMentors = catchAsync(async (req, res, next) => {
  const mentors = await mentorService.getHighQualityMentors();

  res.status(200).json({
    success: true,
    count: mentors.length,
    data: mentors,
  });
});

/**
 * Delete a mentor application (admin only)
 * DELETE /api/mentor/:id
 */
exports.deleteMentorApplication = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  await mentorService.deleteMentorApplication(id);

  res.status(200).json({
    success: true,
    message: "Mentor application deleted",
  });
});
