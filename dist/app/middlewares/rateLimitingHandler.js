"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEndpointRateLimiter = exports.createUserRateLimiter = exports.createProgressiveRateLimiter = void 0;
// Symbol to mark that a request has already been processed
const RATE_LIMIT_CHECKED = Symbol('rateLimitChecked');
/**
 * Creates a progressive rate limiter with escalating block durations
 * Features:
 * - IP-based or user-based rate limiting
 * - Progressive blocking (15min → 1day → 7days → 30days → 1year)
 * - Automatic cleanup of old entries
 * - Prevents double-counting on same request
 * - Standard rate limit headers
 */
const createProgressiveRateLimiter = (options = {}) => {
    const { windowMs = 60 * 1000, // 1 minute
    maxRequests = 15, initialBlockMs = 20 * 60 * 1000, // 20 minutes
    message = {
        success: false,
        message: 'Too many requests. You are temporarily blocked.'
    }, skipSuccessfulRequests = false, skipFailedRequests = false, keyGenerator = (req) => {
        var _a;
        // Get real IP from common proxy headers
        const forwarded = req.headers['x-forwarded-for'];
        if (forwarded)
            return forwarded.split(',')[0].trim();
        return req.ip || ((_a = req.socket) === null || _a === void 0 ? void 0 : _a.remoteAddress) || 'unknown';
    }, enableLogger = false, skip = () => false } = options;
    // In-memory stores
    const requestTrackers = new Map();
    const blockedClients = new Map();
    // Logging helper
    const log = (...args) => {
        if (enableLogger) {
            console.log('[RateLimiter]', ...args);
        }
    };
    /**
     * Cleanup old entries to prevent memory leaks
     */
    const cleanup = () => {
        const now = Date.now();
        let cleanedTrackers = 0;
        let cleanedBlocks = 0;
        // Clean expired request trackers
        for (const [key, tracker] of requestTrackers.entries()) {
            if (tracker.resetTime < now) {
                requestTrackers.delete(key);
                cleanedTrackers++;
            }
        }
        // Clean expired blocks
        for (const [key, blockInfo] of blockedClients.entries()) {
            if (blockInfo.unblockTime < now) {
                blockedClients.delete(key);
                cleanedBlocks++;
            }
        }
        if (cleanedTrackers > 0 || cleanedBlocks > 0) {
            log(`Cleanup: ${cleanedTrackers} trackers, ${cleanedBlocks} blocks removed`);
        }
    };
    // Run cleanup every 2 minutes
    const cleanupInterval = setInterval(cleanup, 2 * 60 * 1000);
    // Cleanup on process exit
    if (typeof process !== 'undefined') {
        process.on('exit', () => clearInterval(cleanupInterval));
    }
    /**
     * Calculate next block duration based on violation history
     */
    const calculateBlockDuration = (blockHistory) => {
        const now = Date.now();
        const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
        // Only consider blocks in last 30 days
        const recentBlocks = blockHistory.filter(block => block.timestamp > thirtyDaysAgo);
        if (recentBlocks.length === 0) {
            return initialBlockMs; // First offense: initial block duration
        }
        // Count violations by severity
        const blockCounts = {
            initial: 0, // 15-20 minutes
            day: 0, // 1 day
            week: 0, // 7 days
            month: 0, // 30 days
            year: 0 // 1 year
        };
        recentBlocks.forEach(block => {
            if (block.duration >= 365 * 24 * 60 * 60 * 1000) {
                blockCounts.year++;
            }
            else if (block.duration >= 30 * 24 * 60 * 60 * 1000) {
                blockCounts.month++;
            }
            else if (block.duration >= 7 * 24 * 60 * 60 * 1000) {
                blockCounts.week++;
            }
            else if (block.duration >= 24 * 60 * 60 * 1000) {
                blockCounts.day++;
            }
            else {
                blockCounts.initial++;
            }
        });
        // Progressive escalation logic
        if (blockCounts.month >= 3) {
            return 365 * 24 * 60 * 60 * 1000; // 1 year
        }
        else if (blockCounts.week >= 3) {
            return 30 * 24 * 60 * 60 * 1000; // 30 days
        }
        else if (blockCounts.day >= 3) {
            return 7 * 24 * 60 * 60 * 1000; // 7 days
        }
        else if (blockCounts.initial >= 5) {
            return 24 * 60 * 60 * 1000; // 1 day
        }
        else {
            return initialBlockMs; // Initial block duration
        }
    };
    /**
     * Format block duration for user-friendly message
     */
    const formatDuration = (durationMs) => {
        const minutes = Math.floor(durationMs / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        if (days >= 365)
            return '1 year';
        if (days >= 30)
            return '30 days';
        if (days >= 7)
            return '7 days';
        if (days >= 1)
            return `${days} day${days > 1 ? 's' : ''}`;
        if (hours >= 1)
            return `${hours} hour${hours > 1 ? 's' : ''}`;
        return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    };
    /**
     * Get block message with duration
     */
    const getBlockMessage = (durationMs) => {
        if (typeof message === 'string') {
            return message;
        }
        const duration = formatDuration(durationMs);
        return Object.assign(Object.assign({}, message), { message: `Too many requests. You are blocked for ${duration}.`, retryAfter: Math.ceil(durationMs / 1000) });
    };
    /**
     * Set standard rate limit headers
     */
    const setHeaders = (res, limit, remaining, resetTime, retryAfter) => {
        res.setHeader('X-RateLimit-Limit', limit.toString());
        res.setHeader('X-RateLimit-Remaining', Math.max(0, remaining).toString());
        res.setHeader('X-RateLimit-Reset', Math.ceil(resetTime / 1000).toString());
        if (retryAfter !== undefined) {
            res.setHeader('Retry-After', Math.ceil(retryAfter).toString());
        }
    };
    /**
     * Main middleware function
     */
    return (req, res, next) => {
        // Check if this request should be skipped
        if (skip(req)) {
            return next();
        }
        // Prevent double-counting the same request
        // @ts-ignore
        if (req[RATE_LIMIT_CHECKED]) {
            log(`Request already checked, skipping...`);
            return next();
        }
        // @ts-ignore
        req[RATE_LIMIT_CHECKED] = true;
        const key = keyGenerator(req);
        const now = Date.now();
        log(`Request from ${key}`);
        // Check if client is currently blocked
        const blockInfo = blockedClients.get(key);
        if (blockInfo && blockInfo.unblockTime > now) {
            const remainingTime = blockInfo.unblockTime - now;
            const retryAfterSeconds = Math.ceil(remainingTime / 1000);
            log(`Blocked client ${key} - ${formatDuration(remainingTime)} remaining`);
            setHeaders(res, maxRequests, 0, blockInfo.unblockTime, retryAfterSeconds);
            return res.status(429).json(getBlockMessage(remainingTime));
        }
        // Client is no longer blocked, remove from blocked list
        if (blockInfo) {
            blockedClients.delete(key);
            log(`Unblocked client ${key}`);
        }
        // Get or initialize request tracker
        let tracker = requestTrackers.get(key);
        if (!tracker || tracker.resetTime <= now) {
            // Start new tracking window
            tracker = {
                count: 0,
                resetTime: now + windowMs,
                windowStart: now
            };
            requestTrackers.set(key, tracker);
            log(`New window for ${key}`);
        }
        // Increment request count
        tracker.count++;
        const remaining = maxRequests - tracker.count;
        log(`Client ${key}: ${tracker.count}/${maxRequests} requests`);
        // Set rate limit headers
        setHeaders(res, maxRequests, remaining, tracker.resetTime);
        // Check if limit exceeded
        if (tracker.count > maxRequests) {
            // Get or initialize block history
            const existingBlock = blockedClients.get(key);
            const blockHistory = (existingBlock === null || existingBlock === void 0 ? void 0 : existingBlock.blockHistory) || [];
            // Calculate new block duration
            const blockDuration = calculateBlockDuration(blockHistory);
            const unblockTime = now + blockDuration;
            // Add this violation to history
            blockHistory.push({
                duration: blockDuration,
                timestamp: now
            });
            // Keep only last 30 days of history
            const filteredHistory = blockHistory.filter(block => now - block.timestamp < 30 * 24 * 60 * 60 * 1000);
            // Block the client
            blockedClients.set(key, {
                unblockTime,
                blockCount: ((existingBlock === null || existingBlock === void 0 ? void 0 : existingBlock.blockCount) || 0) + 1,
                lastBlockDuration: blockDuration,
                blockHistory: filteredHistory
            });
            // Remove from active trackers
            requestTrackers.delete(key);
            const retryAfterSeconds = Math.ceil(blockDuration / 1000);
            log(`BLOCKED ${key} for ${formatDuration(blockDuration)} (violation #${filteredHistory.length})`);
            setHeaders(res, maxRequests, 0, unblockTime, retryAfterSeconds);
            return res.status(429).json(getBlockMessage(blockDuration));
        }
        // Allow request to proceed
        next();
    };
};
exports.createProgressiveRateLimiter = createProgressiveRateLimiter;
/**
 * Create user-specific rate limiter (requires authentication middleware first)
 */
const createUserRateLimiter = (options = {}) => {
    return (0, exports.createProgressiveRateLimiter)(Object.assign(Object.assign({}, options), { keyGenerator: (req) => {
            var _a, _b, _c;
            // @ts-ignore - assuming req.user exists from auth middleware
            const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b._id);
            if (userId) {
                return `user:${userId}`;
            }
            // Fallback to IP if no user
            const forwarded = req.headers['x-forwarded-for'];
            if (forwarded)
                return `ip:${forwarded.split(',')[0].trim()}`;
            return `ip:${req.ip || ((_c = req.socket) === null || _c === void 0 ? void 0 : _c.remoteAddress) || 'unknown'}`;
        } }));
};
exports.createUserRateLimiter = createUserRateLimiter;
/**
 * Create endpoint-specific rate limiter
 */
const createEndpointRateLimiter = (endpoint, options = {}) => {
    return (0, exports.createProgressiveRateLimiter)(Object.assign(Object.assign({}, options), { keyGenerator: (req) => {
            const baseKey = options.keyGenerator
                ? options.keyGenerator(req)
                : req.ip || 'unknown';
            return `${endpoint}:${baseKey}`;
        } }));
};
exports.createEndpointRateLimiter = createEndpointRateLimiter;
