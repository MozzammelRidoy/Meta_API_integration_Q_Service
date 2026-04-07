import { Queue } from 'bullmq'
import { createRedisConnection } from '../redis/redis_connection'

export type TAdInsightsJobData = {
  campaign_id: string
  date: string
}

// create a queue for ad insights
export const adInsightsQueue = new Queue<TAdInsightsJobData>('ad-insights', {
  connection: createRedisConnection(),
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
})

adInsightsQueue.on('error', err => {
  console.error('❌ AdInsights Queue error:', err.message)
})
