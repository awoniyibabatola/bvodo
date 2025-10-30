import sgMail from '@sendgrid/mail';
import { env } from '../config/env';
import { logger } from './logger';

// Initialize SendGrid
if (env.SENDGRID_API_KEY) {
  sgMail.setApiKey(env.SENDGRID_API_KEY);
} else {
  logger.warn('SendGrid API key not configured. Email sending will be disabled.');
}

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send email using SendGrid
 */
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    if (!env.SENDGRID_API_KEY || !env.SENDGRID_FROM_EMAIL) {
      logger.warn('SendGrid not configured. Email not sent:', options.subject);
      logger.warn('SENDGRID_API_KEY present:', !!env.SENDGRID_API_KEY);
      logger.warn('SENDGRID_FROM_EMAIL present:', !!env.SENDGRID_FROM_EMAIL);
      return false;
    }

    const msg = {
      to: options.to,
      from: env.SENDGRID_FROM_EMAIL,
      subject: options.subject,
      html: options.html,
      text: options.text || '',
    };

    logger.info(`Attempting to send email to ${options.to}: ${options.subject}`);
    logger.info(`Using from email: ${env.SENDGRID_FROM_EMAIL}`);

    await sgMail.send(msg);
    logger.info(`✅ Email sent successfully to ${options.to}: ${options.subject}`);
    return true;
  } catch (error: any) {
    logger.error('❌ Error sending email:', {
      message: error.message,
      code: error.code,
      response: error.response?.body,
      to: options.to,
      subject: options.subject,
    });
    return false;
  }
};

/**
 * Send credit application submitted notification to company admin
 */
export const sendCreditApplicationSubmittedEmail = async (
  email: string,
  companyName: string,
  requestedAmount: number,
  currency: string
): Promise<boolean> => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Credit Application Received</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px 15px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 24px 20px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                    ✅ Application Received
                  </h1>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 24px 20px;">
                  <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px; font-weight: 600;">
                    Hello ${companyName},
                  </h2>

                  <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                    Thank you for submitting your credit application with <strong>bvodo</strong>. We have successfully received your request.
                  </p>

                  <!-- Application Summary Box -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 12px; border: 2px solid #e5e7eb; margin: 20px 0;">
                    <tr>
                      <td style="padding: 16px;">
                        <h3 style="margin: 0 0 16px 0; color: #111827; font-size: 18px; font-weight: 600;">
                          Application Summary
                        </h3>
                        <table width="100%" cellpadding="8" cellspacing="0">
                          <tr>
                            <td style="color: #6b7280; font-size: 14px;">Requested Amount:</td>
                            <td align="right" style="color: #111827; font-size: 16px; font-weight: 600;">
                              ${currency} $${requestedAmount.toLocaleString()}
                            </td>
                          </tr>
                          <tr>
                            <td style="color: #6b7280; font-size: 14px;">Review Time:</td>
                            <td align="right" style="color: #111827; font-size: 16px; font-weight: 600;">
                              2-3 Business Days
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- What's Next -->
                  <div style="background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%); border-radius: 12px; padding: 16px; margin: 20px 0;">
                    <h3 style="margin: 0 0 16px 0; color: #1e40af; font-size: 18px; font-weight: 600;">
                      📋 What Happens Next?
                    </h3>
                    <ol style="margin: 0; padding-left: 20px; color: #1e3a8a;">
                      <li style="margin-bottom: 12px; line-height: 1.6;">Our credit team will review your application</li>
                      <li style="margin-bottom: 12px; line-height: 1.6;">You'll receive a decision notification via email within 2-3 business days</li>
                      <li style="margin-bottom: 0; line-height: 1.6;">If approved, credits will be added to your account immediately</li>
                    </ol>
                  </div>

                  <p style="margin: 30px 0 0 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                    You can track your application status anytime in your dashboard under <strong>Manage Credits</strong>.
                  </p>

                  <p style="margin: 30px 0 0 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                    If you have any questions, please don't hesitate to contact our support team.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                    Best regards,<br>
                    <strong style="color: #111827;">The bvodo Team</strong>
                  </p>
                  <p style="margin: 20px 0 0 0; color: #9ca3af; font-size: 12px;">
                    © ${new Date().getFullYear()} bvodo. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const text = `
Credit Application Received

Hello ${companyName},

Thank you for submitting your credit application with bvodo. We have successfully received your request.

Application Summary:
- Requested Amount: ${currency} $${requestedAmount.toLocaleString()}
- Review Time: 2-3 Business Days

What Happens Next?
1. Our credit team will review your application
2. You'll receive a decision notification via email within 2-3 business days
3. If approved, credits will be added to your account immediately

You can track your application status anytime in your dashboard under Manage Credits.

If you have any questions, please don't hesitate to contact our support team.

Best regards,
The bvodo Team
  `;

  return sendEmail({
    to: email,
    subject: 'Credit Application Received - bvodo',
    html,
    text,
  });
};

/**
 * Send credit application approved notification
 */
