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
  
  // Security: Force the application email to match the logged-in user
  const payload = { ...req.body, email: req.user.email, name: req.user.name };

  // Check if they already have a pending or approved application
  const existingApp = await prisma.mentorApplication.findUnique({
    where: { email: req.user.email }
  });

  if (existingApp && ['PENDING', 'APPROVED'].includes(existingApp.status)) {
    return next(new AppError(`You already have an application that is ${existingApp.status}.`, 400));
  }

  // Validate request data
  const { error, value } = validateMentorApplication(payload);

  if (error) {
    console.error("❌ Validation error:", error.message);
    return next(
      new AppError(
        error.message || error.details?.[0]?.message || "Validation failed",
        400,
      ),
    );
  }

  try {
    const mentorApplication = await mentorService.createMentorApplication(value);

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
    if (error instanceof AppError) return next(error);
    return next(new AppError(error.message || "Failed to submit mentor application", 500));
  }
});

/**
 * Get the logged-in user's application status (USER ONLY)
 * GET /api/mentor/my-application
 */
exports.getMyApplication = catchAsync(async (req, res, next) => {
  const application = await prisma.mentorApplication.findUnique({
    where: { email: req.user.email }
  });

  res.status(200).json({
    success: true,
    data: application || null
  });
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
    status, skip, take, sortBy, sortOrder,
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
  res.status(200).json({ success: true, data: stats });
});

/**
 * Update mentor application status & assign RBAC roles (admin only)
 * PATCH /api/mentor/:id/status
 */
exports.updateMentorApplicationStatus = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { status, adminNotes } = req.body;

  if (!status) {
    return next(new AppError("Status is required", 400));
  }

  // ENFORCE SPEC: Rejection requires 20+ chars of reasoning
  if (status === 'REJECTED' && (!adminNotes || adminNotes.trim().length < 20)) {
    return next(new AppError('Rejection requires an admin note of at least 20 characters.', 400));
  }

  // Update the application status via your service
  const updatedApplication = await mentorService.updateMentorApplicationStatus(
    id,
    status,
    adminNotes,
  );

  // ENFORCE SPEC: If Approved, grant the MENTOR role to the user's RBAC array
  if (status === 'APPROVED') {
    const user = await prisma.user.findUnique({ where: { email: updatedApplication.email } });
    
    // Only push if they don't already have it
    if (user && !user.roles.includes(Roles.MENTOR)) {
      await prisma.user.update({
        where: { email: updatedApplication.email },
        data: { roles: { push: Roles.MENTOR } }
      });
    }
  }

  res.status(200).json({
    success: true,
    message: `Mentor application marked as ${status}`,
    data: updatedApplication,
  });
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

  const updatedApplication = await mentorService.scoreMentorApplication(id, score);

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