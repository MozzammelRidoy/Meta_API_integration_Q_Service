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
exports.MetaServices = void 0;
const AppError_1 = __importDefault(require("../../errors/AppError"));
const meta_api_constant_1 = require("./meta_api_constant");
/**
 * Simulated Meta Ads API
 * Randomly returns success (60%), general error (20%), or rate limit error (20%)
 */
// Simulate a Meta API call - deliberately unreliable
const fetch_AdInsights_fromMeta = (campaign_id, date) => __awaiter(void 0, void 0, void 0, function* () {
    // Simulate network latency
    yield new Promise(res => setTimeout(res, 100 + Math.random() * 300));
    const roll = Math.random();
    // 20% chance: rate limit error
    if (roll < 0.2) {
        throw new AppError_1.default(429, 'meta_api', 'Meta API rate limit exceeded. Please retry after some time.');
    }
    // 20% chance: general API error (roll 0.2–0.4)
    if (roll < 0.4) {
        const error = meta_api_constant_1.META_ERRORS[Math.floor(Math.random() * meta_api_constant_1.META_ERRORS.length)];
        throw new AppError_1.default(error.status, 'meta_api', `Meta API error: ${error.mgs}`);
    }
    // 60% chance: success
    const statusCode = [200, 202, 203][Math.floor(Math.random() * 3)];
    return {
        status: statusCode,
        success: true,
        message: 'Ad insights fetched successfully from Meta API',
        data: {
            campaign_id,
            impressions: Math.floor(Math.random() * 50000) + 1000,
            clicks: Math.floor(Math.random() * 2000) + 50,
            spend: parseFloat((Math.random() * 500 + 10).toFixed(2)),
            date
        }
    };
});
exports.MetaServices = { fetch_AdInsights_fromMeta };
