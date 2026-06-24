const express = require('express');
const router = express.Router();

const {
  createUserProject,
  updateUserProject,
  deleteUserProject,
  getUserProject,
  getPublicUserProjects,
  getMyUserProjects,
  getStudentAnalytics,
  submitMilestone,
} = require('./user-project.controller');

const { protect, restrictTo } = require('../../middleware/auth.middleware');
const validate = require('../../middleware/validate.middleware');
const {
  createUserProjectSchema,
  updateUserProjectSchema,
  submitMilestoneSchema,
} = require('./user-project.validation');

const transferRoutes = require('./transfers/transfer.routes');

// 🟢 Import the new middleware
const { validateCampaignEligibility, resolveCampaignClub } = require('../../middleware/club.middleware');
const { checkTransferLock } = require('../../middleware/transferLock.middleware');

const multer = require('multer');
const catchAsync = require('../../utils/catchAsync');

/* ---------------------------
   MULTER CONFIG
---------------------------- */
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB
  },
});

// Student's own campaigns
router.get('/analytics', protect, restrictTo('USER', 'STUDENT_PRESIDENT'), getStudentAnalytics);
router.get('/my',protect, restrictTo('USER', 'STUDENT_PRESIDENT'),getMyUserProjects);
/* ---------------------------
   PUBLIC ROUTES
---------------------------- */
router.get('/public', getPublicUserProjects);
router.get('/:id', getUserProject);

/* ---------------------------
   AUTHENTICATED ROUTES
   ---------------------------- */
   router.use(protect);
   
   router.use('/transfers', transferRoutes);
   router.use('/:id/transfers', transferRoutes);

// 🚀 CREATE CAMPAIGN
router.post(
  '/',
  restrictTo('USER', 'STUDENT_PRESIDENT'),           // 1. Must be a User
  upload.fields([
    { name: "bannerFile", maxCount: 1 },
    { name: "mediaFiles", maxCount: 10 },
    { name: "teamImages", maxCount: 20 }, // 🟢 NEW
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
  validateCampaignEligibility, // (Optional: Keep strict check on updates too)
  checkTransferLock,
  validate(updateUserProjectSchema),
  updateUserProject
);

// DELETE CAMPAIGN
router.delete(
  '/:id',
  restrictTo('USER', 'STUDENT_PRESIDENT'),
  validateCampaignEligibility,
  checkTransferLock,
  deleteUserProject
);

router.patch(
  "/milestones/:milestoneId/submit",
  protect,
  restrictTo('USER', 'STUDENT_PRESIDENT'),
  checkTransferLock,
  validate(submitMilestoneSchema),
  submitMilestone
);




module.exports = router;
