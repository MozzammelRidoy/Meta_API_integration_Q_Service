"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load environment variables from .env file
dotenv_1.default.config({ path: path_1.default.join(process.cwd(), '.env') });
/**
 * Ensure environment variable is set
 * @param key - Environment variable key
 * @returns Environment variable value
 * @throws Error if environment variable is not set
 */
function ensureEnv(key) {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Environment variable ${key} is required but not set.`);
    }
    return value;
}
/**
 * Application configuration object
 */
const config = {
    // Application settings
    NODE_ENV: process.env.NODE_ENV || 'development',
    port: Number(process.env.PORT) || 5000,
    client_side_url: ensureEnv('CLIENT_SIDE_URL'),
    backend_side_url: ensureEnv('BACKEND_SIDE_URL'),
    // PostgreSQL configuration
    postgresql_database_url: ensureEnv('POSTGRESQL_DATABASE_URL'),
    // Authentication configuration
    bcrypt_salt_rounds: Number(ensureEnv('BCRYPT_SALT_ROUNDS')),
    jwt_access_token_secret: ensureEnv('JWT_ACCESS_TOKEN_SECRET'),
    jwt_refresh_token_secret: ensureEnv('JWT_REFRESH_TOKEN_SECRET'),
    jwt_access_token_expires_in: ensureEnv('JWT_ACCESS_TOKEN_EXPIRES_IN'),
    jwt_refresh_token_expires_in: ensureEnv('JWT_REFRESH_TOKEN_EXPIRES_IN'),
    // Email configuration
    email_host_provider_name: ensureEnv('EMAIL_HOST_PROVIDER_NAME'),
    email_host_provider_port: Number(ensureEnv('EMAIL_HOST_PROVIDER_PORT')),
    email_sender_email: ensureEnv('EMAIL_SENDER_EMAIL'),
    email_sender_email_app_pass: ensureEnv('EMAIL_SENDER_EMAIL_APP_PASS'),
    email_sender_name: ensureEnv('EMAIL_SENDER_NAME'),
    email_reply_to: ensureEnv('EMAIL_REPLY_TO'),
    email_test_recipient: ensureEnv('EMAIL_TEST_RECIPIENTS'),
    redis_cache_db_url: ensureEnv('RADIS_CACHE_DB_URL')
};
exports.default = config;
