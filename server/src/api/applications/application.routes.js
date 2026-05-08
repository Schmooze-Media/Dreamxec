const express = require('express');
const applicationController = require('./application.controller');
const { protect } = require('../../middleware/auth.middleware');
const { requirePermission, Permissions } = require('../../rbac');
const validate = require('../../middleware/validate.middleware');
const {
  applyToDonorProjectSchema,
  updateApplicationStatusSchema,
} = require('./application.validation');

const router = express.Router();

// All routes require authentication
router.use(protect);

// STUDENT routes (USER role)
router.post(
  '/',
  requirePermission(Permissions.DONOR_PROJECT_APPLY),
  validate(applyToDonorProjectSchema),
  applicationController.applyToDonorProject
);

router.get(
  '/my',
  requirePermission(Permissions.DONOR_PROJECT_APPLY),
  applicationController.getMyApplications
);

router.delete(
  '/:applicationId',
  requirePermission(Permissions.DONOR_PROJECT_APPLY),
  applicationController.withdrawApplication
);

// DONOR routes
router.get(
  '/donor/all',
  requirePermission(Permissions.DONOR_PROJECT_APPS_VIEW),
  applicationController.getApplicationsForMyProjects
);

router.get(
  '/donor/project/:projectId',
  requirePermission(Permissions.DONOR_PROJECT_APPS_VIEW),
  applicationController.getApplicationsForProject
);

router.patch(
  '/:applicationId/status',
  requirePermission(Permissions.DONOR_PROJECT_APPS_VIEW),
  validate(updateApplicationStatusSchema),
  applicationController.updateApplicationStatus
);

module.exports = router;
