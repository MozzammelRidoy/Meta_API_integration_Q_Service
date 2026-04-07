"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdInsightsRoutes = void 0;
const express_1 = __importDefault(require("express"));
const ad_insights_controller_1 = require("./ad_insights_controller");
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const ad_insights_validationSchema_1 = require("./ad_insights_validationSchema");
const router = express_1.default.Router();
// fetch all adInsights
router.get('/', ad_insights_controller_1.adInsightsControllers.get_all_adInsights);
// store adInsights
router.post('/sync-insights', (0, validateRequest_1.default)(ad_insights_validationSchema_1.AdInsights_Validation.store_adInsights_ValidationZodSchema), ad_insights_controller_1.adInsightsControllers.create_adInsights);
exports.AdInsightsRoutes = router;
