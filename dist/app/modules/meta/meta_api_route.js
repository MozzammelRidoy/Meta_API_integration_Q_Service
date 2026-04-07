"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetaRoutes = void 0;
const express_1 = __importDefault(require("express"));
const meta_api_controller_1 = require("./meta_api_controller");
const router = express_1.default.Router();
// get meta insights for a campaign from meta api.
router.get('/ad-insights', meta_api_controller_1.MetaControllers.get_adInsights_fromMeta);
exports.MetaRoutes = router;
