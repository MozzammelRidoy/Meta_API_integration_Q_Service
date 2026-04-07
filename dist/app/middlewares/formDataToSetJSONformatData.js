"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Middleware to parse JSON data from form data
 * This middleware expects the request body to contain a 'data' field with a JSON string.
 * It parses the JSON string and replaces req.body with the parsed object.
 *
 * @param req - Express Request object
 * @param res - Express Response object
 * @param next - Express NextFunction
 */
const formData_ToSet_JSONformat_Data = (req, res, next) => {
    try {
        // Check if the data field exists in the request body
        if (!req.body || !req.body.data) {
            throw new Error('Missing required field: data');
        }
        // Parse the JSON string from the data field
        const parsedData = JSON.parse(req.body.data);
        // Replace the entire request body with the parsed data
        req.body = parsedData;
        // Continue to the next middleware
        next();
    }
    catch (error) {
        // Handle JSON parsing errors or missing data field
        res.status(400).json({
            success: false,
            message: 'Invalid JSON data provided',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.default = formData_ToSet_JSONformat_Data;
