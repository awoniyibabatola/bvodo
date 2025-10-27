/**
 * Duffel API TypeScript Definitions
 *
 * Based on Duffel API documentation: https://duffel.com/docs/api
 * These types represent the core Duffel API structures
 */

// ==================== Common Types ====================

export interface DuffelMeta {
  request_id?: string;
  status?: number;
}

export interface DuffelPagination {
  before?: string;
  after?: string;
  limit?: number;
}

// ==================== Offer Request ====================

export interface DuffelSlice {
  origin: string; // IATA code
  destination: string; // IATA code
  departure_date: string; // YYYY-MM-DD
}

export interface DuffelPassenger {
  type: 'adult' | 'child' | 'infant_without_seat';
  age?: number;
  given_name?: string;
  family_name?: string;
}

export interface DuffelOfferRequestParams {
  slices: DuffelSlice[];
  passengers: DuffelPassenger[];
  cabin_class?: 'economy' | 'premium_economy' | 'business' | 'first';
  max_connections?: number;
  return_offers?: boolean;
}

export interface DuffelOfferRequest {
  id: string;
  live_mode: boolean;
  slices: DuffelSlice[];
  passengers: DuffelPassenger[];
  cabin_class: string;
  created_at: string;
  offers?: DuffelOffer[];
}

// ==================== Offers ====================

export interface DuffelPlace {
  id: string;
  type: 'airport' | 'city';
  name: string;
  iata_code: string;
  iata_city_code?: string;
  city_name?: string;
  city?: {
    name: string;
    iata_code: string;
  };
  time_zone?: string;
}

export interface DuffelAirline {
  id: string;
  name: string;
  iata_code: string;
  logo_symbol_url?: string;
  logo_lockup_url?: string;
}

export interface DuffelAircraft {
  id: string;
  name: string;
  iata_code: string;
}

export interface DuffelSegment {
  id: string;
  aircraft: DuffelAircraft;
  arriving_at: string; // ISO 8601
  departing_at: string; // ISO 8601
  destination: DuffelPlace;
  destination_terminal?: string;
  distance?: string;
  duration?: string; // ISO 8601 duration
  marketing_carrier: DuffelAirline;
  marketing_carrier_flight_number: string;
  operating_carrier: DuffelAirline;
  operating_carrier_flight_number: string;
  origin: DuffelPlace;
  origin_terminal?: string;
  passengers: Array<{
    passenger_id: string;
    cabin_class: string;
    cabin_class_marketing_name: string;
    baggages: Array<{
      type: 'checked' | 'carry_on';
      quantity: number;
    }>;
  }>;
}

export interface DuffelOfferSlice {
  id: string;
  changeable: boolean;
  comparison_key?: string;
  destination: DuffelPlace;
  destination_type: 'airport' | 'city';
  duration?: string; // ISO 8601 duration
  fare_brand_name?: string;
  origin: DuffelPlace;
  origin_type: 'airport' | 'city';
  segments: DuffelSegment[];
}

export interface DuffelOffer {
  id: string;
  allowed_passenger_identity_document_types: string[];
  available_services?: string[];
  base_amount: string;
  base_currency: string;
  booking_requirements?: {
    requires_specific_gender?: boolean;
    passenger_details_required_by?: string;
  };
  cabin_class: string;
  conditions: {
    change_before_departure?: {
      allowed: boolean;
      penalty_amount?: string;
      penalty_currency?: string;
    };
    refund_before_departure?: {
      allowed: boolean;
      penalty_amount?: string;
      penalty_currency?: string;
    };
  };
  created_at: string;
  expires_at: string;
  live_mode: boolean;
  owner: DuffelAirline;
  partial: boolean;
  passenger_identity_documents_required: boolean;
  passengers: Array<{
    id: string;
    type: string;
    given_name?: string;
    family_name?: string;
  }>;
  payment_requirements: {
    payment_required_by?: string;
    requires_instant_payment: boolean;
    price_guarantee_expires_at?: string;
  };
  slices: DuffelOfferSlice[];
  supported_passenger_identity_document_types: string[];
  tax_amount: string;
  tax_currency: string;
  total_amount: string;
  total_currency: string;
  total_emissions_kg?: string;
}

// ==================== Order ====================

export interface DuffelOrderPassenger {
  id?: string;
  type: 'adult' | 'child' | 'infant_without_seat';
  title?: string;
  given_name: string;
  family_name: string;
  gender?: 'm' | 'f';  // Duffel uses 'm' and 'f', not 'male' and 'female'
  born_on: string; // YYYY-MM-DD
  email?: string;
  phone_number?: string;
  identity_documents?: Array<{
    type: 'passport' | 'tax_id' | 'known_traveler_number' | 'passenger_redress_number';
    unique_identifier: string;
    expires_on?: string; // YYYY-MM-DD
    issuing_country_code?: string;
  }>;
  loyalty_programme_accounts?: Array<{
    airline_iata_code: string;
    account_number: string;
  }>;
}

export interface DuffelPayment {
  type: 'balance' | 'arc_bsp_cash' | 'card';
  amount: string;
  currency: string;
}

export interface DuffelOrderCreateParams {
  selected_offers: string[];
  passengers: DuffelOrderPassenger[];
  payments?: DuffelPayment[];
  services?: Array<{
    id: string;
    quantity: number;
  }>;
  metadata?: Record<string, any>;
}

export interface DuffelOrder {
  id: string;
  live_mode: boolean;
  booking_reference: string;
  created_at: string;
  owner: DuffelAirline;
  passengers: DuffelOrderPassenger[];
  slices: DuffelOfferSlice[];
  base_amount: string;
  base_currency: string;
  tax_amount: string;
  tax_currency: string;
  total_amount: string;
  total_currency: string;
  conditions: {
    change_before_departure?: any;
    refund_before_departure?: any;
  };
  metadata?: Record<string, any>;
  payment_status: {
    awaiting_payment: boolean;
    payment_required_by?: string;
    price_guarantee_expires_at?: string;
  };
  documents?: Array<{
    type: 'ticket' | 'electronic_ticket';
    passenger_id: string;
    unique_identifier: string;
  }>;
  available_actions?: string[];
  services?: any[];
}

// ==================== Seat Maps ====================

export interface DuffelSeatMapCabinRow {
  sections: Array<{
    elements: Array<{
      type: 'seat' | 'bassinet' | 'empty' | 'exit_row' | 'lavatory' | 'galley';
      available_services?: Array<{
        id: string;
        total_amount: string;
        total_currency: string;
      }>;
      designator?: string;
      name?: string;
      disclosures?: string[];
    }>;
  }>;
}

export interface DuffelSeatMapCabin {
  aisles: number;
  cabin_class: string;
  deck: number;
  rows: DuffelSeatMapCabinRow[];
  wings?: {
    first_row_index: number;
    last_row_index: number;
  };
}

export interface DuffelSeatMap {
  id: string;
  slice_id: string;
  segment_id: string;
  cabins: DuffelSeatMapCabin[];
}

// ==================== API Response Types ====================

export interface DuffelApiResponse<T> {
  data: T;
  meta?: DuffelMeta;
}

export interface DuffelApiListResponse<T> {
  data: T[];
  meta?: DuffelMeta;
  links?: {
    next?: string;
    prev?: string;
  };
}

export interface DuffelApiError {
  errors: Array<{
    type: string;
    title: string;
    message: string;
    documentation_url?: string;
    code?: string;
  }>;
  meta?: DuffelMeta;
}
