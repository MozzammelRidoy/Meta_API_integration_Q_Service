import Redis from 'ioredis'
import config from '../config'
import { logger } from '../utils/logger'

// Auth errors are permanent — no point retrying them.
const FATAL_ERROR_CODES = new Set(['WRONGPASS', 'NOAUTH', 'ERR'])

// Retry strategy shared by all connections.
const retryStrategy = (times: number, error?: Error): number | null => {
  const code = (error as NodeJS.ErrnoException)?.message?.split(' ')[0]
  if (code && FATAL_ERROR_CODES.has(code)) return null // stop retrying on auth errors
  if (times > 3) return null // give up after 3 transient retries
  return Math.min(times * 1000, 2000)
}

const BASE_OPTIONS = {
  maxRetriesPerRequest: null as null, // required by BullMQ
  enableReadyCheck: false,
  retryStrategy
}

// Connection used by the main server to access the cache.
export const createRedisConnection = (): Redis => {
  const client = new Redis(config.redis_cache_db_url, BASE_OPTIONS)
  client.on('error', err => {
    logger.error('❌ Redis connection error:', err.message)
  })
  return client
}

// Shared client used inside the worker processor for staging cache ops.

export const redisClient = new Redis(config.redis_cache_db_url, {
  ...BASE_OPTIONS,
  lazyConnect: true
})

redisClient.on('error', err => {
  logger.error('❌ Redis client error:', err.message)
})

// Pings Redis to validate credentials before the server opens.
export const verifyRedisConnection = async (): Promise<void> => {
  await redisClient.connect()
  const pong = await redisClient.ping()
  if (pong !== 'PONG')
    throw new Error('Redis PING returned unexpected response')
  logger.info('✅ Redis connected and verified')
}
