import { Request, Response } from 'express';
import { sendEmail } from '../utils/email.service';
import { env } from '../config/env';
import { logger } from '../utils/logger';

/**
 * Test email sending functionality
 * @route POST /api/v1/test/email
 */
export const testEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { to } = req.body;

    if (!to) {
      res.status(400).json({
        success: false,
        message: 'Email recipient (to) is required',
      });
      return;
    }

    logger.info('Testing email service...');
    logger.info('SendGrid API Key present:', !!env.SENDGRID_API_KEY);
    logger.info('SendGrid From Email:', env.SENDGRID_FROM_EMAIL);
    logger.info('Sending test email to:', to);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Test Email</title>
      </head>
      <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h1 style="color: #3b82f6;">Test Email from bvodo</h1>
        <p>This is a test email to verify SendGrid configuration.</p>
        <p><strong>Configuration:</strong></p>
        <ul>
          <li>API Key: ${env.SENDGRID_API_KEY ? 'Present ✓' : 'Missing ✗'}</li>
          <li>From Email: ${env.SENDGRID_FROM_EMAIL || 'Not configured'}</li>
          <li>Time: ${new Date().toISOString()}</li>
        </ul>
      </body>
      </html>
    `;

    const text = `
Test Email from bvodo

This is a test email to verify SendGrid configuration.

Configuration:
- API Key: ${env.SENDGRID_API_KEY ? 'Present' : 'Missing'}
- From Email: ${env.SENDGRID_FROM_EMAIL || 'Not configured'}
- Time: ${new Date().toISOString()}
    `;

    const result = await sendEmail({
      to,
      subject: 'Test Email - bvodo Platform',
      html,
      text,
    });

    if (result) {
      res.status(200).json({
        success: true,
        message: 'Test email sent successfully! Check your inbox (and spam folder).',
        data: {
          recipient: to,
          timestamp: new Date().toISOString(),
          sendgridConfigured: !!env.SENDGRID_API_KEY,
          fromEmail: env.SENDGRID_FROM_EMAIL,
        },
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send test email. Check server logs for details.',
        data: {
          sendgridConfigured: !!env.SENDGRID_API_KEY,
          fromEmail: env.SENDGRID_FROM_EMAIL,
        },
      });
    }
  } catch (error: any) {
    logger.error('Test email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error.message,
    });
  }
};
