import sgMail from '@sendgrid/mail';
import { logger } from '../utils/logger';

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

interface SeatSelection {
  passengerId: string;
  passengerName: string;
  segmentId: string;
  seatDesignator: string;
  serviceId: string;
  price: {
    amount: number;
    currency: string;
  };
}

interface BaggageSelection {
  serviceId: string;
  description: string;
  quantity: number;
  price: {
    amount: number;
    currency: string;
  };
  totalPrice: number;
}

interface BookingConfirmationData {
  bookingId: string;
  bookingReference: string;
  pnr?: string;
  travelerName: string;
  bookerName: string;
  bookerEmail: string;
  flightDetails: {
    airline: string;
    from: string;
    to: string;
    departureDate: string;
    departureTime: string;
    arrivalTime: string;
    flightNumber?: string;
  };
  passengerDetails: Array<{
    firstName: string;
    lastName: string;
    email?: string;
  }>;
  priceDetails: {
    basePrice: number;
    taxes: number;
    total: number;
    currency: string;
  };
  seatsSelected?: SeatSelection[];
  baggageSelected?: BaggageSelection[];
}

class EmailService {
  private fromEmail: string;
  private fromName: string;
  private isConfigured: boolean = false;

  constructor() {
    this.fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@bvodo.com';
    this.fromName = process.env.SENDGRID_FROM_NAME || 'Bvodo Travel';
    this.initialize();
  }

  private initialize() {
    try {
      const apiKey = process.env.SENDGRID_API_KEY;

      if (apiKey) {
        sgMail.setApiKey(apiKey);
        this.isConfigured = true;
        logger.info('Email service initialized with SendGrid');
      } else {
        logger.warn('SendGrid API key not configured - emails will be logged only');
      }
    } catch (error) {
      logger.error('Failed to initialize SendGrid:', error);
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      if (!this.isConfigured) {
        logger.warn('Email service not configured');
        logger.info('Email would be sent to:', options.to);
        logger.info('Subject:', options.subject);
        return false;
      }

      const recipients = Array.isArray(options.to) ? options.to : [options.to];

      const mailOptions = {
        to: recipients,
        from: {
          email: this.fromEmail,
          name: this.fromName,
        },
        subject: options.subject,
        html: options.html,
        text: options.text || this.htmlToText(options.html),
      };

      await sgMail.send(mailOptions);
      logger.info(`Email sent successfully to: ${recipients.join(', ')}`);

      // Log the email in development
      if (process.env.NODE_ENV === 'development') {
        logger.info('Email sent:', { to: recipients, subject: options.subject });
      }

      return true;
    } catch (error: any) {
      logger.error('Failed to send email:', error.response?.body || error.message || error);
      return false;
    }
  }

  async sendBookingConfirmation(data: BookingConfirmationData): Promise<boolean> {
    const recipients: string[] = [];

    // Add booker email
    if (data.bookerEmail) {
      recipients.push(data.bookerEmail);
    }

    // Add traveler emails (if different from booker)
    data.passengerDetails.forEach(passenger => {
      if (passenger.email && passenger.email !== data.bookerEmail) {
        recipients.push(passenger.email);
      }
    });

    if (recipients.length === 0) {
      logger.warn('No recipients for booking confirmation email');
      return false;
    }

    const subject = `Flight Booking Confirmed - ${data.bookingReference}${data.pnr ? ` (PNR: ${data.pnr})` : ''}`;
    const html = this.generateBookingConfirmationHTML(data);

    return this.sendEmail({
      to: recipients,
      subject,
      html,
    });
  }

