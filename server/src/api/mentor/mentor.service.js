const prisma = require("../../config/prisma");
const AppError = require("../../utils/AppError");
const { Prisma } = require("@prisma/client");

/**
 * Create a new mentor application
 * @param {Object} mentorData - Validated mentor application data
 * @returns {Promise<Object>} - Created mentor application document
 */
exports.createMentorApplication = async (mentorData) => {
  console.log("🔧 [Service] Creating mentor application...");
  console.log("🔧 [Service] Input data keys:", Object.keys(mentorData));

  try {
    // ✅ Directly create (DB handles uniqueness)
    const mentorApplication = await prisma.mentorApplication.create({
      data: {
        ...mentorData,
        status: "PENDING",
      },
    });

    console.log(
      "✅ [Service] Mentor application created successfully:",
      mentorApplication.id,
    );

    return mentorApplication;
  } catch (error) {
    console.error(
      "❌ [Service] Mentor creation error:",
      error?.message || error,
    );

    // ✅ Handle duplicate email (unique constraint)
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new AppError("An application with this email already exists", 409);
    }

    // ✅ Preserve AppError if thrown elsewhere
    if (error instanceof AppError) {
      throw error;
    }

    // fallback
    throw new AppError("Failed to create mentor application", 500);
  }
};

/**
 * Get a mentor application by ID
 */
exports.getMentorApplicationById = async (id) => {
  const mentorApplication = await prisma.mentorApplication.findUnique({
    where: { id },
  });

  if (!mentorApplication) {
    throw new AppError("Mentor application not found", 404);
  }

  return mentorApplication;
};

/**
 * Get all mentor applications (admin only)
 */
exports.getAllMentorApplications = async (filters = {}) => {
  const {
    status,
    skip = 0,
    take = 50,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = filters;

  const where = {};
  if (status) {
    where.status = status;
  }

  return await prisma.mentorApplication.findMany({
    where,
    skip: parseInt(skip),
    take: parseInt(take),
    orderBy: { [sortBy]: sortOrder },
  });
};

/**
 * Get mentor applications stats
 */
exports.getMentorApplicationsStats = async () => {
  const stats = await prisma.mentorApplication.groupBy({
    by: ["status"],
    _count: true,
  });

  const result = {};
  stats.forEach((stat) => {
    result[stat.status] = stat._count;
  });

  return result;
};

/**
 * Update mentor application status
 */
exports.updateMentorApplicationStatus = async (
  id,
  status,
  adminNotes = null,
) => {
  const validStatuses = ["PENDING", "REVIEWED", "APPROVED", "REJECTED", "HOLD"];

  if (!validStatuses.includes(status)) {
    throw new AppError(
      `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      400,
    );
  }

  const updatedApplication = await prisma.mentorApplication.update({
    where: { id },
    data: {
      status,
      adminNotes,
      updatedAt: new Date(),
    },
  });

  if (status === "APPROVED") {
    const user = await prisma.user.findUnique({
      where: { email: updatedApplication.email },
    });

    if (user) {
      if (user.role !== "MENTOR" && user.role !== "ADMIN") {
        await prisma.user.update({
          where: { email: updatedApplication.email },
          data: { role: "MENTOR" },
        });
      }
    }
  }

  return updatedApplication;
};

/**
 * Score mentor application
 */
exports.scoreMentorApplication = async (id, score) => {
  if (score < 0 || score > 100) {
    throw new AppError("Score must be between 0 and 100", 400);
  }

  return await prisma.mentorApplication.update({
    where: { id },
    data: {
      score,
      updatedAt: new Date(),
    },
  });
};

/**
 * Get high-quality mentors
 */
exports.getHighQualityMentors = async () => {
  return await prisma.mentorApplication.findMany({
    where: {
      AND: [{ status: "APPROVED" }, { score: { gte: 80 } }],
    },
    orderBy: { score: "desc" },
  });
};

/**
 * Delete mentor application
 */
exports.deleteMentorApplication = async (id) => {
  await prisma.mentorApplication.delete({
    where: { id },
  });
};
