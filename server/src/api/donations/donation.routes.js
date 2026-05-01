const express = require('express');
const donationController = require('./donation.controller');
const { protect, optionalAuth, restrictTo } = require('../../middleware/auth.middleware');


const router = express.Router();

// PUBLIC ROUTES 
// optionalAuth: attaches req.user if logged in, but lets guests through too
router.post('/create-order', optionalAuth, donationController.createOrder);  
router.post('/verify', donationController.verifyPayment);
router.post('/webhook', donationController.razorpayWebhook);


// AUTHENTICATED ROUTES  
router.get('/my', protect, donationController.getMyDonations);                    
router.get('/project/:projectId', protect, donationController.getProjectDonations);
router.get('/summary', protect, donationController.getDonationSummary);           // 🔥 REMOVE restrictTo('DONOR')
router.get(
  "/me/eligibility",
  protect,
  restrictTo("DONOR"),
  donationController.getMyEligibility
);

module.exports = router;
