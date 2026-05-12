const prisma = require('../../../config/prisma');
const AppError = require('../../../utils/AppError');
const { validateTransferInitiation, revalidateTransferEligibility } = require('./transfer.validation');
const { logTransferEvent, TRANSFER_EVENTS } = require('./transfer.audit');
const { notifyTransferInitiated, notifyActionRequired, notifyTransferStatusUpdate } = require('./transfer.notification');
const { transferQueue } = require('../../../config/queue');
const { delCache } = require('../../../utils/cache');

const bustCampaignCache = async (campaignId, slug) => {
  try {
    await Promise.all([
      delCache(`project:${campaignId}`),
      slug && delCache(`project:slug:${slug}`),
      delCache('public:projects*'),
    ]);
  } catch (_) {}
};

const STAGE_DURATION_DAYS = 5;
const TOTAL_MAX_DURATION_DAYS = 15;

/**
 * Initiates a campaign transfer.
 */
exports.initiateTransfer = async (campaignId, initiatorId, toUserEmail, requestNote = '') => {
  return await prisma.$transaction(async (tx) => {
    // 1. Resolve target user and validate eligibility
    const targetUser = await tx.user.findUnique({ where: { email: toUserEmail } });
    if (!targetUser) throw new AppError('Target user not found', 404);
    const toUserId = targetUser.id;

    const { campaign } = await validateTransferInitiation(campaignId, toUserId);
    
    const initiator = await tx.user.findUnique({ where: { id: initiatorId } });
    if (!initiator) throw new AppError('Initiator not found', 404);

    // 2. Prevent duplicate transfers
    const activeTransfer = await tx.campaignTransfer.findFirst({
      where: {
        campaignId,
        status: {
          in: ['PENDING_ACCEPTANCE', 'PENDING_PRESIDENT', 'PENDING_ADMIN', 'APPROVED']
        }
      }
    });
    if (activeTransfer) throw new AppError('A transfer is already active for this campaign', 400);

    // 3. Determine workflow stage based on initiator role
    let initialStatus = 'PENDING_ACCEPTANCE';
    if (initiator.role === 'ADMIN') {
      // Admin bypasses target approval and president approval
      initialStatus = 'APPROVED'; 
    } else if (initiator.role === 'STUDENT_PRESIDENT') {
      // President initiates, still needs target acceptance
      initialStatus = 'PENDING_ACCEPTANCE';
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + TOTAL_MAX_DURATION_DAYS);

    const stageExpiresAt = new Date();
    stageExpiresAt.setDate(stageExpiresAt.getDate() + STAGE_DURATION_DAYS);

    // 4. Create transfer record
    const transfer = await tx.campaignTransfer.create({
      data: {
        campaignId,
        fromUserId: campaign.userId,
        toUserId,
        status: initialStatus,
        initiatedBy: initiatorId,
        initiatorRole: initiator.role,
        requestNote,
        expiresAt,
        currentStageExpiresAt: stageExpiresAt,
        amountAtTransfer: campaign.amountRaised,
      }
    });

    // 5. Lock campaign
    await tx.userProject.update({
      where: { id: campaignId },
      data: {
        transferStatus: 'TRANSFER_PENDING',
        activeTransferId: transfer.id
      }
    });

    // 6. Audit log
    await logTransferEvent(tx, {
      action: TRANSFER_EVENTS.REQUESTED,
      transferId: transfer.id,
      campaignId,
      performedBy: initiatorId,
      details: { toUserId, role: initiator.role }
    });

    // 7. Notifications
    if (initialStatus === 'APPROVED') {
      // Enqueue execution job immediately if admin initiated
      await transferQueue.add('execute-transfer', { transferId: transfer.id });
    } else {
      await notifyTransferInitiated(transfer, initiator, targetUser, campaign);
    }

    // Bust cache so next page load reflects the lock
    await bustCampaignCache(campaignId, campaign.slug);

    return transfer;
  });
};

/**
 * Target user accepts the transfer request.
 */
