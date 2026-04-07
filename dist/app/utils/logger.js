"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
exports.logger = {
    info: (message, meta) => {
        console.log(`[INFO] ${message}`, meta || '');
    },
    error: (message, error) => {
        console.error(`[ERROR] ${message}`, error || '');
    },
    warn: (message, meta) => {
        console.warn(`[WARN] ${message}`, meta || '');
    }
};
