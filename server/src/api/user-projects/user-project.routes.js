
const express = require('express');
const router = express.Router();
const { approveByFaculty, createUserProject, updateUserProject, deleteUserProject, getUserProject, getPublicUserProjects, getMyUserProjects, getStudentAnalytics, submitMilestone } = require('./user-project.controller');
const { protect, restrictTo } = require('../../middleware/auth.middleware');
const validate = require('../../middleware/validate.middleware');
const { createUserProjectSchema, updateUserProjectSchema, submitMilestoneSchema } = require('./user-project.validation');
const { validateCampaignEligibility, resolveCampaignClub } = require('../../middleware/club.middleware');
const multer = require('multer');
const catchAsync = require('../../utils/catchAsync');

// Multer config
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB
  },
});

// Faculty/ADMIN campaign approval
router.patch(
  '/:id/faculty-approve',
  protect,
  restrictTo('FACULTY', 'ADMIN'),
  approveByFaculty
);

// Student's own campaigns
router.get('/analytics', protect, restrictTo('USER', 'STUDENT_PRESIDENT'), getStudentAnalytics);
router.get('/my', protect, restrictTo('USER', 'STUDENT_PRESIDENT'), getMyUserProjects);

// Public routes
router.get('/public', getPublicUserProjects);
router.get('/:id', getUserProject);

// Authenticated routes
router.use(protect);


// CREATE CAMPAIGN
router.post(
  '/',
  restrictTo('USER', 'STUDENT_PRESIDENT'),
  upload.fields([
    { name: "bannerFile", maxCount: 1 },
    { name: "mediaFiles", maxCount: 10 },
    { name: "teamImages", maxCount: 20 },
  ]),
  validateCampaignEligibility,
  resolveCampaignClub,
  validate(createUserProjectSchema),
  createUserProject
);

// UPDATE CAMPAIGN
router.put(
  '/:id',
  restrictTo('USER', 'STUDENT_PRESIDENT'),
  validateCampaignEligibility,
  validate(updateUserProjectSchema),
  updateUserProject
);

// DELETE CAMPAIGN
router.delete(
  '/:id',
  restrictTo('USER', 'STUDENT_PRESIDENT'),
  validateCampaignEligibility,
  deleteUserProject
);

// Submit milestone
router.patch(
  "/milestones/:milestoneId/submit",
  protect,
  restrictTo('USER', 'STUDENT_PRESIDENT'),
  validate(submitMilestoneSchema),
  submitMilestone
);

module.exports = router;
