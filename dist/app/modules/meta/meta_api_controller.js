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
exports.MetaControllers = void 0;
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const meta_api_service_1 = require("./meta_api_service");
// fetch adInsights data from meta api.
const get_adInsights_fromMeta = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield meta_api_service_1.MetaServices.fetch_AdInsights_fromMeta(req.query.campaign_id || 'ace234b1-ae89-47b0-9f01-53a03b8c3ddc', req.query.date || '2026-04-07');
    (0, sendResponse_1.default)(res, {
        status: result.status || 200,
        success: result.success || true,
        message: result.message || 'Ad insights fetched successfully from Meta API',
        data: result.data || {}
    });
}));
exports.MetaControllers = { get_adInsights_fromMeta };
