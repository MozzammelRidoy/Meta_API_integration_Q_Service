"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRandomBarcodeId = exports.maskSensitiveInfo = exports.isValidPhone = exports.isValidEmail = exports.generateRandomString = exports.formatPhoneNumber = exports.check_Input_isPhone_Or_isEmail = exports.generateOTP = exports.verifyToken = exports.createToken = void 0;
exports.generateTransactionId = generateTransactionId;
/* eslint-disable @typescript-eslint/no-explicit-any */
const AppError_1 = __importDefault(require("../errors/AppError"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
/**
 * Create a JWT token
 * @param jwtPayload - Payload to include in the token
 * @param jwtSecret - Secret key for signing the token
 * @param expiresIn - Token expiration time (e.g., '1d', '2h', '60m')
 * @returns JWT token string
 */
const createToken = (jwtPayload, jwtSecret, expiresIn) => {
    const options = { expiresIn: expiresIn };
    return jsonwebtoken_1.default.sign(jwtPayload, jwtSecret, options);
};
exports.createToken = createToken;
/**
 * Verify a JWT token
 * @param token - JWT token to verify
 * @param secret - Secret key for verification
 * @returns Decoded JWT payload
 * @throws AppError if token is invalid or expired
 */
const verifyToken = (token, secret) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        return decoded;
    }
    catch (err) {
        throw new AppError_1.default(401, '', err.message || 'Invalid or expired token!');
    }
};
exports.verifyToken = verifyToken;
/**
 * Generate a random OTP (One-Time Password)
 * @param length - Length of the OTP (default: 6)
 * @returns Random OTP as a string
 */
const generateOTP = (length = 6) => {
    if (length < 1) {
        throw new AppError_1.default(400, 'otp_length', 'OTP length must be at least 1');
    }
    if (length > 24) {
        throw new AppError_1.default(400, 'otp_length', 'OTP length cannot exceed 24');
    }
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return Math.floor(min + Math.random() * (max - min + 1)).toString();
};
exports.generateOTP = generateOTP;
/**
 * Check if input is a valid phone number or email
 * @param input - String to validate
 * @returns Object containing type ('phone' or 'email') and formatted value
 * @throws AppError if input is neither a valid phone nor email
 */
const check_Input_isPhone_Or_isEmail = (input) => {
    if (!input || typeof input !== 'string') {
        throw new AppError_1.default(400, 'input', 'Input must be a non-empty string');
    }
    // Trim to remove accidental spaces
    const trimmed = input.trim();
    // Check if it's all digits (potential phone number)
    const isAllDigits = /^[0-9]+$/.test(trimmed);
    if (isAllDigits) {
        // Validate phone number format
        if (trimmed.length === 11 && trimmed.startsWith('01')) {
            return { type: 'phone', value: trimmed };
        }
        else {
            throw new AppError_1.default(400, 'phone_format', 'Invalid phone number format (must be 11 digits and start with "01")');
        }
    }
    else {
        // Validate email format
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailPattern.test(trimmed)) {
            return { type: 'email', value: trimmed };
        }
        else {
            throw new AppError_1.default(400, 'email_format', 'Invalid email format');
        }
    }
};
exports.check_Input_isPhone_Or_isEmail = check_Input_isPhone_Or_isEmail;
/**
 * Format a phone number to a specific format
 * @param phone - Phone number string
 * @param format - Desired format ('standard', 'international', 'national')
 * @returns Formatted phone number
 */
const formatPhoneNumber = (phone, format = 'standard') => {
    // Remove all non-digit characters
    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length !== 11 || !digitsOnly.startsWith('01')) {
        throw new AppError_1.default(400, 'phone_format', 'Invalid phone number for formatting');
    }
    switch (format) {
        case 'international':
            return '+880' + digitsOnly.substring(1);
        case 'national':
            return '0' + digitsOnly.substring(1);
        case 'standard':
        default:
            return digitsOnly;
    }
};
exports.formatPhoneNumber = formatPhoneNumber;
/**
 * Generate a random string of specified length
 * @param length - Length of the string to generate
 * @param options - Options for character set
 * @returns Random string
 */
