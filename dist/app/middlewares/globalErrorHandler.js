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
const prismaNamespace_1 = require("../../generated/prisma/internal/prismaNamespace");
const zod_1 = require("zod");
const handleZodValidationError_1 = __importDefault(require("../errors/handleZodValidationError"));
const handlePrismaValidationError_1 = __importDefault(require("../errors/handlePrismaValidationError"));
const handlePrismaCastError_1 = __importDefault(require("../errors/handlePrismaCastError"));
const handlePrismaDuplicateError_1 = __importDefault(require("../errors/handlePrismaDuplicateError"));
const AppError_1 = __importDefault(require("../errors/AppError"));
const removeUploadedFiles_1 = require("../utils/removeUploadedFiles");
const config_1 = __importDefault(require("../config"));
/**
 * Global error handler middleware for PostgreSQL with Prisma
 * Handles all types of errors and returns consistent error responses
 */
const globalErrorHandler = (err, req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // Initialize default error details
    let statusCode = 500;
    let message = 'Something went wrong';
    let errorSources = [
        {
            path: '',
            message: 'Something went wrong'
        }
    ];
    // Zod validation error handling
    if (err instanceof zod_1.ZodError) {
        const simplifiedError = (0, handleZodValidationError_1.default)(err);
        statusCode = simplifiedError.statusCode;
        message = simplifiedError.message;
        errorSources = simplifiedError.errorSources;
    }
    // Prisma validation error handling
    else if (err instanceof prismaNamespace_1.PrismaClientValidationError ||
        (err instanceof prismaNamespace_1.PrismaClientKnownRequestError && err.code === 'P2018')) {
        const simplifiedError = (0, handlePrismaValidationError_1.default)(err);
        if (simplifiedError) {
            statusCode = simplifiedError.statusCode;
            message = simplifiedError.message;
            errorSources = simplifiedError.errorSources;
        }
    }
    // Prisma cast error handling
    else if (err instanceof prismaNamespace_1.PrismaClientKnownRequestError &&
        (err.code === 'P2023' || err.code === 'P2025')) {
        const simplifiedError = (0, handlePrismaCastError_1.default)(err);
        if (simplifiedError) {
            statusCode = simplifiedError.statusCode;
            message = simplifiedError.message;
            errorSources = simplifiedError.errorSources;
        }
    }
    // Prisma Duplicate error handling
    else if (err instanceof prismaNamespace_1.PrismaClientKnownRequestError &&
        err.code === 'P2002') {
        const simplifiedError = (0, handlePrismaDuplicateError_1.default)(err);
        if (simplifiedError) {
            statusCode = simplifiedError.statusCode;
            message = simplifiedError.message;
            errorSources = simplifiedError.errorSources;
        }
    }
    // Custom AppError handling
    else if (err instanceof AppError_1.default) {
        statusCode = err.statusCode;
        message = err.message;
        errorSources = [
            {
                path: err.path || '',
                message: err.message
            }
        ];
    }
    // Built-in error handling
    else if (err instanceof Error) {
        message = err.message;
        errorSources = [
            {
                path: '',
                message: err.message
            }
        ];
    }
    // Clean up uploaded files if they exist
    try {
        // Handle multiple files (req.files)
        if (req.files) {
            // Type assertion for files object with field names as keys
            const files = req.files;
            yield (0, removeUploadedFiles_1.removeUploadedFiles)(files);
        }
        // Handle single file (req.file)
        if (req.file) {
            yield (0, removeUploadedFiles_1.removeSingleUploadedFile)(req.file.path);
        }
    }
    catch (cleanupError) {
        console.error('Error during file cleanup:', cleanupError);
        // Don't throw the cleanup error, just log it
    }
    // Send error response
    res.status(statusCode).json({
        status: statusCode,
        success: false,
        message,
        error: errorSources,
        stack: config_1.default.NODE_ENV === 'development' ? err.stack : null
    });
});
exports.default = globalErrorHandler;
