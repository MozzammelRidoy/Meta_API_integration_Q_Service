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
exports.handle_file_upload_middleware = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const AppError_1 = __importDefault(require("../errors/AppError"));
const removeUploadedFiles_1 = require("../utils/removeUploadedFiles");
// Default constants
const DEFAULT_MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const DEFAULT_MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
// Default allowed file types
const DEFAULT_ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
    'image/svg+xml'
];
const DEFAULT_ALLOWED_VIDEO_TYPES = [
    'video/mp4',
    'video/webm',
    'video/mov',
    'video/avi',
    'video/mkv'
];
// Helper function to ensure directory exists
function ensureDirectoryExists(dirPath) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield promises_1.default.access(dirPath);
        }
        catch (_a) {
            yield promises_1.default.mkdir(dirPath, { recursive: true });
        }
    });
}
// Dynamic storage configuration
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => __awaiter(void 0, void 0, void 0, function* () {
        let uploadPath;
        // Determine upload path based on file type
        if (file.mimetype.startsWith('image/')) {
            uploadPath = path_1.default.join(process.cwd(), 'uploads/images');
        }
        else if (file.mimetype.startsWith('video/')) {
            uploadPath = path_1.default.join(process.cwd(), 'uploads/videos');
        }
        else {
            return cb(new AppError_1.default(400, '', 'Invalid file type'), '');
        }
        try {
            yield ensureDirectoryExists(uploadPath);
            cb(null, uploadPath);
        }
        catch (error) {
            cb(error, '');
        }
    }),
    filename: (req, file, cb) => {
        const ext = path_1.default.extname(file.originalname);
        const originalName = path_1.default.basename(file.originalname, ext);
        // Use a more unique filename to avoid collisions
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${originalName}-${uniqueSuffix}${ext}`);
    }
});
// Multer instance with global file size limit
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: DEFAULT_MAX_VIDEO_SIZE },
    fileFilter: (req, file, cb) => {
        // Basic file type validation at the multer level
        if (file.mimetype.startsWith('image/') ||
            file.mimetype.startsWith('video/')) {
            cb(null, true);
        }
        else {
            cb(new AppError_1.default(400, '', 'Invalid file type. Only images and videos are allowed.'));
        }
    }
});
// Main dynamic upload handler for multiple fields
const handle_file_upload_middleware = (fieldConfigs, globalOptions) => {
    // Set global defaults with options
    const globalMaxImageSize = (globalOptions === null || globalOptions === void 0 ? void 0 : globalOptions.maxImageSize) || DEFAULT_MAX_IMAGE_SIZE;
    const globalMaxVideoSize = (globalOptions === null || globalOptions === void 0 ? void 0 : globalOptions.maxVideoSize) || DEFAULT_MAX_VIDEO_SIZE;
    const globalAllowedImageTypes = (globalOptions === null || globalOptions === void 0 ? void 0 : globalOptions.allowedImageTypes) || DEFAULT_ALLOWED_IMAGE_TYPES;
    const globalAllowedVideoTypes = (globalOptions === null || globalOptions === void 0 ? void 0 : globalOptions.allowedVideoTypes) || DEFAULT_ALLOWED_VIDEO_TYPES;
    return (req, res, next) => {
        // Prepare multer fields configuration
        const multerFields = fieldConfigs.map(config => ({
            name: config.fieldName,
            maxCount: config.maxCount || 1
        }));
        // Use multer's fields method to handle all dynamic fields
        upload.fields(multerFields)(req, res, (err) => __awaiter(void 0, void 0, void 0, function* () {
            if (err) {
                // Handle multer errors
                let errorMessage = '';
                let fieldConfig;
                if (err instanceof multer_1.default.MulterError) {
                    switch (err.code) {
                        case 'LIMIT_FILE_SIZE':
                            fieldConfig = fieldConfigs.find(f => f.fieldName === err.field);
                            errorMessage = `File size exceeds maximum limit for ${err.field}`;
                            break;
                        case 'LIMIT_FILE_COUNT':
                            fieldConfig = fieldConfigs.find(f => f.fieldName === err.field);
                            errorMessage = `Too many files uploaded for ${err.field} (max ${(fieldConfig === null || fieldConfig === void 0 ? void 0 : fieldConfig.maxCount) || 1})`;
                            break;
                        case 'LIMIT_UNEXPECTED_FILE':
                            fieldConfig = fieldConfigs.find(f => f.fieldName === err.field);
                            if (fieldConfig) {
                                errorMessage = `Too many files uploaded for ${err.field} (max ${fieldConfig.maxCount || 1})`;
                            }
                            else {
                                errorMessage = `Unexpected field name: ${err.field}`;
                            }
                            break;
                        case 'LIMIT_FIELD_KEY':
                            errorMessage = 'Too many fields specified';
                            break;
                        case 'LIMIT_FIELD_VALUE':
                            errorMessage = 'Field value too long';
                            break;
                        case 'LIMIT_FIELD_COUNT':
                            errorMessage = 'Too many fields';
                            break;
                        case 'LIMIT_PART_COUNT':
                            errorMessage = 'Too many parts in form';
                            break;
                        default:
                            errorMessage = `Upload error: ${err.message}`;
                    }
                }
                else {
                    errorMessage = err.message;
                }
                return next(new AppError_1.default(400, (fieldConfig === null || fieldConfig === void 0 ? void 0 : fieldConfig.fieldName) || '', errorMessage));
            }
            // Get uploaded files with proper typing
            const files = req.files;
            try {
                // Check for required fields
                for (const config of fieldConfigs) {
                    if (!config.optional &&
                        (!files ||
                            !files[config.fieldName] ||
                            files[config.fieldName].length === 0)) {
                        throw new AppError_1.default(400, config.fieldName, `${config.fieldName} file field is required`);
                    }
                }
                // Validate each file in each field
                for (const config of fieldConfigs) {
                    const fieldFiles = (files === null || files === void 0 ? void 0 : files[config.fieldName]) || [];
                    // Determine the max size for this field
                    const maxSize = config.fileType === 'image'
                        ? config.maxImageSize || globalMaxImageSize
                        : config.maxVideoSize || globalMaxVideoSize;
                    // Determine allowed types for this field
                    const allowedTypes = config.fileType === 'image'
                        ? config.allowedImageTypes || globalAllowedImageTypes
                        : config.allowedVideoTypes || globalAllowedVideoTypes;
                    for (const file of fieldFiles) {
                        // Validate file type
                        if (!allowedTypes.includes(file.mimetype)) {
                            // Create a user-friendly list of allowed extensions
                            const allowedExtensions = allowedTypes
                                .map(type => {
                                const parts = type.split('/');
                                return parts[1] || type;
                            })
                                .join(', ');
                            throw new AppError_1.default(400, config.fieldName, `Invalid file type for ${config.fieldName}. Only ${allowedExtensions} files are allowed`);
                        }
                        // Validate file size
                        if (file.size > maxSize) {
                            throw new AppError_1.default(400, config.fieldName, `File size exceeds maximum limit for ${config.fieldName} (${maxSize / (1024 * 1024)}MB)`);
                        }
                    }
                }
                // If validation passes, proceed to next middleware
                next();
            }
            catch (validationError) {
                // Clean up all uploaded files on validation error
                if (files) {
                    yield (0, removeUploadedFiles_1.removeUploadedFiles)(files);
                }
                next(validationError);
            }
        }));
    };
};
exports.handle_file_upload_middleware = handle_file_upload_middleware;
