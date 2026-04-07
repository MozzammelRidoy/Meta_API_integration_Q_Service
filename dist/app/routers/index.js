"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const meta_api_route_1 = require("../modules/meta/meta_api_route");
const ad_insights_route_1 = require("../modules/ad_insights/ad_insights_route");
/**
 * Main router configuration
 * This file serves as the central point for registering all module routes
 */
const routers = express_1.default.Router();
/**
 * Array of module routes to be registered
 * Each object contains:
 * - path: The base path for the module (e.g., '/auth')
 * - route: The router instance for the module
 */
const moduleRoutes = [
    {
        path: '/meta',
        route: meta_api_route_1.MetaRoutes
    },
    {
        path: '/insights',
        route: ad_insights_route_1.AdInsightsRoutes
    }
];
/**
 * Register all module routes
 * This loop iterates through the moduleRoutes array and registers each route
 * with its corresponding path
 */
moduleRoutes.forEach(route => {
    routers.use(route.path, route.route);
});
exports.default = routers;