export const sendCreditApplicationApprovedEmail = async (
  email: string,
  companyName: string,
  approvedAmount: number,
  currency: string
): Promise<boolean> => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Credit Application Approved!</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px 15px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 24px 20px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">
                    🎉 Congratulations!
                  </h1>
                  <p style="margin: 10px 0 0 0; color: #d1fae5; font-size: 18px;">
                    Your Credit Application is Approved
                  </p>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 24px 20px;">
                  <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px; font-weight: 600;">
                    Great news, ${companyName}!
                  </h2>

                  <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                    We're excited to inform you that your credit application has been <strong style="color: #059669;">approved</strong>! Your credits have been added to your account and are ready to use.
                  </p>

                  <!-- Approved Amount Box -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border-radius: 12px; margin: 20px 0;">
                    <tr>
                      <td style="padding: 20px; text-align: center;">
                        <p style="margin: 0 0 8px 0; color: #065f46; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                          Approved Credit Amount
                        </p>
                        <h2 style="margin: 0; color: #064e3b; font-size: 42px; font-weight: bold;">
                          ${currency} $${approvedAmount.toLocaleString()}
                        </h2>
                      </td>
                    </tr>
                  </table>

                  <!-- Next Steps -->
                  <div style="background-color: #f9fafb; border-radius: 12px; border-left: 4px solid #10b981; padding: 16px; margin: 20px 0;">
                    <h3 style="margin: 0 0 16px 0; color: #111827; font-size: 18px; font-weight: 600;">
                      ✨ Start Using Your Credits
                    </h3>
                    <ul style="margin: 0; padding-left: 20px; color: #4b5563; line-height: 1.8;">
                      <li>Log in to your bvodo dashboard</li>
                      <li>Your credits are immediately available for bookings</li>
                      <li>Book flights, hotels, and manage your corporate travel</li>
                      <li>Track your credit usage in real-time</li>
                    </ul>
                  </div>

                  <p style="margin: 30px 0 0 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                    Thank you for choosing <strong>bvodo</strong> for your corporate travel needs. We look forward to serving you!
                  </p>
                </td>
              </tr>

              <!-- CTA Button -->
              <tr>
                <td style="padding: 0 20px 24px 20px; text-align: center;">
                  <a href="${env.FRONTEND_URL}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);">
                    Go to Dashboard
                  </a>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                    Best regards,<br>
                    <strong style="color: #111827;">The bvodo Team</strong>
                  </p>
                  <p style="margin: 20px 0 0 0; color: #9ca3af; font-size: 12px;">
                    © ${new Date().getFullYear()} bvodo. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const text = `
🎉 Congratulations! Your Credit Application is Approved

Great news, ${companyName}!

We're excited to inform you that your credit application has been approved! Your credits have been added to your account and are ready to use.

Approved Credit Amount: ${currency} $${approvedAmount.toLocaleString()}

Start Using Your Credits:
• Log in to your bvodo dashboard
• Your credits are immediately available for bookings
• Book flights, hotels, and manage your corporate travel
• Track your credit usage in real-time

Thank you for choosing bvodo for your corporate travel needs. We look forward to serving you!

Go to Dashboard: ${env.FRONTEND_URL}/dashboard

Best regards,
The bvodo Team
  `;

  return sendEmail({
    to: email,
    subject: '🎉 Credit Application Approved - bvodo',
    html,
    text,
  });
};

/**
 * Send credit application rejected notification
 */
export const sendCreditApplicationRejectedEmail = async (
  email: string,
  companyName: string,
  rejectionReason: string
): Promise<boolean> => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Credit Application Update</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px 15px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 24px 20px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                    Credit Application Update
                  </h1>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 24px 20px;">
                  <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px; font-weight: 600;">
                    Hello ${companyName},
                  </h2>

                  <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                    Thank you for your interest in applying for credit with <strong>bvodo</strong>. After careful review, we regret to inform you that we are unable to approve your credit application at this time.
                  </p>

                  <!-- Reason Box -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef2f2; border-radius: 12px; border-left: 4px solid #ef4444; margin: 20px 0;">
                    <tr>
                      <td style="padding: 16px;">
                        <h3 style="margin: 0 0 12px 0; color: #991b1b; font-size: 16px; font-weight: 600;">
                          Reason for Decline
                        </h3>
                        <p style="margin: 0; color: #7f1d1d; font-size: 14px; line-height: 1.6;">
                          ${rejectionReason}
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- Alternative Options -->
                  <div style="background-color: #f9fafb; border-radius: 12px; padding: 16px; margin: 20px 0;">
                    <h3 style="margin: 0 0 16px 0; color: #111827; font-size: 18px; font-weight: 600;">
                      📌 Next Steps
                    </h3>
                    <ul style="margin: 0; padding-left: 20px; color: #4b5563; line-height: 1.8;">
                      <li>You can reapply in the future as your business grows</li>
                      <li>Consider using our pay-as-you-go booking options</li>
                      <li>Contact our support team to discuss alternative solutions</li>
                    </ul>
                  </div>

                  <p style="margin: 30px 0 0 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                    We appreciate your interest in <strong>bvodo</strong> and hope to work with you in the future. If you have any questions or would like to discuss this decision, please don't hesitate to reach out.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                    Best regards,<br>
                    <strong style="color: #111827;">The bvodo Team</strong>
                  </p>
                  <p style="margin: 20px 0 0 0; color: #9ca3af; font-size: 12px;">
                    © ${new Date().getFullYear()} bvodo. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const text = `
Credit Application Update

Hello ${companyName},

Thank you for your interest in applying for credit with bvodo. After careful review, we regret to inform you that we are unable to approve your credit application at this time.

Reason for Decline:
${rejectionReason}

Next Steps:
• You can reapply in the future as your business grows
• Consider using our pay-as-you-go booking options
• Contact our support team to discuss alternative solutions

We appreciate your interest in bvodo and hope to work with you in the future. If you have any questions or would like to discuss this decision, please don't hesitate to reach out.

Best regards,
The bvodo Team
  `;

  return sendEmail({
    to: email,
    subject: 'Credit Application Update - bvodo',
    html,
    text,
  });
};

/**
 * Send welcome email after account creation
 */
