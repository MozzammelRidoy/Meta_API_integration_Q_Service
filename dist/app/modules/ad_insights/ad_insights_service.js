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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adIsightsServices = void 0;
const PrismaQueryBuilder_1 = __importDefault(require("../../builder/PrismaQueryBuilder"));
const prisma_1 = require("../../shared/prisma");
const ad_insights_queue_1 = require("../../queue/ad_insights_queue");
const logger_1 = require("../../utils/logger");
const date_Time_Validation_1 = require("../../utils/date_Time_Validation");
const AppError_1 = __importDefault(require("../../errors/AppError"));
const fetch_all_adInsights_from_DB = (query) => __awaiter(void 0, void 0, void 0, function* () {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { isDeleted } = query, rest = __rest(query, ["isDeleted"]);
    if (rest.impressions)
        rest.impressions = Number(rest.impressions);
    if (rest.clicks)
        rest.clicks = Number(rest.clicks);
    if (rest.spend)
        rest.spend = Number(rest.spend);
    const adInsightsQuery = new PrismaQueryBuilder_1.default(prisma_1.prisma.adInsights, rest)
        .setBaseQuery({
        isDeleted: false
    })
        .setSecretFields(['isDeleted'])
        .fields()
        .filter()
        .sort()
        .paginate();
    // .search(['name'])
    const data = yield adInsightsQuery.execute();
    const meta = yield adInsightsQuery.countTotal();
    return { data, meta };
});
// Store ad insights into DB.
const store_adInsights_into_DB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { campaign_ids, date } = payload;
    // date validation and formatting.
    if (!(0, date_Time_Validation_1.isValidDate)(date))
        throw new AppError_1.default(400, 'date', 'Invalid date format');
    // Job creation.
    const jobs = yield Promise.all(campaign_ids.map(campaign_id => ad_insights_queue_1.adInsightsQueue.add(`sync:${campaign_id}:${date}`, { campaign_id, date }, {
        jobId: `insights:${campaign_id}:${date}`
    })));
    logger_1.logger.info(`▶ Enqueued ${jobs.length} sync job(s) for date=${date}`);
    return {
        queued: jobs.length,
        date,
        campaign_ids,
        jobIds: jobs.map(j => j.id)
    };
});
exports.adIsightsServices = {
    fetch_all_adInsights_from_DB,
    store_adInsights_into_DB
};
