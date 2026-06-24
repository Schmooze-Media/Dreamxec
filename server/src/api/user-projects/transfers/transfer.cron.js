const cron = require('node-cron');
const prisma = require('../../../config/prisma');
const { logTransferEvent, TRANSFER_EVENTS } = require('./transfer.audit');

/**
 * Hourly cron job to handle expired transfers.
 */
const startTransferExpiryCron = () => {
  // Run every hour
  cron.schedule('0 * * * *', async () => {
    console.log('[TransferCron] Checking for expired transfers...');
    
    try {
      const now = new Date();
      
      // Find transfers that have exceeded their total lifecycle or current stage duration
      const expiredTransfers = await prisma.campaignTransfer.findMany({
        where: {
          status: {
            in: ['PENDING_ACCEPTANCE', 'PENDING_PRESIDENT', 'PENDING_ADMIN', 'APPROVED']
          },
          OR: [
            { expiresAt: { lt: now } },
            { currentStageExpiresAt: { lt: now } }
          ]
        }
      });

      if (expiredTransfers.length === 0) {
        console.log('[TransferCron] No expired transfers found.');
        return;
      }

      console.log(`[TransferCron] Found ${expiredTransfers.length} expired transfers. Processing...`);

      for (const transfer of expiredTransfers) {
        await prisma.$transaction(async (tx) => {
          // 1. Mark transfer as EXPIRED
          await tx.campaignTransfer.update({
            where: { id: transfer.id },
            data: {
              status: 'EXPIRED',
              expiredAt: now
            }
          });

          // 2. Unlock campaign
          await tx.userProject.update({
            where: { id: transfer.campaignId },
            data: {
              transferStatus: 'NONE',
              activeTransferId: null
            }
          });

          // 3. Audit log
          await logTransferEvent(tx, {
            action: TRANSFER_EVENTS.EXPIRED,
            transferId: transfer.id,
            campaignId: transfer.campaignId,
            performedBy: null, // System action
            details: { reason: 'Time limit exceeded' }
          });

          console.log(`[TransferCron] Transfer ${transfer.id} marked as EXPIRED.`);
        });
      }
    } catch (error) {
      console.error('[TransferCron] Error processing expired transfers:', error);
    }
  });
};

/**
 * Auto-healing cron job to recover stuck campaigns (dangling locks)
 */
const startTransferRecoveryCron = () => {
  // Run every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    console.log('[TransferCron] Checking for dangling campaign locks...');
    try {
      // 1. Find campaigns that are locked but have no activeTransferId
      const danglingNullLocks = await prisma.userProject.findMany({
        where: {
          transferStatus: { not: 'NONE' },
          activeTransferId: null
        }
      });

      // 2. Find campaigns locked by a transfer that has already terminated
      const danglingTerminatedLocks = await prisma.userProject.findMany({
        where: {
          transferStatus: { not: 'NONE' },
          activeTransferId: { not: null },
          activeTransfer: {
            status: {
              in: ['COMPLETED', 'REJECTED', 'TARGET_REJECTED', 'CANCELLED', 'EXPIRED', 'EXECUTION_FAILED']
            }
          }
        }
      });

      const allDangling = [...danglingNullLocks, ...danglingTerminatedLocks];

      if (allDangling.length === 0) {
        console.log('[TransferCron] No dangling locks found.');
        return;
      }

      console.log(`[TransferCron] Found ${allDangling.length} dangling locks. Recovering...`);

      for (const campaign of allDangling) {
        await prisma.$transaction(async (tx) => {
          await tx.userProject.update({
            where: { id: campaign.id },
            data: {
              transferStatus: 'NONE',
              activeTransferId: null
            }
          });

          // We log the recovery in the campaign audit if activeTransferId was present
          if (campaign.activeTransferId) {
            await logTransferEvent(tx, {
              action: TRANSFER_EVENTS.SYSTEM_RECOVERY,
              transferId: campaign.activeTransferId,
              campaignId: campaign.id,
              performedBy: null,
              details: { reason: 'Auto-healed dangling transfer lock' }
            });
          }
        });
        console.log(`[TransferCron] Campaign ${campaign.id} successfully unlocked.`);
      }
    } catch (error) {
      console.error('[TransferCron] Error processing recovery:', error);
    }
  });
};

module.exports = {
  startTransferExpiryCron,
  startTransferRecoveryCron
};
