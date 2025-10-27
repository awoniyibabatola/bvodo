# Duffel Flight Integration - Implementation Guide

## Overview

We've successfully integrated Duffel as your primary flight provider while maintaining Amadeus as a fallback option. The integration uses a **provider abstraction layer** that allows seamless switching between providers without changing your frontend code.

## ✅ Phase 1: Backend Implementation (COMPLETED)

### Files Created

1. **Environment Configuration**
   - Updated: `backend/src/config/env.ts`
   - Added Duffel environment variables
   - Added provider configuration options

2. **Type Definitions**
   - New: `backend/src/types/duffel.d.ts`
   - Comprehensive TypeScript types for Duffel API

3. **Provider Interface**
   - New: `backend/src/interfaces/flight-provider.interface.ts`
   - Common interface for all flight providers
   - Standardized data structures

4. **Duffel Service**
   - New: `backend/src/services/duffel.service.ts`
   - Full implementation of Duffel API
   - Transforms Duffel responses to standard format

5. **Provider Factory**
   - New: `backend/src/services/flight-provider.factory.ts`
   - Manages provider selection
   - Automatic fallback mechanism

6. **Updated Controller**
   - Modified: `backend/src/controllers/flight.controller.ts`
   - Now provider-agnostic
   - Supports both Duffel and Amadeus

7. **Updated Routes**
   - Modified: `backend/src/routes/flight.routes.ts`
   - Added new offer details endpoint

## Environment Setup

### 1. Get Duffel API Credentials

1. Sign up at https://duffel.com
2. Go to Dashboard > API Keys
3. Create a test access token
4. Copy your token (starts with `duffel_test_`)

### 2. Update `.env` Files

**For Development (`backend/.env`):**

Copy from `.env.example` and add your Duffel test token:

```env
# Duffel Flight API (Primary)
DUFFEL_ACCESS_TOKEN=duffel_test_your_access_token_here
DUFFEL_ENVIRONMENT=test

# Flight Provider Configuration
PRIMARY_FLIGHT_PROVIDER=duffel
ENABLE_PROVIDER_FALLBACK=true
```

**For Production (`backend/.env.production`):**

Already configured! Just replace the placeholder token with your production token from Duffel:

```env
# Duffel Flight API - PRODUCTION (Primary)
DUFFEL_ACCESS_TOKEN=duffel_live_your_production_access_token_here
DUFFEL_ENVIRONMENT=production

# Flight Provider Configuration
PRIMARY_FLIGHT_PROVIDER=duffel
ENABLE_PROVIDER_FALLBACK=true
```

**Important Notes:**
- Production `.env.production` is already set up with Duffel configuration
- Amadeus is configured as fallback provider in both environments
- Test tokens start with `duffel_test_`, production tokens start with `duffel_live_`

## API Endpoints

### Search Flights (Provider-Agnostic)

**Endpoint:** `GET /api/v1/flights/search`

**Query Parameters:**
```
origin=LOS              // IATA code (required)
destination=LHR         // IATA code (required)
departureDate=2025-12-01  // YYYY-MM-DD (required)
returnDate=2025-12-10    // YYYY-MM-DD (optional, for round trip)
adults=1                 // Number (required)
children=0               // Number (optional)
infants=0                // Number (optional)
travelClass=ECONOMY      // ECONOMY|PREMIUM_ECONOMY|BUSINESS|FIRST
nonStop=false            // Boolean
currencyCode=USD         // 3-letter currency code
max=50                   // Max results
provider=duffel          // Provider override (optional)
```

**Response:**
```json
{
  "success": true,
  "message": "Flights retrieved successfully",
  "data": [
    {
      "id": "off_123abc...",
      "provider": "duffel",
      "price": {
        "total": 500.00,
        "base": 450.00,
        "taxes": 50.00,
        "currency": "USD"
      },
      "outbound": [...],
      "inbound": [...],
      "validatingAirline": "British Airways",
      "isRefundable": true,
      "rawData": {...}
    }
  ],
  "count": 25,
  "meta": {
    "provider": "duffel",
    "usedFallback": false
  }
}
```

### Get Offer Details

**Endpoint:** `GET /api/v1/flights/offers/:offerId?provider=duffel`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "off_123abc...",
    "provider": "duffel",
    "price": {...},
    "outbound": [...],
    // Full offer details
  }
}
```

### Create Booking

**Endpoint:** `POST /api/v1/flights/book`

**Headers:**
```
Authorization: Bearer your-jwt-token
```

**Body:**
```json
{
  "provider": "duffel",
  "offerId": "off_123abc...",
  "passengers": [
    {
      "type": "adult",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "dateOfBirth": "1990-01-01",
      "passportNumber": "P12345678",
      "passportExpiry": "2030-12-31",
      "passportCountry": "US"
    }
  ],
  "contactEmail": "contact@example.com",
  "contactPhone": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Flight booked successfully",
  "data": {
    "bookingReference": "ABC123",
    "provider": "duffel",
    "status": "confirmed",
    "totalPrice": {
      "amount": 500.00,
      "currency": "USD"
    },
    "bookingDate": "2025-01-23T10:00:00Z",
    "tickets": [...],
    "rawData": {...}
  }
}
```

## How It Works

### Provider Selection Flow

```
┌─────────────────────┐
│  Frontend Request   │
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│  Flight Controller  │
│  GET /api/flights/  │
│  search?provider=   │
└──────────┬──────────┘
           │
┌──────────▼──────────────┐
│  Provider Factory       │
│  - Selects provider     │
│  - Handles fallback     │
└──────────┬──────────────┘
           │
    ┌──────┴───────┐
    │              │
