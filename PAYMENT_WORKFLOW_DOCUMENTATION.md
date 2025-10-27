# Payment Workflow Documentation

## Overview

This document explains the two payment methods available in the Bvodo corporate travel booking system and their respective workflows, approval processes, and auto-confirmation mechanisms.

---

## Payment Methods

### 1. Bvodo Credits (Balance Payment)
- Uses organization's prepaid credit balance
- Requires manual approval from designated approver
- Duffel order created AFTER approval
- Suitable for controlled company spending

### 2. Stripe Credit Card
- User pays with personal credit card
- Auto-approved after successful payment
- Duffel order created automatically via webhook
- No manual approval needed (user's own money)

---

## Workflow Diagrams

### Balance/Credit Payment Flow

```
┌─────────────────────────────────────────────────┐
│ 1. USER BOOKS FLIGHT                            │
│    - Selects flight                             │
│    - Enters passenger details                   │
│    - Chooses "Pay with Bvodo Credits"           │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│ 2. PRE-FLIGHT VALIDATION                        │
│    ✓ Validate Duffel offer still available     │
│    ✓ Validate passport expiry dates (if any)   │
│    ✓ Check organization credit balance          │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│ 3. BOOKING CREATED                              │
│    Status: "pending_approval"                   │
│    Approval needed: YES                         │
│    Credits deducted: NO (not yet)               │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│ 4. NOTIFICATION SENT                            │
│    → Email to approver                          │
│    → Dashboard notification                     │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│ 5. APPROVER REVIEWS                             │
│    → Views booking details                      │
│    → Reviews passenger info, price              │
│    → Makes decision                             │
└─────────────────┬───────────────────────────────┘
                  │
         ┌────────┴────────┐
         │                 │
         ▼                 ▼
    APPROVED           REJECTED
         │                 │
         │                 └──► Status: "rejected"
         │                      End of workflow
         │
         ▼
┌─────────────────────────────────────────────────┐
│ 6. APPROVAL GRANTED                             │
│    Status: "approved"                           │
│    Approved by: [Approver Name]                 │
│    Approved at: [Timestamp]                     │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│ 7. CREATE DUFFEL ORDER                          │
│    ✓ Validate offer still available            │
│    ✓ Create booking with airline               │
│    ✓ Receive PNR (confirmation number)         │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│ 8. DEDUCT CREDITS                               │
│    ✓ Deduct from organization balance          │
│    ✓ Record transaction                         │
│    ✓ Update booking status                      │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│ 9. BOOKING CONFIRMED                            │
│    Status: "confirmed"                          │
│    PNR: [Airline confirmation]                  │
│    Confirmed at: [Timestamp]                    │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│ 10. CONFIRMATION EMAIL                          │
│     → Sent to traveler                          │
│     → Sent to booker                            │
│     → Includes PNR, flight details              │
└─────────────────────────────────────────────────┘
```

---

### Stripe Credit Card Payment Flow

```
┌─────────────────────────────────────────────────┐
│ 1. USER BOOKS FLIGHT                            │
│    - Selects flight                             │
│    - Enters passenger details                   │
│    - Chooses "Pay with Credit Card"             │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│ 2. PRE-FLIGHT VALIDATION                        │
│    ✓ Validate Duffel offer still available     │
│    ✓ Validate passport expiry dates (if any)   │
│    ⚠️ CRITICAL: Prevents payment for invalid    │
│       offers or expired passports               │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│ 3. BOOKING CREATED                              │
│    Status: "pending"                            │
│    Approval needed: NO                          │
│    Payment status: "pending"                    │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│ 4. STRIPE CHECKOUT SESSION                      │
│    ✓ Create Stripe checkout session            │
│    ✓ Store session ID with booking             │
│    ✓ Redirect user to Stripe                    │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│ 5. USER PAYS                                    │
│    → Enter credit card details                  │
│    → Stripe processes payment                   │
│    → Payment intent created                     │
└─────────────────┬───────────────────────────────┘
                  │
         ┌────────┴────────┐
         │                 │
         ▼                 ▼
     SUCCESS           CANCELLED/FAILED
         │                 │
         │                 └──► Payment status: "failed"
         │                      User notified, no charge
         │
         ▼
┌─────────────────────────────────────────────────┐
│ 6. STRIPE WEBHOOK (Automatic)                   │
│    Event: "checkout.session.completed"          │
│    → Triggered by Stripe                        │
│    → Received by backend                        │
│    → Signature verified                         │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│ 7. AUTO-APPROVE BOOKING                         │
│    Status: "approved" (auto)                    │
│    Payment status: "completed"                  │
│    Payment method: "card"                       │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│ 8. CREATE DUFFEL ORDER (Automatic)              │
│    ✓ Validate offer still available            │
│    ✓ Create booking with airline               │
│    ✓ Receive PNR (confirmation number)         │
│    ✓ Use 'balance' payment type (prepaid)      │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│ 9. BOOKING CONFIRMED (Automatic)                │
│    Status: "confirmed"                          │
│    PNR: [Airline confirmation]                  │
│    Confirmed at: [Timestamp]                    │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│ 10. CONFIRMATION EMAIL (Automatic)              │
│     → Sent to traveler                          │
│     → Sent to booker                            │
│     → Includes PNR, flight details              │
└─────────────────────────────────────────────────┘
```

---

## Technical Implementation

### Pre-Flight Validation

**Location**: `backend/src/controllers/booking.controller.ts` (Lines 909-962)

**Purpose**: Prevent payment collection when booking will fail

**Validations**:

1. **Offer Availability** (Lines 916-936)
   ```typescript
   await duffelService.getOfferDetails(offerId);
   ```
   - Checks if offer is still available
   - Validates offer hasn't expired
   - Prevents "offer already booked" errors
   - Deletes booking and returns error if invalid

2. **Passport Expiry** (Lines 938-962)
   ```typescript
   const tripReturnDate = returnDate ? new Date(returnDate) : new Date(departureDate);
   tripReturnDate.setDate(tripReturnDate.getDate() + 7); // 7-day buffer

   if (expiryDate <= tripReturnDate) {
     // Reject and show error
   }
   ```
   - Ensures passport valid for 7+ days after return
   - Only validates if passport details provided
   - Prevents Duffel rejection after payment

**Error Handling**:
- Booking deleted if validation fails
- Clear error message shown to user
- No payment collected

---

### Stripe Webhook Handler

**Location**: `backend/src/controllers/payment.controller.ts` (Lines 103-346)

**Webhook Events Handled**:

1. **`checkout.session.completed`** (Lines 119-120)
   - Payment successful
   - Triggers auto-confirmation flow
   - Creates Duffel order
   - Sends confirmation email

2. **`checkout.session.expired`** (Lines 123-124)
   - Payment session timed out
   - Updates booking status to failed
   - No charge to customer

3. **`payment_intent.payment_failed`** (Lines 131-132)
   - Payment declined or failed
   - Updates booking with failure reason

**Auto-Confirmation Logic** (Lines 149-346):

```typescript
// 1. Update booking to approved + completed
await prisma.booking.update({
  data: {
    paymentStatus: 'completed',
    status: 'approved',  // Auto-approve card payments
    approvedAt: new Date(),
    bookingData: {
      ...bookingData,
      paymentMethod: 'card',
    },
  },
});

// 2. Create Duffel order
const duffelOrder = await duffelService.createBooking({
  offerId: offerId,
  passengers: passengerDetails,
  contactEmail,
  contactPhone,
  services: services,
});

// 3. Update with PNR
await prisma.booking.update({
  data: {
    providerOrderId: duffelOrder.bookingReference,
    status: 'confirmed',
    confirmedAt: new Date(),
  },
});

// 4. Send confirmation email
await emailService.sendBookingConfirmation({...});
```

---

### Balance Payment Approval

**Location**: `backend/src/controllers/booking.controller.ts` (Lines 684-856)

**When Triggered**: Only for bookings that don't require approval (auto-approved)

**Logic**:
```typescript
if (!requiresApproval && paymentMethod === 'credit') {
  // Create Duffel order BEFORE deducting credits
  const duffelOrder = await duffelService.createBooking({...});

  // Deduct credits ONLY if Duffel succeeded
  await deductCredits(userId, organizationId, bookingCost);

  // Update booking with PNR
  await prisma.booking.update({
    data: {
      providerOrderId: duffelOrder.bookingReference,
      status: 'confirmed',
    },
  });
}
```

**Manual Approval Flow**: `backend/src/controllers/booking.controller.ts` (Lines 1414-1577)

---

## Database Schema

### Booking Status States

| Status | Description | Next State |
|--------|-------------|------------|
| `pending` | Initial state for card payments | `approved` (via webhook) |
| `pending_approval` | Waiting for approver action | `approved` or `rejected` |
| `approved` | Approved but not yet confirmed | `confirmed` (after Duffel) |
| `confirmed` | Flight booked with airline (has PNR) | `completed` |
| `rejected` | Approver rejected | N/A (end state) |
| `failed` | Booking or payment failed | N/A (end state) |
| `cancelled` | User or admin cancelled | N/A (end state) |

### Payment Status States

| Payment Status | Description |
|----------------|-------------|
| `pending` | Payment not yet completed |
| `completed` | Payment received successfully |
| `failed` | Payment attempt failed |
| `refunded` | Payment refunded to customer |

---

## Environment Variables

### Required for Stripe Integration

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...          # Stripe API secret key
STRIPE_WEBHOOK_SECRET=whsec_...        # Webhook signing secret

# Frontend URL (for redirects)
FRONTEND_URL=http://localhost:3000
```

### Required for Duffel Integration

```bash
# Duffel Configuration
DUFFEL_ACCESS_TOKEN=duffel_test_...    # Duffel API token
DUFFEL_ENVIRONMENT=test                # 'test' or 'production'
```

---

## Testing Instructions

### Test Balance Payment (With Approval)

1. **Login as regular user** (not admin)
2. **Search for flights**
   - Enter origin, destination, dates
   - Select passengers
3. **Select a flight**
4. **Enter passenger details**
   - First name, last name, email, phone, DOB
   - **Leave passport blank** (optional for testing)
5. **Select "Pay with Bvodo Credits"**
6. **Booking created** → Status: `pending_approval`
7. **Login as approver/admin**
8. **Navigate to Approvals page**
9. **Click "Approve"**
10. **Verify**:
    - ✅ Status → `confirmed`
    - ✅ PNR generated
    - ✅ Confirmation email sent
    - ✅ Credits deducted

---

### Test Stripe Payment (Auto-Confirm)

1. **Login as any user**
2. **Search for NEW flights** (always fresh search)
3. **Select a flight**
4. **Enter passenger details**
   - First name, last name, email, phone, DOB
   - **Leave passport blank** OR use expiry `2030-12-31`
5. **Select "Pay with Credit Card"**
6. **Pre-flight validation** runs:
   - ✅ Offer validated
   - ✅ Passport validated
7. **Redirected to Stripe**
8. **Enter test card**: `4242 4242 4242 4242`
   - Any future expiry date
   - Any 3-digit CVC
9. **Complete payment**
10. **Redirected back to booking page**
11. **Webhook fires automatically** (within 5 seconds)
12. **Verify**:
    - ✅ Status → `confirmed`
    - ✅ Payment status → `completed`
    - ✅ PNR generated
    - ✅ Confirmation email sent

---

## Stripe Test Cards

| Card Number | Description |
|-------------|-------------|
| `4242 4242 4242 4242` | Visa - Success |
| `4000 0025 0000 3155` | Visa - Requires authentication (3D Secure) |
| `4000 0000 0000 9995` | Visa - Declined (insufficient funds) |

Use any future expiry date and any 3-digit CVC.

---

## Webhook Setup

### Local Development

**Option 1: Stripe CLI (Recommended)**
```bash
stripe listen --forward-to localhost:5000/api/v1/payments/webhook
```

**Option 2: Manual Verification**
- Use `/api/v1/payments/verify` endpoint
- Frontend automatically calls this after payment
- Simulates webhook for testing

### Production

1. **Configure webhook in Stripe Dashboard**
   - URL: `https://yourdomain.com/api/v1/payments/webhook`
   - Events to send: `checkout.session.completed`, `checkout.session.expired`, `payment_intent.payment_failed`

2. **Add webhook secret to environment**
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_prod_...
   ```

---

## Error Handling

### Critical Error: Payment Collected, Duffel Failed

**Scenario**: Stripe payment succeeds but Duffel order creation fails

**Current Handling** (Lines 318-341):
```typescript
// Payment was successful, so booking stays as "approved"
// Admin must manually create the booking or issue refund
await prisma.booking.update({
  data: {
    notes: `⚠️ [URGENT - MANUAL REVIEW REQUIRED]
    Payment: COMPLETED ($${totalPrice})
    Duffel Booking: FAILED - ${error.message}

    ACTION REQUIRED:
    1. Review Offer ID
    2. Either manually rebook OR initiate refund
    3. Contact customer about delay`,
  },
});

logger.error(`⚠️⚠️⚠️ CRITICAL: Payment collected but flight NOT booked`);
```

**Admin Actions**:
1. Review error in booking notes
2. Check if offer still available
3. Option A: Manually create Duffel booking
4. Option B: Issue refund via Stripe
5. Contact customer

**Future Enhancement**: Auto-refund if offer expired

---

## Common Issues & Solutions

### Issue 1: "Offer Already Booked"

**Cause**: Attempting to book the same offer twice

**Solution**:
- Always perform fresh flight search
- Don't reuse search results
- Don't click "Book" multiple times

---

### Issue 2: Passport Expiry Error

**Cause**: Passport expires before/soon after return date

**Solutions**:
- **Option A**: Leave passport fields blank (optional)
- **Option B**: Use far future date (e.g., `2030-12-31`)
- **Fix**: Ensure passport valid 7+ days after return

---

### Issue 3: Webhook Not Firing

**Cause**: Stripe webhook not configured or unreachable

**Solutions**:
- **Local**: Use Stripe CLI or `/verify` endpoint
- **Production**: Check webhook logs in Stripe Dashboard
- **Verify**: Webhook signature and endpoint URL

---

### Issue 4: Balance Payment Not Creating Duffel Order

**Cause**: Expected behavior - requires manual approval first

**Solution**:
- Login as approver
- Navigate to Approvals page
- Click "Approve" button
- Duffel order created automatically after approval

---

## API Endpoints

### Payment Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/payments/checkout` | Create Stripe checkout session | Required |
| POST | `/api/v1/payments/webhook` | Stripe webhook handler | Public (signature verified) |
| POST | `/api/v1/payments/verify` | Manual payment verification | Required |
| GET | `/api/v1/payments/status/:bookingReference` | Get payment status | Required |

### Booking Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/bookings` | Create booking | Required |
| POST | `/api/v1/bookings/:id/approve` | Approve booking | Admin/Approver |
| POST | `/api/v1/bookings/:id/reject` | Reject booking | Admin/Approver |
| GET | `/api/v1/bookings/:id` | Get booking details | Required |

---

## Security Considerations

### Stripe Webhook Verification

**Critical**: Always verify webhook signature
```typescript
const event = stripeService.verifyWebhookSignature(payload, signature);
```

**Why**: Prevents malicious webhook spoofing

---

### Pre-Flight Validation

**Critical**: Validate BEFORE payment
```typescript
// 1. Validate offer
await duffelService.getOfferDetails(offerId);

// 2. Validate passport
validatePassportExpiry(passengers, returnDate);

// 3. THEN create checkout session
const session = await stripeService.createCheckoutSession({...});
```

**Why**: Prevents charging customers for failed bookings

---

### Idempotency

**Stripe**: Natural idempotency via `checkout_session_id`
- Same session can't be processed twice
- Webhook may fire multiple times (handled safely)

**Duffel**: Offer-based idempotency
- Each offer can only be booked once
- Prevents duplicate bookings

---

## Monitoring & Logging

### Log Levels

| Level | Use Case | Example |
|-------|----------|---------|
| `info` | Normal operations | Payment completed, booking confirmed |
| `warn` | Recoverable issues | Missing optional fields, retries |
| `error` | Failures | Duffel errors, payment failures |

### Critical Logs to Monitor

```bash
# Payment collected but Duffel failed
[Payment] ⚠️⚠️⚠️ CRITICAL: Payment collected but flight NOT booked

# Pre-flight validation failures
[Booking] ❌ Offer validation failed
[Booking] ❌ Passport expiry validation failed

# Webhook errors
[Payment] Webhook error: [details]
```

---

## Rollback Procedures

### If Stripe Payment Succeeds but Duffel Fails

**Immediate Actions**:
1. Check booking notes for error details
2. Verify customer payment in Stripe
3. Check if offer still available in Duffel

**Resolution Paths**:

**Path A: Offer Still Available**
1. Manually create Duffel order via dashboard
2. Update booking with PNR
3. Send confirmation email to customer

**Path B: Offer Expired**
1. Issue full refund via Stripe
2. Update booking status to `cancelled`
3. Contact customer with alternatives
4. Offer search for new flights

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-10-26 | Initial documentation |
| 1.1 | 2025-10-26 | Added pre-flight validation |
| 1.2 | 2025-10-26 | Added frequent flyer number feature |
| 1.3 | 2025-10-26 | Restored manual approval for balance payments |

---

## Support & Troubleshooting

### Debug Checklist

**Stripe Payment Not Auto-Confirming**:
- [ ] Check webhook is configured
- [ ] Verify webhook secret in environment
- [ ] Check backend logs for webhook errors
- [ ] Verify offer is still available
- [ ] Check passport expiry validation

**Balance Payment Not Creating Duffel Order**:
- [ ] Verify booking requires approval
- [ ] Check if approval has been granted
- [ ] Verify organization has sufficient credits
- [ ] Check Duffel offer is still valid

**Email Not Sending**:
- [ ] Check email service credentials
- [ ] Verify SMTP configuration
- [ ] Check email logs for errors

---

## Contact

For technical support or questions:
- GitHub Issues: [repository]/issues
- Documentation: This file
- Backend Logs: `backend/logs/`

---

**Last Updated**: October 26, 2025
**Maintained By**: Development Team
