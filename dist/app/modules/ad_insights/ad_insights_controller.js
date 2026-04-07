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
exports.adInsightsControllers = void 0;
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const ad_insights_service_1 = require("./ad_insights_service");
// get all ad insights
const get_all_adInsights = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield ad_insights_service_1.adIsightsServices.fetch_all_adInsights_from_DB(req.query);
    (0, sendResponse_1.default)(res, {
        status: 200,
        success: true,
        message: 'Ad Insights Store Data fetched successfully',
        data: result.data,
        meta: result.meta
    });
}));
// store ad insights
const create_adInsights = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield ad_insights_service_1.adIsightsServices.store_adInsights_into_DB(req.body);
    (0, sendResponse_1.default)(res, {
        status: 201,
        success: true,
        message: 'Ad Insights Data stored successfully',
        data: result
    });
}));
exports.adInsightsControllers = { get_all_adInsights, create_adInsights };
