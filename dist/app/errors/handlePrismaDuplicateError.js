"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Handle Prisma unique constraint violation error (P2002)
 * @param err - Prisma known request error
 * @returns Formatted error response or null if not a duplicate error
 */
const handlePrismaDuplicateError = (err) => {
    var _a, _b;
    // Handle unique constraint violation (P2002)
    if (err.code === 'P2002') {
        // Extract field name from the target array
        const target = ((_a = err.meta) === null || _a === void 0 ? void 0 : _a.target) || [];
        const fieldName = target.length > 0 ? target[0] : 'unknown_field';
        // Extract duplicate value if available
        const keyValue = ((_b = err.meta) === null || _b === void 0 ? void 0 : _b.target)
            ? `Duplicate value for field: ${fieldName}`
            : 'Duplicate entry violation';
        const errorSources = [
            {
                path: fieldName,
                message: keyValue
            }
        ];
        return {
            statusCode: 409,
            message: 'Duplicate entry violation',
            errorSources
        };
    }
    // Return null if it's not a duplicate error we handle
    return null;
};
exports.default = handlePrismaDuplicateError;
