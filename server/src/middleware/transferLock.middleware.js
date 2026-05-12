const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

exports.checkTransferLock = catchAsync(async (req, res, next) => {
  let projectId;

  if (req.params.id) {
    projectId = req.params.id;
  } else if (req.params.milestoneId) {
    const milestone = await prisma.milestone.findUnique({
      where: { id: req.params.milestoneId },
      select: { projectId: true },
    });
    if (!milestone) return next(new AppError('Milestone not found', 404));
    projectId = milestone.projectId;
  } else {
    // If no identifiable parameter, let the controller handle validation
    return next();
  }

  // Determine if it's a UserProject or DonorProject
  // Currently, transfers are only for UserProjects
  const project = await prisma.userProject.findUnique({
    where: { id: projectId },
    select: { transferStatus: true },
  });

  if (!project) {
    return next(); // Pass down to controller to return 404
  }

  if (project.transferStatus !== 'NONE') {
    return next(
      new AppError(
        'Campaign is currently locked due to an active ownership transfer. Please wait until the transfer is resolved.',
        423 // 423 Locked
      )
    );
  }

  next();
});
