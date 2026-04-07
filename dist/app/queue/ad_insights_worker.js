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
exports.adInsightsWorker = void 0;
const bullmq_1 = require("bullmq");
const redis_connection_1 = require("../redis/redis_connection");
const meta_api_service_1 = require("../modules/meta/meta_api_service");
const prisma_1 = require("../shared/prisma");
const AppError_1 = __importDefault(require("../errors/AppError"));
const ad_insights_queue_1 = require("./ad_insights_queue");
const logger_1 = require("../utils/logger");
const PERMANENT_SKIP_STATUS = 404; // 404 is the only status that should be skipped permanently
const AUTH_ERROR_STATUSES = new Set([401, 403]); // 401 and 403 are the only statuses that should trigger a retry
const AUTH_RETRY_DELAY_MS = 5 * 60 * 1000; // after the 5 minute delay, the job will be retried
// Create a worker to process ad insights jobs
const processAdInsightsJob = (job) => __awaiter(void 0, void 0, void 0, function* () {
    const { campaign_id, date } = job.data;
    const attempt = `${job.attemptsMade + 1}/${job.opts.attempts}`;
    logger_1.logger.info(`🔄 [Job ${job.id}] Started — campaign="${campaign_id}" | date="${date}" | attempt ${attempt}`);
    try {
        logger_1.logger.info(`📡 [Job ${job.id}] Calling Meta API — campaign="${campaign_id}" | date="${date}"`);
        // Step:1 Call Meta API to fetch ad insights
        const response = yield meta_api_service_1.MetaServices.fetch_AdInsights_fromMeta(campaign_id, date);
        logger_1.logger.info(`✅ [Job ${job.id}] Meta API responded with HTTP ${response.status} — campaign="${campaign_id}"`);
        // Step 2 — Meta API Response Upsert to PostgreSQL.
        logger_1.logger.info(`💾 [Job ${job.id}] Writing to PostgreSQL — campaign="${campaign_id}" | date="${date}"`);
        yield prisma_1.prisma.adInsights.upsert({
            where: { campaign_id_date: { campaign_id, date: new Date(date) } },
            update: {
                impressions: response.data.impressions,
                clicks: response.data.clicks,
                spend: response.data.spend
            },
            create: {
                campaign_id,
                impressions: response.data.impressions,
                clicks: response.data.clicks,
                spend: response.data.spend,
                date: new Date(date),
                isDeleted: false
            }
        });
        logger_1.logger.info(`✅ [Job ${job.id}] DB write successful — impressions=${response.data.impressions} | clicks=${response.data.clicks} | spend=$${response.data.spend}`);
    }
    catch (error) {
        if (error instanceof AppError_1.default) {
            // 404 : campaign does not exist in Meta. Skip permanently.
            if (error.statusCode === PERMANENT_SKIP_STATUS) {
                logger_1.logger.warn(`🚫 [Job ${job.id}] 404 Not Found — campaign="${campaign_id}" does not exist in Meta. ` +
                    `Permanently skipping. No retry will be scheduled.`);
                return; // returning marks the job as "completed" (not failed).
            }
            // 401 / 403 : Auth failure — credentials missing or expired. event re-queues with a long delay.
            if (AUTH_ERROR_STATUSES.has(error.statusCode)) {
                logger_1.logger.warn(`🔐 [Job ${job.id}] HTTP ${error.statusCode} ${error.statusCode === 401 ? 'Unauthorized' : 'Forbidden'} — ` +
                    `campaign="${campaign_id}" | attempt ${attempt}. ` +
                    `Auth may be temporarily broken. Retrying with backoff...`);
                throw error;
            }
            // 429 : Rate limited by Meta API — back off and retry.
            if (error.statusCode === 429) {
                logger_1.logger.warn(`⏳ [Job ${job.id}] 429 Rate Limited — campaign="${campaign_id}" | attempt ${attempt}. ` +
                    `Meta API throttled the request. Retrying with exponential backoff...`);
                throw error;
            }
            // 5xx / other : Transient server-side error — retry with backoff.
            logger_1.logger.error(`💥 [Job ${job.id}] HTTP ${error.statusCode} Server Error — campaign="${campaign_id}" | attempt ${attempt}. ` +
                `Reason: ${error.message}. Retrying with exponential backoff...`);
            throw error;
        }
        // Unknown / unexpected error — always rethrow so BullMQ handles retry.
        logger_1.logger.error(`❓ [Job ${job.id}] Unexpected error — campaign="${campaign_id}": ${error.message}`);
        throw error;
    }
});
// Create an worker to process ad insights jobs
exports.adInsightsWorker = new bullmq_1.Worker('ad-insights', processAdInsightsJob, {
    connection: (0, redis_connection_1.createRedisConnection)(),
    concurrency: 5
});
// Job completion event
exports.adInsightsWorker.on('completed', job => {
    logger_1.logger.info(`🎉 [Worker] Job ${job.id} completed & removed from Redis — campaign="${job.data.campaign_id}" | date="${job.data.date}"`);
});
// Job failure event
exports.adInsightsWorker.on('failed', (job, err) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (!job)
        return;
    // Check if the job has exhausted all its retry attempts
    const isLastAttempt = job.attemptsMade >= ((_a = job.opts.attempts) !== null && _a !== void 0 ? _a : 1);
    const isAuthError = err instanceof AppError_1.default && AUTH_ERROR_STATUSES.has(err.statusCode);
    if (isAuthError && isLastAttempt) {
        const delayMin = AUTH_RETRY_DELAY_MS / 60000;
        logger_1.logger.warn(`🔁 [Worker] Job ${job.id} exhausted all ${job.opts.attempts} attempts due to HTTP ${err.statusCode}. ` +
            `Re-queuing campaign="${job.data.campaign_id}" with ${delayMin} min delay — waiting for auth to be restored.`);
        // Re-queue with a fresh jobId so it doesn't collide with the failed job entry in Redis.
        yield ad_insights_queue_1.adInsightsQueue.add(`sync:${job.data.campaign_id}:${job.data.date}`, job.data, {
            delay: AUTH_RETRY_DELAY_MS,
            jobId: `insights:${job.data.campaign_id}:${job.data.date}:auth-retry:${Date.now()}`
        });
        logger_1.logger.info(`📬 [Worker] Auth-retry job queued for campaign="${job.data.campaign_id}" — will attempt again in ${delayMin} min.`);
        return;
    }
    // Permanent failure for non-auth errors (all retries exhausted).
    logger_1.logger.error(`❌ [Worker] Job ${job.id} permanently failed after ${job.attemptsMade} attempt(s) — ` +
        `campaign="${job.data.campaign_id}" | date="${job.data.date}". Reason: ${err.message}`);
}));
// Job error event
exports.adInsightsWorker.on('error', err => {
    logger_1.logger.error(`🔴 [Worker] Worker-level error: ${err.message}`);
});