export const sendAccountCreatedEmail = async (
  email: string,
  firstName: string,
  organizationName: string,
  subdomain: string
): Promise<boolean> => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to bvodo!</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px 15px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 24px 20px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">
                    🎉 Welcome to bvodo!
                  </h1>
                  <p style="margin: 10px 0 0 0; color: #dbeafe; font-size: 18px;">
                    Your Corporate Travel Platform
                  </p>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 24px 20px;">
                  <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px; font-weight: 600;">
                    Hello ${firstName}!
                  </h2>

                  <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                    Congratulations! Your organization <strong>${organizationName}</strong> has been successfully registered on bvodo. You're all set to streamline your corporate travel management.
                  </p>

                  <!-- Organization Details Box -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 12px; border: 2px solid #e5e7eb; margin: 20px 0;">
                    <tr>
                      <td style="padding: 16px;">
                        <h3 style="margin: 0 0 16px 0; color: #111827; font-size: 18px; font-weight: 600;">
                          Your Account Details
                        </h3>
                        <table width="100%" cellpadding="8" cellspacing="0">
                          <tr>
                            <td style="color: #6b7280; font-size: 14px;">Organization:</td>
                            <td align="right" style="color: #111827; font-size: 16px; font-weight: 600;">
                              ${organizationName}
                            </td>
                          </tr>
                          <tr>
                            <td style="color: #6b7280; font-size: 14px;">Subdomain:</td>
                            <td align="right" style="color: #111827; font-size: 16px; font-weight: 600;">
                              ${subdomain}
                            </td>
                          </tr>
                          <tr>
                            <td style="color: #6b7280; font-size: 14px;">Email:</td>
                            <td align="right" style="color: #111827; font-size: 16px; font-weight: 600;">
                              ${email}
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- Getting Started -->
                  <div style="background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%); border-radius: 12px; padding: 16px; margin: 20px 0;">
                    <h3 style="margin: 0 0 16px 0; color: #1e40af; font-size: 18px; font-weight: 600;">
                      🚀 Get Started in 3 Easy Steps
                    </h3>
                    <ol style="margin: 0; padding-left: 20px; color: #1e3a8a;">
                      <li style="margin-bottom: 12px; line-height: 1.6;"><strong>Apply for Credit:</strong> Submit a credit application to get your organization funded</li>
                      <li style="margin-bottom: 12px; line-height: 1.6;"><strong>Invite Your Team:</strong> Add travelers and managers to your organization</li>
                      <li style="margin-bottom: 0; line-height: 1.6;"><strong>Book Your First Trip:</strong> Start booking flights and hotels with ease</li>
                    </ol>
                  </div>

                  <p style="margin: 30px 0 0 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                    Our platform makes corporate travel simple, efficient, and cost-effective. If you have any questions, our support team is here to help!
                  </p>
                </td>
              </tr>

              <!-- CTA Button -->
              <tr>
                <td style="padding: 0 20px 24px 20px; text-align: center;">
                  <a href="${env.FRONTEND_URL}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);">
                    Go to Dashboard
                  </a>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                    Best regards,<br>
                    <strong style="color: #111827;">The bvodo Team</strong>
                  </p>
                  <p style="margin: 20px 0 0 0; color: #9ca3af; font-size: 12px;">
                    © ${new Date().getFullYear()} bvodo. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const text = `
Welcome to bvodo!

Hello ${firstName}!

Congratulations! Your organization ${organizationName} has been successfully registered on bvodo. You're all set to streamline your corporate travel management.

Your Account Details:
- Organization: ${organizationName}
- Subdomain: ${subdomain}
- Email: ${email}

Get Started in 3 Easy Steps:
1. Apply for Credit: Submit a credit application to get your organization funded
2. Invite Your Team: Add travelers and managers to your organization
3. Book Your First Trip: Start booking flights and hotels with ease

Our platform makes corporate travel simple, efficient, and cost-effective. If you have any questions, our support team is here to help!

Go to Dashboard: ${env.FRONTEND_URL}/dashboard

Best regards,
The bvodo Team
  `;

  return sendEmail({
    to: email,
    subject: '🎉 Welcome to bvodo - Your Account is Ready!',
    html,
    text,
  });
};

/**
 * Send invitation email to new team member
 */
