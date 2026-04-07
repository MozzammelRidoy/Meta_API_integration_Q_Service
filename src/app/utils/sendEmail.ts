/* eslint-disable @typescript-eslint/no-explicit-any */
import nodemailer from 'nodemailer'
import config from '../config'
import { TEmailFormat } from '../interfaces/emailFormat'
import AppError from '../errors/AppError'

/**
 * Email transporter configuration
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    host: config.email_host_provider_name as string,
    port: Number(config.email_host_provider_port),
    secure: config.NODE_ENV === 'production', // Use TLS in production
    auth: {
      user: config.email_sender_email,
      pass: config.email_sender_email_app_pass
    },
    // Additional security options for production
    ...(config.NODE_ENV === 'production' && {
      tls: {
        rejectUnauthorized: true // Enforce certificate validation in production
      }
    })
  })
}

/**
 * Send email using configured transporter
 * @param to - Recipient email address
 * @param emailTemplate - Email template containing subject and body
 * @returns Promise that resolves when email is sent
 * @throws AppError if email sending fails
 */
const sendEmail = async (
  to: string,
  emailTemplate: TEmailFormat
): Promise<void> => {
  try {
    // Validate required parameters
    if (!to || !emailTemplate?.subject || !emailTemplate?.emailBody) {
      throw new AppError(
        400,
        'INVALID_INPUT',
        'Missing required email parameters'
      )
    }

    // Create transporter
    const transporter = createTransporter()

    // Prepare email options
    const mailOptions = {
      from: `"${config.email_sender_name || 'Your App'}" <${config.email_sender_email}>`,
      to,
      subject: emailTemplate.subject,
      text: emailTemplate.text || '', // Fallback to empty string if text not provided
      html: emailTemplate.emailBody,
      // Optional: Add reply-to address
      ...(config.email_reply_to && {
        replyTo: config.email_reply_to
      })
    }

    // Send email
    const info = await transporter.sendMail(mailOptions)

    // Log successful email sending (optional)
    console.log('Email sent successfully:', {
      messageId: info.messageId,
      to,
      subject: emailTemplate.subject
    })
  } catch (error: any) {
    console.error('Email sending failed:', {
      to,
      subject: emailTemplate?.subject,
      error: error.message,
      stack: error.stack
    })

    // Throw a more specific error based on the error type
    if (error.code === 'EAUTH') {
      throw new AppError(
        500,
        'EMAIL_AUTH_ERROR',
        'Email authentication failed. Check email credentials.'
      )
    } else if (error.code === 'ECONNECTION') {
      throw new AppError(
        500,
        'EMAIL_CONNECTION_ERROR',
        'Failed to connect to email server.'
      )
    } else if (error.code === 'EMESSAGE') {
      throw new AppError(
        400,
        'EMAIL_MESSAGE_ERROR',
        'Invalid email message format.'
      )
    } else {
      throw new AppError(
        500,
        'EMAIL_SEND_ERROR',
        `Failed to send email: ${error.message}`
      )
    }
  }
}

/**
 * Test email configuration
 * @returns Promise that resolves when test email is sent
 */
export const testEmailConfig = async (): Promise<void> => {
  try {
    const testEmail = config.email_test_recipient || config.email_sender_email

    if (!testEmail) {
      throw new AppError(
        400,
        'INVALID_CONFIG',
        'No test email recipient configured'
      )
    }

    const testTemplate: TEmailFormat = {
      subject: 'Test Email from Your App',
      text: 'This is a test email to verify your email configuration.',
      emailBody: `
        <h1>Email Configuration Test</h1>
        <p>If you receive this email, your email configuration is working correctly.</p>
        <p>Time sent: ${new Date().toISOString()}</p>
      `
    }

    await sendEmail(testEmail, testTemplate)
    console.log('Email configuration test successful')
  } catch (error) {
    console.error('Email configuration test failed:', error)
    throw error
  }
}

export default sendEmail
