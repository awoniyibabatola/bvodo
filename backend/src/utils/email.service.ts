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
 * Base email template with minimal modern design
 * - Simple bvodo logo centered
 * - No icons in header
 * - No header background
 * - No thick borders
 * - No colored backgrounds
 * - Grey/black only
 * - Lemon green buttons only
 * - Detailed footer
 */
const getEmailTemplate = (content: string): string => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <title>bvodo</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #ffffff; color: #111827;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; max-width: 600px;">

              <!-- Logo Header -->
              <tr>
                <td style="padding: 32px 0; text-align: center; border-bottom: 1px solid #e5e7eb;">
                  <h1 style="margin: 0; font-size: 32px; font-weight: 700; color: #111827; letter-spacing: -0.5px;">
                    bvodo
                  </h1>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 40px 24px;">
                  ${content}
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 32px 24px; border-top: 1px solid #e5e7eb; background-color: #fafafa;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding-bottom: 20px;">
                        <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #111827;">
                          bvodo
                        </p>
                        <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #6b7280;">
                          Corporate travel booking made simple.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 16px 0; border-top: 1px solid #e5e7eb;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="padding: 4px 0;">
                              <a href="${env.FRONTEND_URL || 'https://bvodo.com'}/terms" style="font-size: 12px; color: #6b7280; text-decoration: none; margin-right: 12px;">Terms</a>
                              <a href="${env.FRONTEND_URL || 'https://bvodo.com'}/privacy" style="font-size: 12px; color: #6b7280; text-decoration: none; margin-right: 12px;">Privacy</a>
                              <a href="${env.FRONTEND_URL || 'https://bvodo.com'}/support" style="font-size: 12px; color: #6b7280; text-decoration: none;">Support</a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding-top: 16px;">
                        <p style="margin: 0; font-size: 12px; color: #9ca3af; line-height: 1.5;">
                          © ${new Date().getFullYear()} bvodo. All rights reserved.<br>
                          Corporate Travel Platform
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding-top: 12px;">
                        <p style="margin: 0; font-size: 11px; color: #9ca3af;">
                          Questions? Contact us at <a href="mailto:support@bvodo.com" style="color: #6b7280; text-decoration: none;">support@bvodo.com</a>
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

/**
 * Button style (lemon green)
 */