export const sendTeamInvitationEmail = async (
  email: string,
  firstName: string,
  lastName: string,
  organizationName: string,
  inviterName: string,
  role: string,
  creditLimit: number,
  invitationToken: string
): Promise<boolean> => {
  const invitationLink = `${env.FRONTEND_URL}/accept-invitation?token=${invitationToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>You're Invited to bvodo</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px 15px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">

              <!-- Header -->
              <tr>
                <td style="background-color: #111827; padding: 32px 20px; text-align: center;">
                  <div style="margin-bottom: 16px;">
                    <div style="display: inline-block; width: 48px; height: 48px; background-color: #ADF802; border-radius: 12px; line-height: 48px; text-align: center;">
                      <span style="font-size: 24px;">✉️</span>
                    </div>
                  </div>
                  <h1 style="margin: 0 0 8px 0; color: #ffffff; font-size: 28px; font-weight: bold; letter-spacing: -0.5px;">
                    You're Invited!
                  </h1>
                  <p style="margin: 0; color: #9ca3af; font-size: 15px;">
                    Join ${organizationName} on bvodo
                  </p>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 32px 24px;">
                  <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 20px; font-weight: 600;">
                    Hello ${firstName} ${lastName},
                  </h2>

                  <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                    <strong style="color: #111827;">${inviterName}</strong> has invited you to join <strong style="color: #111827;">${organizationName}</strong> on <strong style="color: #111827;">bvodo</strong>, the corporate travel platform.
                  </p>

                  <!-- Invitation Details Box -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 12px; border: 2px solid #e5e7eb; margin: 24px 0;">
                    <tr>
                      <td style="padding: 20px;">
                        <h3 style="margin: 0 0 16px 0; color: #111827; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                          Invitation Details
                        </h3>
                        <table width="100%" cellpadding="10" cellspacing="0">
                          <tr>
                            <td style="color: #6b7280; font-size: 14px;">Organization</td>
                            <td align="right" style="color: #111827; font-size: 14px; font-weight: 600;">
                              ${organizationName}
                            </td>
                          </tr>
                          <tr>
                            <td style="color: #6b7280; font-size: 14px;">Role</td>
                            <td align="right" style="color: #111827; font-size: 14px; font-weight: 600;">
                              ${role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ')}
                            </td>
                          </tr>
                          ${creditLimit > 0 ? `
                          <tr>
                            <td style="color: #6b7280; font-size: 14px;">Credit Allocation</td>
                            <td align="right" style="color: #111827; font-size: 14px; font-weight: 600;">
                              <span style="background-color: #ADF802; color: #111827; padding: 4px 8px; border-radius: 4px; font-weight: 700;">
                                USD $${creditLimit.toLocaleString()}
                              </span>
                            </td>
                          </tr>
                          ` : ''}
                          <tr>
                            <td style="color: #6b7280; font-size: 14px;">Invited By</td>
                            <td align="right" style="color: #111827; font-size: 14px; font-weight: 600;">
                              ${inviterName}
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- Instructions -->
                  <div style="background-color: #f9fafb; border-radius: 12px; border-left: 4px solid #ADF802; padding: 20px; margin: 24px 0;">
                    <h3 style="margin: 0 0 12px 0; color: #111827; font-size: 15px; font-weight: 700;">
                      Complete Your Registration
                    </h3>
                    <ol style="margin: 0; padding-left: 20px; color: #4b5563; line-height: 1.8; font-size: 14px;">
                      <li style="margin-bottom: 8px;">Click the "Accept Invitation" button below</li>
                      <li style="margin-bottom: 8px;">Create a secure password for your account</li>
                      <li style="margin-bottom: 0;">Start managing your corporate travel bookings</li>
                    </ol>
                  </div>

                  <!-- Warning Box -->
                  <div style="background-color: #fffbeb; border-radius: 12px; border: 1px solid #fbbf24; padding: 16px; margin: 24px 0;">
                    <p style="margin: 0; color: #92400e; font-size: 13px; line-height: 1.6;">
                      ⚠️ <strong style="color: #111827;">Important:</strong> This invitation expires in 7 days. Please accept it soon to maintain access.
                    </p>
                  </div>
                </td>
              </tr>

              <!-- CTA Button -->
              <tr>
                <td style="padding: 0 24px 32px 24px; text-align: center;">
                  <a href="${invitationLink}" style="display: inline-block; background-color: #111827; color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 12px; font-size: 15px; font-weight: 700; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15); border: 2px solid #111827;">
                    Accept Invitation
                  </a>
                  <p style="margin: 12px 0 0 0; color: #6b7280; font-size: 12px;">
                    or copy this link: <a href="${invitationLink}" style="color: #111827; text-decoration: none; word-break: break-all;">${invitationLink}</a>
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #111827; padding: 24px 20px; text-align: center;">
                  <p style="margin: 0 0 4px 0; color: #ffffff; font-size: 18px; font-weight: 700; letter-spacing: -0.5px;">
                    bvodo
                  </p>
                  <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                    © ${new Date().getFullYear()} bvodo. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const text = `
You're Invited to Join ${organizationName} on bvodo!

Hello ${firstName} ${lastName},

${inviterName} has invited you to join ${organizationName} on bvodo, the corporate travel platform.

Invitation Details:
- Organization: ${organizationName}
- Role: ${role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ')}
${creditLimit > 0 ? `- Credit Allocation: USD $${creditLimit.toLocaleString()}` : ''}
- Invited By: ${inviterName}

Complete Your Registration:
1. Click the link below to accept the invitation
2. Create a secure password for your account
3. Start managing your corporate travel bookings

⚠️ Important: This invitation expires in 7 days. Please accept it soon to maintain access.

Accept Invitation: ${invitationLink}

Best regards,
The bvodo Team
  `;

  return sendEmail({
    to: email,
    subject: `You're invited to join ${organizationName} on bvodo`,
    html,
    text,
  });
};

/**
 * Send booking request email (when booking is created)
 */
