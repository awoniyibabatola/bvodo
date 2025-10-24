/**
 * Flight Provider Interface
 *
 * This interface defines the contract that all flight providers (Amadeus, Duffel, etc.)
 * must implement to ensure consistent behavior across different providers.
 */

// ==================== Common Types ====================

export type TravelClass = 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
export type ProviderType = 'amadeus' | 'duffel';

// ==================== Search Parameters ====================

export interface FlightSearchParams {
  originLocationCode: string;
  destinationLocationCode: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  children?: number;
  infants?: number;
  travelClass?: TravelClass;
  nonStop?: boolean;
  currencyCode?: string;
  maxPrice?: number;
  max?: number;
}

// ==================== Standardized Flight Offer ====================

export interface StandardizedFlightSegment {
  id: string;
  airline: string;
  airlineCode: string;
  flightNumber: string;

  departure: {
    airport: string;
    airportCode: string;
    city: string;
    terminal?: string;
    time: string; // ISO 8601
  };

  arrival: {
    airport: string;
    airportCode: string;
    city: string;
    terminal?: string;
    time: string; // ISO 8601
  };

  duration: string; // e.g., "PT5H30M" or "5h 30m"
  stops: number;
  cabinClass: string;

  aircraft?: {
    code: string;
    name: string;
  };

  baggage?: {
    checked?: string;
    carryOn?: string;
  };
}

export interface StandardizedFlightOffer {
  id: string; // Provider's offer ID
  provider: ProviderType;

  // Pricing
  price: {
    total: number;
    base: number;
    taxes: number;
    currency: string;
  };

  // Segments
  outbound: StandardizedFlightSegment[];
  inbound?: StandardizedFlightSegment[]; // For round trips

  // Metadata
  validatingAirline: string;
  validatingAirlineCode: string;
  isRefundable: boolean;
  isChangeable: boolean;
  lastTicketingDate?: string;

  // Seats and availability
  numberOfBookableSeats: number;

  // Provider-specific data (stored as-is for booking)
  rawData: any;
}

// ==================== Booking Parameters ====================

export interface PassengerDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;

  // Address
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;

  // Passport (for international flights)
  passportNumber?: string;
  passportExpiry?: string;
  passportCountry?: string;

  // Passenger type (Duffel format)
  type?: 'adult' | 'child' | 'infant_without_seat';

  // Gender (required for flights)
  gender?: 'm' | 'f';

  // Special requests
  specialRequests?: string[];
}

export interface CreateBookingParams {
  offerId: string;
  passengers: PassengerDetails[];

  // Contact info (may differ from passengers)
  contactEmail?: string;
  contactPhone?: string;

  // Payment info (if needed)
  paymentMethod?: {
    type: 'credit_card' | 'debit_card' | 'company_credit';
    details?: any;
  };

  // Ancillaries (seats, bags, etc.)
  ancillaries?: {
    seats?: Array<{
      segmentId: string;
      passengerId: string;
      seatNumber: string;
    }>;
    extraBaggage?: Array<{
      segmentId: string;
      passengerId: string;
      quantity: number;
    }>;
  };

  // Direct service IDs from Duffel (alternative to ancillaries)
  services?: Array<{
    id: string;      // Service ID from seat map or available_services
    quantity: number; // Always 1 for seats, can be > 1 for baggage
  }>;
}

// ==================== Booking Confirmation ====================

export interface BookingConfirmation {
  bookingReference: string; // PNR or Order ID
  provider: ProviderType;

  status: 'confirmed' | 'pending' | 'failed';

  // Flight details
  flights: StandardizedFlightOffer;

  // Passenger details
  passengers: PassengerDetails[];

  // Pricing
  totalPrice: {
    amount: number;
    currency: string;
  };

  // Booking metadata
  bookingDate: string;
  ticketingDeadline?: string;

  // Tickets (if issued)
  tickets?: Array<{
    passengerId: string;
    ticketNumber: string;
  }>;

  // Provider-specific data
  rawData: any;
}

// ==================== Seat Maps ====================

export interface SeatMap {
  segmentId: string;
  cabins: Array<{
    cabinClass: string;
    rows: Array<{
      seats: Array<{
        designator: string;
        available: boolean;
        type: 'seat' | 'bassinet' | 'empty' | 'exit_row' | 'lavatory' | 'galley';
        serviceId?: string;
        price?: {
          amount: number;
          currency: string;
        };
        disclosures?: string[]; // e.g., ["window", "extra_legroom", "exit row"]
      }>;
    }>;
  }>;
}

// ==================== Available Services (Ancillaries) ====================

export interface AvailableService {
  id: string;
  type: 'baggage' | 'seat' | 'meal' | 'lounge' | 'other';
  description: string;
  price: {
    amount: number;
    currency: string;
  };
  segmentIds?: string[];
  passengerIds?: string[];
  maxQuantity?: number;
  metadata?: any;
}

// ==================== Flight Provider Interface ====================

export interface IFlightProvider {
  /**
   * Provider identifier
   */
  readonly providerName: ProviderType;

  /**
   * Search for flight offers
   */
  searchFlights(params: FlightSearchParams): Promise<StandardizedFlightOffer[]>;

  /**
   * Get detailed information about a specific offer
   */
  getOfferDetails(offerId: string): Promise<StandardizedFlightOffer>;

  /**
   * Create a flight booking
   */
  createBooking(params: CreateBookingParams): Promise<BookingConfirmation>;

  /**
   * Get seat maps for an offer (optional - not all providers support this)
   */
  getSeatMaps?(offerId: string): Promise<SeatMap[]>;

  /**
   * Get available ancillary services (optional)
   */
  getAvailableServices?(offerId: string): Promise<AvailableService[]>;

  /**
   * Cancel a booking (optional)
   */
  cancelBooking?(bookingReference: string): Promise<{
    success: boolean;
    refundAmount?: number;
    refundCurrency?: string;
  }>;
}
