"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRole = exports.USER_ROLE = void 0;
/**
 * User Role Constants
 * Defines available user roles in the application
 */
exports.USER_ROLE = {
    superAdmin: 'superAdmin',
    admin: 'admin',
    user: 'user',
    developer: 'developer',
    editor: 'editor'
};
/**
 * Array of all available user roles
 * This is automatically generated from USER_ROLE to ensure consistency
 */
exports.UserRole = Object.values(exports.USER_ROLE);
