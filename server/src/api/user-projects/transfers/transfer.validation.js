const prisma = require('../../../config/prisma');
const AppError = require('../../../utils/AppError');

/**
 * Validates if a campaign is eligible for transfer initiation.
 */
const validateTransferInitiation = async (campaignId, toUserId) => {
  const campaign = await prisma.userProject.findUnique({
    where: { id: campaignId },
    include: {
      user: true,
      milestones: true,
      withdrawals: true,
    },
  });

  if (!campaign) {
    throw new AppError('Campaign not found', 404);
  }

  // 1. Campaign must be APPROVED
  if (campaign.status !== 'APPROVED') {
    throw new AppError('Only approved campaigns can be transferred', 400);
  }

  // 2. No active transfer
  if (campaign.activeTransferId) {
    throw new AppError('A transfer is already in progress for this campaign', 400);
  }

  // 3. No active milestone (PENDING or SUBMITTED)
  const activeMilestone = campaign.milestones.find(m => 
    ['PENDING', 'SUBMITTED'].includes(m.status)
  );
  if (activeMilestone) {
    throw new AppError('Cannot transfer campaign with active milestones', 400);
  }

  // 4. No active withdrawal (pending or processing)
  const activeWithdrawal = campaign.withdrawals.find(w => 
    ['pending', 'processing', 'PENDING', 'PROCESSING'].includes(w.status)
  );
  if (activeWithdrawal) {
    throw new AppError('Cannot transfer campaign with active withdrawals', 400);
  }

  // 5. Target user must exist and be ACTIVE
  const targetUser = await prisma.user.findUnique({
    where: { id: toUserId },
  });

  if (!targetUser) {
    throw new AppError('Target user not found', 404);
  }

  if (targetUser.accountStatus !== 'ACTIVE') {
    throw new AppError('Target user account is not active', 400);
  }

  // 6. Same club only (Phase 1 restriction)
  if (campaign.clubId && (!targetUser.clubIds || !targetUser.clubIds.includes(campaign.clubId))) {
    throw new AppError('Target user must belong to the same club as the campaign', 400);
  }

  // 7. Not self-transfer
  if (campaign.userId === toUserId) {
    throw new AppError('Cannot transfer campaign to yourself', 400);
  }

  // 8. Cooldown check (7 days)
  if (campaign.lastTransferredAt) {
    const cooldownPeriod = 7 * 24 * 60 * 60 * 1000; // 7 days
    if (Date.now() - new Date(campaign.lastTransferredAt).getTime() < cooldownPeriod) {
      throw new AppError('Campaign is currently in cooldown period after a previous transfer', 400);
    }
  }

  return { campaign, targetUser };
};

/**
 * Re-validates eligibility during approval stages.
 */
const revalidateTransferEligibility = async (transferId) => {
  const transfer = await prisma.campaignTransfer.findUnique({
    where: { id: transferId },
    include: {
      campaign: {
        include: {
          milestones: true,
          withdrawals: true,
        },
      },
    },
  });

  if (!transfer) {
    throw new AppError('Transfer request not found', 404);
  }

  const { campaign } = transfer;

  // Re-check critical locks
  const activeMilestone = campaign.milestones.find(m => 
    ['PENDING', 'SUBMITTED'].includes(m.status)
  );
  if (activeMilestone) {
    throw new AppError('Campaign now has active milestones, transfer blocked', 400);
  }

  const activeWithdrawal = campaign.withdrawals.find(w => 
    ['pending', 'processing', 'PENDING', 'PROCESSING'].includes(w.status)
  );
  if (activeWithdrawal) {
    throw new AppError('Campaign now has active withdrawals, transfer blocked', 400);
  }

  // Re-check target user status
  const targetUser = await prisma.user.findUnique({
    where: { id: transfer.toUserId },
  });

  if (!targetUser || targetUser.accountStatus !== 'ACTIVE') {
    throw new AppError('Target user is no longer eligible', 400);
  }

  return { transfer, campaign, targetUser };
};

module.exports = {
  validateTransferInitiation,
  revalidateTransferEligibility,
};
