import axios, { AxiosInstance, AxiosError } from 'axios';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import {
  DuffelStaysSearchParams,
  DuffelStaysSearchResult,
  DuffelStaysAccommodation,
  DuffelStaysQuote,
  DuffelStaysQuoteParams,
  DuffelStaysBooking,
  DuffelStaysBookingParams,
  DuffelStaysCancellation,
  DuffelStaysApiResponse,
  DuffelStaysApiListResponse,
  DuffelStaysApiError,
} from '../types/duffel-stays';

/**
 * Duffel Stays Service
 *
 * Handles all hotel/accommodation operations via Duffel Stays API
 * API Documentation: https://duffel.com/docs/api/v2/accommodation
 */
export class DuffelStaysService {
  private client: AxiosInstance;
  private readonly baseURL: string;

  constructor() {
    // Use same base URL as Duffel flights
    this.baseURL = 'https://api.duffel.com';

    // Create axios instance with Duffel configuration
    // Reuses same authentication and headers as DuffelService (flights)
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Duffel-Version': 'v2',
        'Authorization': `Bearer ${env.DUFFEL_ACCESS_TOKEN}`,
      },
      timeout: 30000, // 30 seconds
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<DuffelStaysApiError>) => {
        this.handleApiError(error);
        return Promise.reject(error);
      }
    );

    logger.info('DuffelStaysService initialized', {
      environment: env.DUFFEL_ENVIRONMENT,
      baseURL: this.baseURL,
    });
  }

  /**
   * Search for accommodations
   *
   * @param params - Search parameters (location, dates, guests, rooms)
   * @returns Array of search results with cheapest rates
   */
  async searchAccommodation(params: {
    latitude: number;
    longitude: number;
    radius?: number; // Default: 5 km
    checkInDate: string;
    checkOutDate: string;
    guests: Array<{ type: 'adult' | 'child'; age?: number }>;
    rooms: number;
    negotiatedRateCodes?: string[];
  }): Promise<DuffelStaysSearchResult[]> {
    try {
      logger.info('Searching accommodations', {
        latitude: params.latitude,
        longitude: params.longitude,
        checkIn: params.checkInDate,
        checkOut: params.checkOutDate,
        guests: params.guests.length,
        rooms: params.rooms,
      });

      const searchParams: DuffelStaysSearchParams = {
        location: {
          radius: params.radius || 5,
          geographic_coordinates: {
            latitude: params.latitude,
            longitude: params.longitude,
          },
        },
        check_in_date: params.checkInDate,
        check_out_date: params.checkOutDate,
        guests: params.guests,
        rooms: params.rooms,
      };

      // Add negotiated rate codes if provided (for corporate rates)
      if (params.negotiatedRateCodes && params.negotiatedRateCodes.length > 0) {
        searchParams.negotiated_rate_codes = params.negotiatedRateCodes;
      }

      const response = await this.client.post<DuffelStaysApiListResponse<DuffelStaysSearchResult>>(
        '/stays/search',
        { data: searchParams }
      );

      const searchResults = response.data.data;

      logger.info(`Found ${searchResults.length} accommodations`, {
        count: searchResults.length,
      });

      return searchResults;
    } catch (error) {
      logger.error('Error searching accommodations:', error);
      throw this.createServiceError('Failed to search accommodations', error);
    }
  }

  /**
   * Get all rates for a specific search result
   *
   * @param searchResultId - The search result ID from searchAccommodation()
   * @returns Full accommodation data with all rooms and rates
   */
  async getRatesForSearchResult(searchResultId: string): Promise<DuffelStaysAccommodation> {
    try {
      logger.info('Fetching rates for search result', { searchResultId });

      const response = await this.client.get<DuffelStaysApiResponse<DuffelStaysAccommodation>>(
        `/stays/search_results/${searchResultId}/rates`
      );

      const accommodation = response.data.data;

      logger.info('Rates fetched successfully', {
        accommodationId: accommodation.id,
        accommodationName: accommodation.name,
        roomCount: accommodation.rooms?.length || 0,
      });

      return accommodation;
    } catch (error) {
      logger.error('Error fetching rates:', error);
      throw this.createServiceError('Failed to fetch rates for accommodation', error);
    }
  }

  /**
   * Create a quote to validate availability and lock pricing
   *
   * IMPORTANT: Quote must be created before booking to ensure:
   * 1. Rate is still available
   * 2. Price hasn't changed
   * 3. Inventory is reserved temporarily
   *
   * @param rateId - The rate ID from getRatesForSearchResult()
   * @returns Quote object with quoteId (required for booking)
   */
  async createQuote(rateId: string): Promise<DuffelStaysQuote> {
    try {
      logger.info('Creating quote', { rateId });

      const quoteParams: DuffelStaysQuoteParams = {
        rate_id: rateId,
      };

      const response = await this.client.post<DuffelStaysApiResponse<DuffelStaysQuote>>(
        '/stays/quotes',
        { data: quoteParams }
      );

      const quote = response.data.data;

      logger.info('Quote created successfully', {
        quoteId: quote.id,
        totalAmount: quote.total_amount,
        currency: quote.total_currency,
        expiresAt: quote.expires_at,
      });

      return quote;
    } catch (error) {
      logger.error('Error creating quote:', error);
      throw this.createServiceError('Failed to create quote. Rate may no longer be available.', error);
    }
  }

  /**
   * Get an existing quote by ID
   *
   * @param quoteId - The quote ID
   * @returns Quote object
   */
  async getQuote(quoteId: string): Promise<DuffelStaysQuote> {
    try {
      logger.info('Fetching quote', { quoteId });

      const response = await this.client.get<DuffelStaysApiResponse<DuffelStaysQuote>>(
        `/stays/quotes/${quoteId}`
      );

      const quote = response.data.data;

      logger.info('Quote fetched successfully', {
        quoteId: quote.id,
        expiresAt: quote.expires_at,
      });

      return quote;
    } catch (error) {
      logger.error('Error fetching quote:', error);
      throw this.createServiceError('Failed to fetch quote. Quote may have expired.', error);
    }
  }

  /**
   * Create a booking from a quote
   *
   * IMPORTANT: This is the final step that confirms the reservation
   * and charges the Duffel balance. Only call this after:
   * 1. Quote has been created and validated
   * 2. Payment has been collected (Stripe) OR approved (Bvodo Credits)
   *
   * @param params - Booking parameters (quoteId, guests, contact info)
   * @returns Confirmed booking
   */
  async createBooking(params: DuffelStaysBookingParams): Promise<DuffelStaysBooking> {
    try {
      logger.info('Creating booking', {
        quoteId: params.quote_id,
        guestCount: params.guests.length,
      });

      const response = await this.client.post<DuffelStaysApiResponse<DuffelStaysBooking>>(
        '/stays/bookings',
        { data: params }
      );

      const booking = response.data.data;

      logger.info('Booking created successfully', {
        bookingId: booking.id,
        status: booking.status,
        confirmationNumber: booking.confirmation_number,
        totalAmount: booking.total_amount,
        currency: booking.total_currency,
      });

      return booking;
    } catch (error) {
      logger.error('Error creating booking:', error);
      throw this.createServiceError('Failed to create booking. Quote may have expired or payment failed.', error);
    }
  }

  /**
   * Get booking details by ID
   *
   * @param bookingId - The booking ID
   * @returns Booking object
   */
  async getBooking(bookingId: string): Promise<DuffelStaysBooking> {
    try {
      logger.info('Fetching booking', { bookingId });

      const response = await this.client.get<DuffelStaysApiResponse<DuffelStaysBooking>>(
        `/stays/bookings/${bookingId}`
      );

      const booking = response.data.data;

      logger.info('Booking fetched successfully', {
        bookingId: booking.id,
        status: booking.status,
      });

      return booking;
    } catch (error) {
      logger.error('Error fetching booking:', error);
      throw this.createServiceError('Failed to fetch booking', error);
    }
  }

  /**
   * Cancel a booking
   *
   * @param bookingId - The booking ID to cancel
   * @returns Cancellation confirmation with refund details
   */
  async cancelBooking(bookingId: string): Promise<DuffelStaysCancellation> {
    try {
      logger.info('Cancelling booking', { bookingId });

      const response = await this.client.post<DuffelStaysApiResponse<DuffelStaysCancellation>>(
        `/stays/bookings/${bookingId}/cancellations`,
        {}
      );

      const cancellation = response.data.data;

      logger.info('Booking cancelled successfully', {
        cancellationId: cancellation.id,
        refundAmount: cancellation.refund_amount,
        refundCurrency: cancellation.refund_currency,
      });

      return cancellation;
    } catch (error) {
      logger.error('Error cancelling booking:', error);
      throw this.createServiceError('Failed to cancel booking', error);
    }
  }

  /**
   * Refresh an expired quote
   *
   * Attempts to create a new quote with the same rate.
   * Useful when a quote expires during approval workflow.
   *
   * @param expiredQuote - The expired quote object
   * @returns New quote with fresh expiry time
   */
  async refreshQuote(expiredQuote: DuffelStaysQuote): Promise<DuffelStaysQuote> {
    try {
      logger.info('Refreshing expired quote', {
        oldQuoteId: expiredQuote.id,
        rateId: expiredQuote.rate_id,
      });

      const newQuote = await this.createQuote(expiredQuote.rate_id);

      logger.info('Quote refreshed successfully', {
        oldQuoteId: expiredQuote.id,
        newQuoteId: newQuote.id,
        oldAmount: expiredQuote.total_amount,
        newAmount: newQuote.total_amount,
        priceChanged: expiredQuote.total_amount !== newQuote.total_amount,
      });

      return newQuote;
    } catch (error) {
      logger.error('Error refreshing quote:', error);
      throw this.createServiceError('Failed to refresh quote. Rate may no longer be available.', error);
    }
  }

  /**
   * Validate if a quote is still valid (not expired)
   *
   * @param quote - Quote object to validate
   * @returns true if valid, false if expired
   */
  isQuoteValid(quote: DuffelStaysQuote): boolean {
    const now = new Date();
    const expiresAt = new Date(quote.expires_at);
    return expiresAt > now;
  }

  /**
   * Handle API errors and format them consistently
   */
  private handleApiError(error: AxiosError<DuffelStaysApiError>): void {
    if (error.response?.data?.errors) {
      const errors = error.response.data.errors;
      const errorMessages = errors.map(err => `${err.title}: ${err.detail || 'No details'}`);
      logger.error('Duffel Stays API error', {
        status: error.response.status,
        errors: errorMessages,
        requestId: error.response.data.meta?.request_id,
      });
    } else {
      logger.error('Duffel Stays network error', {
        message: error.message,
        code: error.code,
      });
    }
  }

  /**
   * Create a standardized service error
   */
  private createServiceError(message: string, originalError: any): Error {
    const error = new Error(message);
    error.name = 'DuffelStaysServiceError';
    (error as any).originalError = originalError;
    return error;
  }
}

// Export singleton instance
export const duffelStaysService = new DuffelStaysService();

// Named export for dependency injection
export default DuffelStaysService;