const getButtonHTML = (text: string, url: string): string => {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
      <tr>
        <td align="center">
          <a href="${url}" style="display: inline-block; padding: 14px 40px; background-color: #ADF802; color: #111827; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 6px; border: none;">
            ${text}
          </a>
        </td>
      </tr>
    </table>
  `;
};

/**
 * Info box style (grey background)
 */
const getInfoBox = (title: string, rows: {label: string, value: string}[]): string => {
  const rowsHTML = rows.map(row => `
    <tr>
      <td style="padding: 10px 0; color: #6b7280; font-size: 14px; border-bottom: 1px solid #f3f4f6;">
        ${row.label}
      </td>
      <td align="right" style="padding: 10px 0; color: #111827; font-size: 14px; font-weight: 600; border-bottom: 1px solid #f3f4f6;">
        ${row.value}
      </td>
    </tr>
  `).join('');

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0; background-color: #fafafa; border-radius: 8px; border: 1px solid #e5e7eb;">
      <tr>
        <td style="padding: 20px;">
          ${title ? `<h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #111827;">${title}</h3>` : ''}
          <table width="100%" cellpadding="0" cellspacing="0">
            ${rowsHTML}
          </table>
        </td>
      </tr>
    </table>
  `;
};

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
  const content = `
    <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #111827;">
      Credit Application Received
    </h2>

    <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #4b5563;">
      Hello ${companyName},
    </p>

    <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #4b5563;">
      Thank you for submitting your credit application with bvodo. We have successfully received your request and our team will review it shortly.
    </p>

    ${getInfoBox('Application Summary', [
      { label: 'Requested Amount', value: `${currency} $${requestedAmount.toLocaleString()}` },
      { label: 'Review Time', value: '2-3 Business Days' }
    ])}

    <div style="padding: 20px; background-color: #fafafa; border-radius: 6px; border-left: 3px solid #111827; margin: 24px 0;">
      <h4 style="margin: 0 0 12px 0; font-size: 15px; font-weight: 600; color: #111827;">
        What Happens Next?
      </h4>
      <ol style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 14px; line-height: 1.8;">
        <li>Our credit team will review your application</li>
        <li>You'll receive a decision notification via email within 2-3 business days</li>
        <li>If approved, credits will be added to your account immediately</li>
      </ol>
    </div>

    <p style="margin: 24px 0 0 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
      You can track your application status anytime in your dashboard.
    </p>
  `;

  const html = getEmailTemplate(content);

  const text = `
Credit Application Received

Hello ${companyName},

Thank you for submitting your credit application with bvodo. We have successfully received your request and our team will review it shortly.

Application Summary:
- Requested Amount: ${currency} $${requestedAmount.toLocaleString()}
- Review Time: 2-3 Business Days

What Happens Next?
1. Our credit team will review your application
2. You'll receive a decision notification via email within 2-3 business days
3. If approved, credits will be added to your account immediately

You can track your application status anytime in your dashboard.

Best regards,
The bvodo Team
  `;

  return sendEmail({
    to: email,
    subject: 'Credit Application Received',
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
  const content = `
    <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #111827;">
      Credit Application Approved
    </h2>

    <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #4b5563;">
      Great news, ${companyName}!
    </p>

    <p style="margin: 0 0 32px 0; font-size: 15px; line-height: 1.6; color: #4b5563;">
      We're pleased to inform you that your credit application has been approved. Your credits have been added to your account and are ready to use.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0; background-color: #fafafa; border-radius: 8px; border: 1px solid #e5e7eb;">
      <tr>
        <td style="padding: 32px; text-align: center;">
          <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">
            Approved Credit Amount
          </p>
          <h2 style="margin: 0; font-size: 42px; font-weight: 700; color: #111827;">
            ${currency} $${approvedAmount.toLocaleString()}
          </h2>
        </td>
      </tr>
    </table>

    <div style="padding: 20px; background-color: #fafafa; border-radius: 6px; border-left: 3px solid #111827; margin: 24px 0;">
      <h4 style="margin: 0 0 12px 0; font-size: 15px; font-weight: 600; color: #111827;">
        Start Using Your Credits
      </h4>
      <ul style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 14px; line-height: 1.8;">
        <li>Log in to your bvodo dashboard</li>
        <li>Your credits are immediately available for bookings</li>
        <li>Book flights, hotels, and manage your corporate travel</li>
        <li>Track your credit usage in real-time</li>
      </ul>
    </div>

    ${getButtonHTML('Go to Dashboard', `${env.FRONTEND_URL}/dashboard`)}

    <p style="margin: 24px 0 0 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
      Thank you for choosing bvodo for your corporate travel needs.
    </p>
  `;

  const html = getEmailTemplate(content);

  const text = `
Credit Application Approved

Great news, ${companyName}!

We're pleased to inform you that your credit application has been approved. Your credits have been added to your account and are ready to use.

Approved Credit Amount: ${currency} $${approvedAmount.toLocaleString()}

Start Using Your Credits:
• Log in to your bvodo dashboard
• Your credits are immediately available for bookings
• Book flights, hotels, and manage your corporate travel
• Track your credit usage in real-time

Go to Dashboard: ${env.FRONTEND_URL}/dashboard

Thank you for choosing bvodo for your corporate travel needs.

Best regards,
The bvodo Team
  `;

  return sendEmail({
    to: email,
    subject: 'Credit Application Approved',
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
  const content = `
    <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #111827;">
      Credit Application Update
    </h2>

    <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #4b5563;">
      Hello ${companyName},
    </p>

    <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #4b5563;">
      Thank you for your interest in applying for credit with bvodo. After careful review, we are unable to approve your credit application at this time.
    </p>

    <div style="padding: 20px; background-color: #fafafa; border-radius: 6px; border-left: 3px solid #111827; margin: 24px 0;">
      <h4 style="margin: 0 0 12px 0; font-size: 15px; font-weight: 600; color: #111827;">
        Reason for Decline
      </h4>
      <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #4b5563;">
        ${rejectionReason}
      </p>
    </div>

    <div style="padding: 20px; background-color: #fafafa; border-radius: 6px; border-left: 3px solid #111827; margin: 24px 0;">
      <h4 style="margin: 0 0 12px 0; font-size: 15px; font-weight: 600; color: #111827;">
        Next Steps
      </h4>
      <ul style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 14px; line-height: 1.8;">
        <li>You can reapply in the future as your business grows</li>
        <li>Consider using our pay-as-you-go booking options</li>
        <li>Contact our support team to discuss alternative solutions</li>
      </ul>
    </div>

    <p style="margin: 24px 0 0 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
      We appreciate your interest in bvodo and hope to work with you in the future.
    </p>
  `;

  const html = getEmailTemplate(content);

  const text = `
Credit Application Update

Hello ${companyName},

Thank you for your interest in applying for credit with bvodo. After careful review, we are unable to approve your credit application at this time.

Reason for Decline:
${rejectionReason}

Next Steps:
• You can reapply in the future as your business grows
• Consider using our pay-as-you-go booking options
• Contact our support team to discuss alternative solutions

We appreciate your interest in bvodo and hope to work with you in the future.

Best regards,
The bvodo Team
  `;

  return sendEmail({
    to: email,
    subject: 'Credit Application Update',
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
  const content = `
    <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #111827;">
      Welcome to bvodo
    </h2>

    <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #4b5563;">
      Hello ${firstName},
    </p>

    <p style="margin: 0 0 32px 0; font-size: 15px; line-height: 1.6; color: #4b5563;">
      Congratulations! Your organization <strong>${organizationName}</strong> has been successfully registered on bvodo. You're all set to streamline your corporate travel management.
    </p>

    ${getInfoBox('Your Account Details', [
      { label: 'Organization', value: organizationName },
      { label: 'Subdomain', value: subdomain },
      { label: 'Email', value: email }
    ])}

    <div style="padding: 20px; background-color: #fafafa; border-radius: 6px; border-left: 3px solid #111827; margin: 24px 0;">
      <h4 style="margin: 0 0 12px 0; font-size: 15px; font-weight: 600; color: #111827;">
        Get Started in 3 Easy Steps
      </h4>
      <ol style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 14px; line-height: 1.8;">
        <li><strong>Apply for Credit:</strong> Submit a credit application to get your organization funded</li>
        <li><strong>Invite Your Team:</strong> Add travelers and managers to your organization</li>
        <li><strong>Book Your First Trip:</strong> Start booking flights and hotels with ease</li>
      </ol>
    </div>

    ${getButtonHTML('Go to Dashboard', `${env.FRONTEND_URL}/dashboard`)}

    <p style="margin: 24px 0 0 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
      Our platform makes corporate travel simple, efficient, and cost-effective.
    </p>
  `;

  const html = getEmailTemplate(content);

  const text = `
Welcome to bvodo

Hello ${firstName},

Congratulations! Your organization ${organizationName} has been successfully registered on bvodo. You're all set to streamline your corporate travel management.

Your Account Details:
- Organization: ${organizationName}
- Subdomain: ${subdomain}
- Email: ${email}

Get Started in 3 Easy Steps:
1. Apply for Credit: Submit a credit application to get your organization funded
2. Invite Your Team: Add travelers and managers to your organization
3. Book Your First Trip: Start booking flights and hotels with ease

Go to Dashboard: ${env.FRONTEND_URL}/dashboard

Our platform makes corporate travel simple, efficient, and cost-effective.

Best regards,
The bvodo Team
  `;

  return sendEmail({
    to: email,
    subject: 'Welcome to bvodo',
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

  const content = `
    <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #111827;">
      You're Invited to Join ${organizationName}
    </h2>

    <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #4b5563;">
      Hello ${firstName} ${lastName},
    </p>

    <p style="margin: 0 0 32px 0; font-size: 15px; line-height: 1.6; color: #4b5563;">
      <strong>${inviterName}</strong> has invited you to join <strong>${organizationName}</strong> on bvodo, the corporate travel platform.
    </p>

    ${getInfoBox('Invitation Details', [
      { label: 'Organization', value: organizationName },
      { label: 'Role', value: role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ') },
      ...(creditLimit > 0 ? [{ label: 'Credit Allocation', value: `USD $${creditLimit.toLocaleString()}` }] : []),
      { label: 'Invited By', value: inviterName }
    ])}

    <div style="padding: 20px; background-color: #fafafa; border-radius: 6px; border-left: 3px solid #111827; margin: 24px 0;">
      <h4 style="margin: 0 0 12px 0; font-size: 15px; font-weight: 600; color: #111827;">
        Complete Your Registration
      </h4>
      <ol style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 14px; line-height: 1.8;">
        <li>Click the "Accept Invitation" button below</li>
        <li>Create a secure password for your account</li>
        <li>Start managing your corporate travel bookings</li>
      </ol>
    </div>

    <div style="padding: 16px; background-color: #fafafa; border-radius: 6px; margin: 24px 0;">
      <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #6b7280;">
        <strong>Important:</strong> This invitation expires in 7 days. Please accept it soon to maintain access.
      </p>
    </div>

    ${getButtonHTML('Accept Invitation', invitationLink)}

    <p style="margin: 24px 0 0 0; font-size: 12px; line-height: 1.6; color: #9ca3af; text-align: center;">
      Or copy this link: <a href="${invitationLink}" style="color: #6b7280; word-break: break-all;">${invitationLink}</a>
    </p>
  `;

  const html = getEmailTemplate(content);

  const text = `
You're Invited to Join ${organizationName}

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

Important: This invitation expires in 7 days. Please accept it soon to maintain access.

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
  const content = `
    <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #111827;">
      ${requiresApproval ? 'Booking Pending Approval' : 'Booking Request Submitted'}
    </h2>

    <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #4b5563;">
      Hello ${travelerName},
    </p>

    <p style="margin: 0 0 32px 0; font-size: 15px; line-height: 1.6; color: #4b5563;">
      Your ${bookingType} booking request has been ${requiresApproval ? 'submitted for approval' : 'successfully created'}.
    </p>

    ${getInfoBox('Booking Details', [
      { label: 'Booking Reference', value: bookingReference },
      { label: 'Type', value: bookingType.charAt(0).toUpperCase() + bookingType.slice(1) },
      ...(origin ? [{ label: 'From', value: origin }] : []),
      { label: 'To', value: destination },
      { label: 'Departure Date', value: new Date(departureDate).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) },
      ...(returnDate ? [{ label: 'Return Date', value: new Date(returnDate).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) }] : []),
      { label: 'Total Cost', value: `${currency} $${totalPrice.toLocaleString()}` }
    ])}

    ${requiresApproval ? `
    <div style="padding: 20px; background-color: #fafafa; border-radius: 6px; border-left: 3px solid #111827; margin: 24px 0;">
      <h4 style="margin: 0 0 12px 0; font-size: 15px; font-weight: 600; color: #111827;">
        Approval Required
      </h4>
      <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #4b5563;">
        This booking requires approval from ${approverName || 'your manager'}. You'll receive an email notification once it has been reviewed.
      </p>
    </div>
    ` : `
    <div style="padding: 20px; background-color: #fafafa; border-radius: 6px; border-left: 3px solid #111827; margin: 24px 0;">
      <h4 style="margin: 0 0 12px 0; font-size: 15px; font-weight: 600; color: #111827;">
        What's Next?
      </h4>
      <ol style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 14px; line-height: 1.8;">
        <li>Your credits have been held for this booking</li>
        <li>Our team will confirm rates and availability</li>
        <li>You'll receive confirmation once booking is finalized</li>
      </ol>
    </div>
    `}

    ${getButtonHTML('View Booking', `${env.FRONTEND_URL}/dashboard/bookings`)}

    <p style="margin: 24px 0 0 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
      You can track your booking status anytime in your dashboard.
    </p>
  `;

  const html = getEmailTemplate(content);

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
`Approval Required:
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
  const content = `
    <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #111827;">
      Booking Approved
    </h2>

    <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #4b5563;">
      Great news, ${travelerName}!
    </p>

    <p style="margin: 0 0 32px 0; font-size: 15px; line-height: 1.6; color: #4b5563;">
      Your ${bookingType} booking to <strong>${destination}</strong> has been approved by ${approverName}.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0; background-color: #fafafa; border-radius: 8px; border: 1px solid #e5e7eb;">
      <tr>
        <td style="padding: 32px; text-align: center;">
          <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">
            Booking Reference
          </p>
          <h2 style="margin: 0; font-size: 32px; font-weight: 700; color: #111827; letter-spacing: 2px;">
            ${bookingReference}
          </h2>
        </td>
      </tr>
    </table>

    ${getInfoBox('Approval Details', [
      { label: 'Approved By', value: approverName },
      { label: 'Approval Date', value: new Date(approvalDate).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) }
    ])}

    <div style="padding: 20px; background-color: #fafafa; border-radius: 6px; border-left: 3px solid #111827; margin: 24px 0;">
      <h4 style="margin: 0 0 12px 0; font-size: 15px; font-weight: 600; color: #111827;">
        What's Next?
      </h4>
      <ol style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 14px; line-height: 1.8;">
        <li>Our team will confirm current rates with travel providers</li>
        <li>You'll receive final confirmation once rates are verified</li>
        <li>Your booking will be finalized and tickets issued</li>
      </ol>
    </div>

    ${getButtonHTML('View Booking', `${env.FRONTEND_URL}/dashboard/bookings`)}

    <p style="margin: 24px 0 0 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
      Track your booking status anytime in your dashboard.
    </p>
  `;

  const html = getEmailTemplate(content);

  const text = `
Booking Approved

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
    subject: `Booking Approved - ${bookingReference}`,
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
  const content = `
    <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #111827;">
      Booking Confirmed
    </h2>

    <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #4b5563;">
      Hello ${travelerName},
    </p>

    <p style="margin: 0 0 32px 0; font-size: 15px; line-height: 1.6; color: #4b5563;">
      Great news! Your ${bookingType} booking has been confirmed and is ready for your trip.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0; background-color: #fafafa; border-radius: 8px; border: 1px solid #e5e7eb;">
      <tr>
        <td style="padding: 32px; text-align: center;">
          <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">
            Your Booking Reference
          </p>
          <h2 style="margin: 0; font-size: 36px; font-weight: 700; color: #111827; letter-spacing: 3px;">
            ${bookingReference}
          </h2>
        </td>
      </tr>
    </table>

    ${getInfoBox('Trip Details', [
      { label: 'Type', value: bookingType.charAt(0).toUpperCase() + bookingType.slice(1) },
      ...(origin ? [{ label: 'From', value: origin }] : []),
      { label: 'To', value: destination },
      { label: 'Departure', value: new Date(departureDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) },
      ...(returnDate ? [{ label: 'Return', value: new Date(returnDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }] : []),
      { label: 'Total Cost', value: `${currency} $${totalPrice.toLocaleString()}` }
    ])}

    <div style="padding: 20px; background-color: #fafafa; border-radius: 6px; border-left: 3px solid #111827; margin: 24px 0;">
      <h4 style="margin: 0 0 12px 0; font-size: 15px; font-weight: 600; color: #111827;">
        Important Information
      </h4>
      <ul style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 14px; line-height: 1.8;">
        <li>Please keep this booking reference for your records</li>
        <li>Check-in requirements vary by provider - review carefully</li>
        <li>Arrive early for your departure</li>
        <li>Contact support if you need to make any changes</li>
      </ul>
    </div>

    ${getButtonHTML('View Full Itinerary', `${env.FRONTEND_URL}/dashboard/bookings`)}

    <p style="margin: 24px 0 0 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
      Have a wonderful trip! If you need any assistance, our support team is here to help.
    </p>
  `;

  const html = getEmailTemplate(content);

  const text = `
Booking Confirmed

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

Important Information:
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
    subject: `Booking Confirmed - ${bookingReference}`,
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
  const content = `
    <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #111827;">
      Booking Update
    </h2>

    <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #4b5563;">
      Hello ${travelerName},
    </p>

    <p style="margin: 0 0 32px 0; font-size: 15px; line-height: 1.6; color: #4b5563;">
      We regret to inform you that your ${bookingType} booking to <strong>${destination}</strong> (Reference: <strong>${bookingReference}</strong>) has not been approved.
    </p>

    <div style="padding: 20px; background-color: #fafafa; border-radius: 6px; border-left: 3px solid #111827; margin: 24px 0;">
      <h4 style="margin: 0 0 12px 0; font-size: 15px; font-weight: 600; color: #111827;">
        Reason for Rejection
      </h4>
      <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #4b5563;">
        ${rejectionReason}
      </p>
      <p style="margin: 0; font-size: 13px; color: #6b7280;">
        Rejected by: ${rejectedBy}
      </p>
    </div>

    <div style="padding: 16px; background-color: #fafafa; border-radius: 6px; margin: 24px 0;">
      <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #4b5563;">
        <strong>Credit Refund:</strong> Any credits that were held for this booking have been released back to your account and are now available for use.
      </p>
    </div>

    <div style="padding: 20px; background-color: #fafafa; border-radius: 6px; border-left: 3px solid #111827; margin: 24px 0;">
      <h4 style="margin: 0 0 12px 0; font-size: 15px; font-weight: 600; color: #111827;">
        Next Steps
      </h4>
      <ul style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 14px; line-height: 1.8;">
        <li>Review the rejection reason with your approver</li>
        <li>Modify your booking request if needed</li>
        <li>Resubmit with updated details</li>
        <li>Contact your manager for alternative options</li>
      </ul>
    </div>

    ${getButtonHTML('View My Bookings', `${env.FRONTEND_URL}/dashboard/bookings`)}

    <p style="margin: 24px 0 0 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
      If you have any questions about this decision, please reach out to ${rejectedBy} or contact our support team.
    </p>
  `;

  const html = getEmailTemplate(content);

  const text = `
Booking Update

Hello ${travelerName},

We regret to inform you that your ${bookingType} booking to ${destination} (Reference: ${bookingReference}) has not been approved.

Reason for Rejection:
${rejectionReason}

Rejected by: ${rejectedBy}

Credit Refund:
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
  const content = `
    <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #111827;">
      Booking Cancelled
    </h2>

    <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #4b5563;">
      Hello ${travelerName},
    </p>

    <p style="margin: 0 0 32px 0; font-size: 15px; line-height: 1.6; color: #4b5563;">
      Your ${bookingType} booking to <strong>${destination}</strong> has been cancelled.
    </p>

    ${getInfoBox('Cancellation Details', [
      { label: 'Booking Reference', value: bookingReference },
      { label: 'Cancelled By', value: cancelledBy },
      { label: 'Cancellation Date', value: new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) }
    ])}

    ${cancellationReason ? `
    <div style="padding: 20px; background-color: #fafafa; border-radius: 6px; border-left: 3px solid #111827; margin: 24px 0;">
      <h4 style="margin: 0 0 12px 0; font-size: 15px; font-weight: 600; color: #111827;">
        Cancellation Reason
      </h4>
      <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #4b5563;">
        ${cancellationReason}
      </p>
    </div>
    ` : ''}

    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0; background-color: #fafafa; border-radius: 8px; border: 1px solid #e5e7eb;">
      <tr>
        <td style="padding: 20px;">
          <h4 style="margin: 0 0 12px 0; font-size: 15px; font-weight: 600; color: #111827;">
            Credit Refund Processed
          </h4>
          <p style="margin: 0 0 12px 0; font-size: 14px; line-height: 1.6; color: #4b5563;">
            The following amount has been refunded to your account:
          </p>
          <p style="margin: 0; font-size: 24px; font-weight: 700; color: #111827;">
            ${currency} $${refundAmount.toLocaleString()}
          </p>
        </td>
      </tr>
    </table>

    ${getButtonHTML('Go to Dashboard', `${env.FRONTEND_URL}/dashboard`)}

    <p style="margin: 24px 0 0 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
      If you have any questions about this cancellation or need to book a new trip, please don't hesitate to contact us.
    </p>
  `;

  const html = getEmailTemplate(content);

  const text = `
Booking Cancelled

Hello ${travelerName},

Your ${bookingType} booking to ${destination} has been cancelled.

Cancellation Details:
- Booking Reference: ${bookingReference}
- Cancelled By: ${cancelledBy}
- Cancellation Date: ${new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}

${cancellationReason ? `Cancellation Reason:\n${cancellationReason}\n` : ''}
Credit Refund Processed:
The following amount has been refunded to your account: ${currency} $${refundAmount.toLocaleString()}

If you have any questions about this cancellation or need to book a new trip, please don't hesitate to contact us.

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