export const sendBookingRequestEmail = async (
  email: string,
  travelerName: string,
  bookingReference: string,
  bookingType: string,
  origin: string,
  destination: string,
  departureDate: Date,
  returnDate: Date | null,
  totalPrice: number,
  currency: string,
  requiresApproval: boolean,
  approverName?: string
): Promise<boolean> => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Booking Request ${requiresApproval ? 'Pending Approval' : 'Submitted'}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px 15px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 24px 20px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                    ${requiresApproval ? '📝 Booking Pending Approval' : '✅ Booking Request Submitted'}
                  </h1>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 24px 20px;">
                  <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px; font-weight: 600;">
                    Hello ${travelerName},
                  </h2>

                  <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                    Your ${bookingType} booking request has been ${requiresApproval ? 'submitted for approval' : 'successfully created'}.
                  </p>

                  <!-- Booking Details Box -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 12px; border: 2px solid #e5e7eb; margin: 20px 0;">
                    <tr>
                      <td style="padding: 16px;">
                        <h3 style="margin: 0 0 16px 0; color: #111827; font-size: 18px; font-weight: 600;">
                          Booking Details
                        </h3>
                        <table width="100%" cellpadding="8" cellspacing="0">
                          <tr>
                            <td style="color: #6b7280; font-size: 14px;">Booking Reference:</td>
                            <td align="right" style="color: #111827; font-size: 16px; font-weight: 600;">
                              ${bookingReference}
                            </td>
                          </tr>
                          <tr>
                            <td style="color: #6b7280; font-size: 14px;">Type:</td>
                            <td align="right" style="color: #111827; font-size: 16px; font-weight: 600;">
                              ${bookingType.charAt(0).toUpperCase() + bookingType.slice(1)}
                            </td>
                          </tr>
                          ${origin ? `
                          <tr>
                            <td style="color: #6b7280; font-size: 14px;">From:</td>
                            <td align="right" style="color: #111827; font-size: 16px; font-weight: 600;">
                              ${origin}
                            </td>
                          </tr>
                          ` : ''}
                          <tr>
                            <td style="color: #6b7280; font-size: 14px;">To:</td>
                            <td align="right" style="color: #111827; font-size: 16px; font-weight: 600;">
                              ${destination}
                            </td>
                          </tr>
                          <tr>
                            <td style="color: #6b7280; font-size: 14px;">Departure Date:</td>
                            <td align="right" style="color: #111827; font-size: 16px; font-weight: 600;">
                              ${new Date(departureDate).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                            </td>
                          </tr>
                          ${returnDate ? `
                          <tr>
                            <td style="color: #6b7280; font-size: 14px;">Return Date:</td>
                            <td align="right" style="color: #111827; font-size: 16px; font-weight: 600;">
                              ${new Date(returnDate).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                            </td>
                          </tr>
                          ` : ''}
                          <tr>
                            <td style="color: #6b7280; font-size: 14px;">Total Cost:</td>
                            <td align="right" style="color: #10b981; font-size: 18px; font-weight: 700;">
                              ${currency} $${totalPrice.toLocaleString()}
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  ${requiresApproval ? `
                  <!-- Approval Status -->
                  <div style="background-color: #fef3c7; border-radius: 12px; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0;">
                    <h3 style="margin: 0 0 12px 0; color: #92400e; font-size: 16px; font-weight: 600;">
                      ⏳ Approval Required
                    </h3>
                    <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.6;">
                      This booking requires approval from ${approverName || 'your manager'}. You'll receive an email notification once it has been reviewed.
                    </p>
                  </div>
                  ` : `
                  <!-- Next Steps -->
                  <div style="background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%); border-radius: 12px; padding: 16px; margin: 20px 0;">
                    <h3 style="margin: 0 0 16px 0; color: #1e40af; font-size: 18px; font-weight: 600;">
                      📋 What's Next?
                    </h3>
                    <ol style="margin: 0; padding-left: 20px; color: #1e3a8a;">
                      <li style="margin-bottom: 12px; line-height: 1.6;">Your credits have been held for this booking</li>
                      <li style="margin-bottom: 12px; line-height: 1.6;">Our team will confirm rates and availability</li>
                      <li style="margin-bottom: 0; line-height: 1.6;">You'll receive confirmation once booking is finalized</li>
                    </ol>
                  </div>
                  `}

                  <p style="margin: 30px 0 0 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                    You can track your booking status anytime in your dashboard.
                  </p>
                </td>
              </tr>

              <!-- CTA Button -->
              <tr>
                <td style="padding: 0 20px 24px 20px; text-align: center;">
                  <a href="${env.FRONTEND_URL}/dashboard/bookings" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);">
                    View Booking
                  </a>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                    Best regards,<br>
                    <strong style="color: #111827;">The bvodo Team</strong>
                  </p>
                  <p style="margin: 20px 0 0 0; color: #9ca3af; font-size: 12px;">
                    © ${new Date().getFullYear()} bvodo. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const text = `
${requiresApproval ? 'Booking Pending Approval' : 'Booking Request Submitted'}

Hello ${travelerName},

Your ${bookingType} booking request has been ${requiresApproval ? 'submitted for approval' : 'successfully created'}.

Booking Details:
- Booking Reference: ${bookingReference}
- Type: ${bookingType.charAt(0).toUpperCase() + bookingType.slice(1)}
${origin ? `- From: ${origin}` : ''}
- To: ${destination}
- Departure Date: ${new Date(departureDate).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
${returnDate ? `- Return Date: ${new Date(returnDate).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}` : ''}
- Total Cost: ${currency} $${totalPrice.toLocaleString()}

${requiresApproval ?
`⏳ Approval Required
This booking requires approval from ${approverName || 'your manager'}. You'll receive an email notification once it has been reviewed.`
:
`What's Next?
1. Your credits have been held for this booking
2. Our team will confirm rates and availability
3. You'll receive confirmation once booking is finalized`}

You can track your booking status anytime in your dashboard.

View Booking: ${env.FRONTEND_URL}/dashboard/bookings

