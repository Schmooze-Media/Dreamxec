const { Worker } = require('bullmq');
const transferService = require('./transfer.service');
const redis = require('../../../services/redis.service');

/**
 * Worker to process campaign transfer execution jobs.
 */
const transferWorker = new Worker('campaign-transfers', async job => {
  if (job.name === 'execute-transfer') {
    const { transferId } = job.data;
    console.log(`[TransferWorker] Executing transfer ${transferId}...`);
    
    try {
      await transferService.executeTransfer(transferId);
      console.log(`[TransferWorker] Transfer ${transferId} completed successfully.`);
    } catch (error) {
      console.error(`[TransferWorker] Transfer ${transferId} failed:`, error.message);
      // We don't re-throw here to allow BullMQ to handle it based on retry settings,
      // but we could mark it as failed in DB if needed.
      throw error; 
    }
  }
}, {
  connection: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
  },
  concurrency: 5 // Process up to 5 transfers concurrently
});

transferWorker.on('completed', job => {
  console.log(`[TransferWorker] Job ${job.id} completed.`);
});

transferWorker.on('failed', (job, err) => {
  console.error(`[TransferWorker] Job ${job.id} failed with error: ${err.message}`);
});

module.exports = transferWorker;