  private generateBookingConfirmationHTML(data: BookingConfirmationData): string {
    const passengersList = data.passengerDetails
      .map(p => `<div style="padding: 10px 0; font-size: 14px; color: #1f2937;">${p.firstName} ${p.lastName}</div>`)
      .join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background-color: #f9fafb;
      margin: 0;
      padding: 0;
    }
    .email-wrapper {
      background-color: #f9fafb;
      padding: 40px 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    }
    .header {
      background-color: #ffffff;
      padding: 32px 32px 24px 32px;
      border-bottom: 1px solid #e5e7eb;
    }
    .logo {
      font-size: 24px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 16px;
    }
    .status-badge {
      display: inline-block;
      padding: 6px 12px;
      background-color: #C6F432;
      color: #111827;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 1.2px;
      text-transform: uppercase;
      border-radius: 4px;
    }
    .content {
      padding: 32px;
    }
    .greeting {
      font-size: 15px;
      color: #374151;
      margin-bottom: 32px;
      line-height: 1.6;
    }
    .greeting-name {
      font-weight: 600;
      color: #111827;
    }
    .section {
      margin-bottom: 32px;
      padding-bottom: 32px;
      border-bottom: 1px solid #f3f4f6;
    }
    .section:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    .section-title {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #6b7280;
      margin-bottom: 12px;
    }
    .ref-number {
      font-size: 28px;
      font-weight: 700;
      color: #111827;
      letter-spacing: 2px;
      margin-bottom: 8px;
      word-break: break-all;
    }
    .sub-ref {
      font-size: 13px;
      color: #6b7280;
    }
    .route-container {
      display: flex;
      align-items: center;
      gap: 16px;
      margin: 16px 0;
      padding: 16px;
      background-color: #f9fafb;
      border-radius: 6px;
    }
    .city-code {
      font-size: 24px;
      font-weight: 700;
      color: #111827;
      letter-spacing: 1px;
    }
    .arrow {
      color: #111827;
      font-size: 20px;
      font-weight: 300;
    }
    .airline-name {
      font-size: 14px;
      color: #6b7280;
      margin-bottom: 12px;
    }
    .info-row {
      width: 100%;
      padding: 12px 0;
      border-bottom: 1px solid #f3f4f6;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .info-row table {
      width: 100%;
      border-collapse: collapse;
    }
    .info-label {
      color: #6b7280;
      font-size: 14px;
      text-align: left;
    }
    .info-value {
      color: #111827;
      font-weight: 500;
      font-size: 14px;
      text-align: right;
    }
    .passenger-item {
      padding: 10px 0;
      font-size: 14px;
      color: #1f2937;
    }
    .price-row {
      width: 100%;
      padding: 10px 0;
    }
    .price-row table {
      width: 100%;
      border-collapse: collapse;
    }
    .price-label {
      color: #6b7280;
      font-size: 14px;
      text-align: left;
    }
    .price-value {
      color: #111827;
      font-weight: 500;
      font-size: 14px;
      text-align: right;
    }
    .total-row {
      width: 100%;
      padding: 16px 0;
      margin-top: 8px;
      border-top: 2px solid #111827;
    }
    .total-row table {
      width: 100%;
      border-collapse: collapse;
    }
    .total-label {
      color: #111827;
      font-size: 16px;
      font-weight: 700;
      text-align: left;
    }
    .total-value {
      color: #111827;
      font-size: 16px;
      font-weight: 700;
      text-align: right;
    }
    .important-box {
      background-color: #fffbeb;
      border-left: 3px solid #C6F432;
      padding: 20px;
      border-radius: 6px;
      margin: 24px 0;
    }
    .important-title {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #92400e;
      margin-bottom: 12px;
    }
    .important-item {
      font-size: 13px;
      color: #78350f;
      padding: 6px 0;
      padding-left: 16px;
      position: relative;
      line-height: 1.5;
    }
    .important-item:before {
      content: "•";
      position: absolute;
      left: 0;
      color: #92400e;
      font-weight: 700;
    }
    .button-container {
      text-align: center;
      margin: 32px 0;
    }
    .button {
      display: inline-block;
      padding: 14px 40px;
      background-color: #111827;
      color: #ffffff;
      text-decoration: none;
      font-size: 14px;
      font-weight: 600;
      letter-spacing: 0.5px;
      border-radius: 6px;
    }
    .footer {
      background-color: #f9fafb;
      padding: 24px 32px;
      border-top: 1px solid #e5e7eb;
      font-size: 12px;
      color: #6b7280;
      line-height: 1.6;
    }
    .footer-brand {
      color: #111827;
      font-weight: 600;
      margin-top: 8px;
    }
    @media only screen and (max-width: 600px) {
      .email-wrapper {
        padding: 20px 10px;
      }
      .content {
        padding: 24px 20px;
      }
      .header {
        padding: 24px 20px;
      }
      .ref-number {
        font-size: 22px;
      }
      .city-code {
        font-size: 20px;
      }
      .route-container {
        gap: 12px;
      }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="container">
      <div class="header">
        <div class="logo">bvodo</div>
        <div class="status-badge">CONFIRMED</div>
      </div>

      <div class="content">
        <div class="greeting">
          <span class="greeting-name">Hello ${data.travelerName},</span><br>
          Your flight booking has been confirmed. Below are your travel details.
        </div>

        <div class="section">
          ${data.pnr ? `
          <div class="section-title">Airline Confirmation (PNR)</div>
          <div class="ref-number">${data.pnr}</div>
          <div class="sub-ref">Bvodo Reference: ${data.bookingReference}</div>
          ` : `
          <div class="section-title">Booking Reference</div>
          <div class="ref-number">${data.bookingReference}</div>
          <div class="sub-ref">Your PNR will be available once the airline confirms</div>
          `}
        </div>

        <div class="section">
          <div class="section-title">Flight Details</div>
          <div class="airline-name">${data.flightDetails.airline}</div>
          <div class="route-container">
            <span class="city-code">${data.flightDetails.from}</span>
            <span class="arrow">→</span>
            <span class="city-code">${data.flightDetails.to}</span>
          </div>
          ${data.flightDetails.flightNumber ? `
          <div class="info-row">
            <table>
              <tr>
                <td class="info-label">Flight Number</td>
                <td class="info-value">${data.flightDetails.flightNumber}</td>
              </tr>
            </table>
          </div>` : ''}
          <div class="info-row">
            <table>
              <tr>
                <td class="info-label">Date</td>
                <td class="info-value">${data.flightDetails.departureDate}</td>
              </tr>
            </table>
          </div>
          <div class="info-row">
            <table>
              <tr>
                <td class="info-label">Departure</td>
                <td class="info-value">${data.flightDetails.departureTime}</td>
              </tr>
            </table>
          </div>
          <div class="info-row">
            <table>
              <tr>
                <td class="info-label">Arrival</td>
                <td class="info-value">${data.flightDetails.arrivalTime}</td>
              </tr>
            </table>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Passengers</div>
          ${passengersList}
        </div>

        ${data.seatsSelected && data.seatsSelected.length > 0 ? `
        <div class="section">
          <div class="section-title">Seat Assignments</div>
          ${data.seatsSelected.map(seat => `
            <div class="info-row">
              <table>
                <tr>
                  <td class="info-label">${seat.passengerName}</td>
                  <td class="info-value">Seat ${seat.seatDesignator} - ${seat.price.currency} ${seat.price.amount.toFixed(2)}</td>
                </tr>
              </table>
            </div>
          `).join('')}
        </div>
        ` : ''}

        ${data.baggageSelected && data.baggageSelected.length > 0 ? `
        <div class="section">
          <div class="section-title">Additional Baggage</div>
          ${data.baggageSelected.map(bag => `
            <div class="info-row">
              <table>
                <tr>
                  <td class="info-label">${bag.description} (×${bag.quantity})</td>
                  <td class="info-value">${bag.price.currency} ${bag.totalPrice.toFixed(2)}</td>
                </tr>
              </table>
            </div>
          `).join('')}
        </div>
        ` : ''}

        <div class="section">
          <div class="section-title">Payment Summary</div>
          <div class="price-row">
            <table>
              <tr>
                <td class="price-label">Base Fare</td>
                <td class="price-value">${data.priceDetails.currency} ${data.priceDetails.basePrice.toFixed(2)}</td>
              </tr>
            </table>
          </div>
          <div class="price-row">
            <table>
              <tr>
                <td class="price-label">Taxes & Fees</td>
                <td class="price-value">${data.priceDetails.currency} ${data.priceDetails.taxes.toFixed(2)}</td>
              </tr>
            </table>
          </div>
          ${(() => {
            const seatsCost = data.seatsSelected?.reduce((sum, seat) => sum + (seat.price?.amount || 0), 0) || 0;
            const baggageCost = data.baggageSelected?.reduce((sum, bag) => sum + (bag.totalPrice || 0), 0) || 0;
            const servicesCost = seatsCost + baggageCost;

            return servicesCost > 0 ? `
              <div class="price-row">
                <table>
                  <tr>
                    <td class="price-label">Additional Services</td>
                    <td class="price-value">${data.priceDetails.currency} ${servicesCost.toFixed(2)}</td>
                  </tr>
                </table>
              </div>
            ` : '';
          })()}
          <div class="total-row">
            <table>
              <tr>
                <td class="total-label">Total Paid</td>
                <td class="total-value">${data.priceDetails.currency} ${data.priceDetails.total.toFixed(2)}</td>
              </tr>
            </table>
          </div>
        </div>

        <div class="important-box">
          <div class="important-title">Important Information</div>
          <div class="important-item">Arrive at the airport 2-3 hours before departure</div>
          <div class="important-item">Bring a valid government-issued ID and passport</div>
          ${data.pnr ? `<div class="important-item">Use PNR ${data.pnr} for online check-in</div>` : ''}
          <div class="important-item">Verify baggage allowance with your airline</div>
          <div class="important-item">Check visa requirements for your destination</div>
        </div>

        <div class="button-container">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}/dashboard/bookings/confirmed?booking=${data.bookingId}" class="button">
            View Booking Details
          </a>
        </div>
      </div>

      <div class="footer">
        Booked by ${data.bookerName}
        <div class="footer-brand">Bvodo Travel</div>
      </div>
    </div>
  </div>
</body>
</html>
    `;
  }

  private htmlToText(html: string): string {
    // Simple HTML to text conversion
    return html
      .replace(/<style[^>]*>.*?<\/style>/gs, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

export const emailService = new EmailService();
export default emailService;