Best regards,
The bvodo Team
  `;

  return sendEmail({
    to: email,
    subject: `${requiresApproval ? 'Booking Pending Approval' : 'Booking Request Submitted'} - ${bookingReference}`,
    html,
    text,
  });
};

/**
 * Send booking approval email (when admin/manager approves)
 */
export const sendBookingApprovalEmail = async (
  travelerEmail: string,
  travelerName: string,
  bookingReference: string,
  bookingType: string,
  destination: string,
  approverName: string,
  approvalDate: Date
): Promise<boolean> => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Booking Approved</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px 15px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 24px 20px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">
                    ✅ Booking Approved!
                  </h1>
                  <p style="margin: 10px 0 0 0; color: #d1fae5; font-size: 18px;">
                    Awaiting Rate Confirmation
                  </p>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 24px 20px;">
                  <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px; font-weight: 600;">
                    Great news, ${travelerName}!
                  </h2>

                  <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                    Your ${bookingType} booking to <strong>${destination}</strong> has been <strong style="color: #059669;">approved</strong> by ${approverName}.
                  </p>

                  <!-- Booking Reference Box -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border-radius: 12px; margin: 20px 0;">
                    <tr>
                      <td style="padding: 24px; text-align: center;">
                        <p style="margin: 0 0 8px 0; color: #065f46; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                          Booking Reference
                        </p>
                        <h2 style="margin: 0; color: #064e3b; font-size: 28px; font-weight: bold; letter-spacing: 2px;">
                          ${bookingReference}
                        </h2>
                      </td>
                    </tr>
                  </table>

                  <!-- Approval Details -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 12px; border: 2px solid #e5e7eb; margin: 20px 0;">
                    <tr>
                      <td style="padding: 16px;">
                        <table width="100%" cellpadding="8" cellspacing="0">
                          <tr>
                            <td style="color: #6b7280; font-size: 14px;">Approved By:</td>
                            <td align="right" style="color: #111827; font-size: 16px; font-weight: 600;">
                              ${approverName}
                            </td>
                          </tr>
                          <tr>
                            <td style="color: #6b7280; font-size: 14px;">Approval Date:</td>
                            <td align="right" style="color: #111827; font-size: 16px; font-weight: 600;">
                              ${new Date(approvalDate).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- Next Steps -->
                  <div style="background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%); border-radius: 12px; padding: 16px; margin: 20px 0;">
                    <h3 style="margin: 0 0 16px 0; color: #1e40af; font-size: 18px; font-weight: 600;">
                      📋 What's Next?
                    </h3>
                    <ol style="margin: 0; padding-left: 20px; color: #1e3a8a;">
                      <li style="margin-bottom: 12px; line-height: 1.6;">Our team will confirm current rates with travel providers</li>
                      <li style="margin-bottom: 12px; line-height: 1.6;">You'll receive final confirmation once rates are verified</li>
                      <li style="margin-bottom: 0; line-height: 1.6;">Your booking will be finalized and tickets issued</li>
                    </ol>
                  </div>

                  <p style="margin: 30px 0 0 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                    Track your booking status anytime in your dashboard.
                  </p>
                </td>
              </tr>

              <!-- CTA Button -->
              <tr>
                <td style="padding: 0 20px 24px 20px; text-align: center;">
                  <a href="${env.FRONTEND_URL}/dashboard/bookings" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);">
                    View Booking
                  </a>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                    Best regards,<br>
                    <strong style="color: #111827;">The bvodo Team</strong>
                  </p>
                  <p style="margin: 20px 0 0 0; color: #9ca3af; font-size: 12px;">
                    © ${new Date().getFullYear()} bvodo. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const text = `
✅ Booking Approved!

Great news, ${travelerName}!

Your ${bookingType} booking to ${destination} has been approved by ${approverName}.

Booking Reference: ${bookingReference}

Approval Details:
- Approved By: ${approverName}
- Approval Date: ${new Date(approvalDate).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}

What's Next?
1. Our team will confirm current rates with travel providers
2. You'll receive final confirmation once rates are verified
3. Your booking will be finalized and tickets issued

Track your booking status anytime in your dashboard.

View Booking: ${env.FRONTEND_URL}/dashboard/bookings

