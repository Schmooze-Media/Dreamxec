const express = require('express');
const donorProjectController = require('./donor-project.controller');
const { protect } = require('../../middleware/auth.middleware');
const { requirePermission, Permissions } = require('../../rbac');
const validate = require('../../middleware/validate.middleware');
const {
  createDonorProjectSchema,
  updateDonorProjectSchema,
} = require('./donor-project.validation');

const router = express.Router();

// PUBLIC routes (no authentication required)
router.get('/public', donorProjectController.getPublicDonorProjects);

// Protected routes (authentication required)
router.use(protect);

// DONOR routes - /my must come before /:id to avoid treating 'my' as an id
router.get('/my', requirePermission(Permissions.DONOR_PROJECT_CREATE), donorProjectController.getMyDonorProjects);

router.post(
  '/',
  requirePermission(Permissions.DONOR_PROJECT_CREATE),
  validate(createDonorProjectSchema),
  donorProjectController.createDonorProject
);

router.put(
  '/:id',
  requirePermission(Permissions.DONOR_PROJECT_CREATE),
  validate(updateDonorProjectSchema),
  donorProjectController.updateDonorProject
);

router.delete(
  '/:id',
  requirePermission(Permissions.DONOR_PROJECT_CREATE),
  donorProjectController.deleteDonorProject
);

// This must come after /my to avoid conflicts
router.get('/:id', donorProjectController.getDonorProject);

module.exports = router;
