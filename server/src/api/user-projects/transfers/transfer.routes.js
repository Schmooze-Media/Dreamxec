const express = require('express');
const transferController = require('./transfer.controller');
const authMiddleware = require('../../../middleware/auth.middleware');

const router = express.Router({ mergeParams: true });

// Protect all routes
router.use(authMiddleware.protect);

// Look up user (POST /api/user-projects/transfers/lookup-user)
// Note: This is mounted on the main project routes, so it might need a specific path
router.get('/my', transferController.getMyTransfers);
router.post('/lookup-user', transferController.lookupUser);

// Routes with campaign ID
// POST /api/user-projects/:id/transfers
router.post('/', transferController.initiateTransfer);
router.get('/', transferController.getTransferHistory);

// Routes with transfer ID
// PATCH /api/user-projects/:id/transfers/:tid/accept
router.patch('/:tid/accept', transferController.acceptTransfer);
router.patch('/:tid/reject', transferController.rejectTransfer);
router.patch('/:tid/approve', transferController.approveTransfer);
router.delete('/:tid', transferController.cancelTransfer);

module.exports = router;
