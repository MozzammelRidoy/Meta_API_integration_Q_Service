"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const app_1 = __importDefault(require("./app"));
const config_1 = __importDefault(require("./app/config"));
const prisma_1 = require("./app/shared/prisma");
const redis_connection_1 = require("./app/redis/redis_connection");
let server;
let isShuttingDown = false;
// Track open sockets
const connections = new Set();
/**
 * Graceful shutdown
 */
const shutdown = (signal) => __awaiter(void 0, void 0, void 0, function* () {
    if (isShuttingDown)
        return;
    isShuttingDown = true;
    console.log(`\n🔴 ${signal} received. Starting graceful shutdown...`);
    // Stop new requests
    server.close(() => {
        console.log('✅ HTTP server stopped accepting new connections.');
    });
    // Kill hanging keep-alive connections
    setTimeout(() => {
        console.log('⚠️ Force closing remaining connections...');
        connections.forEach(socket => socket.destroy());
    }, 10000);
    // Disconnect DB
    try {
        yield prisma_1.prisma.$disconnect();
        console.log('✅ Prisma disconnected.');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Prisma disconnect error:', error);
        process.exit(1);
    }
});
/**
 * Start server
 */
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Verify Redis first — exits cleanly on auth/connection failure
            yield (0, redis_connection_1.verifyRedisConnection)();
            // Only start the worker after Redis is confirmed healthy
            yield Promise.resolve().then(() => __importStar(require('./app/queue/ad_insights_worker')));
            yield prisma_1.prisma.$connect();
            console.log('✅ PostgreSQL connected via Prisma');
            server = app_1.default.listen(config_1.default.port, () => {
                console.log(`🚀 Server running on port ${config_1.default.port}`);
            });
            // Track sockets
            server.on('connection', socket => {
                connections.add(socket);
                socket.on('close', () => connections.delete(socket));
            });
            process.on('SIGINT', shutdown);
            process.on('SIGTERM', shutdown);
        }
        catch (err) {
            console.error('❌ Startup failed:', err);
            process.exit(1);
        }
    });
}
main();
/** Non-fatal */
process.on('unhandledRejection', reason => {
    console.error('😡 Unhandled Rejection:', reason);
});
/** Fatal */
process.on('uncaughtException', err => {
    console.error('💥 Uncaught Exception:', err);
    shutdown('uncaughtException');
});