exports.acceptTransfer = async (transferId, userId, targetNote = '') => {
  return await prisma.$transaction(async (tx) => {
    const { transfer, campaign, targetUser } = await revalidateTransferEligibility(transferId);

    if (transfer.toUserId !== userId) throw new AppError('Unauthorized to accept this transfer', 403);
    if (transfer.status !== 'PENDING_ACCEPTANCE') throw new AppError('Transfer is not in acceptance stage', 400);

    // Move to next stage: PENDING_PRESIDENT
    const stageExpiresAt = new Date();
    stageExpiresAt.setDate(stageExpiresAt.getDate() + STAGE_DURATION_DAYS);

    const updatedTransfer = await tx.campaignTransfer.update({
      where: { id: transferId },
      data: {
        status: 'PENDING_PRESIDENT',
        targetAcceptedAt: new Date(),
        targetNote,
        currentStageExpiresAt: stageExpiresAt,
        acceptedBy: userId
      }
    });

    // Audit log
    await logTransferEvent(tx, {
      action: TRANSFER_EVENTS.ACCEPTED,
      transferId,
      campaignId: transfer.campaignId,
      performedBy: userId
    });

    // Notify President
    if (campaign.clubId) {
      const club = await tx.club.findUnique({ 
        where: { id: campaign.clubId },
        include: { presidentUser: true }
      });
      if (club && club.presidentUser) {
        await notifyActionRequired(updatedTransfer, 'STUDENT_PRESIDENT', club.presidentUser.email, club.presidentUser.name, campaign);
      }
    }

    return updatedTransfer;
  });
};

/**
 * Rejects a transfer request at any stage.
 */
exports.rejectTransfer = async (transferId, userId, reason, role) => {
  return await prisma.$transaction(async (tx) => {
    const transfer = await tx.campaignTransfer.findUnique({ where: { id: transferId } });
    if (!transfer) throw new AppError('Transfer not found', 404);

    let status = 'REJECTED';
    if (role === 'TARGET') status = 'TARGET_REJECTED';

    const updatedTransfer = await tx.campaignTransfer.update({
      where: { id: transferId },
      data: {
        status,
        rejectionReason: reason,
        rejectedBy: userId,
        rejectedRole: role
      }
    });

    // Unlock campaign
    await tx.userProject.update({
      where: { id: transfer.campaignId },
      data: {
        transferStatus: 'NONE',
        activeTransferId: null
      }
    });

    // Audit log
    const action = role === 'TARGET' ? TRANSFER_EVENTS.TARGET_REJECTED : 
                   role === 'STUDENT_PRESIDENT' ? TRANSFER_EVENTS.PRESIDENT_REJECTED : 
                   TRANSFER_EVENTS.ADMIN_REJECTED;

    await logTransferEvent(tx, {
      action,
      transferId,
      campaignId: transfer.campaignId,
      performedBy: userId,
      details: { reason }
    });

    // Notify participants
    // (Logic for gathering recipients...)
    
    // Bust cache so next page load reflects the unlock
    await bustCampaignCache(transfer.campaignId, null);

    return updatedTransfer;
  });
};

/**
 * President or Admin approves the transfer.
 */
exports.approveTransfer = async (transferId, userId, note = '', role) => {
  return await prisma.$transaction(async (tx) => {
    const { transfer, campaign } = await revalidateTransferEligibility(transferId);

    if (transfer.initiatedBy === userId) throw new AppError('Self-approval is forbidden', 403);

    let nextStatus;
    let action;

    if (role === 'STUDENT_PRESIDENT') {
      if (transfer.status !== 'PENDING_PRESIDENT') throw new AppError('Transfer not awaiting president approval', 400);
      nextStatus = 'PENDING_ADMIN';
      action = TRANSFER_EVENTS.PRESIDENT_APPROVED;
    } else if (role === 'ADMIN') {
      if (!['PENDING_PRESIDENT', 'PENDING_ADMIN'].includes(transfer.status)) {
        throw new AppError('Transfer not awaiting admin approval', 400);
      }
      nextStatus = 'APPROVED';
      action = TRANSFER_EVENTS.ADMIN_APPROVED;
    } else {
      throw new AppError('Invalid approval role', 400);
    }

    const stageExpiresAt = new Date();
    stageExpiresAt.setDate(stageExpiresAt.getDate() + STAGE_DURATION_DAYS);

    const updatedTransfer = await tx.campaignTransfer.update({
      where: { id: transferId, status: transfer.status }, // Optimistic lock
      data: {
        status: nextStatus,
        presidentId: role === 'STUDENT_PRESIDENT' ? userId : transfer.presidentId,
        adminId: role === 'ADMIN' ? userId : transfer.adminId,
        presidentNote: role === 'STUDENT_PRESIDENT' ? note : transfer.presidentNote,
        adminNote: role === 'ADMIN' ? note : transfer.adminNote,
        currentStageExpiresAt: stageExpiresAt
      }
    });

    // Audit log
    await logTransferEvent(tx, {
      action,
      transferId,
      campaignId: transfer.campaignId,
      performedBy: userId
    });

    if (nextStatus === 'APPROVED') {
      // Enqueue execution job
      await transferQueue.add('execute-transfer', { transferId: transfer.id });
    } else {
      // Notify Admin? (Usually admin dashboard covers this, but can send email)
    }

    return updatedTransfer;
  });
};

