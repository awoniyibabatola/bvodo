const sgMail = require('@sendgrid/mail');
require('dotenv').config();

console.log('Testing SendGrid configuration...\n');
console.log('API Key present:', !!process.env.SENDGRID_API_KEY);
console.log('From Email:', process.env.SENDGRID_FROM_EMAIL);
console.log('API Key (first 10 chars):', process.env.SENDGRID_API_KEY?.substring(0, 10));

if (!process.env.SENDGRID_API_KEY) {
  console.error('\n❌ SENDGRID_API_KEY not found in environment!');
  process.exit(1);
}

if (!process.env.SENDGRID_FROM_EMAIL) {
  console.error('\n❌ SENDGRID_FROM_EMAIL not found in environment!');
  process.exit(1);
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const testEmail = process.argv[2] || 'test@example.com';

const msg = {
  to: testEmail,
  from: process.env.SENDGRID_FROM_EMAIL,
  subject: 'Test Email from bvodo - SendGrid Test',
  html: `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h1 style="color: #3b82f6;">Test Email from bvodo</h1>
      <p>This is a test email sent directly from Node.js script.</p>
      <p><strong>Time:</strong> ${new Date().toISOString()}</p>
      <p>If you received this, SendGrid is working correctly!</p>
    </div>
  `,
  text: `Test Email from bvodo\n\nThis is a test email sent directly from Node.js script.\nTime: ${new Date().toISOString()}\n\nIf you received this, SendGrid is working correctly!`,
};

console.log('\n📧 Attempting to send test email...');
console.log('To:', testEmail);
console.log('From:', process.env.SENDGRID_FROM_EMAIL);
console.log('Subject:', msg.subject);

sgMail
  .send(msg)
  .then(() => {
    console.log('\n✅ SUCCESS! Email sent successfully!');
    console.log('Check your inbox (and spam folder) at:', testEmail);
  })
  .catch((error) => {
    console.error('\n❌ ERROR sending email:');
    console.error('Message:', error.message);
    console.error('Code:', error.code);

    if (error.response) {
      console.error('\nSendGrid Response:');
      console.error(JSON.stringify(error.response.body, null, 2));
    }
  });
