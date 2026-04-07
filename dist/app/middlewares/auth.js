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
const config_1 = __importDefault(require("../config"));
const AppError_1 = __importDefault(require("../errors/AppError"));
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const commonUtils_1 = require("../utils/commonUtils");
// initiate authentication route auth function
const auth = (...rolesAndFlags) => {
    // Check if the last argument is a boolean flag
    let isIgnoreAuthentication = false;
    if (typeof rolesAndFlags[rolesAndFlags.length - 1] === 'boolean') {
        isIgnoreAuthentication = rolesAndFlags.pop();
    }
    // The remaining arguments are the required roles
    const requiredRoles = rolesAndFlags;
    return (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        // Skip authentication if flag is set
        if (isIgnoreAuthentication) {
            return next();
        }
        // Extract token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AppError_1.default(401, 'UNAUTHORIZED', 'You are not authorized. No token provided.');
        }
        const token = authHeader.split(' ')[1];
        // Verify token
        const decoded = (0, commonUtils_1.verifyToken)(token, config_1.default.jwt_access_token_secret);
        const { user_id, role, iat } = decoded;
        // Check if user exists (implementation depends on your user model)
        // const user = await User.isUserStatusCheckFindBy_id(user_id);
        // if (!user) {
        //   throw new AppError(404, 'NOT_FOUND', 'User not found!');
        // }
        // Check if user is deleted
        // if (user.isDeleted) {
        //   throw new AppError(401, 'UNAUTHORIZED', 'This user has been deleted!');
        // }
        // Check if user is blocked
        // if (user.status === 'blocked') {
        //   throw new AppError(403, 'FORBIDDEN', 'This user is blocked!');
        // }
        // Check if user role matches
        // if (user.role !== role) {
        //   throw new AppError(403, 'FORBIDDEN', 'Invalid user role!');
        // }
        // Check if password was changed after token was issued
        // if (user.passwordChangedAt) {
        //   const isPasswordChanged = User.isJWTIssuedAtBeforePasswordChanged(
        //     user.passwordChangedAt,
        //     iat as number
        //   );
        //   if (isPasswordChanged) {
        //     // Clear cache if needed
        //     // delete_cache_from_RAM(user._id?.toString() as string);
        //     throw new AppError(401, 'UNAUTHORIZED', 'Password has been changed. Please login again.');
        //   }
        // }
        // Check if user has required role
        if (requiredRoles.length > 0 && !requiredRoles.includes(role)) {
            throw new AppError_1.default(403, 'FORBIDDEN', 'You do not have permission to perform this action.');
        }
        // Attach user to request object
        req.user = decoded;
        next();
    }));
};
exports.default = auth;
