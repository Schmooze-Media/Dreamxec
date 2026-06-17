const cron = require("node-cron");
const prisma = require("../config/prisma");

cron.schedule("0 * * * *", async () => {
  // To check for projects ready to transition from Launch Phase to milestone 1
  console.log("Running launch phase cron...");

  const now = new Date();

  const expiredLaunchPhases = await prisma.userProject.findMany({
    where: {
      lpIsActive: true,
      lpEndDate: { lte: now },
    },
    include: {
      milestones: {
        orderBy: { order: "asc" },
        take: 1,
      },
    },
  });

  for (const project of expiredLaunchPhases) {
    try {
      await prisma.$transaction(async (tx) => {
        await tx.userProject.update({
          where: { id: project.id },
          data: {
            currentMilestone: 1,
            lpIsActive: false,
          },
        });

        const firstMilestone = project.milestones[0];
        if (firstMilestone) {
          const dueDate = new Date();
          dueDate.setDate(now.getDate() + firstMilestone.durationDays);

          await tx.milestone.update({
            where: { id: firstMilestone.id },
            data: {
              activatedAt: now,
              dueDate: dueDate,
              status: "PENDING",
              reminder3Sent: false,
              reminder1Sent: false,
              overdueSent: false,
              ratingPenaltyDays: 0,
            },
          });
        }
      });

      console.log(`Project ${project.id} transitioned to Milestone 1`);
    } catch (err) {
      console.error(` Transition error for project ${project.id}:`, err);
    }
  }
});