/**
 * Executes the actual ownership swap.
 * Called by worker after ADMIN approval.
 */
exports.executeTransfer = async (transferId) => {
  return await prisma.$transaction(async (tx) => {
    const transfer = await tx.campaignTransfer.findUnique({
      where: { id: transferId, status: 'APPROVED' }
    });

    if (!transfer) throw new AppError('Transfer not found or not approved', 404);

    // Final security check
    const campaign = await tx.userProject.findUnique({
      where: { id: transfer.campaignId },
      include: { withdrawals: true }
    });

    const activeWithdrawal = campaign.withdrawals.find(w => 
      ['pending', 'processing', 'PENDING', 'PROCESSING'].includes(w.status)
    );
    if (activeWithdrawal) {
      await tx.campaignTransfer.update({
        where: { id: transferId },
        data: { status: 'EXECUTION_FAILED', rejectionReason: 'Active withdrawal detected during execution' }
      });
      throw new AppError('Transfer failed: Active withdrawal detected', 400);
    }

    // 1. Swap ownership
    await tx.userProject.update({
      where: { id: transfer.campaignId },
      data: {
        userId: transfer.toUserId,
        bankAccountId: null, // Clear bank account for safety
        transferStatus: 'NONE',
        activeTransferId: null,
        lastTransferredAt: new Date()
      }
    });

    // 2. Mark transfer COMPLETED
    const updatedTransfer = await tx.campaignTransfer.update({
      where: { id: transferId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date()
      }
    });

    // 3. Audit log
    await logTransferEvent(tx, {
      action: TRANSFER_EVENTS.COMPLETED,
      transferId,
      campaignId: transfer.campaignId,
      performedBy: transfer.adminId || transfer.initiatedBy // Admin approved or Admin initiated
    });

    // 4. Notifications
    // notify participants about completion

    return updatedTransfer;
  });
};

/**
 * Cancels a transfer by the initiator.
 */
exports.cancelTransfer = async (transferId, userId) => {
  return await prisma.$transaction(async (tx) => {
    const transfer = await tx.campaignTransfer.findUnique({ where: { id: transferId } });
    if (!transfer) throw new AppError('Transfer not found', 404);

    if (transfer.initiatedBy !== userId) throw new AppError('Only initiator can cancel the transfer', 403);
    
    const terminalStatuses = ['COMPLETED', 'REJECTED', 'TARGET_REJECTED', 'CANCELLED', 'EXPIRED'];
    if (terminalStatuses.includes(transfer.status)) throw new AppError('Transfer is already in a terminal state', 400);

    const updatedTransfer = await tx.campaignTransfer.update({
      where: { id: transferId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date()
      }
    });

    // Unlock campaign
    await tx.userProject.update({
      where: { id: transfer.campaignId },
      data: {
        transferStatus: 'NONE',
        activeTransferId: null
      }
    });

    // Audit log
    await logTransferEvent(tx, {
      action: TRANSFER_EVENTS.CANCELLED,
      transferId,
      campaignId: transfer.campaignId,
      performedBy: userId
    });

    // Bust cache so next page load reflects the unlock
    await bustCampaignCache(transfer.campaignId, null);

    return updatedTransfer;
  });
};
