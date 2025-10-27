/**
 * Duffel Stays API Type Definitions
 * API Documentation: https://duffel.com/docs/api/v2/accommodation
 */

// ============================================================================
// SEARCH TYPES
// ============================================================================

export interface DuffelStaysLocation {
  radius: number; // Radius in kilometers
  geographic_coordinates: {
    latitude: number;
    longitude: number;
  };
}

export interface DuffelStaysGuest {
  type: 'adult' | 'child';
  age?: number; // Required for children (under 18)
}

export interface DuffelStaysSearchParams {
  location: DuffelStaysLocation;
  check_in_date: string; // ISO 8601 date (YYYY-MM-DD)
  check_out_date: string; // ISO 8601 date (YYYY-MM-DD)
  guests: DuffelStaysGuest[];
  rooms: number;
  negotiated_rate_codes?: string[]; // Optional RACs for corporate rates
}

export interface DuffelStaysSearchResult {
  id: string; // Search result ID (used to fetch rates)
  accommodation: {
    id: string;
    name: string;
    location: {
      geographic_coordinates: {
        latitude: number;
        longitude: number;
      };
    };
  };
  cheapest_rate: {
    id: string;
    total_amount: string;
    total_currency: string;
  };
}

// ============================================================================
// ACCOMMODATION & RATES TYPES
// ============================================================================

export interface DuffelStaysPhoto {
  url: string;
}

export interface DuffelStaysAmenity {
  type: string; // e.g., "wifi", "parking", "pool", "gym"
  description: string;
}

export interface DuffelStaysAddress {
  line_one: string;
  line_two?: string;
  city_name: string;
  postal_code?: string;
  region?: string;
  country_code: string;
}

export interface DuffelStaysLocation {
  geographic_coordinates: {
    latitude: number;
    longitude: number;
  };
}

export interface DuffelStaysCancellationTimelinePeriod {
  before: string; // ISO 8601 datetime
  refund_amount: string; // Amount refunded if cancelled before this time
  refund_currency: string;
}

export interface DuffelStaysCancellationTimeline {
  timeline: DuffelStaysCancellationTimelinePeriod[];
}

export interface DuffelStaysRate {
  id: string; // Rate ID (used to create quote)
  total_amount: string;
  total_currency: string;
  tax_amount: string;
  base_amount: string;
  room: {
    id: string;
    name: string;
    description?: string;
    photos: DuffelStaysPhoto[];
    bed_type?: string;
    bed_count?: number;
  };
  cancellation_timeline: DuffelStaysCancellationTimeline;
  supported_loyalty_programmes?: string[]; // e.g., ["marriott_bonvoy", "hilton_honors"]
}

export interface DuffelStaysAccommodation {
  id: string;
  name: string;
  description?: string;
  photos: DuffelStaysPhoto[];
  rating?: number; // Star rating (1-5)
  amenities: DuffelStaysAmenity[];
  location: DuffelStaysLocation;
  address: DuffelStaysAddress;
  rooms: {
    id: string;
    name: string;
    description?: string;
    photos: DuffelStaysPhoto[];
    rates: DuffelStaysRate[];
  }[];
}

// ============================================================================
// QUOTE TYPES
// ============================================================================

export interface DuffelStaysQuoteParams {
  rate_id: string;
}

export interface DuffelStaysQuote {
  id: string; // Quote ID (used to create booking)
  rate_id: string;
  total_amount: string;
  total_currency: string;
  tax_amount: string;
  base_amount: string;
  accommodation: DuffelStaysAccommodation;
  room: {
    id: string;
    name: string;
    description?: string;
    photos: DuffelStaysPhoto[];
  };
  check_in_date: string;
  check_out_date: string;
  guests: DuffelStaysGuest[];
  expires_at: string; // ISO 8601 datetime
  cancellation_timeline: DuffelStaysCancellationTimeline;
}

// ============================================================================
// BOOKING TYPES
// ============================================================================

export interface DuffelStaysBookingGuest {
  given_name: string; // First name
  family_name: string; // Last name
  born_on?: string; // ISO 8601 date (YYYY-MM-DD) - Required for children
  email?: string; // Optional, at least one guest needs email
  phone_number?: string; // Optional
}

export interface DuffelStaysBookingParams {
  quote_id: string;
  email: string; // Primary contact email
  phone_number: string; // Primary contact phone
  guests: DuffelStaysBookingGuest[];
  accommodation_special_requests?: string;
  loyalty_programme?: {
    airline_iata_code?: string;
    number: string;
  };
}

export interface DuffelStaysBooking {
  id: string; // Booking ID
  quote_id: string;
  accommodation: DuffelStaysAccommodation;
  room: {
    id: string;
    name: string;
    description?: string;
    photos: DuffelStaysPhoto[];
  };
  check_in_date: string;
  check_out_date: string;
  guests: DuffelStaysBookingGuest[];
  total_amount: string;
  total_currency: string;
  tax_amount: string;
  base_amount: string;
  status: 'confirmed' | 'cancelled' | 'pending';
  confirmation_number?: string;
  cancellation_timeline: DuffelStaysCancellationTimeline;
  special_requests?: string;
  key_collection?: {
    type: string;
    instructions: string;
  };
  created_at: string;
  updated_at: string;
}

// ============================================================================
// CANCELLATION TYPES
// ============================================================================

export interface DuffelStaysCancellation {
  id: string;
  booking_id: string;
  refund_amount: string;
  refund_currency: string;
  cancelled_at: string;
}

// ============================================================================
// API RESPONSE WRAPPERS
// ============================================================================

export interface DuffelStaysApiResponse<T> {
  data: T;
}

export interface DuffelStaysApiListResponse<T> {
  data: T[];
  meta?: {
    limit?: number;
    after?: string;
    before?: string;
  };
}

export interface DuffelStaysApiError {
  errors: Array<{
    type: string;
    title: string;
    detail?: string;
    code?: string;
    status?: number;
  }>;
  meta?: {
    request_id?: string;
    status?: number;
  };
}
