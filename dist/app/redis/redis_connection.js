"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyRedisConnection = exports.redisClient = exports.createRedisConnection = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const config_1 = __importDefault(require("../config"));
const logger_1 = require("../utils/logger");
// Auth errors are permanent — no point retrying them.
const FATAL_ERROR_CODES = new Set(['WRONGPASS', 'NOAUTH', 'ERR']);
// Retry strategy shared by all connections.
const retryStrategy = (times, error) => {
    var _a;
    const code = (_a = error === null || error === void 0 ? void 0 : error.message) === null || _a === void 0 ? void 0 : _a.split(' ')[0];
    if (code && FATAL_ERROR_CODES.has(code))
        return null; // stop retrying on auth errors
    if (times > 3)
        return null; // give up after 3 transient retries
    return Math.min(times * 1000, 2000);
};
const BASE_OPTIONS = {
    maxRetriesPerRequest: null, // required by BullMQ
    enableReadyCheck: false,
    retryStrategy
};
// Connection used by the main server to access the cache.
const createRedisConnection = () => {
    const client = new ioredis_1.default(config_1.default.redis_cache_db_url, BASE_OPTIONS);
    client.on('error', err => {
        logger_1.logger.error('❌ Redis connection error:', err.message);
    });
    return client;
};
exports.createRedisConnection = createRedisConnection;
// Shared client used inside the worker processor for staging cache ops.
exports.redisClient = new ioredis_1.default(config_1.default.redis_cache_db_url, Object.assign(Object.assign({}, BASE_OPTIONS), { lazyConnect: true }));
exports.redisClient.on('error', err => {
    logger_1.logger.error('❌ Redis client error:', err.message);
});
// Pings Redis to validate credentials before the server opens.
const verifyRedisConnection = () => __awaiter(void 0, void 0, void 0, function* () {
    yield exports.redisClient.connect();
    const pong = yield exports.redisClient.ping();
    if (pong !== 'PONG')
        throw new Error('Redis PING returned unexpected response');
    logger_1.logger.info('✅ Redis connected and verified');
});
exports.verifyRedisConnection = verifyRedisConnection;
