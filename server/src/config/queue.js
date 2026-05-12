const { Queue } = require('bullmq');
const redis = require('../services/redis.service');

// Use the existing ioredis instance from redis.service if possible
// BullMQ expects a connection object or ioredis instance.
// In our redis.service, we export the redis client.

const transferQueue = new Queue('campaign-transfers', {
  connection: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
  }
});

module.exports = {
  transferQueue,
};
