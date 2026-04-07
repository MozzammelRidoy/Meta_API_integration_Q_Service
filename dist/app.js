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
/* eslint-disable @typescript-eslint/no-unused-vars */
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const routers_1 = __importDefault(require("./app/routers"));
const globalErrorHandler_1 = __importDefault(require("./app/middlewares/globalErrorHandler"));
const notFound_1 = __importDefault(require("./app/middlewares/notFound"));
const bigIntSerializer_1 = require("./app/middlewares/bigIntSerializer");
const node_cache_1 = require("./app/utils/node_cache");
const rateLimitingHandler_1 = require("./app/middlewares/rateLimitingHandler");
const app = (0, express_1.default)();
// Enable trust proxy (if behind proxy)
app.enable('trust proxy');
// 🧱 Create limiter instance
const globalRateLimiter = (0, rateLimitingHandler_1.createProgressiveRateLimiter)({
    windowMs: 60 * 1000, // 1 minute window
    maxRequests: 200, // 200 requests per window
    initialBlockMs: 15 * 60 * 1000, // 15 minutes initial block
    // enableLogger: true, // Enable console logs
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.'
    },
    keyGenerator: (req) => {
        var _a;
        // Get real IP from proxy headers
        const forwarded = req.headers['x-forwarded-for'];
        if (forwarded)
            return forwarded.split(',')[0].trim();
        return req.ip || ((_a = req.socket) === null || _a === void 0 ? void 0 : _a.remoteAddress) || 'unknown';
    }
});
// CORS configuration
const getCorsOrigin = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let value = (0, node_cache_1.get_cache_from_RAM)('cors_origin');
        if (value === undefined) {
            // TODO: Replace with actual database fetch
            // const cors = await yourCorsOriginFromDB();
            // value = cors?.origin || [];
            value = ['http://localhost:5173', 'http://localhost:5174'];
            (0, node_cache_1.create_cache_into_RAM)('cors_origin', value);
        }
        return Array.isArray(value) ? value : [value];
    }
    catch (error) {
        console.error('Error fetching CORS origins:', error);
        return ['http://localhost:5173', 'http://localhost:5174']; // Fallback origins
    }
});
const getFallbackOrigins = () => [
    'http://localhost:5173',
    'http://localhost:5174'
];
// Middleware setup
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use((0, cookie_parser_1.default)());
app.use(bigIntSerializer_1.bigIntSerializer);
// CORS configuration with dynamic origins
app.use('/v1/api', globalRateLimiter, (0, cors_1.default)({
    origin: (origin, callback) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            // Allow requests with no origin (mobile apps, Postman, etc.)
            if (!origin)
                return callback(null, true);
            // if (!origin) return callback(new Error('Not allowed by CORS')) // for block anything without origin #for production
            const dynamicOrigins = yield getCorsOrigin();
            const allowedOrigins = dynamicOrigins.length > 0 ? dynamicOrigins : getFallbackOrigins();
            if (allowedOrigins.includes(origin)) {
                callback(null, true);
            }
            else {
                console.warn(`CORS blocked origin: ${origin}`);
                callback(new Error('Not allowed by CORS'));
            }
        }
        catch (error) {
            console.error('CORS origin check failed:', error);
            callback(new Error('CORS configuration error'));
        }
    }),
    credentials: true,
    optionsSuccessStatus: 200
}));
// API routes
app.use('/v1/api', globalRateLimiter, routers_1.default);
// Home route
const homeRoute = (req, res) => {
    res.status(200).json({
        server: 'Active',
        success: true,
        status: 200,
        message: 'This is Home Route.',
        timestamp: new Date().toISOString()
    });
};
app.get('/', globalRateLimiter, homeRoute);
// Health check endpoint
app.get('/health', globalRateLimiter, (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});
// Error handling middleware
app.use(globalErrorHandler_1.default);
app.use(notFound_1.default);
exports.default = app;
