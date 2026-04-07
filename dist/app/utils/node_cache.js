"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.get_cache_ttl = exports.get_all_cache_keys = exports.has_cache_key = exports.get_cache_stats = exports.clear_all_cache = exports.delete_cache_from_RAM = exports.get_cache_from_RAM = exports.create_cache_into_RAM = exports.myCache = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const node_cache_1 = __importDefault(require("node-cache"));
// Initialize cache with default options (stdTTL: 0 = never expire, checkperiod: 600 = 10 minutes)
exports.myCache = new node_cache_1.default({
    stdTTL: 0, // Default time to live in seconds (0 = never expire)
    checkperiod: 600, // Period in seconds to check for expired items
    useClones: false // For better performance with large objects
});
/**
 * Create or update cache entry in RAM
 * @param key - Cache key (string)
 * @param value - Value to cache (any type)
 * @param ttl - Time to live in seconds (optional)
 * @returns boolean indicating success
 */
const create_cache_into_RAM = (key, value, ttl) => {
    try {
        if (ttl && ttl > 0) {
            return exports.myCache.set(key, value, ttl);
        }
        return exports.myCache.set(key, value);
    }
    catch (error) {
        console.error('Cache creation error:', error);
        return false;
    }
};
exports.create_cache_into_RAM = create_cache_into_RAM;
/**
 * Retrieve cached value from RAM
 * @param key - Cache key (string)
 * @returns Cached value or undefined if not found
 */
const get_cache_from_RAM = (key) => {
    try {
        return exports.myCache.get(key);
    }
    catch (error) {
        console.error('Cache retrieval error:', error);
        return undefined;
    }
};
exports.get_cache_from_RAM = get_cache_from_RAM;
/**
 * Delete specific cache entry from RAM
 * @param key - Cache key to delete
 * @returns number of deleted entries (0 or 1)
 */
const delete_cache_from_RAM = (key) => {
    try {
        return exports.myCache.del(key);
    }
    catch (error) {
        console.error('Cache deletion error:', error);
        return 0;
    }
};
exports.delete_cache_from_RAM = delete_cache_from_RAM;
/**
 * Clear all cache entries
 * @returns void
 */
const clear_all_cache = () => {
    try {
        exports.myCache.flushAll();
        console.log('All cache entries cleared');
    }
    catch (error) {
        console.error('Cache clearing error:', error);
    }
};
exports.clear_all_cache = clear_all_cache;
/**
 * Get cache statistics
 * @returns Object with cache statistics
 */
const get_cache_stats = () => {
    try {
        return exports.myCache.getStats();
    }
    catch (error) {
        console.error('Cache stats error:', error);
        return null;
    }
};
exports.get_cache_stats = get_cache_stats;
/**
 * Check if key exists in cache
 * @param key - Cache key to check
 * @returns boolean indicating if key exists
 */
const has_cache_key = (key) => {
    try {
        return exports.myCache.has(key);
    }
    catch (error) {
        console.error('Cache key check error:', error);
        return false;
    }
};
exports.has_cache_key = has_cache_key;
/**
 * Get all cache keys
 * @returns Array of all cache keys
 */
const get_all_cache_keys = () => {
    try {
        return exports.myCache.keys();
    }
    catch (error) {
        console.error('Cache keys retrieval error:', error);
        return [];
    }
};
exports.get_all_cache_keys = get_all_cache_keys;
/**
 * Get TTL for a specific key
 * @param key - Cache key
 * @returns TTL in seconds or 0 if no TTL set
 */
const get_cache_ttl = (key) => {
    try {
        return exports.myCache.getTtl(key) || 0;
    }
    catch (error) {
        console.error('Cache TTL retrieval error:', error);
        return 0;
    }
};
exports.get_cache_ttl = get_cache_ttl;
