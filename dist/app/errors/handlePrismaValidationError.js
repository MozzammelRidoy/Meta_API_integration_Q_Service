"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prismaNamespace_1 = require("../../generated/prisma/internal/prismaNamespace");
/**
 * Handle Prisma validation errors
 * @param err - Prisma error instance
 * @returns Formatted error response or null if not a validation error
 */
const handlePrismaValidationError = (err) => {
    // Handle PrismaClientValidationError (invalid data types, missing required fields, etc.)
    if (err instanceof prismaNamespace_1.PrismaClientValidationError) {
        // Extract field information from error message
        const fieldMatches = [...err.message.matchAll(/Argument `(w+)`/g)].map(match => match[1]);
        const errorSources = fieldMatches.length > 0
            ? fieldMatches.map(field => ({
                path: field,
                message: `Invalid value for field: ${field}`
            }))
            : [
                {
                    path: 'validation',
                    message: 'Invalid data provided'
                }
            ];
        return {
            statusCode: 400,
            message: 'Validation Error',
            errorSources
        };
    }
    // Handle PrismaClientKnownRequestError for missing required fields (P2018)
    if (err instanceof prismaNamespace_1.PrismaClientKnownRequestError && err.code === 'P2018') {
        const errorSources = [
            {
                path: 'required_fields',
                message: 'Required fields are missing'
            }
        ];
        return {
            statusCode: 400,
            message: 'Validation Error',
            errorSources
        };
    }
    // Return null if it's not a validation error we handle
    return null;
};
exports.default = handlePrismaValidationError;
