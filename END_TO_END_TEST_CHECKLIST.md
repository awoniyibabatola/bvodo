# End-to-End Test Checklist

## System Status
- **Backend**: Running on port 5000
- **Frontend**: Running on port 3000
- **Compilation**: All pages compiled successfully
- **Date**: 2025-10-26

---

## Test 1: Frequent Flyer Number Feature

### Objective
Verify that frequent flyer numbers are captured, stored, and sent to Duffel API.

### Steps
1. Navigate to: http://localhost:3000/dashboard/flights/search
2. Search for a flight (e.g., JFK to LAX)
3. Select a flight and click "Book Now"
4. Fill in passenger details:
   - First Name: John
   - Last Name: Doe
   - Email: john.doe@example.com
   - Phone: +1234567890
   - Date of Birth: 1990-01-01
   - Gender: Male
   - **Frequent Flyer Number: AA123456789** ← Test this field
5. Leave passport fields blank (optional)
6. Proceed to payment

### Expected Results
- ✅ Frequent flyer field appears in the form
- ✅ Field has placeholder text: "e.g., AA123456789"
- ✅ Help text shows: "Enter your airline loyalty program number"
- ✅ Value is saved in booking data
- ✅ When booking creates Duffel order, number is sent in `loyalty_programme_accounts` array

### Verification
Check browser console or network tab for:
- Booking creation payload should include `frequentFlyerNumber: "AA123456789"`
- Duffel API call should include:
  ```json
  "loyalty_programme_accounts": [
    {
      "airline_iata_code": "AA",
      "account_number": "AA123456789"
    }
  ]
  ```

---

## Test 2: Balance Payment Flow (Manual Approval)

### Objective
Verify that bookings paid with Bvodo Credits require manual approval before creating Duffel order.

### Prerequisites
- User must have sufficient Bvodo Credits balance
- Organization approval threshold settings configured

### Steps
1. Search and select a flight
2. Fill in passenger details (can skip passport fields)
3. Select payment method: **Bvodo Credits**
4. Complete booking

### Expected Results - Part A: After Booking Creation
- ✅ Booking status: `pending_approval`
- ✅ Payment status: `pending`
- ✅ No Duffel order created yet
- ✅ No PNR generated yet
- ✅ Credits NOT deducted yet
- ✅ Booking appears in "Approvals" page for approvers

### Steps - Part B: Manager Approval
5. Login as Company Admin or Manager
6. Navigate to: http://localhost:3000/dashboard/approvals
7. Find the booking
8. Click "Approve" button

### Expected Results - Part B: After Manager Approval
- ✅ Booking status changes to: `approved`
- ✅ Notification sent to Super Admin
- ✅ Booking appears in Super Admin's approval queue

### Steps - Part C: Super Admin Confirmation
9. Login as Super Admin
10. Navigate to: http://localhost:3000/dashboard/approvals
11. Find the approved booking
12. Click "Confirm" button

### Expected Results - Part C: After Super Admin Confirmation
- ✅ Duffel order created automatically
- ✅ PNR received from airline
- ✅ Booking status: `confirmed`
- ✅ Payment status: `completed`
- ✅ Credits deducted from user balance
- ✅ Confirmation email sent to passenger
- ✅ Booking has `providerOrderId` and `providerConfirmationNumber`

### Critical Checks
- 🚨 Credits should NOT be deducted before confirmation
- 🚨 Duffel order should NOT be created before confirmation
- 🚨 No automatic confirmation should happen for balance payments

---

## Test 3: Stripe Payment Flow (Auto-Confirm)

### Objective
Verify that Stripe payments automatically confirm and create Duffel orders via webhook.

### Prerequisites
- Stripe test API keys configured
- Stripe webhook endpoint accessible

