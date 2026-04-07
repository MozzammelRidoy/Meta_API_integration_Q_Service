"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const adapter_pg_1 = require("@prisma/adapter-pg");
const config_1 = __importDefault(require("../config"));
const client_1 = require("../../generated/prisma/client");
const connectionString = config_1.default.postgresql_database_url;
const adapter = new adapter_pg_1.PrismaPg({ connectionString });
const prisma = new client_1.PrismaClient({
    adapter
    // log: ['query', 'info', 'warn', 'error']
});
exports.prisma = prisma;
