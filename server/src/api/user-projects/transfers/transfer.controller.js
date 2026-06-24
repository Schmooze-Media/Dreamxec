const transferService = require('./transfer.service');
const prisma = require('../../../config/prisma');
const catchAsync = require('../../../utils/catchAsync');
const AppError = require('../../../utils/AppError');

/**
 * Look up a user by email with masked identity.
 */
exports.lookupUser = catchAsync(async (req, res, next) => {
  const { campaignId } = req.body;
  const email = req.body.email?.trim().toLowerCase();
  
  console.log('[TransferController] lookupUser request:', { email, campaignId });
  if (!email) return next(new AppError('Email is required', 400));

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      accountStatus: true,
      clubIds: true
    }
  });

  console.log('[TransferController] User found:', user ? user.email : 'NOT FOUND');

  if (!user) {
    return res.status(200).json({
      status: 'success',
      data: { eligible: false, message: 'No account found with this email' }
    });
  }

  let sameClub = false;
  if (campaignId) {
    const campaign = await prisma.userProject.findUnique({
      where: { id: campaignId },
      select: { clubId: true }
    });
    if (campaign && campaign.clubId && user.clubIds?.includes(campaign.clubId)) {
      sameClub = true;
    }
  }

  const eligible = user.accountStatus === 'ACTIVE';

  // Masking logic: R****l S****a
  const maskName = (name) => {
    if (!name) return 'User';
    const parts = name.split(' ');
    return parts.map(p => p[0] + '*'.repeat(Math.max(0, p.length - 2)) + (p.length > 1 ? p[p.length - 1] : '')).join(' ');
  };

  res.status(200).json({
    status: 'success',
    data: {
      eligible,
      maskedName: maskName(user.name),
      sameClub,
      message: !eligible ? 'User account is not active' : undefined
    }
  });
});

/**
 * Initiate a transfer.
 */
exports.initiateTransfer = catchAsync(async (req, res, next) => {
  const { toUserEmail, note } = req.body;
  const campaignId = req.params.id;

  const transfer = await transferService.initiateTransfer(campaignId, req.user.id, toUserEmail, note);

  res.status(201).json({
    status: 'success',
    data: { transfer }
  });
});

/**
 * Accept a transfer.
 */
exports.acceptTransfer = catchAsync(async (req, res, next) => {
  const { tid } = req.params;
  const { note } = req.body;

  const transfer = await transferService.acceptTransfer(tid, req.user.id, note);

  res.status(200).json({
    status: 'success',
    data: { transfer }
  });
});

/**
 * Reject a transfer.
 */
exports.rejectTransfer = catchAsync(async (req, res, next) => {
  const { tid } = req.params;
  const { reason, role } = req.body;

  const transfer = await transferService.rejectTransfer(tid, req.user.id, reason, role);

  res.status(200).json({
    status: 'success',
    data: { transfer }
  });
});

/**
 * Approve a transfer (President/Admin).
 */
exports.approveTransfer = catchAsync(async (req, res, next) => {
  const { tid } = req.params;
  const { note, role } = req.body;

  const transfer = await transferService.approveTransfer(tid, req.user.id, note, role);

  res.status(200).json({
    status: 'success',
    data: { transfer }
  });
});

/**
 * Cancel a transfer.
 */
exports.cancelTransfer = catchAsync(async (req, res, next) => {
  const { tid } = req.params;

  const transfer = await transferService.cancelTransfer(tid, req.user.id);

  res.status(200).json({
    status: 'success',
    data: { transfer }
  });
});

/**
 * Get transfer history for a campaign.
 */
exports.getTransferHistory = catchAsync(async (req, res, next) => {
  const campaignId = req.params.id;

  const transfers = await prisma.campaignTransfer.findMany({
    where: { campaignId },
    orderBy: { createdAt: 'desc' },
    include: {
      campaign: { select: { title: true } }
    }
  });

  res.status(200).json({
    status: 'success',
    data: { transfers }
  });
});

/**
 * Get all transfers for the current user (sent or received).
 */
exports.getMyTransfers = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  const transfers = await prisma.campaignTransfer.findMany({
    where: {
      OR: [
        { fromUserId: userId },
        { toUserId: userId }
      ]
    },
    orderBy: { createdAt: 'desc' },
    include: {
      campaign: { select: { title: true } },
      originalOwner: { select: { name: true, email: true } },
      targetUser: { select: { name: true, email: true } }
    }
  });

  res.status(200).json({
    status: 'success',
    data: { transfers }
  });
});
