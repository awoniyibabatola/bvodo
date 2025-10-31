import { sendTeamInvitationEmail } from './src/utils/email.service';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testInvitationEmail() {
  console.log('\n🧪 Testing Invitation Email...\n');

  console.log('Environment Variables:');
  console.log('- SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? '✓ Present' : '✗ Missing');
  console.log('- SENDGRID_FROM_EMAIL:', process.env.SENDGRID_FROM_EMAIL || '✗ Missing');
  console.log('- SENDGRID_FROM_NAME:', process.env.SENDGRID_FROM_NAME || '(not set)');
  console.log('- FRONTEND_URL:', process.env.FRONTEND_URL || '(not set)');
  console.log('');

  const testEmail = 'your-email@example.com'; // Replace with your email
  const firstName = 'Test';
  const lastName = 'User';
  const organizationName = 'Test Company';
  const inviterName = 'Admin User';
  const role = 'traveler';
  const creditLimit = 1000;
  const invitationToken = 'test-token-123';

  console.log(`📧 Attempting to send test invitation email to: ${testEmail}\n`);

  try {
    const result = await sendTeamInvitationEmail(
      testEmail,
      firstName,
      lastName,
      organizationName,
      inviterName,
      role,
      creditLimit,
      invitationToken
    );

    if (result) {
      console.log('\n✅ SUCCESS: Email sent successfully!');
      console.log('   Check your inbox at:', testEmail);
    } else {
      console.log('\n❌ FAILED: Email was not sent');
      console.log('\n💡 Common issues:');
      console.log('   1. SendGrid API key is invalid or expired');
      console.log('   2. From email (noreply@bvodo.com) is not verified in SendGrid');
      console.log('   3. SendGrid account suspended or out of credits');
      console.log('   4. Environment variables not loaded correctly');
      console.log('\n📋 Next steps:');
      console.log('   1. Go to https://app.sendgrid.com/settings/sender_auth/senders');
      console.log('   2. Verify that noreply@bvodo.com is verified');
      console.log('   3. Check your SendGrid API key at https://app.sendgrid.com/settings/api_keys');
      console.log('   4. Make sure you have sending credits available');
    }
  } catch (error: any) {
    console.log('\n💥 ERROR:', error.message);
    if (error.response?.body) {
      console.log('\n📋 SendGrid Error Details:');
      console.log(JSON.stringify(error.response.body, null, 2));
    }
  }
}

testInvitationEmail()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Script error:', error);
    process.exit(1);
  });
