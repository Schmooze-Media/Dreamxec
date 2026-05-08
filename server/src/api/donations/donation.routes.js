const express = require('express');
const donationController = require('./donation.controller');
const { protect } = require('../../middleware/auth.middleware');
const { requirePermission, Permissions } = require('../../rbac');

const router = express.Router();

// PUBLIC ROUTES 
router.post('/create-order', protect, donationController.createOrder);  
router.post('/verify', donationController.verifyPayment);
router.post('/webhook', donationController.razorpayWebhook);

// AUTHENTICATED ROUTES  
router.get('/my', protect, donationController.getMyDonations);                    
router.get('/project/:projectId', protect, donationController.getProjectDonations);
router.get('/summary', protect, donationController.getDonationSummary);           // 🔥 REMOVE restrictTo('DONOR')
router.get(
  "/me/eligibility",
  protect,
  requirePermission(Permissions.DONATION_MAKE),
  donationController.getMyEligibility
);

module.exports = router;
