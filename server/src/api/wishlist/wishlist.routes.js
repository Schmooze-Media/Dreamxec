const express = require('express');
const router = express.Router();
const wishlistController = require('./wishlist.controller');
const { protect } = require('../../middleware/auth.middleware');
const { requirePermission, Permissions } = require('../../rbac');

// All routes are protected and restricted to DONOR
router.use(protect);
router.use(requirePermission(Permissions.WISHLIST_MANAGE));

router.post('/toggle', wishlistController.toggleWishlist);
router.get('/', wishlistController.getMyWishlist);
router.get('/check/:campaignId', wishlistController.checkWishlistStatus);

module.exports = router;
