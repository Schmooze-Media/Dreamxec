const prisma = require('../../../config/prisma');

/**
 * Creates an audit log entry for a transfer event.
 */
const logTransferEvent = async (prisma, {
  action,
  transferId,
  campaignId,
  performedBy,
  details = {},
  ipAddress = null,
}) => {
  return await prisma.auditLog.create({
    data: {
      action,
      entity: 'CampaignTransfer',
      entityId: transferId,
      performedBy,
      ipAddress,
      details: JSON.stringify({
        campaignId,
        ...details,
      }),
    },
  });
};

const TRANSFER_EVENTS = {
  REQUESTED: 'TRANSFER_REQUESTED',
  ACCEPTED: 'TRANSFER_ACCEPTED',
  TARGET_REJECTED: 'TRANSFER_TARGET_REJECTED',
  PRESIDENT_APPROVED: 'TRANSFER_PRESIDENT_APPROVED',
  PRESIDENT_REJECTED: 'TRANSFER_PRESIDENT_REJECTED',
  ADMIN_APPROVED: 'TRANSFER_ADMIN_APPROVED',
  ADMIN_REJECTED: 'TRANSFER_ADMIN_REJECTED',
  COMPLETED: 'TRANSFER_COMPLETED',
  CANCELLED: 'TRANSFER_CANCELLED',
  EXPIRED: 'TRANSFER_EXPIRED',
  EXECUTION_FAILED: 'TRANSFER_EXECUTION_FAILED',
  SYSTEM_RECOVERY: 'TRANSFER_SYSTEM_RECOVERY',
};

module.exports = {
  logTransferEvent,
  TRANSFER_EVENTS,
};