const generateRandomString = (length, options = {}) => {
    const { includeUppercase = true, includeLowercase = true, includeNumbers = true, includeSymbols = false } = options;
    if (length < 1) {
        throw new AppError_1.default(400, 'string_length', 'Length must be at least 1');
    }
    let charset = '';
    if (includeUppercase)
        charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeLowercase)
        charset += 'abcdefghijklmnopqrstuvwxyz';
    if (includeNumbers)
        charset += '0123456789';
    if (includeSymbols)
        charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    if (charset === '') {
        throw new AppError_1.default(400, 'charset', 'At least one character type must be selected');
    }
    let result = '';
    for (let i = 0; i < length; i++) {
        result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return result;
};
exports.generateRandomString = generateRandomString;
/**
 * Check if a string is a valid email address
 * @param email - Email string to validate
 * @returns True if valid, false otherwise
 */
const isValidEmail = (email) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email.trim());
};
exports.isValidEmail = isValidEmail;
/**
 * Check if a string is a valid phone number
 * @param phone - Phone number string to validate
 * @returns True if valid, false otherwise
 */
const isValidPhone = (phone) => {
    const digitsOnly = phone.replace(/\D/g, '');
    return digitsOnly.length === 11 && digitsOnly.startsWith('01');
};
exports.isValidPhone = isValidPhone;
/**
 * Mask sensitive information (like email or phone)
 * @param value - Value to mask
 * @param type - Type of value ('email' or 'phone')
 * @returns Masked string
 */
const maskSensitiveInfo = (value, type) => {
    if (!value || typeof value !== 'string') {
        return value;
    }
    let maskedValue;
    switch (type) {
        case 'email': {
            const [username, domain] = value.split('@');
            if (username && domain) {
                const visibleChars = Math.max(1, Math.floor(username.length / 2));
                const maskedUsername = username.substring(0, visibleChars) +
                    '*'.repeat(username.length - visibleChars);
                maskedValue = maskedUsername + '@' + domain;
                break;
            }
            maskedValue = value;
            break;
        }
        case 'phone': {
            const digitsOnly = value.replace(/\D/g, '');
            if (digitsOnly.length === 11) {
                maskedValue =
                    digitsOnly.substring(0, 3) + '****' + digitsOnly.substring(7);
                break;
            }
            maskedValue = value;
            break;
        }
        default:
            maskedValue = value;
    }
    return maskedValue;
};
exports.maskSensitiveInfo = maskSensitiveInfo;
/** Generate a random barcode ID in the format XXX.XX.XX.XXX
 * where X is a digit (0-9)
 * @returns Random barcode ID string
 */
const generateRandomBarcodeId = () => {
    // Generate each part with the required number of digits (with leading zeros if needed)
    const part1 = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, '0');
    const part2 = Math.floor(Math.random() * 100)
        .toString()
        .padStart(2, '0');
    const part3 = Math.floor(Math.random() * 100)
        .toString()
        .padStart(2, '0');
    const part4 = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, '0');
    // Example format: 153.04.55.022
    return part1 + '.' + part2 + '.' + part3 + '.' + part4;
};
exports.generateRandomBarcodeId = generateRandomBarcodeId;
/** Generate a unique transaction ID
 * Combines current timestamp in base36 with a counter to ensure uniqueness
 * @param totalLength - Total length of the transaction ID (default: 12)
 * @returns Unique transaction ID string
 */
function generateTransactionId(totalLength = 12) {
    if (totalLength < 2)
        throw new Error('Minimum length is 2');
    // Allocate 1-3 characters for counter based on total length
    const counterLength = Math.min(3, totalLength - 1);
    const timeLength = totalLength - counterLength;
    const now = Date.now();
    const maxCounter = 36 ** counterLength; // Base36 counter capacity
    // Use a closure to maintain state between calls
    let lastTime = 0;
    let counter = 0;
    // Update counter with overflow protection
    if (now === lastTime) {
        counter = (counter + 1) % maxCounter;
    }
    else {
        lastTime = now;
        counter = 0;
    }
    // Generate time part (base36) - take the last 'timeLength' characters
    const timePart = now
        .toString(36)
        .padStart(timeLength, '0')
        .slice(-timeLength)
        .toUpperCase();
    // Generate counter part (base36) - pad to counterLength and take last characters
    const counterPart = counter
        .toString(36)
        .padStart(counterLength, '0')
        .slice(-counterLength)
        .toUpperCase();
    return timePart + counterPart;
}
