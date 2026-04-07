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
exports.testEmailConfig = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const nodemailer_1 = __importDefault(require("nodemailer"));
const config_1 = __importDefault(require("../config"));
const AppError_1 = __importDefault(require("../errors/AppError"));
/**
 * Email transporter configuration
 */
const createTransporter = () => {
    return nodemailer_1.default.createTransport(Object.assign({ host: config_1.default.email_host_provider_name, port: Number(config_1.default.email_host_provider_port), secure: config_1.default.NODE_ENV === 'production', auth: {
            user: config_1.default.email_sender_email,
            pass: config_1.default.email_sender_email_app_pass
        } }, (config_1.default.NODE_ENV === 'production' && {
        tls: {
            rejectUnauthorized: true // Enforce certificate validation in production
        }
    })));
};
/**
 * Send email using configured transporter
 * @param to - Recipient email address
 * @param emailTemplate - Email template containing subject and body
 * @returns Promise that resolves when email is sent
 * @throws AppError if email sending fails
 */
const sendEmail = (to, emailTemplate) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Validate required parameters
        if (!to || !(emailTemplate === null || emailTemplate === void 0 ? void 0 : emailTemplate.subject) || !(emailTemplate === null || emailTemplate === void 0 ? void 0 : emailTemplate.emailBody)) {
            throw new AppError_1.default(400, 'INVALID_INPUT', 'Missing required email parameters');
        }
        // Create transporter
        const transporter = createTransporter();
        // Prepare email options
        const mailOptions = Object.assign({ from: `"${config_1.default.email_sender_name || 'Your App'}" <${config_1.default.email_sender_email}>`, to, subject: emailTemplate.subject, text: emailTemplate.text || '', html: emailTemplate.emailBody }, (config_1.default.email_reply_to && {
            replyTo: config_1.default.email_reply_to
        }));
        // Send email
        const info = yield transporter.sendMail(mailOptions);
        // Log successful email sending (optional)
        console.log('Email sent successfully:', {
            messageId: info.messageId,
            to,
            subject: emailTemplate.subject
        });
    }
    catch (error) {
        console.error('Email sending failed:', {
            to,
            subject: emailTemplate === null || emailTemplate === void 0 ? void 0 : emailTemplate.subject,
            error: error.message,
            stack: error.stack
        });
        // Throw a more specific error based on the error type
        if (error.code === 'EAUTH') {
            throw new AppError_1.default(500, 'EMAIL_AUTH_ERROR', 'Email authentication failed. Check email credentials.');
        }
        else if (error.code === 'ECONNECTION') {
            throw new AppError_1.default(500, 'EMAIL_CONNECTION_ERROR', 'Failed to connect to email server.');
        }
        else if (error.code === 'EMESSAGE') {
            throw new AppError_1.default(400, 'EMAIL_MESSAGE_ERROR', 'Invalid email message format.');
        }
        else {
            throw new AppError_1.default(500, 'EMAIL_SEND_ERROR', `Failed to send email: ${error.message}`);
        }
    }
});
/**
 * Test email configuration
 * @returns Promise that resolves when test email is sent
 */
const testEmailConfig = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const testEmail = config_1.default.email_test_recipient || config_1.default.email_sender_email;
        if (!testEmail) {
            throw new AppError_1.default(400, 'INVALID_CONFIG', 'No test email recipient configured');
        }
        const testTemplate = {
            subject: 'Test Email from Your App',
            text: 'This is a test email to verify your email configuration.',
            emailBody: `
        <h1>Email Configuration Test</h1>
        <p>If you receive this email, your email configuration is working correctly.</p>
        <p>Time sent: ${new Date().toISOString()}</p>
      `
        };
        yield sendEmail(testEmail, testTemplate);
        console.log('Email configuration test successful');
    }
    catch (error) {
        console.error('Email configuration test failed:', error);
        throw error;
    }
});
exports.testEmailConfig = testEmailConfig;
exports.default = sendEmail;
