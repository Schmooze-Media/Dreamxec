const express = require('express');
const projectController = require('./project.controller');
const { protect } = require('../../middleware/auth.middleware');
const { requirePermission, Permissions } = require('../../rbac');
const validate = require('../../middleware/validate.middleware');
const {
  createProjectSchema,
  updateProjectSchema,
  verifyProjectSchema,
} = require('./project.validation');

const router = express.Router();

// PUBLIC routes (no authentication required)
router.get('/public', projectController.getPublicProjects);
router.get('/:id', projectController.getProject);

// Protected routes (authentication required)
router.use(protect);

// User's own projects
router.get('/my-projects', projectController.getMyProjects);

// Create a new project
router.post(
  '/',
  requirePermission(Permissions.CAMPAIGN_CREATE),
  validate(createProjectSchema),
  projectController.createProject
);

// Update/delete user's own project
router
  .route('/:id/my-project')
  .put(
    requirePermission(Permissions.CAMPAIGN_OWN_EDIT),
    validate(updateProjectSchema),
    projectController.updateMyProject
  )
  .delete(requirePermission(Permissions.CAMPAIGN_OWN_EDIT), projectController.deleteMyProject);

// ADMIN routes
router.get(
  '/admin/all',
  requirePermission(Permissions.CAMPAIGN_VIEW),
  projectController.getAllProjectsForAdmin
);

router.patch(
  '/:id/verify',
  requirePermission(Permissions.CAMPAIGN_APPROVE),
  validate(verifyProjectSchema),
  projectController.verifyProject
);

module.exports = router;