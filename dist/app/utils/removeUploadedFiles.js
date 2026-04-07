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
exports.cleanUploadDirectory = exports.removeFilesFromFields = exports.removeUploadedFiles = exports.removeSingleUploadedFile = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const promises_1 = __importDefault(require("fs/promises"));
const util_1 = require("util");
const path_1 = __importDefault(require("path"));
// Promisify the unlink function for callback-based operations
const unlinkAsync = (0, util_1.promisify)(promises_1.default.unlink);
/**
 * Remove a single uploaded file
 * @param filePath - Path to the file to remove
 * @returns Promise that resolves when file is removed or rejects on error
 */
const removeSingleUploadedFile = (filePath) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Check if file exists before attempting to remove
        yield promises_1.default.access(filePath, promises_1.default.constants.F_OK);
        yield unlinkAsync(filePath);
    }
    catch (error) {
        // If file doesn't exist (ENOENT), that's okay - it might have been removed already
        if (error.code !== 'ENOENT') {
            console.error(`Failed to remove file: ${filePath}`, error);
            throw new Error(`Failed to remove file: ${filePath}`);
        }
    }
});
exports.removeSingleUploadedFile = removeSingleUploadedFile;
/**
 * Remove multiple uploaded files from all fields
 * @param files - Object containing uploaded files grouped by field name
 * @returns Promise that resolves when all files are removed or rejects on error
 */
const removeUploadedFiles = (files) => __awaiter(void 0, void 0, void 0, function* () {
    if (!files || Object.keys(files).length === 0) {
        return;
    }
    try {
        // Create an array of removal promises for all files
        const removalPromises = [];
        // Iterate through each field in the files object
        for (const fieldName in files) {
            if (Object.prototype.hasOwnProperty.call(files, fieldName)) {
                const fieldFiles = files[fieldName] || [];
                // Add removal promise for each file in the field
                for (const file of fieldFiles) {
                    removalPromises.push((0, exports.removeSingleUploadedFile)(file.path).catch(error => {
                        console.error(`Failed to remove file: ${file.path}`, error);
                        // Don't throw - continue removing other files
                    }));
                }
            }
        }
        // Execute all removal promises concurrently
        yield Promise.all(removalPromises);
    }
    catch (error) {
        console.error('Error during batch file removal:', error);
        throw new Error('Failed to remove uploaded files');
    }
});
exports.removeUploadedFiles = removeUploadedFiles;
/**
 * Remove files from specific fields only
 * @param files - Object containing uploaded files grouped by field name
 * @param fieldNames - Array of field names to remove files from
 * @returns Promise that resolves when specified files are removed or rejects on error
 */
const removeFilesFromFields = (files, fieldNames) => __awaiter(void 0, void 0, void 0, function* () {
    if (!files || fieldNames.length === 0) {
        return;
    }
    try {
        const removalPromises = [];
        // Only process files from specified fields
        for (const fieldName of fieldNames) {
            const fieldFiles = files[fieldName] || [];
            for (const file of fieldFiles) {
                removalPromises.push((0, exports.removeSingleUploadedFile)(file.path).catch(error => {
                    console.error(`Failed to remove file: ${file.path}`, error);
                }));
            }
        }
        yield Promise.all(removalPromises);
    }
    catch (error) {
        console.error('Error during field-specific file removal:', error);
        throw new Error('Failed to remove files from specified fields');
    }
});
exports.removeFilesFromFields = removeFilesFromFields;
/**
 * Clean up uploaded files directory (removes all files in a directory)
 * @param directoryPath - Path to the directory to clean
 * @returns Promise that resolves when directory is cleaned or rejects on error
 */
const cleanUploadDirectory = (directoryPath) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Check if directory exists
        yield promises_1.default.access(directoryPath, promises_1.default.constants.F_OK);
        // Read all files in the directory
        const files = yield promises_1.default.readdir(directoryPath);
        // Remove each file
        const removalPromises = files.map(file => {
            const filePath = path_1.default.join(directoryPath, file);
            return (0, exports.removeSingleUploadedFile)(filePath).catch(error => {
                console.error(`Failed to remove file: ${filePath}`, error);
            });
        });
        yield Promise.all(removalPromises);
    }
    catch (error) {
        // If directory doesn't exist, that's okay
        if (error.code !== 'ENOENT') {
            console.error('Error cleaning upload directory:', error);
            throw new Error(`Failed to clean directory: ${directoryPath}`);
        }
    }
});
exports.cleanUploadDirectory = cleanUploadDirectory;
