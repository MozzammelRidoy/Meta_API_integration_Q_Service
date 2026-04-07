"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Not Found middleware
 * Handles requests to non-existent routes and returns a consistent 404 response
 *
 * @param req - Express Request object
 * @param res - Express Response object
 * @param next - Express NextFunction
 */
const notFound = (req, res, next) => {
    res.status(404).json({
        status: 404,
        success: false,
        message: 'API Not Found!',
        error: {
            path: req.originalUrl,
            message: 'Your requested API not found',
            method: req.method
        }
    });
};
exports.default = notFound;
