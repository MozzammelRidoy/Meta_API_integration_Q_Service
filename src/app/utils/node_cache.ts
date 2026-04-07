/* eslint-disable @typescript-eslint/no-explicit-any */
import NodeCache from 'node-cache'

// Initialize cache with default options (stdTTL: 0 = never expire, checkperiod: 600 = 10 minutes)
export const myCache = new NodeCache({
  stdTTL: 0, // Default time to live in seconds (0 = never expire)
  checkperiod: 600, // Period in seconds to check for expired items
  useClones: false // For better performance with large objects
})

/**
 * Create or update cache entry in RAM
 * @param key - Cache key (string)
 * @param value - Value to cache (any type)
 * @param ttl - Time to live in seconds (optional)
 * @returns boolean indicating success
 */
export const create_cache_into_RAM = (
  key: string,
  value: any,
  ttl?: number
): boolean => {
  try {
    if (ttl && ttl > 0) {
      return myCache.set(key, value, ttl)
    }
    return myCache.set(key, value)
  } catch (error) {
    console.error('Cache creation error:', error)
    return false
  }
}

/**
 * Retrieve cached value from RAM
 * @param key - Cache key (string)
 * @returns Cached value or undefined if not found
 */
export const get_cache_from_RAM = (key: string): any | undefined => {
  try {
    return myCache.get(key)
  } catch (error) {
    console.error('Cache retrieval error:', error)
    return undefined
  }
}

/**
 * Delete specific cache entry from RAM
 * @param key - Cache key to delete
 * @returns number of deleted entries (0 or 1)
 */
export const delete_cache_from_RAM = (key: string): number => {
  try {
    return myCache.del(key)
  } catch (error) {
    console.error('Cache deletion error:', error)
    return 0
  }
}

/**
 * Clear all cache entries
 * @returns void
 */
export const clear_all_cache = (): void => {
  try {
    myCache.flushAll()
    console.log('All cache entries cleared')
  } catch (error) {
    console.error('Cache clearing error:', error)
  }
}

/**
 * Get cache statistics
 * @returns Object with cache statistics
 */
export const get_cache_stats = () => {
  try {
    return myCache.getStats()
  } catch (error) {
    console.error('Cache stats error:', error)
    return null
  }
}

/**
 * Check if key exists in cache
 * @param key - Cache key to check
 * @returns boolean indicating if key exists
 */
export const has_cache_key = (key: string): boolean => {
  try {
    return myCache.has(key)
  } catch (error) {
    console.error('Cache key check error:', error)
    return false
  }
}

/**
 * Get all cache keys
 * @returns Array of all cache keys
 */
export const get_all_cache_keys = (): string[] => {
  try {
    return myCache.keys()
  } catch (error) {
    console.error('Cache keys retrieval error:', error)
    return []
  }
}

/**
 * Get TTL for a specific key
 * @param key - Cache key
 * @returns TTL in seconds or 0 if no TTL set
 */
export const get_cache_ttl = (key: string): number => {
  try {
    return myCache.getTtl(key) || 0
  } catch (error) {
    console.error('Cache TTL retrieval error:', error)
    return 0
  }
}