### Steps
1. Search and select a flight
2. Fill in passenger details:
   - Fill all required fields
   - **Leave passport fields BLANK** (they're optional)
3. Select payment method: **Credit/Debit Card**
4. Click "Proceed to Payment"

### Expected Results - Part A: Pre-Flight Validation
- ✅ System validates Duffel offer is still available
- ✅ System validates passport expiry (if provided)
- ✅ If validation fails:
  - Booking is deleted
  - Error message shown
  - User NOT redirected to Stripe
  - NO payment collected

### Steps - Part B: Stripe Payment
5. Complete Stripe checkout (use test card: 4242 4242 4242 4242)
6. Wait for redirect back to confirmation page

### Expected Results - Part B: After Successful Payment
- ✅ Stripe webhook fires: `checkout.session.completed`
- ✅ Booking status automatically changed to: `approved`
- ✅ Duffel order created automatically (no manual approval needed)
- ✅ PNR received from airline
- ✅ Booking status: `confirmed`
- ✅ Payment status: `completed`
- ✅ Confirmation email sent
- ✅ All happens within seconds (automated)

### Critical Checks
- 🚨 No manual approval step for card payments
- 🚨 Duffel order created automatically after payment
- 🚨 If Duffel creation fails, error is logged but payment is captured
- 🚨 User should see confirmation page with PNR

### Backend Verification
Check backend console logs for:
```
[Payment] ✅ Checkout session completed for booking: BK...
[Payment] ✅ Duffel order created successfully
[Payment] ✅ Booking confirmed with PNR: ABC123
```

---

## Test 4: Pre-Flight Validation (Offer Expiry)

### Objective
Verify that expired offers are rejected BEFORE payment collection.

### Steps
1. Search for flights
2. Select a flight
3. Fill in passenger details
4. **Wait 20 minutes** (Duffel offers typically expire in 15-20 minutes)
5. Try to proceed to payment

### Expected Results
- ✅ System validates offer before Stripe checkout
- ✅ Error message: "This flight offer has expired. Please search for flights again..."
- ✅ Booking is deleted
- ✅ User NOT redirected to Stripe
- ✅ NO payment collected
- ✅ User returned to search page

### Critical Check
- 🚨 User should NEVER be charged for expired offers

---

## Test 5: Pre-Flight Validation (Passport Expiry)

### Objective
Verify that invalid passport expiry dates are rejected BEFORE payment.

### Steps
1. Search for a round-trip flight (Departure: 2025-11-01, Return: 2025-11-10)
2. Select a flight
3. Fill in passenger details:
   - First Name: Jane
   - Last Name: Smith
   - Email: jane@example.com
   - **Passport Number: AB123456**
   - **Passport Expiry: 2025-11-12** ← This is too close (only 2 days after return)
   - Passport Country: USA
4. Try to proceed to payment

### Expected Results
- ✅ System validates passport expiry before Stripe checkout
- ✅ Error message: "Passport for Jane Smith expires 2025-11-12, which is too soon. Passport must be valid for at least 7 days after your return date..."
- ✅ Booking is deleted
- ✅ User NOT redirected to Stripe
- ✅ NO payment collected

### Test with Valid Passport
5. Repeat with **Passport Expiry: 2026-01-01** (far in future)
6. Should proceed to payment successfully

### Critical Check
- 🚨 System requires 7+ days validity after return date
- 🚨 User can leave passport blank if not required

---

## Test 6: UI/UX Verification

### Objective
Verify layout improvements and responsive design.

### Test 6A: Flight Results Width
1. Navigate to: http://localhost:3000/dashboard/flights/search
2. Search for flights
3. Check layout on different screen sizes

### Expected Results
- ✅ Desktop (1280px+): Sidebar ~220px, flight cards ~1100px wide
- ✅ Desktop (1536px+): Flight cards ~1220px wide
- ✅ Tablet: Sidebar hidden, full width for results
- ✅ Mobile: Single column, full width
- ✅ Flight cards display all information clearly

### Test 6B: Sidebar Filters
1. Open sidebar filters on desktop
2. Try different filter combinations:
   - Price range slider
   - Airlines checkboxes
   - Stops (non-stop, 1 stop, 2+ stops)
   - Departure time ranges

### Expected Results
- ✅ Filters apply to results immediately
- ✅ Result count updates
- ✅ "Clear All Filters" resets everything
- ✅ Filters are responsive and usable

### Test 6C: Passenger Details Form
1. Start booking a flight
2. Check the passenger form layout

### Expected Results
- ✅ All fields properly aligned
- ✅ Frequent flyer field appears after gender
- ✅ Help text is clear
- ✅ Form is responsive on mobile
- ✅ Multi-passenger forms display correctly

---

## Test 7: Complete Booking Journey (Happy Path)

### Objective
Complete a full booking from search to confirmation.

### Steps
1. **Search**: JFK → LAX, Departure: Next week, 1 adult
2. **Select**: Choose a non-stop flight
3. **Passenger Details**:
   - First Name: Test
   - Last Name: User
   - Email: test@example.com
   - Phone: +1234567890
   - DOB: 1990-01-01
   - Gender: Male
   - Frequent Flyer: AA123456789
   - Leave passport fields blank
4. **Payment**: Select Stripe, complete checkout
5. **Confirmation**: Verify all details on confirmation page

### Expected Results
- ✅ Search results load within 5 seconds
- ✅ Booking creation successful
- ✅ Pre-flight validation passes
- ✅ Stripe checkout loads
- ✅ Payment processes successfully
- ✅ Webhook auto-confirms within 10 seconds
- ✅ Duffel order created
- ✅ PNR displayed on confirmation page
- ✅ Confirmation email received
- ✅ Booking visible in "My Bookings"

---

## Test 8: Error Handling

### Test 8A: Network Error During Payment
1. Start booking process
2. Disconnect internet before clicking "Proceed to Payment"
3. Try to proceed

### Expected Results
- ✅ Clear error message displayed
- ✅ User can retry
- ✅ Booking remains in pending state

### Test 8B: Duffel API Error
1. Book a flight
2. If Duffel API returns error (e.g., no availability)

### Expected Results
- ✅ Error logged in backend
- ✅ User sees friendly error message
- ✅ Booking marked as failed
- ✅ Payment not collected (if validation happens before payment)
- ✅ Or refund initiated (if payment already collected)

---

## Browser Console Checks

### During Booking Creation
Open browser DevTools (F12) → Console tab

Look for:
- No JavaScript errors
- API calls returning 200/201 status codes
- No CORS errors
- No missing dependencies

### During Payment
- Stripe.js loaded successfully
- Checkout session created
- Redirect to Stripe happens smoothly
- Return redirect works correctly

---

## Database Verification (Optional)

If you have database access, verify:

### After Balance Payment (Before Approval)
```sql
SELECT id, status, paymentStatus, providerOrderId
FROM Booking
WHERE id = 'BK...'
```
Expected:
- status: `pending_approval`
- paymentStatus: `pending`
- providerOrderId: `null`

### After Stripe Payment
```sql
SELECT id, status, paymentStatus, providerOrderId, providerConfirmationNumber
FROM Booking
WHERE id = 'BK...'
```
Expected:
- status: `confirmed`
- paymentStatus: `completed`
- providerOrderId: Not null (Duffel order ID)
- providerConfirmationNumber: PNR (e.g., ABC123)

### Passenger Data
```sql
SELECT bookingData->>'passengerDetails'
FROM Booking
WHERE id = 'BK...'
```
Expected: JSON containing frequent flyer number

---

## Performance Checks

### Page Load Times
- Search page: < 2 seconds
- Search results: < 5 seconds
- Booking creation: < 3 seconds
- Payment redirect: < 2 seconds

### API Response Times
- Offer search: < 5 seconds
- Offer details: < 2 seconds
- Order creation: < 10 seconds

---

## Security Checks

### Stripe Webhook
1. Check backend logs for webhook signature verification
2. Verify only legitimate Stripe webhooks are processed

### Payment Data
1. No credit card numbers stored in database
2. No sensitive data in browser console
3. HTTPS used for all payment pages

---

## Critical Issues to Watch For

🚨 **MUST NOT HAPPEN**:
1. Payment collected but no Duffel order created
2. Credits deducted before admin confirmation (balance payments)
3. Stripe auto-confirm NOT working
4. Expired offers accepted for payment
5. Invalid passport expiry dates accepted
6. User charged multiple times for same booking

✅ **MUST HAPPEN**:
1. Pre-flight validation before payment
2. Webhook auto-confirms Stripe payments within seconds
3. Balance payments require manual approval
4. Clear error messages for all failure scenarios
5. Confirmation emails sent after successful bookings
6. PNR visible on confirmation page

---

## Test Result Summary

| Test | Pass/Fail | Notes |
|------|-----------|-------|
| 1. Frequent Flyer Number | ⬜ | |
| 2. Balance Payment (Manual) | ⬜ | |
| 3. Stripe Payment (Auto) | ⬜ | |
| 4. Offer Expiry Validation | ⬜ | |
| 5. Passport Validation | ⬜ | |
| 6. UI/UX Layout | ⬜ | |
| 7. Complete Journey | ⬜ | |
| 8. Error Handling | ⬜ | |

---

## Quick Test Commands

### Check Backend Logs
```bash
cd backend
tail -f backend.log | findstr "Payment\|Duffel\|Booking"
```

### Check Recent Bookings
```bash
cd backend
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.booking.findMany({ take: 5, orderBy: { createdAt: 'desc' } }).then(console.log).finally(() => prisma.$disconnect());"
```

### Kill and Restart Servers
```bash
# Backend
npx kill-port 5000
cd backend && npm run dev

# Frontend
npx kill-port 3000
cd frontend && npm run dev
```

---

## Contact for Issues

If any test fails:
1. Check browser console for errors
2. Check backend logs for detailed error messages
3. Verify environment variables are set correctly
4. Ensure Stripe webhook endpoint is accessible
5. Verify Duffel API credentials are valid

---

**Happy Testing! 🎉**
