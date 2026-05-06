const prisma = require("../../config/prisma");
const AppError = require("../../utils/AppError");
const { Prisma } = require("@prisma/client");

// ...existing functions above...

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

  // 1. Update the mentor application status
  const updatedApplication = await prisma.mentorApplication.update({
    where: { id },
    data: {
      status,
      adminNotes,
      updatedAt: new Date(),
    },
  });

  // 2. ✅ Wire approval → add MENTOR role to user ($addToSet equivalent)
  if (status === "APPROVED") {
    const user = await prisma.user.findUnique({
      where: { email: updatedApplication.email },
    });

    if (user) {
      // Only update if not already MENTOR or ADMIN (don't downgrade)
      if (user.role !== "MENTOR" && user.role !== "ADMIN") {
        await prisma.user.update({
          where: { email: updatedApplication.email },
          data: { role: "MENTOR" },
        });
      }
    }
    // If no user found — applicant hasn't signed up yet, skip silently
  }

  return updatedApplication;
};