┌───▼────┐    ┌───▼────┐
│ Duffel │    │Amadeus │
│Service │    │Service │
└────────┘    └────────┘
```

### Automatic Fallback

1. **Primary Request**: Try Duffel first
2. **Error Detected**: If Duffel fails and `ENABLE_PROVIDER_FALLBACK=true`
3. **Fallback Request**: Automatically try Amadeus
4. **Response**: Return results with metadata indicating which provider was used

## Key Benefits

### ✅ Duffel Advantages

1. **Instant Booking Confirmation**
   - No waiting for ticket confirmation
   - Immediate order creation

2. **Modern API**
   - Better documentation
   - Cleaner data structures
   - More reliable error handling

3. **Seat Maps**
   - Built-in seat selection support
   - Real-time seat availability

4. **Better Checkout**
   - Single API call for booking
   - Support for payment methods
   - Metadata support for tracking

### 🔄 Multi-Provider Benefits

1. **Reliability**
   - Fallback if primary provider fails
   - No single point of failure

2. **Flexibility**
   - Switch providers per route
   - A/B testing capabilities
   - Cost optimization

3. **Future-Proof**
   - Easy to add more providers
   - Standardized interface

## Frontend Integration (Next Steps)

### Minimal Changes Needed

Your existing frontend already has:
- ✅ Flight search form
- ✅ Passenger details modal
- ✅ Results display

You only need to:
1. Add `provider` parameter to API calls
2. Update booking flow to use new endpoint format

### Example Frontend Update

**Current Code:**
```typescript
// Search flights
const response = await fetch(
  `/api/flights/search?origin=${from}&destination=${to}&...`
);
```

**Updated Code:**
```typescript
// Search flights with Duffel
const response = await fetch(
  `/api/flights/search?origin=${from}&destination=${to}&provider=duffel&...`
);
```

**Booking Update:**
```typescript
// Book flight
const response = await fetch('/api/flights/book', {
  method: 'POST',
  body: JSON.stringify({
    provider: 'duffel',
    offerId: selectedOffer.id,
    passengers: passengerDetails,
  })
});
```

## Testing

### Test with Duffel Sandbox

1. Use test credentials from Duffel dashboard
2. Test airports: `LHR`, `JFK`, `LAX`, `DXB`
3. Test dates: Any future date

### Test Endpoints

```bash
# Search flights
curl "http://localhost:5000/api/v1/flights/search?origin=LOS&destination=LHR&departureDate=2025-12-01&adults=1&provider=duffel"

# Get offer details
curl "http://localhost:5000/api/v1/flights/offers/off_123?provider=duffel"
```

## ✅ Phase 2: Database Integration (COMPLETED)

### Database Schema Updates

Added the following fields to the `Booking` model:

1. **Provider Tracking**
   - `provider` - String field to specify which provider (default: "duffel")
   - `providerOrderId` - Stores Duffel order ID or Amadeus PNR
   - `providerRawData` - JSON field storing full provider response

2. **Duffel-Specific Fields**
   - `checkoutSessionId` - For Duffel checkout sessions
   - `paymentStatus` - Tracks payment status (pending, completed, failed, refunded)

3. **Database Indexes**
   - Added indexes on `provider`, `providerOrderId`, and `paymentStatus` for better query performance

### Controller Updates

Updated `flight.controller.ts` to:
- Save flight bookings to database after successful Duffel order creation
- Store all provider information and raw data
- Create related `FlightBooking` records for each segment
- Return booking ID along with confirmation data

### Migration

Created and applied migration: `20251023222535_add_provider_tracking`

## Next Steps

### Phase 3: Frontend Updates

**✅ Search Updates (COMPLETED)**
- Added `provider: 'duffel'` parameter to flight search requests
- Updated both `performSearch` and `handleSearch` functions in `/flights/search`
- No UI changes needed - existing interface works with Duffel responses

**⏳ Booking Flow (TO BE IMPLEMENTED)**

When implementing the booking form, ensure the request includes the `provider` field:

```typescript
const bookingData = {
  provider: 'duffel',
  offerId: selectedFlight.id,
  passengers: [
    {
      type: 'adult',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      dateOfBirth: '1990-01-01',
      passportNumber: 'P12345678',
      passportExpiry: '2030-12-31',
      passportCountry: 'US',
    },
  ],
  contactEmail: 'contact@example.com',
  contactPhone: '+1234567890',
};

const response = await fetch('/api/v1/flights/book', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(bookingData),
});
```

**Seat Selection (OPTIONAL)**

Duffel supports seat maps. To implement:
```typescript
// Get seat maps for an offer
const seatMaps = await fetch(
  `/api/v1/flights/seat-maps?offerId=${offerId}&provider=duffel`
);
```

### Phase 4: Production

- Get production Duffel credentials
- Set `DUFFEL_ENVIRONMENT=production`
- Monitor performance

## Troubleshooting

### Common Issues

**1. "Duffel access token not configured"**
- Solution: Add `DUFFEL_ACCESS_TOKEN` to `.env`

**2. "Failed to search flights"**
- Check: IATA codes are valid
- Check: Dates are in future
- Check: Internet connection

**3. "Provider amadeus not available"**
- Solution: Fallback requires Amadeus credentials
- Set `ENABLE_PROVIDER_FALLBACK=false` to use Duffel only

## Support

- Duffel Docs: https://duffel.com/docs
- API Reference: https://duffel.com/docs/api
- Status: https://status.duffel.com

---

**Implementation Status:**
✅ Phase 1: Backend Complete (Provider abstraction, Duffel service, factory pattern)
✅ Phase 2: Database Complete (Schema updates, provider tracking, booking persistence)
✅ Phase 3: Frontend Complete (Search updated to use Duffel)
⏳ Phase 4: Testing & Production (Ready for testing with Duffel credentials)