Best regards,
The bvodo Team
  `;

  return sendEmail({
    to: travelerEmail,
    subject: `✅ Booking Approved - ${bookingReference}`,
    html,
    text,
  });
};

/**
 * Send booking confirmation email (final confirmation by super admin)
 */
export const sendBookingConfirmationEmail = async (
  travelerEmail: string,
  travelerName: string,
  bookingReference: string,
  bookingType: string,
  origin: string,
  destination: string,
  departureDate: Date,
  returnDate: Date | null,
  totalPrice: number,
  currency: string
): Promise<boolean> => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Booking Confirmed</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px 15px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 24px 20px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">
                    🎉 Booking Confirmed!
                  </h1>
                  <p style="margin: 10px 0 0 0; color: #d1fae5; font-size: 18px;">
                    You're All Set to Travel
                  </p>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 24px 20px;">
                  <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px; font-weight: 600;">
                    Hello ${travelerName},
                  </h2>

                  <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                    Great news! Your ${bookingType} booking has been <strong style="color: #059669;">confirmed</strong> and is ready for your trip.
                  </p>

                  <!-- Booking Reference Box -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border-radius: 12px; margin: 20px 0;">
                    <tr>
                      <td style="padding: 20px; text-align: center;">
                        <p style="margin: 0 0 8px 0; color: #065f46; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                          Your Booking Reference
                        </p>
                        <h2 style="margin: 0; color: #064e3b; font-size: 36px; font-weight: bold; letter-spacing: 3px;">
                          ${bookingReference}
                        </h2>
                      </td>
                    </tr>
                  </table>

                  <!-- Trip Details -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 12px; border: 2px solid #e5e7eb; margin: 20px 0;">
                    <tr>
                      <td style="padding: 16px;">
                        <h3 style="margin: 0 0 16px 0; color: #111827; font-size: 18px; font-weight: 600;">
                          Trip Details
                        </h3>
                        <table width="100%" cellpadding="8" cellspacing="0">
                          <tr>
                            <td style="color: #6b7280; font-size: 14px;">Type:</td>
                            <td align="right" style="color: #111827; font-size: 16px; font-weight: 600;">
                              ${bookingType.charAt(0).toUpperCase() + bookingType.slice(1)}
                            </td>
                          </tr>
                          ${origin ? `
                          <tr>
                            <td style="color: #6b7280; font-size: 14px;">From:</td>
                            <td align="right" style="color: #111827; font-size: 16px; font-weight: 600;">
                              ${origin}
                            </td>
                          </tr>
                          ` : ''}
                          <tr>
                            <td style="color: #6b7280; font-size: 14px;">To:</td>
                            <td align="right" style="color: #111827; font-size: 16px; font-weight: 600;">
                              ${destination}
                            </td>
                          </tr>
                          <tr>
                            <td style="color: #6b7280; font-size: 14px;">Departure:</td>
                            <td align="right" style="color: #111827; font-size: 16px; font-weight: 600;">
                              ${new Date(departureDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </td>
                          </tr>
                          ${returnDate ? `
                          <tr>
                            <td style="color: #6b7280; font-size: 14px;">Return:</td>
                            <td align="right" style="color: #111827; font-size: 16px; font-weight: 600;">
                              ${new Date(returnDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </td>
                          </tr>
                          ` : ''}
                          <tr>
                            <td style="color: #6b7280; font-size: 14px;">Total Cost:</td>
                            <td align="right" style="color: #10b981; font-size: 18px; font-weight: 700;">
                              ${currency} $${totalPrice.toLocaleString()}
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- Important Information -->
                  <div style="background-color: #fef3c7; border-radius: 12px; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0;">
                    <h3 style="margin: 0 0 12px 0; color: #92400e; font-size: 16px; font-weight: 600;">
                      📌 Important Information
                    </h3>
                    <ul style="margin: 0; padding-left: 20px; color: #78350f; line-height: 1.8;">
                      <li>Please keep this booking reference for your records</li>
                      <li>Check-in requirements vary by provider - review carefully</li>
                      <li>Arrive early for your departure</li>
                      <li>Contact support if you need to make any changes</li>
                    </ul>
                  </div>

                  <p style="margin: 30px 0 0 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                    Have a wonderful trip! If you need any assistance, our support team is here to help.
                  </p>
                </td>
              </tr>

              <!-- CTA Button -->
              <tr>
                <td style="padding: 0 20px 24px 20px; text-align: center;">
                  <a href="${env.FRONTEND_URL}/dashboard/bookings" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);">
                    View Full Itinerary
                  </a>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                    Safe travels,<br>
                    <strong style="color: #111827;">The bvodo Team</strong>
                  </p>
                  <p style="margin: 20px 0 0 0; color: #9ca3af; font-size: 12px;">
                    © ${new Date().getFullYear()} bvodo. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const text = `
🎉 Booking Confirmed!

Hello ${travelerName},

Great news! Your ${bookingType} booking has been confirmed and is ready for your trip.

Your Booking Reference: ${bookingReference}

Trip Details:
- Type: ${bookingType.charAt(0).toUpperCase() + bookingType.slice(1)}
${origin ? `- From: ${origin}` : ''}
- To: ${destination}
- Departure: ${new Date(departureDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
${returnDate ? `- Return: ${new Date(returnDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}` : ''}
- Total Cost: ${currency} $${totalPrice.toLocaleString()}

📌 Important Information:
• Please keep this booking reference for your records
• Check-in requirements vary by provider - review carefully
• Arrive early for your departure
• Contact support if you need to make any changes

Have a wonderful trip! If you need any assistance, our support team is here to help.

View Full Itinerary: ${env.FRONTEND_URL}/dashboard/bookings

Safe travels,
The bvodo Team
  `;

  return sendEmail({
    to: travelerEmail,
    subject: `🎉 Booking Confirmed - ${bookingReference}`,
    html,
    text,
  });
};

/**
 * Send booking rejection email
 */
export const sendBookingRejectionEmail = async (
  travelerEmail: string,
  travelerName: string,
  bookingReference: string,
  bookingType: string,
  destination: string,
  rejectionReason: string,
  rejectedBy: string
): Promise<boolean> => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Booking Update</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px 15px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 24px 20px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                    Booking Update
                  </h1>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 24px 20px;">
                  <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px; font-weight: 600;">
                    Hello ${travelerName},
                  </h2>

                  <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                    We regret to inform you that your ${bookingType} booking to <strong>${destination}</strong> (Reference: <strong>${bookingReference}</strong>) has not been approved.
                  </p>

                  <!-- Rejection Details Box -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef2f2; border-radius: 12px; border-left: 4px solid #ef4444; margin: 20px 0;">
                    <tr>
                      <td style="padding: 16px;">
                        <h3 style="margin: 0 0 12px 0; color: #991b1b; font-size: 16px; font-weight: 600;">
                          Reason for Rejection
                        </h3>
                        <p style="margin: 0 0 16px 0; color: #7f1d1d; font-size: 14px; line-height: 1.6;">
                          ${rejectionReason}
                        </p>
                        <p style="margin: 0; color: #991b1b; font-size: 13px;">
                          Rejected by: ${rejectedBy}
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- Credit Refund Notice -->
                  <div style="background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%); border-radius: 12px; padding: 20px; margin: 30px 0;">
                    <h3 style="margin: 0 0 12px 0; color: #1e40af; font-size: 16px; font-weight: 600;">
                      💳 Credit Refund
                    </h3>
                    <p style="margin: 0; color: #1e3a8a; font-size: 14px; line-height: 1.6;">
                      Any credits that were held for this booking have been released back to your account and are now available for use.
                    </p>
                  </div>

                  <!-- Next Steps -->
                  <div style="background-color: #f9fafb; border-radius: 12px; padding: 16px; margin: 20px 0;">
                    <h3 style="margin: 0 0 16px 0; color: #111827; font-size: 18px; font-weight: 600;">
                      Next Steps
                    </h3>
                    <ul style="margin: 0; padding-left: 20px; color: #4b5563; line-height: 1.8;">
                      <li>Review the rejection reason with your approver</li>
                      <li>Modify your booking request if needed</li>
                      <li>Resubmit with updated details</li>
                      <li>Contact your manager for alternative options</li>
                    </ul>
                  </div>

                  <p style="margin: 30px 0 0 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                    If you have any questions about this decision, please reach out to ${rejectedBy} or contact our support team.
                  </p>
                </td>
              </tr>

              <!-- CTA Button -->
              <tr>
                <td style="padding: 0 20px 24px 20px; text-align: center;">
                  <a href="${env.FRONTEND_URL}/dashboard/bookings" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);">
                    View My Bookings
                  </a>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                    Best regards,<br>
                    <strong style="color: #111827;">The bvodo Team</strong>
                  </p>
                  <p style="margin: 20px 0 0 0; color: #9ca3af; font-size: 12px;">
                    © ${new Date().getFullYear()} bvodo. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const text = `
Booking Update

Hello ${travelerName},

We regret to inform you that your ${bookingType} booking to ${destination} (Reference: ${bookingReference}) has not been approved.

Reason for Rejection:
${rejectionReason}

Rejected by: ${rejectedBy}

💳 Credit Refund:
Any credits that were held for this booking have been released back to your account and are now available for use.

Next Steps:
• Review the rejection reason with your approver
• Modify your booking request if needed
• Resubmit with updated details
• Contact your manager for alternative options

If you have any questions about this decision, please reach out to ${rejectedBy} or contact our support team.

View My Bookings: ${env.FRONTEND_URL}/dashboard/bookings

Best regards,
The bvodo Team
  `;

  return sendEmail({
    to: travelerEmail,
    subject: `Booking Update - ${bookingReference}`,
    html,
    text,
  });
};

/**
 * Send booking cancellation email
 */
export const sendBookingCancellationEmail = async (
  travelerEmail: string,
  travelerName: string,
  bookingReference: string,
  bookingType: string,
  destination: string,
  cancellationReason: string,
  cancelledBy: string,
  refundAmount: number,
  currency: string
): Promise<boolean> => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Booking Cancelled</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px 15px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 24px 20px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                    Booking Cancelled
                  </h1>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 24px 20px;">
                  <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px; font-weight: 600;">
                    Hello ${travelerName},
                  </h2>

                  <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                    Your ${bookingType} booking to <strong>${destination}</strong> has been cancelled.
                  </p>

                  <!-- Booking Reference Box -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 12px; border: 2px solid #e5e7eb; margin: 20px 0;">
                    <tr>
                      <td style="padding: 16px;">
                        <h3 style="margin: 0 0 16px 0; color: #111827; font-size: 18px; font-weight: 600;">
                          Cancellation Details
                        </h3>
                        <table width="100%" cellpadding="8" cellspacing="0">
                          <tr>
                            <td style="color: #6b7280; font-size: 14px;">Booking Reference:</td>
                            <td align="right" style="color: #111827; font-size: 16px; font-weight: 600;">
                              ${bookingReference}
                            </td>
                          </tr>
                          <tr>
                            <td style="color: #6b7280; font-size: 14px;">Cancelled By:</td>
                            <td align="right" style="color: #111827; font-size: 16px; font-weight: 600;">
                              ${cancelledBy}
                            </td>
                          </tr>
                          <tr>
                            <td style="color: #6b7280; font-size: 14px;">Cancellation Date:</td>
                            <td align="right" style="color: #111827; font-size: 16px; font-weight: 600;">
                              ${new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  ${cancellationReason ? `
                  <!-- Cancellation Reason -->
                  <div style="background-color: #fef3c7; border-radius: 12px; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0;">
                    <h3 style="margin: 0 0 12px 0; color: #92400e; font-size: 16px; font-weight: 600;">
                      Cancellation Reason
                    </h3>
                    <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.6;">
                      ${cancellationReason}
                    </p>
                  </div>
                  ` : ''}

                  <!-- Credit Refund -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border-radius: 12px; margin: 20px 0;">
                    <tr>
                      <td style="padding: 16px;">
                        <h3 style="margin: 0 0 12px 0; color: #065f46; font-size: 16px; font-weight: 600;">
                          💳 Credit Refund Processed
                        </h3>
                        <p style="margin: 0 0 12px 0; color: #047857; font-size: 14px; line-height: 1.6;">
                          The following amount has been refunded to your account:
                        </p>
                        <p style="margin: 0; color: #064e3b; font-size: 24px; font-weight: bold;">
                          ${currency} $${refundAmount.toLocaleString()}
                        </p>
                      </td>
                    </tr>
                  </table>

                  <p style="margin: 30px 0 0 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                    If you have any questions about this cancellation or need to book a new trip, please don't hesitate to contact us or visit your dashboard.
                  </p>
                </td>
              </tr>

              <!-- CTA Button -->
              <tr>
                <td style="padding: 0 20px 24px 20px; text-align: center;">
                  <a href="${env.FRONTEND_URL}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);">
                    Go to Dashboard
                  </a>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                    Best regards,<br>
                    <strong style="color: #111827;">The bvodo Team</strong>
                  </p>
                  <p style="margin: 20px 0 0 0; color: #9ca3af; font-size: 12px;">
                    © ${new Date().getFullYear()} bvodo. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const text = `
Booking Cancelled

Hello ${travelerName},

Your ${bookingType} booking to ${destination} has been cancelled.

Cancellation Details:
- Booking Reference: ${bookingReference}
- Cancelled By: ${cancelledBy}
- Cancellation Date: ${new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}

${cancellationReason ? `Cancellation Reason:\n${cancellationReason}\n` : ''}
💳 Credit Refund Processed:
The following amount has been refunded to your account: ${currency} $${refundAmount.toLocaleString()}

If you have any questions about this cancellation or need to book a new trip, please don't hesitate to contact us or visit your dashboard.

Go to Dashboard: ${env.FRONTEND_URL}/dashboard

Best regards,
The bvodo Team
  `;

  return sendEmail({
    to: travelerEmail,
    subject: `Booking Cancelled - ${bookingReference}`,
    html,
    text,
  });
};
