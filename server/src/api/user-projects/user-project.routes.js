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

const { protect } = require('../../middleware/auth.middleware');
const { requirePermission, Permissions } = require('../../rbac');
const validate = require('../../middleware/validate.middleware');
const {
  createUserProjectSchema,
  updateUserProjectSchema,
  submitMilestoneSchema,
} = require('./user-project.validation');

// 🟢 Import the new middleware
const { validateCampaignEligibility, resolveCampaignClub } = require('../../middleware/club.middleware');

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
router.get('/analytics', protect, requirePermission(Permissions.CAMPAIGN_VIEW), getStudentAnalytics);
router.get('/my',protect, requirePermission(Permissions.CAMPAIGN_VIEW),getMyUserProjects);
/* ---------------------------
   PUBLIC ROUTES
---------------------------- */
router.get('/public', getPublicUserProjects);
router.get('/:id', getUserProject);

/* ---------------------------
   AUTHENTICATED ROUTES
---------------------------- */
router.use(protect);


// 🚀 CREATE CAMPAIGN
router.post(
  '/',
  requirePermission(Permissions.CAMPAIGN_CREATE), // 1. Must have campaign create permission
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
  requirePermission(Permissions.CAMPAIGN_OWN_EDIT),
  validateCampaignEligibility, // (Optional: Keep strict check on updates too)
  validate(updateUserProjectSchema),
  updateUserProject
);

// DELETE CAMPAIGN
router.delete(
  '/:id',
  requirePermission(Permissions.CAMPAIGN_OWN_EDIT),
  validateCampaignEligibility,
  deleteUserProject
);

router.patch(
  "/milestones/:milestoneId/submit",
  protect,
  requirePermission(Permissions.MILESTONE_SUBMIT),
  validate(submitMilestoneSchema),
  submitMilestone
);



module.exports = router;
