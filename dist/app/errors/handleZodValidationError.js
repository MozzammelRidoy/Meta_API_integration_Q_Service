"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Handle Zod validation errors
 * @param error - ZodError instance
 * @returns Formatted error response
 */
const handleZodValidationError = (error) => {
    const errorSources = error.issues.map((issue) => {
        // Remove the first element (usually 'body', 'query', or 'params') and join the rest
        const pathSegments = issue.path.slice(1);
        const fullPath = pathSegments.join('.');
        return {
            path: fullPath,
            message: issue.message
        };
    });
    return {
        statusCode: 400,
        message: 'Validation Error',
        errorSources
    };
};
exports.default = handleZodValidationError;
