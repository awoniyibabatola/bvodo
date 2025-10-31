# Email Invitation Troubleshooting Guide

## Issue: Invitation Emails Not Sending

### Problem
When inviting users to the platform, the invitation is created in the database but the email is not being sent to the invited user.

---

## Root Cause

The `sendEmail` function silently fails and returns `false` when SendGrid is misconfigured, but the invitation controller wasn't checking this return value. This caused invitations to appear successful even though emails weren't sent.

---

## What Was Fixed

### 1. Controller Now Checks Email Status
**File:** `backend/src/controllers/company-admin.controller.ts`

**Before:**
```typescript
await sendTeamInvitationEmail(...);

return res.status(201).json({
  success: true,
  message: 'User invitation created successfully',
  ...
});
```

**After:**
```typescript
const emailSent = await sendTeamInvitationEmail(...);

if (!emailSent) {
  logger.warn(`Invitation email failed to send to ${email}`);
}

return res.status(201).json({
  success: true,
  message: emailSent
    ? 'User invitation created successfully and email sent'
    : 'User invitation created but email failed to send. Please share the invitation link manually.',
  emailSent,  // ← New field in response
  data: {
    ...
    invitationLink,  // ← Can share manually if email fails
  },
});
```

**Benefits:**
- API now returns `emailSent: true/false` so frontend knows if email was sent
- Logs a warning when email fails
- Returns invitation link for manual sharing
- Clearer success/failure messaging

---

## How to Diagnose Email Issues

### Step 1: Run the Test Script

```bash
cd backend
npx ts-node test-invitation-email.ts
```

**Update the test email first:**
```typescript
const testEmail = 'your-email@example.com'; // ← Change this
```

### Step 2: Check the Output

The script will show:
- ✓ Which environment variables are present
- ✓ Whether SendGrid config is loaded
- ✓ Whether email sent successfully
- ✓ Detailed error messages if it failed

### Step 3: Common Issues & Solutions

#### Issue 1: "From" Email Not Verified

**Error:**
```
Sender address not verified
```

**Solution:**
1. Go to https://app.sendgrid.com/settings/sender_auth/senders
2. Click "Verify a Single Sender"
3. Add `noreply@bvodo.com` (or your custom domain email)
4. Check your inbox and click the verification link
5. Wait a few minutes for verification to complete

**Alternative (Use Domain Authentication - Recommended):**
1. Go to https://app.sendgrid.com/settings/sender_auth/domains
2. Add your domain (e.g., `bvodo.com`)
3. Add the DNS records to your domain registrar
4. Verify domain authentication
5. Now you can send from any `@bvodo.com` email

---

#### Issue 2: Invalid API Key

**Error:**
```
Unauthorized / API key is invalid
```

**Solution:**
1. Go to https://app.sendgrid.com/settings/api_keys
2. Create a new API key with "Full Access" or "Mail Send" permission
3. Copy the API key (you can only see it once!)
4. Update your `.env` file:
   ```env
   SENDGRID_API_KEY=SG.your-new-api-key-here
   ```
5. Restart your backend server

---

#### Issue 3: SendGrid Account Suspended

**Error:**
```
Account suspended
```

**Solution:**
1. Check your SendGrid account status
2. May need to verify identity or add payment method
3. Contact SendGrid support if account is locked
4. Free tier has limits (100 emails/day)

---

#### Issue 4: Missing Environment Variables

**Error:**
```
SendGrid not configured. Email not sent
```

**Solution:**
Check your `.env` file has these variables:
```env
SENDGRID_API_KEY=SG.your-api-key
SENDGRID_FROM_EMAIL=noreply@bvodo.com
SENDGRID_FROM_NAME=bvodo Corporate Travels
FRONTEND_URL=https://your-domain.com  # or http://localhost:3000 for dev
```

**Verify they're loaded:**
```bash
cd backend
node -e "require('dotenv').config(); console.log('API Key:', process.env.SENDGRID_API_KEY ? 'Present' : 'Missing')"
```

---

#### Issue 5: Email in Spam Folder

**Not an error, but user doesn't receive email**

**Solution:**
1. Check spam/junk folder
2. Add SendGrid SPF/DKIM records to your domain
3. Use domain authentication instead of single sender verification
4. Warm up your sending domain gradually (don't send 1000s immediately)

---

## SendGrid Best Practices

### 1. Use Domain Authentication
Instead of verifying individual senders, verify your entire domain:
- Better deliverability
- Looks more professional
- Can send from any `@yourdomain.com` email

### 2. Monitor Your Sender Reputation
- Check SendGrid dashboard for bounces/spam reports
- Keep bounce rate < 5%
- Keep spam complaint rate < 0.1%

### 3. Use Templates (Optional)
Instead of hardcoding HTML in code, create templates in SendGrid:
- Easier to update
- Can be edited by non-developers
- Version control

### 4. Set Up Webhooks (Future Enhancement)
Track email events:
- Delivered
- Opened
- Clicked
- Bounced
- Spam reported

---

## Testing Checklist

Before deploying to production:

- [ ] SendGrid API key is valid
- [ ] "From" email is verified OR domain is authenticated
- [ ] Test email sends successfully
- [ ] Email arrives in inbox (not spam)
- [ ] Links in email work correctly
- [ ] Email displays correctly on mobile
- [ ] Unsubscribe link works (if applicable)

---

## Monitoring Email Delivery

### Backend Logs
Check your logs for these messages:

**Success:**
```
✅ Email sent successfully to user@example.com: You're invited to join...
```

**Failure:**
```
❌ Error sending email: Sender address not verified
⚠️  Invitation email failed to send to user@example.com
```

### SendGrid Dashboard
https://app.sendgrid.com/stats

Check:
- Delivery rate
- Bounce rate
- Spam reports
- Recent activity

---

## Alternative: Use Different Email Service

If SendGrid doesn't work, you can switch to:

### AWS SES (Amazon Simple Email Service)
- Very cheap ($0.10 per 1000 emails)
- Requires domain verification
- Good for high volume

### Mailgun
- Similar to SendGrid
- Good documentation
- Generous free tier

### Resend
- Modern, developer-friendly
- Great DX
- Easy setup

### Gmail SMTP (Development Only)
- Quick for testing
- Not reliable for production
- Rate limited

---

## Frontend Handling

### Display Email Status to Admin

When inviting a user, check the `emailSent` field:

```typescript
const response = await fetch('/api/admin/invite', {
  method: 'POST',
  body: JSON.stringify({ email, firstName, lastName }),
});

const data = await response.json();

if (data.success) {
  if (data.emailSent) {
    toast.success('Invitation sent! Email delivered.');
  } else {
    toast.warning(
      'User created, but email failed to send. ' +
      'Please share this link manually: ' + data.data.invitationLink,
      { duration: 10000 }
    );
  }
}
```

---

## Support

If you're still having issues:

1. Check SendGrid status: https://status.sendgrid.com/
2. Review SendGrid docs: https://docs.sendgrid.com/
3. Contact SendGrid support: https://support.sendgrid.com/
4. Check backend logs for detailed errors

---

## Summary

**Quick Fix:**
1. Verify `noreply@bvodo.com` in SendGrid
2. Or use domain authentication for `bvodo.com`
3. Run the test script to confirm
4. Restart backend server

**Code Changes:**
- Controller now checks if email was sent
- Returns `emailSent` status in API response
- Logs warnings for failed emails
- Provides invitation link for manual sharing

---

**Last Updated:** 2025-10-30
**Status:** Fixed - Emails now properly tracked
