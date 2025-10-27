const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

async function sendDuffelPlanEmail() {
  // Read the work plan document
  const workPlanPath = path.join(__dirname, 'DUFFEL_STAYS_MIGRATION_PLAN.md');
  const workPlanContent = fs.readFileSync(workPlanPath, 'utf8');

  // Create HTML version with better formatting
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 {
      color: #1a1a1a;
      border-bottom: 3px solid #4CAF50;
      padding-bottom: 10px;
    }
    h2 {
      color: #2c3e50;
      margin-top: 30px;
      border-left: 4px solid #4CAF50;
      padding-left: 15px;
    }
    h3 {
      color: #34495e;
      margin-top: 20px;
    }
    .highlight {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 20px 0;
    }
    .success {
      background-color: #d4edda;
      border-left: 4px solid #28a745;
      padding: 15px;
      margin: 20px 0;
    }
    .info {
      background-color: #d1ecf1;
      border-left: 4px solid #17a2b8;
      padding: 15px;
      margin: 20px 0;
    }
    code {
      background-color: #f4f4f4;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
    }
    pre {
      background-color: #2d2d2d;
      color: #f8f8f2;
      padding: 15px;
      border-radius: 5px;
      overflow-x: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 12px;
      text-align: left;
    }
    th {
      background-color: #4CAF50;
      color: white;
    }
    tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #eee;
      text-align: center;
      color: #666;
    }
    ul, ol {
      margin: 10px 0;
      padding-left: 30px;
    }
    li {
      margin: 8px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🏨 Duffel Stays Migration Work Plan</h1>

    <div class="success">
      <h3>📧 Your Comprehensive Migration Plan is Ready!</h3>
      <p>This email contains the complete work plan for migrating from Amadeus to Duffel Stays API. The full detailed document is attached.</p>
    </div>

    <h2>📋 Executive Summary</h2>
    <p>This work plan outlines a comprehensive strategy to migrate the Bvodo hotel booking system from Amadeus to Duffel Stays API.</p>

    <div class="info">
      <h3>Key Highlights:</h3>
      <ul>
        <li><strong>Current State:</strong> Amadeus hotel search is functional, but booking API is NOT implemented (marked as TODO)</li>
        <li><strong>Target State:</strong> Full Duffel Stays integration with search, quotes, and bookings</li>
        <li><strong>Advantage:</strong> Duffel flights already working - reuse authentication, payment flows, and patterns</li>
        <li><strong>Timeline Estimate:</strong> 4-6 weeks for complete implementation</li>
        <li><strong>Risk Level:</strong> Low-Medium (familiar API, proven patterns from flights)</li>
      </ul>
    </div>

    <h2>🎯 Why Duffel Stays?</h2>
    <table>
      <thead>
        <tr>
          <th>Feature</th>
          <th>Amadeus</th>
          <th>Duffel Stays</th>
          <th>Winner</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Pricing Validation</td>
          <td>No pre-booking validation</td>
          <td>Quote step validates before booking</td>
          <td><strong>Duffel ✓</strong></td>
        </tr>
        <tr>
          <td>Inventory Scope</td>
          <td>~700k properties</td>
          <td>Millions of properties</td>
          <td><strong>Duffel ✓</strong></td>
        </tr>
        <tr>
          <td>Payment Methods</td>
          <td>External (hotel payment)</td>
          <td>balance, card (integrated)</td>
          <td><strong>Duffel ✓</strong></td>
        </tr>
        <tr>
          <td>Photos</td>
          <td>Limited, requires Google Places</td>
          <td>Comprehensive photos included</td>
          <td><strong>Duffel ✓</strong></td>
        </tr>
        <tr>
          <td>API Consistency</td>
          <td>Separate from flights</td>
          <td>Same API as Duffel Flights</td>
          <td><strong>Duffel ✓</strong></td>
        </tr>
      </tbody>
    </table>

    <h2>📅 Implementation Timeline</h2>
    <table>
      <thead>
        <tr>
          <th>Phase</th>
          <th>Tasks</th>
          <th>Duration</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Phase 1</td>
          <td>Backend Service Layer</td>
          <td>1-2 weeks</td>
        </tr>
        <tr>
          <td>Phase 2</td>
          <td>Controller & Routes</td>
          <td>1 week</td>
        </tr>
        <tr>
          <td>Phase 3</td>
          <td>Frontend Adaptation</td>
          <td>1-2 weeks</td>
        </tr>
        <tr>
          <td>Phase 4</td>
          <td>Payment Integration</td>
          <td>1 week</td>
        </tr>
        <tr>
          <td>Phase 5</td>
          <td>Testing & QA</td>
          <td>1 week</td>
        </tr>
        <tr>
          <td>Phase 6</td>
          <td>Deployment</td>
          <td>2-3 days</td>
        </tr>
      </tbody>
    </table>

    <h2>🚀 Next Steps (Immediate Actions)</h2>
    <div class="highlight">
      <ol>
        <li><strong>Request Duffel Stays Access</strong>
          <ul>
            <li>Visit: <a href="https://duffel.com/contact-us">duffel.com/contact-us</a></li>
            <li>Message: "We currently use Duffel for flights and would like to add Stays. Please enable Stays API access for our account."</li>
          </ul>
        </li>
        <li><strong>Review Duffel Balance</strong>
          <ul>
            <li>Login to Duffel dashboard</li>
            <li>Check current balance</li>
            <li>Plan top-up if needed for production</li>
          </ul>
        </li>
        <li><strong>Test API Access</strong>
          <ul>
            <li>Test with test hotels at coordinates: -24.38, -128.32</li>
            <li>Verify search API working</li>
          </ul>
        </li>
        <li><strong>Kickoff Meeting</strong>
          <ul>
            <li>Review work plan with development team</li>
            <li>Assign responsibilities</li>
            <li>Schedule weekly check-ins</li>
          </ul>
        </li>
      </ol>
    </div>

    <h2>📊 What's Included in the Full Document</h2>
    <ul>
      <li>✅ Current State Analysis (What's working, what's not)</li>
      <li>✅ Detailed Amadeus vs Duffel Comparison</li>
      <li>✅ Migration Strategy with Phased Rollout</li>
      <li>✅ Complete Implementation Phases (6 phases)</li>
      <li>✅ Technical Architecture Diagrams</li>
      <li>✅ Code Changes Required (line-by-line)</li>
      <li>✅ Database Schema Updates</li>
      <li>✅ API Workflow Mapping</li>
      <li>✅ Payment Integration Strategy</li>
      <li>✅ Comprehensive Testing Strategy</li>
      <li>✅ Timeline & Resource Requirements</li>
      <li>✅ Risk Assessment & Mitigation</li>
      <li>✅ Prerequisites Checklist</li>
    </ul>

    <div class="success">
      <h3>✨ Why This is Perfect Timing</h3>
      <ul>
        <li><strong>No Migration Debt:</strong> Amadeus booking API not implemented yet (marked as TODO)</li>
        <li><strong>Database Ready:</strong> Schema already supports all needed fields</li>
        <li><strong>Frontend Ready:</strong> UI already built and compatible</li>
        <li><strong>Duffel Ready:</strong> Already working for flights</li>
        <li><strong>Stripe Ready:</strong> Payment integration already implemented</li>
      </ul>
    </div>

    <h2>💡 Key Benefits of Migration</h2>
    <ol>
      <li><strong>Unified Platform:</strong> Single API for flights AND hotels</li>
      <li><strong>Quote Validation:</strong> Prevents "payment collected but no booking" scenarios</li>
      <li><strong>Better Data:</strong> Comprehensive photos, amenities, reviews included</li>
      <li><strong>Larger Inventory:</strong> Millions of properties vs 700k</li>
      <li><strong>Corporate Features:</strong> Negotiated rates, loyalty programs</li>
      <li><strong>Better Testing:</strong> Dedicated test hotels (Amadeus often returns no offers)</li>
    </ol>

    <h2>📄 Document Location</h2>
    <p>The complete work plan is saved at:</p>
    <code>C:\\Users\\TolaAwoniyi\\Downloads\\bvodo\\DUFFEL_STAYS_MIGRATION_PLAN.md</code>

    <div class="footer">
      <p><strong>Document Version:</strong> 1.0 | <strong>Date:</strong> October 26, 2025</p>
      <p><strong>Prepared For:</strong> fb.awoniyi@gmail.com</p>
      <p><strong>Project:</strong> Bvodo Corporate Travel Platform</p>
      <p style="margin-top: 20px; color: #999;">
        Generated by Claude Code Assistant<br>
        Ready to proceed? Start with requesting Duffel Stays access today!
      </p>
    </div>
  </div>
</body>
</html>
  `;

  // For demonstration, log the email content
  // In production, you would configure nodemailer with your SMTP settings
  console.log('===============================================');
  console.log('EMAIL READY TO SEND');
  console.log('===============================================');
  console.log('To: fb.awoniyi@gmail.com');
  console.log('Subject: Duffel Stays Migration Work Plan - Bvodo Platform');
  console.log('Attachment: DUFFEL_STAYS_MIGRATION_PLAN.md');
  console.log('===============================================');
  console.log('');
  console.log('HTML Email Preview:');
  console.log('The email contains a beautifully formatted HTML summary with:');
  console.log('- Executive summary with key highlights');
  console.log('- Comparison table (Amadeus vs Duffel)');
  console.log('- Implementation timeline');
  console.log('- Next steps checklist');
  console.log('- Full document attached');
  console.log('');
  console.log('===============================================');
  console.log('FULL WORK PLAN SAVED AT:');
  console.log('C:\\Users\\TolaAwoniyi\\Downloads\\bvodo\\DUFFEL_STAYS_MIGRATION_PLAN.md');
  console.log('===============================================');

  // Save HTML email for manual sending if needed
  fs.writeFileSync(
    path.join(__dirname, 'duffel-plan-email.html'),
    htmlContent
  );

  console.log('');
  console.log('HTML email template saved to:');
  console.log('C:\\Users\\TolaAwoniyi\\Downloads\\bvodo\\duffel-plan-email.html');
  console.log('');
  console.log('You can:');
  console.log('1. Open this HTML file in a browser and email it');
  console.log('2. Configure SMTP settings in this script and run it');
  console.log('3. Use the markdown file directly');
}

sendDuffelPlanEmail().catch(console.error);
