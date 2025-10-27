# Duffel Stays Migration Work Plan
**Migration from Amadeus to Duffel Stays API**

**Date**: October 26, 2025
**Prepared For**: fb.awoniyi@gmail.com
**Project**: Bvodo Corporate Travel Platform
**Status**: Planning Phase - No Integration Required Yet

---

## Executive Summary

This document outlines a comprehensive plan to migrate the Bvodo hotel booking system from Amadeus to Duffel Stays API. The migration leverages existing Duffel infrastructure (already implemented for flights) and Stripe payment integration to create a unified, streamlined booking experience.

### Key Highlights

- **Current State**: Amadeus hotel search is functional, but booking API is NOT implemented (marked as TODO)
- **Target State**: Full Duffel Stays integration with search, quotes, and bookings
- **Advantage**: Duffel flights already working - reuse authentication, payment flows, and patterns
- **Timeline Estimate**: 4-6 weeks for complete implementation
- **Risk Level**: Low-Medium (familiar API, proven patterns from flights)

---

## Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [Amadeus vs Duffel Comparison](#amadeus-vs-duffel-comparison)
3. [Migration Strategy](#migration-strategy)
4. [Implementation Phases](#implementation-phases)
5. [Technical Architecture](#technical-architecture)
6. [Code Changes Required](#code-changes-required)
7. [Database Schema Updates](#database-schema-updates)
8. [API Workflow Mapping](#api-workflow-mapping)
9. [Payment Integration](#payment-integration)
10. [Testing Strategy](#testing-strategy)
11. [Timeline & Resources](#timeline-resources)
12. [Risks & Mitigation](#risks-mitigation)
13. [Prerequisites](#prerequisites)
14. [Next Steps](#next-steps)

---

## Current State Analysis

### What's Working with Amadeus

✅ **Hotel Search** (Lines 123-213 in `backend/src/services/amadeus.service.ts`)
- Search by city code or coordinates (latitude/longitude)
- Fetches hotel list from Amadeus API
- Enriches results with Google Places photos
- Returns hotel details with basic pricing

✅ **Hotel Offers** (Lines 218-266)
- Fetches detailed room offers for specific hotels
- Returns room types, bed configurations, pricing
- Includes meal plans and cancellation policies

✅ **Frontend Pages**
- Search page fully built (`frontend/src/app/dashboard/hotels/search/page.tsx` - 1,687 lines)
- Hotel details page complete (`frontend/src/app/dashboard/hotels/[id]/page.tsx` - 1,349 lines)
- Map integration, filters, sorting all functional

✅ **Database Schema**
- Comprehensive schema for hotel bookings (schema.prisma)
- Multi-room support with `room_booking_items` table
- Guest management with `guests` table
- Approval workflow integration

### What's NOT Working

❌ **Amadeus Hotel Booking API**
- Line 289 in `backend/src/controllers/hotel.controller.ts`: **"TODO: Implement hotel booking with Amadeus"**
- No actual booking creation with Amadeus
- No PNR/confirmation from Amadeus
- No real-time availability validation
- No modification/cancellation through Amadeus

### Why This is Perfect Timing

The incomplete Amadeus implementation means:
1. **No Migration Debt**: No existing booking logic to untangle
2. **Clean Slate**: Can build Duffel integration from scratch
3. **Database Ready**: Schema already supports all needed fields
4. **Frontend Ready**: UI can work with either provider's data
5. **Testing Easier**: No legacy behavior to maintain

---

## Amadeus vs Duffel Comparison

### API Workflow Comparison

| Step | Amadeus | Duffel Stays |
|------|---------|--------------|
| **1. Search** | Single-step: `hotelOffersSearch.get()` returns hotels + offers | Two-step: Search returns accommodations, then fetch rates separately |
| **2. Details** | Included in search response | `fetchAllRates()` to get room options |
| **3. Validation** | No explicit validation step | **Create Quote** - validates availability & locks pricing |
| **4. Booking** | `hotelBookings.post()` | `bookings.create()` with quote_id |

### Key Differences

| Feature | Amadeus | Duffel Stays | Winner |
|---------|---------|--------------|--------|
| **Search Flexibility** | City code OR coordinates | Coordinates + radius OR accommodation IDs | Duffel (more flexible) |
| **Pricing Validation** | No pre-booking validation | Quote step validates before booking | **Duffel** (prevents failed bookings) |
| **Payment Methods** | External (hotel payment) | balance, card (Stripe-like) | **Duffel** (integrated) |
| **Inventory Scope** | ~700k properties (GDS-focused) | Millions of properties (aggregated) | **Duffel** |
| **Rate Types** | Standard rates | Standard + negotiated corporate rates (RACs) | **Duffel** |
| **Cancellation Info** | Basic policy text | Structured timeline with refund amounts | **Duffel** (better UX) |
| **Photos** | Limited, requires Google Places | Comprehensive photos included | **Duffel** |
| **Amenities** | Basic list | Detailed categorized amenities | **Duffel** |
| **Loyalty Programs** | Limited support | 15+ programs (Marriott, Hilton, Hyatt, etc.) | **Duffel** |
| **Test Environment** | Often returns no offers | Dedicated test hotels at specific coordinates | **Duffel** |
| **API Consistency** | Separate from flights | **Same API as Duffel Flights** (already implemented) | **Duffel** |

### Duffel Advantages

1. **Unified Provider**: Same API for flights and hotels
   - Shared authentication (`DUFFEL_ACCESS_TOKEN` already configured)
   - Consistent error handling
   - Single vendor relationship

2. **Quote Step Prevents Payment Failures**:
   - Amadeus: Book → Pay → Might fail (offer expired)
   - Duffel: Quote (validate) → Pay only if valid → Book (guaranteed)
   - **Mirrors your existing pre-flight validation for Duffel flights**

3. **Better Data Quality**:
   - More comprehensive photos (no Google Places dependency)
   - Structured cancellation timelines (vs text policies)
   - Detailed amenities with standardized types
   - Better room descriptions

4. **Payment Integration**:
   - `balance` payment: Use Duffel balance (like flights)
   - `card` payment: Direct card processing (Stripe-like flow)
   - **Perfect match for your existing Stripe + Bvodo Credits setup**

5. **Corporate Features**:
   - Negotiated Rate Access Codes (RACs)
   - Corporate discounts and perks
   - Consistent rates across properties

---

## Migration Strategy

### Phased Rollout Approach

**Phase 1: Backend Service Layer** (Week 1-2)
- Create `DuffelStaysService` in `backend/src/services/duffel-stays.service.ts`
- Implement search, rates, quotes, booking methods
- Reuse existing Duffel client configuration from flights
- Add TypeScript type definitions

**Phase 2: Controller & Routes** (Week 2-3)
- Update `hotel.controller.ts` to use Duffel instead of Amadeus
- Modify search endpoint to handle Duffel's two-step search
- Add quote creation endpoint
- Update booking creation to use Duffel quotes

**Phase 3: Frontend Adaptation** (Week 3-4)
- Minimal changes needed (data structure mostly compatible)
- Update search flow to handle two-step process
- Add quote creation before payment
- Display enhanced cancellation timelines
- Show loyalty program options

**Phase 4: Payment Integration** (Week 4-5)
- Integrate Duffel balance payment (same as flights)
- Integrate card payment flow
- Update approval workflow for hotel bookings
- Test both payment methods

**Phase 5: Testing & QA** (Week 5-6)
- End-to-end testing with test hotels
- Payment flow testing
- Multi-room booking testing
- Error handling validation
- Performance testing

**Phase 6: Deployment & Monitoring** (Week 6)
- Deploy to production
- Monitor booking success rates
- Collect user feedback
- Performance tuning

### Parallel Development Option

If you want faster delivery, Phases 1-2 (backend) and Phase 3 (frontend) can run in parallel with proper coordination.

---

## Implementation Phases

### Phase 1: Backend Service Layer

**Goal**: Create Duffel Stays service that mirrors flight service patterns

**Files to Create**:
1. `backend/src/services/duffel-stays.service.ts` (new file ~400-500 lines)
2. `backend/src/types/duffel-stays.d.ts` (new file ~300 lines)

**Methods to Implement**:

```typescript
class DuffelStaysService {
  // 1. Search for accommodation
  async searchAccommodation(params: {
    latitude: number;
    longitude: number;
    radius: number;
    checkInDate: string;
    checkOutDate: string;
    guests: Array<{type: 'adult' | 'child', age?: number}>;
    rooms: number;
  }): Promise<SearchResult[]>

  // 2. Get all rates for a search result
  async getRatesForSearchResult(searchResultId: string): Promise<Accommodation>

  // 3. Create quote for a rate
  async createQuote(rateId: string): Promise<Quote>

  // 4. Create booking from quote
  async createBooking(params: {
    quoteId: string;
    email: string;
    phoneNumber: string;
    guests: Guest[];
    specialRequests?: string;
  }): Promise<Booking>

  // 5. Get booking details
  async getBooking(bookingId: string): Promise<Booking>

  // 6. Cancel booking (if needed)
  async cancelBooking(bookingId: string): Promise<Cancellation>
}
```

**Key Implementation Details**:

```typescript
// Reuse existing Duffel client from flights
import { DuffelService } from './duffel.service';

export class DuffelStaysService {
  private client: AxiosInstance;

  constructor() {
    // Use same config as DuffelService (flights)
    this.client = axios.create({
      baseURL: 'https://api.duffel.com',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Duffel-Version': 'v2',
        'Authorization': `Bearer ${env.DUFFEL_ACCESS_TOKEN}`,
      },
      timeout: 30000,
    });
  }

  async searchAccommodation(params) {
    const response = await this.client.post('/stays/search', {
      data: {
        location: {
          radius: params.radius,
          geographic_coordinates: {
            latitude: params.latitude,
            longitude: params.longitude,
          },
        },
        check_in_date: params.checkInDate,
        check_out_date: params.checkOutDate,
        guests: params.guests,
        rooms: params.rooms,
      },
    });

    return response.data.data; // Array of search results
  }

  async getRatesForSearchResult(searchResultId: string) {
    const response = await this.client.get(
      `/stays/search_results/${searchResultId}/rates`
    );

    return response.data.data; // Full accommodation with all rooms and rates
  }

  async createQuote(rateId: string) {
    const response = await this.client.post('/stays/quotes', {
      data: { rate_id: rateId },
    });

    return response.data.data; // Quote object
  }

  async createBooking(params) {
    const response = await this.client.post('/stays/bookings', {
      data: {
        quote_id: params.quoteId,
        email: params.email,
        phone_number: params.phoneNumber,
        guests: params.guests,
        accommodation_special_requests: params.specialRequests,
      },
    });

    return response.data.data; // Booking object
  }
}
```

**Estimated Effort**: 3-4 days

---

### Phase 2: Controller & Routes Updates

**Goal**: Update hotel controller to use Duffel Stays service

**Files to Modify**:
1. `backend/src/controllers/hotel.controller.ts`
2. `backend/src/routes/hotel.routes.ts` (add quote endpoint)

**Changes Required**:

**A. Search Endpoint** (`hotel.controller.ts` - Line 11-116)

Replace Amadeus search logic with:

```typescript
export const searchHotels = async (req: Request, res: Response) => {
  try {
    const { checkInDate, checkOutDate, adults, children, rooms, latitude, longitude, radius, cityCode, address } = req.query;

    // Convert coordinates if needed (keep existing geocoding logic)
    let finalLat = latitude;
    let finalLon = longitude;

    if (address && !latitude) {
      const coords = await GeocodingService.geocodeAddress(address);
      finalLat = coords.latitude;
      finalLon = coords.longitude;
    } else if (cityCode && !latitude) {
      const coords = cityMapping[cityCode];
      if (coords) {
        finalLat = coords.latitude;
        finalLon = coords.longitude;
      }
    }

    // Build guests array for Duffel
    const guests = [
      ...Array(parseInt(adults) || 1).fill({ type: 'adult' }),
      ...Array(parseInt(children) || 0).fill({ type: 'child' }),
    ];

    // Step 1: Search with Duffel
    const searchResults = await duffelStaysService.searchAccommodation({
      latitude: finalLat,
      longitude: finalLon,
      radius: parseInt(radius) || 5,
      checkInDate,
      checkOutDate,
      guests,
      rooms: parseInt(rooms) || 1,
    });

    // Step 2: For each search result, fetch rates (in parallel)
    const accommodationsWithRates = await Promise.all(
      searchResults.map(async (result) => {
        try {
          const accommodation = await duffelStaysService.getRatesForSearchResult(result.id);
          return {
            searchResultId: result.id,
            accommodation,
            cheapestRate: result.cheapest_rate, // From search response
          };
        } catch (error) {
          logger.warn(`Failed to fetch rates for ${result.id}`);
          return null;
        }
      })
    );

    const validAccommodations = accommodationsWithRates.filter(Boolean);

    res.json({
      success: true,
      data: validAccommodations,
      count: validAccommodations.length,
    });
  } catch (error) {
    logger.error('Hotel search error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
```

**B. Get Hotel Offers** (Lines 121-262)

Replace with:

```typescript
export const getHotelRates = async (req: Request, res: Response) => {
  try {
    const { searchResultId } = req.params;

    // Fetch all rates for this accommodation
    const accommodation = await duffelStaysService.getRatesForSearchResult(searchResultId);

    res.json({
      success: true,
      data: accommodation,
    });
  } catch (error) {
    logger.error('Get hotel rates error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
```

**C. Create Quote Endpoint** (NEW)

```typescript
export const createHotelQuote = async (req: Request, res: Response) => {
  try {
    const { rateId } = req.body;

    // Create quote to validate rate availability and lock pricing
    const quote = await duffelStaysService.createQuote(rateId);

    res.json({
      success: true,
      data: quote,
    });
  } catch (error) {
    logger.error('Create quote error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create quote. Rate may no longer be available.',
    });
  }
};
```

**D. Create Booking** (Lines 267-308 - Currently TODO)

Replace TODO with:

```typescript
export const createHotelBooking = async (req: Request, res: Response) => {
  try {
    const { quoteId, guests, email, phoneNumber, specialRequests } = req.body;

    // Create Duffel booking
    const duffelBooking = await duffelStaysService.createBooking({
      quoteId,
      email,
      phoneNumber,
      guests,
      specialRequests,
    });

    // Save to database (integrate with existing booking.controller.ts flow)
    // This part already exists in booking.controller.ts (Lines 592-640)

    res.json({
      success: true,
      data: duffelBooking,
      message: 'Hotel booking created successfully',
    });
  } catch (error) {
    logger.error('Create hotel booking error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
```

**E. Routes Updates** (`hotel.routes.ts`)

Add new route:
```typescript
router.post('/quotes', createHotelQuote);
```

**Estimated Effort**: 2-3 days

---

### Phase 3: Frontend Adaptation

**Goal**: Update frontend to work with Duffel's two-step search and quote flow

**Files to Modify**:
1. `frontend/src/app/dashboard/hotels/search/page.tsx`
2. `frontend/src/app/dashboard/hotels/[id]/page.tsx`

**Changes Required**:

**A. Search Page Updates**

The search page is mostly compatible, but needs minor adjustments:

1. **Store searchResultId** with each hotel:
```typescript
// Current: hotels array contains hotel data
// New: hotels array contains { searchResultId, accommodation, cheapestRate }

const [hotels, setHotels] = useState<Array<{
  searchResultId: string;
  accommodation: Accommodation;
  cheapestRate: Rate;
}>>([]);
```

2. **Update navigation** to pass searchResultId:
```typescript
// When user clicks hotel
router.push(`/dashboard/hotels/${searchResultId}`);
```

**B. Hotel Details Page Updates**

Major changes needed here:

1. **Fetch rates** on page load:
```typescript
const [id] = useState(params.id); // This is now searchResultId

useEffect(() => {
  const fetchHotelRates = async () => {
    const response = await fetch(`/api/v1/hotels/${id}/rates`);
    const data = await response.json();
    setAccommodation(data.data);
  };

  fetchHotelRates();
}, [id]);
```

2. **Add quote creation** before booking:
```typescript
const handleRoomSelection = async (rate: Rate) => {
  setSelectedRate(rate);

  // Create quote to validate availability
  try {
    const quoteResponse = await fetch('/api/v1/hotels/quotes', {
      method: 'POST',
      body: JSON.stringify({ rateId: rate.id }),
    });

    const { data: quote } = await quoteResponse.json();
    setQuote(quote);

    // Open passenger details modal
    setShowPassengerModal(true);
  } catch (error) {
    toast.error('This rate is no longer available. Please select another option.');
  }
};
```

3. **Update booking creation** to use quoteId:
```typescript
const createBooking = async (guestDetails) => {
  const response = await fetch('/api/v1/bookings', {
    method: 'POST',
    body: JSON.stringify({
      bookingType: 'hotel',
      provider: 'duffel',
      quoteId: quote.id, // NEW: Use quote ID instead of rate ID
      guests: guestDetails,
      email: userEmail,
      phoneNumber: userPhone,
      // ... other fields
    }),
  });
};
```

4. **Enhanced cancellation display**:
```typescript
// Display structured cancellation timeline
{rate.cancellation_timeline.map((period, index) => (
  <div key={index} className="flex items-center gap-3">
    <div className={`h-2 w-2 rounded-full ${period.refund_amount === rate.total_amount ? 'bg-green-500' : 'bg-gray-400'}`} />
    <div>
      <p className="font-medium">
        {period.refund_amount === rate.total_amount ? 'Full Refund' :
         period.refund_amount === '0.00' ? 'Non-Refundable' : 'Partial Refund'}
      </p>
      <p className="text-sm text-gray-600">
        Until {new Date(period.before).toLocaleDateString()} - Refund: ${period.refund_amount}
      </p>
    </div>
  </div>
))}
```

5. **Add loyalty program selector** (optional):
```typescript
{accommodation.supported_loyalty_programme && (
  <div className="mb-4">
    <label className="block text-sm font-medium mb-2">
      Loyalty Program (Optional)
    </label>
    <select
      value={selectedLoyaltyProgram}
      onChange={(e) => setSelectedLoyaltyProgram(e.target.value)}
      className="w-full border rounded-lg px-4 py-2"
    >
      <option value="">None</option>
      <option value="marriott_bonvoy">Marriott Bonvoy</option>
      <option value="hilton_honors">Hilton Honors</option>
      <option value="world_of_hyatt">World of Hyatt</option>
      {/* ... other programs */}
    </select>
  </div>
)}
```

**Estimated Effort**: 4-5 days

---

### Phase 4: Payment Integration

**Goal**: Integrate Duffel Stays with existing payment infrastructure

**Current Payment Setup**:
- ✅ Stripe webhooks working (`payment.controller.ts`)
- ✅ Bvodo Credits (balance) working
- ✅ Two-tier approval workflow functional

**Integration Points**:

**A. Payment Method Selection**

Duffel Stays supports two payment methods:
1. **`balance`** - Duffel balance (mirrors Bvodo Credits flow)
2. **`card`** - Card payment (mirrors Stripe flow)

**B. Balance Payment Flow**

```typescript
// In booking.controller.ts
if (paymentMethod === 'credit') {
  // Create Duffel booking with balance payment
  const duffelBooking = await duffelStaysService.createBooking({
    quoteId,
    email,
    phoneNumber,
    guests,
    paymentType: 'balance', // Use Duffel balance
  });

  // Existing approval workflow kicks in
  // requiresApproval = true for balance payments
}
```

**C. Stripe Payment Flow**

```typescript
// In booking.controller.ts
if (paymentMethod === 'card') {
  // 1. Create Stripe checkout session (existing code)
  const session = await stripeService.createCheckoutSession({
    amount: totalPrice,
    bookingId,
    // ... other params
  });

  // 2. After Stripe payment succeeds (webhook handler)
  // payment.controller.ts - handleCheckoutSessionCompleted

  // 3. Create Duffel booking
  const duffelBooking = await duffelStaysService.createBooking({
    quoteId: booking.bookingData.quoteId,
    email: booking.bookingData.email,
    phoneNumber: booking.bookingData.phoneNumber,
    guests: booking.bookingData.guests,
    paymentType: 'card', // Or handle card separately if needed
  });

  // 4. Update booking with confirmation
  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: 'confirmed',
      providerOrderId: duffelBooking.id,
      providerConfirmationNumber: duffelBooking.id, // Duffel doesn't use PNR for hotels
      providerRawData: duffelBooking,
    },
  });
}
```

**D. Approval Workflow Integration**

Hotels follow same pattern as flights:

| Payment Method | Approval Required | Duffel Booking Creation |
|----------------|-------------------|-------------------------|
| Bvodo Credits (balance) | Yes (manual approval) | After super admin confirms |
| Stripe (card) | No (auto-approve) | After webhook receives payment |

**Implementation**:

```typescript
// booking.controller.ts - approveBooking()
if (booking.bookingType === 'hotel') {
  // After super admin confirms balance payment booking
  const duffelBooking = await duffelStaysService.createBooking({
    quoteId: booking.bookingData.quoteId,
    email: booking.bookingData.email,
    phoneNumber: booking.bookingData.phoneNumber,
    guests: booking.bookingData.guests,
  });

  // Update booking
  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: 'confirmed',
      providerOrderId: duffelBooking.id,
      providerRawData: duffelBooking,
    },
  });

  // Deduct credits
  await deductUserCredits(userId, totalPrice);
}
```

**Estimated Effort**: 2-3 days

---

### Phase 5: Testing Strategy

**Goal**: Comprehensive testing across all scenarios

#### Test Hotels for Development

Duffel provides test hotels at coordinates: **-24.38, -128.32**

```typescript
// Test search
const testSearch = {
  latitude: -24.38,
  longitude: -128.32,
  radius: 2,
  checkInDate: '2025-11-10',
  checkOutDate: '2025-11-13',
  guests: [{ type: 'adult' }, { type: 'adult' }],
  rooms: 1,
};
```

#### Test Scenarios

**1. Search & Rate Retrieval**
- [ ] Search by coordinates returns results
- [ ] Search by city code (geocoded to coordinates) returns results
- [ ] Fetch rates for search result returns rooms and rates
- [ ] Multiple rooms per accommodation displayed correctly
- [ ] Multiple rates per room displayed with differences highlighted

**2. Quote Creation**
- [ ] Creating quote for valid rate succeeds
- [ ] Creating quote for expired rate fails gracefully
- [ ] Quote shows final pricing (base + taxes + fees)
- [ ] Quote expiry handled properly

**3. Booking Creation - Balance Payment**
- [ ] Booking created in pending_approval status
- [ ] No Duffel booking created yet
- [ ] Manager approval works
- [ ] Super admin confirmation creates Duffel booking
- [ ] Credits deducted after confirmation
- [ ] Booking confirmation email sent

**4. Booking Creation - Stripe Payment**
- [ ] Quote created successfully
- [ ] Stripe checkout session created
- [ ] Payment webhook receives event
- [ ] Duffel booking auto-created after payment
- [ ] Booking status updated to confirmed
- [ ] Confirmation email sent with booking details

**5. Multi-Room Bookings**
- [ ] Can book multiple rooms in single reservation
- [ ] Guest details collected per room
- [ ] Pricing calculated correctly for multiple rooms
- [ ] All rooms appear in confirmation

**6. Cancellation Timeline Display**
- [ ] Full refund periods shown in green
- [ ] Partial refund periods shown with amounts
- [ ] Non-refundable periods clearly marked
- [ ] Dates converted to local timezone

**7. Error Handling**
- [ ] Expired quote shows user-friendly error
- [ ] Network errors handled gracefully
- [ ] Invalid rate ID returns clear error
- [ ] Payment failures trigger proper cleanup

**8. UI/UX**
- [ ] Search results display correctly
- [ ] Hotel photos load properly
- [ ] Amenities displayed with icons
- [ ] Room selection flow intuitive
- [ ] Mobile responsive design maintained

**9. Performance**
- [ ] Search completes within 5 seconds
- [ ] Rate fetching completes within 3 seconds
- [ ] Quote creation within 2 seconds
- [ ] Booking creation within 5 seconds

**10. Integration**
- [ ] Duffel balance payment works
- [ ] Stripe payment works
- [ ] Approval workflow functions correctly
- [ ] Email notifications sent properly

#### Automated Testing

Create test suites:

```typescript
// backend/tests/duffel-stays.test.ts

describe('Duffel Stays Service', () => {
  it('should search accommodation by coordinates', async () => {
    const results = await duffelStaysService.searchAccommodation({
      latitude: -24.38,
      longitude: -128.32,
      radius: 2,
      checkInDate: '2025-11-10',
      checkOutDate: '2025-11-13',
      guests: [{ type: 'adult' }],
      rooms: 1,
    });

    expect(results).toBeDefined();
    expect(results.length).toBeGreaterThan(0);
  });

  it('should fetch rates for search result', async () => {
    // ... test implementation
  });

  it('should create quote for rate', async () => {
    // ... test implementation
  });

  it('should create booking from quote', async () => {
    // ... test implementation
  });
});
```

**Estimated Effort**: 5-7 days

---

### Phase 6: Deployment

**Goal**: Safe, monitored rollout to production

#### Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Code reviewed
- [ ] Environment variables configured
  - [ ] `DUFFEL_ACCESS_TOKEN` (production token)
  - [ ] `DUFFEL_ENVIRONMENT=production`
- [ ] Database migrations run (if any schema changes)
- [ ] Stripe webhooks configured for production
- [ ] Email templates updated with hotel-specific content
- [ ] Documentation updated

#### Deployment Steps

1. **Deploy Backend** (production API)
   - Deploy backend service with Duffel Stays integration
   - Monitor logs for errors
   - Test search endpoint manually

2. **Deploy Frontend** (production app)
   - Deploy frontend with updated hotel flow
   - Test full booking flow in production
   - Monitor for JavaScript errors

3. **Enable Feature Flag** (if using feature flags)
   - Gradually enable for subset of users
   - Monitor booking success rates
   - Collect feedback

4. **Full Rollout**
   - Enable for all users
   - Announce new hotel features
   - Provide support documentation

#### Monitoring

Track these metrics:
- Hotel search success rate
- Quote creation success rate
- Booking creation success rate
- Payment success rate (balance vs card)
- Average response times
- Error rates by endpoint

**Estimated Effort**: 2-3 days

---

## Technical Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                    │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Search Page  │  │ Details Page │  │ Booking Flow │      │
│  │              │  │              │  │              │      │
│  │ - Filters    │  │ - Rooms      │  │ - Quote      │      │
│  │ - Map        │  │ - Rates      │  │ - Payment    │      │
│  │ - List/Grid  │  │ - Photos     │  │ - Confirm    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                           │                                  │
└───────────────────────────┼──────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend API (Express)                     │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              hotel.controller.ts                      │  │
│  │                                                        │  │
│  │  - searchHotels()      - createHotelQuote()          │  │
│  │  - getHotelRates()     - createHotelBooking()        │  │
│  └──────────────────────────────────────────────────────┘  │
│                            │                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           duffel-stays.service.ts (NEW)              │  │
│  │                                                        │  │
│  │  - searchAccommodation()                              │  │
│  │  - getRatesForSearchResult()                          │  │
│  │  - createQuote()                                      │  │
│  │  - createBooking()                                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                            │                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            booking.controller.ts                      │  │
│  │                                                        │  │
│  │  - createBooking() - handles DB + payments            │  │
│  │  - approveBooking() - creates Duffel booking          │  │
│  └──────────────────────────────────────────────────────┘  │
│                            │                                 │
└────────────────────────────┼─────────────────────────────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
              ▼                             ▼
┌──────────────────────────┐   ┌──────────────────────────┐
│     Duffel Stays API     │   │      Stripe API          │
│                          │   │                          │
│ - /stays/search          │   │ - Create checkout        │
│ - /stays/search_results  │   │ - Webhooks               │
│ - /stays/quotes          │   │                          │
│ - /stays/bookings        │   │                          │
└──────────────────────────┘   └──────────────────────────┘
```

### Data Flow

**1. Search Flow**
```
User enters search → Frontend sends coordinates/dates
  ↓
Backend: hotel.controller.searchHotels()
  ↓
DuffelStaysService.searchAccommodation()
  ↓
Duffel API: POST /stays/search
  ← Returns array of search results with searchResultIds
  ↓
For each result: DuffelStaysService.getRatesForSearchResult()
  ↓
Duffel API: GET /stays/search_results/{id}/rates
  ← Returns full accommodation with rooms and rates
  ↓
Backend combines all data
  ↓
Frontend displays hotels with cheapest rate
```

**2. Quote & Booking Flow**
```
User selects room/rate → Frontend sends rateId
  ↓
Backend: hotel.controller.createHotelQuote()
  ↓
DuffelStaysService.createQuote(rateId)
  ↓
Duffel API: POST /stays/quotes
  ← Returns quote with quoteId and validated pricing
  ↓
Frontend displays passenger details form
  ↓
User enters details + selects payment method
  ↓
If Stripe: Create checkout session → User pays → Webhook
If Balance: Create booking in pending status
  ↓
Backend: DuffelStaysService.createBooking(quoteId, guests)
  ↓
Duffel API: POST /stays/bookings
  ← Returns booking confirmation
  ↓
Update database with confirmation
  ↓
Send confirmation email
```

---

## Code Changes Required

### New Files to Create

1. **`backend/src/services/duffel-stays.service.ts`** (~400-500 lines)
   - Main service class
   - All API methods
   - Error handling
   - Response transformation

2. **`backend/src/types/duffel-stays.d.ts`** (~300 lines)
   - TypeScript interfaces
   - Accommodation, Room, Rate types
   - SearchResult, Quote, Booking types
   - Request/response schemas

3. **`backend/tests/duffel-stays.test.ts`** (~200 lines)
   - Unit tests
   - Integration tests
   - Mock data

### Files to Modify

1. **`backend/src/controllers/hotel.controller.ts`** (Major changes)
   - Lines 11-116: searchHotels() - replace Amadeus with Duffel
   - Lines 121-262: getHotelOffers() → getHotelRates() - use Duffel
   - Lines 267-308: createHotelBooking() - implement with Duffel
   - NEW: createHotelQuote() method

2. **`backend/src/routes/hotel.routes.ts`** (Minor)
   - Add: `POST /quotes` route
   - Possibly rename: `GET /offers/:id` → `GET /rates/:id`

3. **`backend/src/controllers/booking.controller.ts`** (Minor)
   - Lines 592-640: Hotel booking creation
   - Add quoteId handling
   - Integrate with DuffelStaysService
   - Update approval flow to create Duffel booking

4. **`frontend/src/app/dashboard/hotels/search/page.tsx`** (Moderate)
   - Store searchResultId with each hotel
   - Update navigation to pass searchResultId
   - Minor UI tweaks for enhanced data

5. **`frontend/src/app/dashboard/hotels/[id]/page.tsx`** (Major)
   - Fetch rates using searchResultId
   - Add quote creation step
   - Update booking creation with quoteId
   - Enhanced cancellation timeline display
   - Loyalty program selector (optional)

6. **`frontend/src/components/PassengerDetailsModal.tsx`** (Minor)
   - Add support for hotel-specific fields if needed
   - Ensure guest details format matches Duffel requirements

7. **`backend/src/config/env.ts`** (Minor, if needed)
   - Verify DUFFEL_ACCESS_TOKEN configured
   - Verify DUFFEL_ENVIRONMENT configured

### Files to Remove (Eventually)

1. **`backend/src/services/amadeus.service.ts`** (Lines 123-266)
   - Keep flight-related methods
   - Remove hotel search and offers methods
   - Or keep for comparison/fallback during transition

2. **`backend/src/services/google-places.service.ts`** (Optional)
   - May no longer need if Duffel provides sufficient photos
   - Keep for other purposes if used elsewhere

---

## Database Schema Updates

### Current Schema Analysis

The existing schema in `backend/prisma/schema.prisma` is **well-designed** and requires **minimal changes**.

#### Tables Already Supporting Duffel Stays

✅ **`bookings` table** (Lines 151-260)
- `provider` field: Can use 'duffel' (already used for flights)
- `providerBookingReference`: Store quoteId during quote phase
- `providerOrderId`: Store Duffel booking ID after creation
- `bookingData` (JSON): Can store quote and rate details
- All other fields compatible

✅ **`hotel_bookings` table** (Lines 324-392)
- All fields map directly to Duffel data
- `confirmationNumber`: Use Duffel booking ID
- `amenities` (JSON): Store Duffel amenities array
- `cancellationPolicy`: Store structured timeline or text summary

✅ **`room_booking_items` table** (Lines 398-430)
- Perfect for multi-room bookings
- `offerId`: Store Duffel rate ID
- All other fields compatible

✅ **`guests` table** (Lines 436-467)
- Maps directly to Duffel guest requirements
- All required fields present

### Minor Schema Additions (Optional)

Consider adding fields for Duffel-specific features:

```prisma
model HotelBooking {
  // ... existing fields ...

  // Optional additions for Duffel
  searchResultId     String?     // Reference to search result
  quoteId            String?     // Duffel quote ID
  loyaltyProgramme   String?     // e.g., "marriott_bonvoy"
  loyaltyNumber      String?     // User's loyalty account number
  keyCollectionInfo  Json?       // Instructions for key collection
  specialRequests    String?     // Guest special requests

  // Enhanced cancellation data
  cancellationTimeline Json?     // Structured timeline from Duffel
}
```

Migration file example:

```sql
-- migrations/add_duffel_stays_fields.sql

ALTER TABLE hotel_bookings
  ADD COLUMN search_result_id VARCHAR(255),
  ADD COLUMN quote_id VARCHAR(255),
  ADD COLUMN loyalty_programme VARCHAR(100),
  ADD COLUMN loyalty_number VARCHAR(100),
  ADD COLUMN key_collection_info JSONB,
  ADD COLUMN special_requests TEXT,
  ADD COLUMN cancellation_timeline JSONB;

CREATE INDEX idx_hotel_bookings_quote_id ON hotel_bookings(quote_id);
CREATE INDEX idx_hotel_bookings_search_result_id ON hotel_bookings(search_result_id);
```

**Recommendation**: Start without schema changes, add these fields only if needed during implementation.

---

## API Workflow Mapping

### Detailed API Call Sequences

#### Scenario 1: User Searches for Hotels in London

**Current Flow (Amadeus)**:
```
1. Frontend → Backend: GET /api/v1/hotels/search?cityCode=LON&checkInDate=2025-11-10&checkOutDate=2025-11-13&adults=2&rooms=1

2. Backend:
   - Geocode "LON" → (51.5074, -0.1278)
   - Call Amadeus: referenceData.locations.hotels.byGeocode.get()
   - For each hotel: Call hotelOffersSearch.get() (try to get pricing)
   - For each hotel: Call Google Places API (get photos)
   - Combine all data

3. Backend → Frontend: Array of hotels with photos and pricing
```

**New Flow (Duffel Stays)**:
```
1. Frontend → Backend: GET /api/v1/hotels/search?cityCode=LON&checkInDate=2025-11-10&checkOutDate=2025-11-13&adults=2&rooms=1

2. Backend:
   - Geocode "LON" → (51.5074, -0.1278)
   - Call Duffel: POST /stays/search
     Body: {
       location: { radius: 5, geographic_coordinates: {latitude: 51.5074, longitude: -0.1278} },
       check_in_date: "2025-11-10",
       check_out_date: "2025-11-13",
       guests: [{type: "adult"}, {type: "adult"}],
       rooms: 1
     }
   - Response: Array of search results with searchResultId

   - For each search result (in parallel):
     Call Duffel: GET /stays/search_results/{searchResultId}/rates
   - Response: Full accommodation with rooms, rates, photos, amenities

3. Backend → Frontend: Array of accommodations with all data
```

**Key Differences**:
- Duffel: Two API calls (search + rates) vs Amadeus: One call + photo enrichment
- Duffel: Photos included vs Amadeus: Need Google Places
- Duffel: More data in response (better amenities, ratings, reviews)

---

#### Scenario 2: User Selects Hotel and Views Rooms

**Current Flow (Amadeus)**:
```
1. Frontend → Backend: GET /api/v1/hotels/offers/{hotelId}?checkInDate=...&checkOutDate=...

2. Backend:
   - Call Amadeus: hotelOffersSearch.get({hotelIds: hotelId, ...})
   - Response: Hotel with all room offers

3. Backend → Frontend: Rooms and rates
```

**New Flow (Duffel Stays)**:
```
1. Frontend → Backend: GET /api/v1/hotels/rates/{searchResultId}

2. Backend:
   - Call Duffel: GET /stays/search_results/{searchResultId}/rates
   - Response: Full accommodation with all rooms and rates

3. Backend → Frontend: Accommodation with rooms and rates

Note: This may have already been called during search, so could cache results
```

---

#### Scenario 3: User Books Hotel with Stripe Payment

**Current Flow (Amadeus - NOT IMPLEMENTED)**:
```
1. Frontend → Backend: POST /api/v1/hotels/bookings
   Body: {hotelId, offerId, guests, paymentMethod: "card"}

2. Backend:
   - Create Stripe checkout session
   - Save booking in DB with status: pending

3. Frontend: Redirect to Stripe

4. User pays → Stripe webhook → Backend

5. Backend (webhook):
   - ❌ TODO: Call Amadeus booking API (not implemented)
   - Update booking status: confirmed

6. Backend → User: Confirmation email
```

**New Flow (Duffel Stays)**:
```
1. User selects room/rate

2. Frontend → Backend: POST /api/v1/hotels/quotes
   Body: {rateId: "rat_xxxxx"}

3. Backend:
   - Call Duffel: POST /stays/quotes
   - Response: Quote with quoteId

4. Backend → Frontend: Quote data

5. Frontend: User enters passenger details

6. Frontend → Backend: POST /api/v1/bookings
   Body: {
     bookingType: "hotel",
     provider: "duffel",
     quoteId: "quo_xxxxx",
     guests: [...],
     paymentMethod: "card"
   }

7. Backend:
   - Save booking in DB (status: pending)
   - Create Stripe checkout session
   - Return session URL

8. Frontend: Redirect to Stripe

9. User pays → Stripe webhook → Backend

10. Backend (webhook):
    - Call Duffel: POST /stays/bookings
      Body: {
        quote_id: "quo_xxxxx",
        guests: [...],
        email: "...",
        phone_number: "..."
      }
    - Response: Duffel booking with booking ID
    - Update DB: status = confirmed, providerOrderId = booking ID
    - Send confirmation email

11. Frontend: Show confirmation page
```

**Key Differences**:
- Duffel: Quote step validates availability BEFORE payment
- Duffel: Booking created AFTER payment succeeds (guaranteed success)
- Amadeus: Would create booking directly (no validation, higher failure risk)

---

#### Scenario 4: User Books Hotel with Bvodo Credits

**New Flow (Duffel Stays)**:
```
1-5. Same as Stripe flow (quote creation, details entry)

6. Frontend → Backend: POST /api/v1/bookings
   Body: {paymentMethod: "credit", ...}

7. Backend:
   - Save booking in DB (status: pending_approval)
   - NO Duffel booking created yet
   - NO credits deducted yet

8. Manager: Approves booking

9. Backend:
   - Update status: approved
   - Notify super admin

10. Super Admin: Confirms booking

11. Backend (approval handler):
    - Call Duffel: POST /stays/bookings (NOW create actual booking)
    - Response: Duffel booking confirmation
    - Update DB: status = confirmed, providerOrderId = booking ID
    - Deduct credits from user balance
    - Send confirmation email

12. User: Receives confirmation
```

**Key Benefit**: Credits only deducted AFTER Duffel confirms booking (no money lost on failed bookings)

---

## Payment Integration

### Overview

Your existing payment infrastructure is **perfectly suited** for Duffel Stays with minimal changes needed.

### Current Payment Setup

✅ **Stripe Integration**:
- Checkout sessions for card payments
- Webhooks for auto-confirmation
- Working for flights

✅ **Bvodo Credits (Balance)**:
- Internal credit system
- Manual approval workflow
- Two-tier approval (manager → super admin)

✅ **Approval Workflow**:
- `requiresApproval` logic in booking.controller.ts
- Balance payments: Manual approval required
- Card payments: Auto-approve after payment

### Duffel Stays Payment Methods

Duffel Stays supports:
1. **`balance`** - Duffel account balance (prepaid)
2. **`card`** - Direct card payment (with 3DS support)

### Mapping to Your System

| Your System | Duffel Stays | Booking Creation Timing |
|-------------|--------------|-------------------------|
| Bvodo Credits | `balance` | After super admin approval |
| Stripe | Not used directly | After Stripe webhook (use Duffel balance internally) |

### Recommended Approach

**Option 1: Duffel Balance for All Bookings** (Recommended)

Use Duffel `balance` payment for all bookings, funded by:
- Your Duffel prepaid balance (topped up via bank transfer)
- You collect payment via Stripe OR deduct from Bvodo Credits
- Then create Duffel booking using your balance

**Flow**:
```
User selects payment method
  ├─ Bvodo Credits:
  │   1. Create booking (pending_approval)
  │   2. Approval workflow
  │   3. After approval: Create Duffel booking with balance payment
  │   4. Deduct from user's Bvodo Credits
  │
  └─ Stripe Card:
      1. Create booking (pending)
      2. Stripe checkout
      3. After payment webhook: Create Duffel booking with balance payment
      4. Stripe payment covers your cost
```

**Benefits**:
- Simple integration
- Unified payment method to Duffel
- Your existing flows mostly unchanged
- Full control over when Duffel booking is created

**Option 2: Duffel Card Payment for Stripe Users**

Use Duffel's `card` payment type directly for Stripe users:
- Duffel handles card processing
- 3DS authentication built-in
- Direct payment to hotel

**Complexity**: Higher, requires integrating Duffel's card payment flow instead of Stripe

**Recommendation**: Start with Option 1, consider Option 2 later if Duffel's card rates are better

### Implementation Details

#### Balance Payment (Bvodo Credits)

```typescript
// booking.controller.ts - approveBooking()

if (booking.bookingType === 'hotel' && booking.provider === 'duffel') {
  // After super admin confirms

  // Check if quote is still valid (may have expired)
  const quoteId = booking.bookingData.quoteId;
  let quote;

  try {
    quote = await duffelStaysService.getQuote(quoteId);
  } catch (error) {
    // Quote expired, need to create new one
    const newQuote = await duffelStaysService.createQuote(
      booking.bookingData.rateId
    );
    quoteId = newQuote.id;
  }

  // Create Duffel booking with balance payment
  const duffelBooking = await duffelStaysService.createBooking({
    quoteId: quoteId,
    email: booking.bookingData.email,
    phoneNumber: booking.bookingData.phoneNumber,
    guests: booking.bookingData.guests,
    specialRequests: booking.bookingData.specialRequests,
    // Payment handled via Duffel balance (no payment param needed)
  });

  // Update booking
  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: 'confirmed',
      confirmedAt: new Date(),
      providerOrderId: duffelBooking.id,
      providerRawData: duffelBooking,
    },
  });

  // Deduct credits
  await deductUserCredits(userId, totalPrice);

  // Send confirmation
  await emailService.sendHotelConfirmation({
    email: booking.bookingData.email,
    bookingId: duffelBooking.id,
    hotelName: booking.destination,
    checkIn: booking.departureDate,
    checkOut: booking.returnDate,
  });
}
```

#### Card Payment (Stripe → Duffel Balance)

```typescript
// payment.controller.ts - handleCheckoutSessionCompleted()

if (booking.bookingType === 'hotel' && booking.provider === 'duffel') {
  // After Stripe payment succeeds

  const quoteId = booking.bookingData.quoteId;

  // Create Duffel booking
  const duffelBooking = await duffelStaysService.createBooking({
    quoteId: quoteId,
    email: booking.bookingData.email,
    phoneNumber: booking.bookingData.phoneNumber,
    guests: booking.bookingData.guests,
    specialRequests: booking.bookingData.specialRequests,
  });

  // Update booking
  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: 'confirmed',
      confirmedAt: new Date(),
      paymentStatus: 'completed',
      providerOrderId: duffelBooking.id,
      providerRawData: duffelBooking,
    },
  });

  // Send confirmation
  await emailService.sendHotelConfirmation({...});
}
```

### Quote Expiry Handling

Duffel quotes may expire (typically 15-30 minutes). Handle this:

```typescript
async createBookingFromQuote(quoteId: string, bookingData: any) {
  try {
    // Try to create booking with existing quote
    return await duffelStaysService.createBooking({
      quoteId,
      ...bookingData,
    });
  } catch (error) {
    if (error.message.includes('expired') || error.message.includes('no longer available')) {
      // Quote expired, create new one and retry
      logger.warn(`Quote ${quoteId} expired, creating new quote`);

      const newQuote = await duffelStaysService.createQuote(
        bookingData.rateId
      );

      // Retry with new quote
      return await duffelStaysService.createBooking({
        quoteId: newQuote.id,
        ...bookingData,
      });
    }

    throw error; // Other errors
  }
}
```

---

## Timeline & Resources

### Estimated Timeline: 4-6 Weeks

| Phase | Tasks | Duration | Dependencies |
|-------|-------|----------|--------------|
| **Phase 1** | Backend Service Layer | 1-2 weeks | None |
| **Phase 2** | Controller & Routes | 1 week | Phase 1 |
| **Phase 3** | Frontend Adaptation | 1-2 weeks | Phase 2 (can overlap) |
| **Phase 4** | Payment Integration | 1 week | Phase 2, 3 |
| **Phase 5** | Testing & QA | 1 week | Phase 4 |
| **Phase 6** | Deployment | 2-3 days | Phase 5 |

### Resource Requirements

**Development Team**:
- 1 Backend Developer (Phases 1, 2, 4)
- 1 Frontend Developer (Phase 3)
- 1 Full-Stack Developer (can cover both) OR parallel backend + frontend

**QA/Testing**:
- 1 QA Engineer (Phase 5)
- Automated testing setup

**DevOps**:
- 1 DevOps Engineer (deployment, monitoring setup)

**Estimated Hours**:
- Backend: 60-80 hours
- Frontend: 40-60 hours
- Testing: 30-40 hours
- Deployment & monitoring: 10-15 hours
- **Total: 140-195 hours** (~4-6 weeks with 1 developer, ~2-3 weeks with 2 developers in parallel)

---

## Risks & Mitigation

### Risk Matrix

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **Quote expiry during approval workflow** | Medium | Medium | Auto-refresh quotes before Duffel booking creation |
| **Duffel API rate limits** | Low | Medium | Implement caching, monitor usage |
| **Payment failures** | Low | High | Robust error handling, retry logic, monitoring |
| **Data migration issues** | Low | Low | No migration needed (new implementation) |
| **Frontend UI breaks** | Low | Medium | Comprehensive testing, gradual rollout |
| **Test hotel availability** | Low | Low | Use multiple test scenarios, contact Duffel support |
| **Production Duffel balance runs out** | Medium | High | Set up alerts, auto-top-up if possible, monitor daily |

### Detailed Mitigation Strategies

#### 1. Quote Expiry During Approval Workflow

**Problem**: User creates booking with Bvodo Credits → Waits for approval (could be hours/days) → Quote expires before super admin confirms

**Solution**:
```typescript
// Before creating Duffel booking, validate and refresh quote
async function ensureValidQuote(originalQuoteId: string, rateId: string) {
  try {
    // Try to use original quote
    const quote = await duffelStaysService.getQuote(originalQuoteId);
    return quote;
  } catch (error) {
    // Quote expired, create fresh one
    logger.info('Quote expired, creating new quote');
    const newQuote = await duffelStaysService.createQuote(rateId);

    // Check if pricing changed
    if (newQuote.total_amount !== originalQuote.total_amount) {
      // Notify user of price change
      await notifyPriceChange(user, originalQuote, newQuote);
    }

    return newQuote;
  }
}
```

#### 2. Duffel API Rate Limits

**Solution**:
- Implement request caching for search results (5-10 minute TTL)
- Monitor API usage via Duffel dashboard
- Implement exponential backoff for retries
- Cache accommodation details after first fetch

#### 3. Payment Failures

**Solution**:
- Comprehensive error handling with user-friendly messages
- Automatic retry logic for transient failures
- Monitor all payment webhooks
- Alert on failed bookings after successful payment
- Manual reconciliation process for edge cases

#### 4. Production Duffel Balance Management

**Solution**:
- Set up balance monitoring alerts (email/SMS when balance < $10,000)
- Weekly balance reviews
- Automate top-up requests when balance is low
- Track burn rate to predict when top-up needed
- Have backup plan if balance insufficient (pause hotel bookings temporarily)

---

## Prerequisites

### Before Starting Implementation

#### 1. Duffel Account Setup

- [ ] **Duffel Account**: Already have one (flights working)
- [ ] **Request Stays Access**: Contact Duffel via duffel.com/contact-us
  - Mention existing flight integration
  - Request Stays API access for test and production
  - Typical approval: 1-3 business days
- [ ] **Verify Access Token**: Same token works for flights and stays
- [ ] **Test Mode Verification**: Confirm test hotels accessible at -24.38, -128.32

#### 2. Environment Configuration

- [ ] **Environment Variables**:
  ```env
  DUFFEL_ACCESS_TOKEN=duffel_test_xxxxx (for test)
  DUFFEL_ACCESS_TOKEN=duffel_live_xxxxx (for production)
  DUFFEL_ENVIRONMENT=test (or production)
  ```

- [ ] **Duffel Balance**: Ensure sufficient balance
  - Test mode: Unlimited balance (free testing)
  - Production: Top up via bank transfer (coordinate with finance)
  - Recommended initial balance: $50,000+ (adjust based on volume)

#### 3. Technical Prerequisites

- [ ] **Node.js & TypeScript**: Already set up ✅
- [ ] **Axios**: Already installed (used in duffel.service.ts) ✅
- [ ] **Database**: PostgreSQL with Prisma ✅
- [ ] **Stripe Integration**: Already working ✅
- [ ] **Email Service**: Already configured ✅

#### 4. Team Readiness

- [ ] **Developer Availability**: 1-2 developers for 4-6 weeks
- [ ] **QA Resources**: Testing environment and QA engineer
- [ ] **Documentation**: API documentation review with team
- [ ] **Stakeholder Buy-in**: Approval from product/business teams

#### 5. Documentation Review

- [ ] Read: Duffel Stays Getting Started Guide
- [ ] Read: Duffel Stays API Reference
- [ ] Review: Test Hotels Guide
- [ ] Review: Negotiated Rates Guide (if using corporate rates)
- [ ] Test: Make sample API calls with Postman/curl

---

## Next Steps

### Immediate Actions (This Week)

1. **Request Duffel Stays Access**
   - Visit: duffel.com/contact-us
   - Message: "We currently use Duffel for flights and would like to add Stays. Please enable Stays API access for our account."
   - Include: Your Duffel account email

2. **Review Duffel Balance**
   - Login to Duffel dashboard
   - Check current balance
   - Plan top-up if needed for production (coordinate with finance)

3. **Test API Access**
   - Once Stays access granted, test search API:
   ```bash
   curl -X POST https://api.duffel.com/stays/search \
     -H "Authorization: Bearer $DUFFEL_ACCESS_TOKEN" \
     -H "Duffel-Version: v2" \
     -H "Content-Type: application/json" \
     -d '{
       "data": {
         "location": {
           "radius": 2,
           "geographic_coordinates": {
             "latitude": -24.38,
             "longitude": -128.32
           }
         },
         "check_in_date": "2025-11-10",
         "check_out_date": "2025-11-13",
         "guests": [{"type": "adult"}],
         "rooms": 1
       }
     }'
   ```

4. **Kickoff Meeting**
   - Review this work plan with development team
   - Assign responsibilities
   - Set up project tracking (Jira, Trello, etc.)
   - Schedule weekly check-ins

5. **Create Development Branch**
   ```bash
   git checkout -b feature/duffel-stays-integration
   ```

### Week 1 Actions

1. **Start Phase 1**: Backend service layer
   - Create `duffel-stays.service.ts`
   - Create type definitions
   - Implement search method
   - Test with test hotels

2. **Set Up Testing Environment**
   - Create test suite structure
   - Set up automated testing
   - Configure CI/CD for tests

3. **Documentation**
   - Set up technical documentation
   - Document API endpoints
   - Create developer guide

### Week 2-6 Actions

Follow the implementation phases as outlined in this document.

---

## Conclusion

### Why Duffel Stays is the Right Choice

1. **Unified Platform**: Same API as flights (already implemented)
2. **Better Data Quality**: Comprehensive photos, amenities, reviews
3. **Validation Step**: Quote prevents payment failures
4. **Payment Integration**: Seamless with existing Stripe + Bvodo Credits
5. **Corporate Features**: Negotiated rates, loyalty programs
6. **Test Environment**: Dedicated test hotels (Amadeus often returns no offers)
7. **Larger Inventory**: Millions of properties vs Amadeus's 700k
8. **Better Developer Experience**: Clear documentation, modern API

### The Perfect Timing

- Amadeus booking API **not implemented** yet (marked as TODO)
- Database schema **already supports** everything needed
- Frontend UI **already built** and compatible
- Duffel infrastructure **already in place** (flights working)
- Payment workflows **already proven** and tested

### Expected Outcomes

After completing this migration:

✅ **Functional**:
- Full hotel search with rich data
- Complete booking flow (search → quote → book)
- Integrated payments (Stripe + Bvodo Credits)
- Approval workflow for balance payments
- Multi-room booking support

✅ **Quality**:
- Better hotel photos (no Google Places dependency)
- Structured cancellation policies
- Loyalty program integration
- Corporate rate access

✅ **Technical**:
- Unified Duffel platform for flights + hotels
- Reduced vendor complexity
- Better error handling (quote validation)
- Comprehensive testing coverage

### Success Metrics

Track these after launch:
- Hotel booking success rate (target: >95%)
- Quote-to-booking conversion rate
- Average response times (search <5s, booking <10s)
- Payment success rate (target: >98%)
- User satisfaction scores
- Revenue from hotel bookings

---

## Appendix

### Useful Resources

**Duffel Documentation**:
- Getting Started: https://duffel.com/docs/guides/getting-started-with-stays
- API Reference: https://duffel.com/docs/api/v2/accommodation
- Test Hotels: https://duffel.com/docs/guides/test-hotels
- Negotiated Rates: https://duffel.com/docs/guides/negotiated-rates

**Code References**:
- Current Amadeus Service: `backend/src/services/amadeus.service.ts` (Lines 123-266)
- Current Hotel Controller: `backend/src/controllers/hotel.controller.ts`
- Duffel Flight Service: `backend/src/services/duffel.service.ts`
- Payment Controller: `backend/src/controllers/payment.controller.ts`
- Booking Controller: `backend/src/controllers/booking.controller.ts`

**Support**:
- Duffel Support: help@duffel.com
- Duffel Status Page: https://www.duffelstatus.com/

### Glossary

- **Accommodation**: The property/hotel
- **Room**: A specific unit type within the accommodation
- **Rate**: Booking conditions and pricing for a room
- **Search Result**: Result from initial search, contains searchResultId
- **Quote**: Validated rate with locked pricing, ready to book
- **Booking**: Confirmed reservation after payment
- **RAC**: Rate Access Code for negotiated corporate rates
- **Balance**: Duffel prepaid account balance
- **3DS**: 3D Secure authentication for card payments

---

**Document Version**: 1.0
**Last Updated**: October 26, 2025
**Prepared By**: Claude Code Assistant
**For**: Bvodo Corporate Travel Platform
**Contact**: fb.awoniyi@gmail.com

---

**End of Work Plan**

**Ready to proceed?** Start with the "Next Steps" section and request Duffel Stays access today!
