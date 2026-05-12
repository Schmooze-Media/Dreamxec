const { publishEvent } = require('../../../services/eventPublisher.service');
const EVENTS = require('../../../config/events');

/**
 * Notifies target user about a new transfer request.
 */
const notifyTransferInitiated = async (transfer, fromUser, toUser, campaign) => {
  await publishEvent(EVENTS.TRANSFER_INITIATED, {
    toEmail: toUser.email,
    toName: toUser.name,
    fromName: fromUser.name,
    campaignTitle: campaign.title,
    transferId: transfer.id,
    expiresAt: transfer.expiresAt,
    actionUrl: `${process.env.CLIENT_URL}/dashboard/transfers/${transfer.id}`
  });
};

/**
 * Notifies relevant actors about an action required (e.g., president approval).
 */
const notifyActionRequired = async (transfer, targetRole, email, name, campaign) => {
  await publishEvent(EVENTS.TRANSFER_ACTION_REQUIRED, {
    toEmail: email,
    toName: name,
    targetRole,
    campaignTitle: campaign.title,
    transferId: transfer.id,
    actionUrl: `${process.env.CLIENT_URL}/dashboard/transfers/${transfer.id}`
  });
};

/**
 * Notifies actors about a status update (Accepted, Rejected, Approved, Completed).
 */
const notifyTransferStatusUpdate = async (transfer, campaign, status, recipients) => {
  for (const recipient of recipients) {
    await publishEvent(EVENTS.TRANSFER_STATUS_UPDATE, {
      toEmail: recipient.email,
      toName: recipient.name,
      status,
      campaignTitle: campaign.title,
      transferId: transfer.id,
      rejectionReason: transfer.rejectionReason || null
    });
  }
};

module.exports = {
  notifyTransferInitiated,
  notifyActionRequired,
  notifyTransferStatusUpdate,
};
