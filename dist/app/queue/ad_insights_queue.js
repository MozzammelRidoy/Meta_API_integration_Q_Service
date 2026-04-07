"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adInsightsQueue = void 0;
const bullmq_1 = require("bullmq");
const redis_connection_1 = require("../redis/redis_connection");
// create a queue for ad insights
exports.adInsightsQueue = new bullmq_1.Queue('ad-insights', {
    connection: (0, redis_connection_1.createRedisConnection)(),
    defaultJobOptions: {
        attempts: 5,
        backoff: {
            type: 'exponential',
            delay: 3000 // Delays: 3s → 6s → 12s → 24s → 48s
        },
        removeOnComplete: true, // delete job from Redis immediately on completion
        // removeOnComplete: { count: 5 }, // hold last 5 completed job for debugging
        removeOnFail: { count: 50 } // keep last 50 failed jobs for debugging
    }
});
exports.adInsightsQueue.on('error', err => {
    console.error('❌ AdInsights Queue error:', err.message);
});
