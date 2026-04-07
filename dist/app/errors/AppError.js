"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Custom error class for handling application-specific errors
 * Extends the built-in Error class with additional properties for HTTP status codes and error paths
 */
class AppError extends Error {
    /**
     * Create a new AppError instance
     * @param statusCode - HTTP status code (e.g., 400, 404, 500)
     * @param path - Route or module where the error occurred
     * @param message - Error message
     * @param stack - Optional stack trace (if not provided, will be captured automatically)
     */
    constructor(statusCode, path, message, stack = '') {
        super(message);
        // Set the prototype explicitly to maintain instanceof checks
        Object.setPrototypeOf(this, AppError.prototype);
        this.statusCode = statusCode;
        this.path = path;
        if (stack) {
            this.stack = stack;
        }
        else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}
exports.default = AppError;
