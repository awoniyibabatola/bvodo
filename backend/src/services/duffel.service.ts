import axios, { AxiosInstance } from 'axios';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import {
  IFlightProvider,
  FlightSearchParams,
  StandardizedFlightOffer,
  StandardizedFlightSegment,
  CreateBookingParams,
  BookingConfirmation,
  SeatMap,
  AvailableService,
} from '../interfaces/flight-provider.interface';
import {
  DuffelOfferRequestParams,
  DuffelOffer,
  DuffelOrder,
  DuffelOrderCreateParams,
  DuffelOrderPassenger,
  DuffelApiResponse,
  DuffelApiListResponse,
  DuffelSeatMap,
} from '../types/duffel.d';

/**
 * Duffel Flight Provider Service
 *
 * Implements the IFlightProvider interface for Duffel API
 * API Documentation: https://duffel.com/docs/api
 */
export class DuffelService implements IFlightProvider {
  readonly providerName = 'duffel' as const;
  private client: AxiosInstance;
  private readonly baseURL: string;

  constructor() {
    // Determine base URL based on environment
    this.baseURL =
      env.DUFFEL_ENVIRONMENT === 'production'
        ? 'https://api.duffel.com'
        : 'https://api.duffel.com'; // Duffel uses same URL for test/prod, differentiates by token

    // Create axios instance with Duffel configuration
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

    // Add request/response interceptors for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.info(`[Duffel] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('[Duffel] Request error:', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        logger.info(`[Duffel] Response: ${response.status}`);
        return response;
      },
      (error) => {
        logger.error('[Duffel] Response error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Search for flight offers
   */
  async searchFlights(params: FlightSearchParams): Promise<StandardizedFlightOffer[]> {
    try {
      logger.info('[Duffel] Searching flights:', params);

      // Step 1: Create an Offer Request
      const offerRequestParams = this.buildOfferRequestParams(params);

      const { data: offerRequestResponse } = await this.client.post<DuffelApiResponse<any>>(
        '/air/offer_requests',
        { data: offerRequestParams }
      );

      const offerRequestId = offerRequestResponse.data.id;
      logger.info(`[Duffel] Created offer request: ${offerRequestId}`);

      // Step 2: Fetch offers from the offer request
      const { data: offersResponse } = await this.client.get<DuffelApiListResponse<DuffelOffer>>(
        `/air/offers?offer_request_id=${offerRequestId}&sort=total_amount`
      );

      logger.info(`[Duffel] Found ${offersResponse.data.length} offers`);

      // Step 3: Transform to standardized format
      const standardizedOffers = offersResponse.data.map((offer) =>
        this.transformDuffelOfferToStandard(offer)
      );

      // Step 4: Apply max results limit if specified
      const maxResults = params.max || 50;
      return standardizedOffers.slice(0, maxResults);
    } catch (error: any) {
      logger.error('[Duffel] Flight search error:', error.response?.data || error);
      throw new Error(
        error.response?.data?.errors?.[0]?.message || 'Failed to search flights with Duffel'
      );
    }
  }

  /**
   * Get detailed information about a specific offer
   */
  async getOfferDetails(offerId: string): Promise<StandardizedFlightOffer> {
    try {
      logger.info(`[Duffel] Fetching offer details: ${offerId}`);

      const { data: response } = await this.client.get<DuffelApiResponse<DuffelOffer>>(
        `/air/offers/${offerId}`
      );

      // Check if offer has expired
      const offer = response.data;
      const expiresAt = new Date(offer.expires_at);
      const now = new Date();

      if (expiresAt <= now) {
        logger.error(`[Duffel] Offer ${offerId} has expired at ${offer.expires_at}`);
        throw new Error(`Offer has expired at ${offer.expires_at}`);
      }

      logger.info(`[Duffel] Offer ${offerId} is valid until ${offer.expires_at}`);
      return this.transformDuffelOfferToStandard(response.data);
    } catch (error: any) {
      logger.error('[Duffel] Get offer details error:', error.response?.data || error);
      throw new Error(error.message || 'Failed to get offer details');
    }
  }

  /**
   * Create a flight booking
   */
  async createBooking(params: CreateBookingParams): Promise<BookingConfirmation> {
    try {
      logger.info('[Duffel] Creating booking:', { offerId: params.offerId });

      // Get the offer first to get passenger IDs
      const { data: offerResponse } = await this.client.get<DuffelApiResponse<DuffelOffer>>(
        `/air/offers/${params.offerId}`
      );
      const offer = offerResponse.data;

      // Check if offer has expired BEFORE attempting to create order
      const expiresAt = new Date(offer.expires_at);
      const now = new Date();

      if (expiresAt <= now) {
        const expiredMinutesAgo = Math.floor((now.getTime() - expiresAt.getTime()) / 60000);
        logger.error(`[Duffel] Offer ${params.offerId} expired ${expiredMinutesAgo} minutes ago at ${offer.expires_at}`);
        throw new Error(
          `This flight offer has expired ${expiredMinutesAgo} minutes ago. ` +
          `Flight offers are only valid for 5-15 minutes. ` +
          `Please search for flights again to get fresh availability and pricing.`
        );
      }

      const minutesUntilExpiry = Math.floor((expiresAt.getTime() - now.getTime()) / 60000);
      logger.info(`[Duffel] Offer ${params.offerId} is valid for ${minutesUntilExpiry} more minutes (expires at ${offer.expires_at})`);

      // Warn if offer will expire very soon
      if (minutesUntilExpiry < 2) {
        logger.warn(`[Duffel] WARNING: Offer expires in less than 2 minutes! This booking may fail.`);
      }

      // Transform passengers to Duffel format, mapping to offer passenger IDs
      const duffelPassengers = this.transformPassengersToDuffel(params.passengers, offer.passengers);

      // Calculate total amount including services
      let totalAmount = parseFloat(offer.total_amount);
      let servicesTotal = 0;
      let validServices: Array<{ id: string; quantity: number }> = [];

      if (params.services && params.services.length > 0) {
        logger.info(`[Duffel] Checking ${params.services.length} services`);

        // Fetch available services once to get pricing
        try {
          const serviceResponse = await this.client.get<DuffelApiResponse<any>>(
            `/air/offers/${params.offerId}?return_available_services=true`
          );
          const availableServices = serviceResponse.data.data.available_services || [];

          // Calculate total cost of selected services and filter out unavailable ones
          for (const service of params.services) {
            const matchedService = availableServices.find((s: any) => s.id === service.id);

            if (matchedService) {
              const servicePrice = parseFloat(matchedService.total_amount) * service.quantity;
              servicesTotal += servicePrice;
              validServices.push({ id: service.id, quantity: service.quantity });
              logger.info(`[Duffel] Service ${service.id}: ${matchedService.total_amount} x ${service.quantity} = ${servicePrice}`);
            } else {
              logger.warn(`[Duffel] Service ${service.id} not found in available services, excluding from order`);
            }
          }

          totalAmount += servicesTotal;
          logger.info(`[Duffel] Base offer: ${offer.total_amount}, Services: ${servicesTotal}, Total: ${totalAmount}`);
          logger.info(`[Duffel] Valid services: ${validServices.length}/${params.services.length}`);
        } catch (error) {
          logger.warn(`[Duffel] Could not fetch service prices, proceeding without services`);
          validServices = []; // Don't send any services if we can't validate them
        }
      }

      // Build order create params with correct payment amount
      const orderParams: DuffelOrderCreateParams = {
        selected_offers: [params.offerId],
        passengers: duffelPassengers,
        payments: [
          {
            type: 'arc_bsp_cash', // Standard payment method that works in test/production
            amount: totalAmount.toFixed(2), // Include only valid services in payment amount
            currency: offer.total_currency,
          },
        ],
        services: validServices.length > 0 ? validServices : undefined, // Only include valid services
        metadata: {
          contact_email: params.contactEmail,
          contact_phone: params.contactPhone,
        },
      };

      // Create the order
      const { data: response } = await this.client.post<DuffelApiResponse<DuffelOrder>>(
        '/air/orders',
        { data: orderParams }
      );

      const order = response.data;
      logger.info(`[Duffel] Order created: ${order.id}, PNR: ${order.booking_reference}`);

      // Transform to standardized booking confirmation
      return this.transformDuffelOrderToConfirmation(order, params);
    } catch (error: any) {
      logger.error('[Duffel] Create booking error:', error.response?.data || error);

      // Log the full error for debugging
      console.log('\n=== DUFFEL ERROR DEBUG ===');
      console.log('Status:', error.response?.status);
      console.log('Full response data:', JSON.stringify(error.response?.data, null, 2));
      console.log('=========================\n');

      // Extract the full error details
      const errorMessage = error.response?.data?.errors?.[0]?.message || 'Failed to create booking with Duffel';
      const errorDetails = error.response?.data?.errors || [];

      throw new Error(errorMessage);
    }
  }

  /**
   * Get seat maps for an offer
   */
  async getSeatMaps(offerId: string): Promise<SeatMap[]> {
    try {
      logger.info(`[Duffel] Fetching seat maps for offer: ${offerId}`);

      const { data: response } = await this.client.get<DuffelApiListResponse<DuffelSeatMap>>(
        `/air/seat_maps?offer_id=${offerId}`
      );

      // Transform Duffel seat maps to standardized format
      return response.data.map((seatMap) => this.transformDuffelSeatMap(seatMap));
    } catch (error: any) {
      logger.error('[Duffel] Get seat maps error:', error.response?.data || error);
      throw new Error('Failed to get seat maps');
    }
  }

  /**
   * Get available ancillary services (baggage, meals, etc.)
   */
  async getAvailableServices(offerId: string): Promise<AvailableService[]> {
    try {
      logger.info(`[Duffel] Fetching available services for offer: ${offerId}`);

      // Fetch the offer WITH available services
      const { data: response } = await this.client.get<DuffelApiResponse<any>>(
        `/air/offers/${offerId}?return_available_services=true`
      );

      const offer = response.data;
      const services: AvailableService[] = [];

      // Extract and transform available services from offer
      if (offer.available_services && Array.isArray(offer.available_services)) {
        logger.info(`[Duffel] Found ${offer.available_services.length} available services`);

        offer.available_services.forEach((service: any) => {
          services.push({
            id: service.id,
            type: service.type || 'baggage', // e.g., 'baggage', 'meal', etc.
            description: service.metadata?.type || service.type || 'Additional service',
            price: {
              amount: parseFloat(service.total_amount),
              currency: service.total_currency,
            },
            segmentIds: service.segment_ids || [],
            passengerIds: service.passenger_ids || [],
            maxQuantity: service.maximum_quantity || 1,
          });
        });
      } else {
        logger.info('[Duffel] No available services found for this offer');
      }

      return services;
    } catch (error: any) {
      logger.error('[Duffel] Get available services error:', error.response?.data || error);
      return [];
    }
  }

  // ==================== Helper Methods ====================

  /**
   * Convert country name to ISO 3166-1 alpha-2 code
   */
  private countryNameToCode(countryName: string): string {
    const countryMap: Record<string, string> = {
      'canada': 'CA',
      'united states': 'US',
      'usa': 'US',
      'united kingdom': 'GB',
      'uk': 'GB',
      'australia': 'AU',
      'new zealand': 'NZ',
      'india': 'IN',
      'china': 'CN',
      'japan': 'JP',
      'south korea': 'KR',
      'korea': 'KR',
      'france': 'FR',
      'germany': 'DE',
      'italy': 'IT',
      'spain': 'ES',
      'mexico': 'MX',
      'brazil': 'BR',
      'argentina': 'AR',
      'south africa': 'ZA',
      'nigeria': 'NG',
      'kenya': 'KE',
      'egypt': 'EG',
      'netherlands': 'NL',
      'belgium': 'BE',
      'switzerland': 'CH',
      'sweden': 'SE',
      'norway': 'NO',
      'denmark': 'DK',
      'finland': 'FI',
      'ireland': 'IE',
      'portugal': 'PT',
      'poland': 'PL',
      'russia': 'RU',
      'turkey': 'TR',
      'saudi arabia': 'SA',
      'uae': 'AE',
      'united arab emirates': 'AE',
      'qatar': 'QA',
      'singapore': 'SG',
      'malaysia': 'MY',
      'thailand': 'TH',
      'indonesia': 'ID',
      'philippines': 'PH',
      'vietnam': 'VN',
    };

    // If it's already a 2-letter code, return it
    if (countryName && countryName.length === 2) {
      return countryName.toUpperCase();
    }

    // Otherwise, look it up
    const normalized = countryName.toLowerCase().trim();
    return countryMap[normalized] || countryName.toUpperCase().substring(0, 2);
  }

  /**
   * Build Duffel Offer Request parameters from our standard params
   */
  private buildOfferRequestParams(params: FlightSearchParams): DuffelOfferRequestParams {
    const slices = [
      {
        origin: params.originLocationCode,
        destination: params.destinationLocationCode,
        departure_date: params.departureDate,
      },
    ];

    // Add return slice if round trip
    if (params.returnDate) {
      slices.push({
        origin: params.destinationLocationCode,
        destination: params.originLocationCode,
        departure_date: params.returnDate,
      });
    }

    // Build passengers array
    const passengers = [];

    // Add adults
    for (let i = 0; i < params.adults; i++) {
      passengers.push({ type: 'adult' as const });
    }

    // Add children
    if (params.children) {
      for (let i = 0; i < params.children; i++) {
        passengers.push({ type: 'child' as const, age: 8 }); // Default age
      }
    }

    // Add infants
    if (params.infants) {
      for (let i = 0; i < params.infants; i++) {
        passengers.push({ type: 'infant_without_seat' as const });
      }
    }

    // Map cabin class
    const cabinClassMap: Record<string, any> = {
      ECONOMY: 'economy',
      PREMIUM_ECONOMY: 'premium_economy',
      BUSINESS: 'business',
      FIRST: 'first',
    };

    return {
      slices,
      passengers,
      cabin_class: params.travelClass
        ? cabinClassMap[params.travelClass]
        : 'economy',
      max_connections: params.nonStop ? 0 : undefined,
    };
  }

  /**
   * Transform Duffel offer to standardized format
   */
  private transformDuffelOfferToStandard(offer: DuffelOffer): StandardizedFlightOffer {
    const outbound = offer.slices[0];
    const inbound = offer.slices[1];

    // Extract fare brand name from the first slice
    const fareBrandName = outbound.fare_brand_name;

    // Extract cabin class marketing name from first segment
    const cabinClassMarketing = outbound.segments[0]?.passengers[0]?.cabin_class_marketing_name;

    // Extract change penalty
    const changePenalty = offer.conditions.change_before_departure?.penalty_amount
      ? {
          amount: parseFloat(offer.conditions.change_before_departure.penalty_amount),
          currency: offer.conditions.change_before_departure.penalty_currency || offer.total_currency,
        }
      : undefined;

    // Extract refund penalty
    const refundPenalty = offer.conditions.refund_before_departure?.penalty_amount
      ? {
          amount: parseFloat(offer.conditions.refund_before_departure.penalty_amount),
          currency: offer.conditions.refund_before_departure.penalty_currency || offer.total_currency,
        }
      : undefined;

    return {
      id: offer.id,
      provider: 'duffel',

      price: {
        total: parseFloat(offer.total_amount),
        base: parseFloat(offer.base_amount),
        taxes: parseFloat(offer.tax_amount),
        currency: offer.total_currency,
      },

      outbound: this.transformDuffelSliceSegments(outbound),
      inbound: inbound ? this.transformDuffelSliceSegments(inbound) : undefined,

      validatingAirline: offer.owner.name,
      validatingAirlineCode: offer.owner.iata_code,
      isRefundable: offer.conditions.refund_before_departure?.allowed || false,
      isChangeable: offer.conditions.change_before_departure?.allowed || false,
      lastTicketingDate: offer.payment_requirements.payment_required_by,

      // Fare information
      fareBrandName,
      cabinClass: offer.cabin_class || 'economy',
      cabinClassMarketing,

      // Fare flexibility
      changePenalty,
      refundPenalty,

      numberOfBookableSeats: 9, // Duffel doesn't provide this, default to 9

      rawData: offer,
    };
  }

  /**
   * Transform Duffel slice segments
   */
  private transformDuffelSliceSegments(slice: any): StandardizedFlightSegment[] {
    return slice.segments.map((segment: any) => ({
      id: segment.id,
      airline: segment.marketing_carrier.name,
      airlineCode: segment.marketing_carrier.iata_code,
      flightNumber: segment.marketing_carrier_flight_number,

      departure: {
        airport: segment.origin.name,
        airportCode: segment.origin.iata_code,
        city: segment.origin.city_name || segment.origin.name,
        terminal: segment.origin_terminal,
        time: segment.departing_at,
      },

      arrival: {
        airport: segment.destination.name,
        airportCode: segment.destination.iata_code,
        city: segment.destination.city_name || segment.destination.name,
        terminal: segment.destination_terminal,
        time: segment.arriving_at,
      },

      duration: segment.duration || '',
      stops: 0, // Individual segments don't have stops
      cabinClass: segment.passengers[0]?.cabin_class || 'economy',

      aircraft: segment.aircraft
        ? {
            code: segment.aircraft.iata_code,
            name: segment.aircraft.name,
          }
        : undefined,

      baggage: segment.passengers[0]?.baggages
        ? {
            checked: `${segment.passengers[0].baggages.find((b: any) => b.type === 'checked')?.quantity || 0} bags`,
            carryOn: `${segment.passengers[0].baggages.find((b: any) => b.type === 'carry_on')?.quantity || 0} bags`,
          }
        : undefined,
    }));
  }

  /**
   * Transform passengers to Duffel format
   */
  private transformPassengersToDuffel(passengers: any[], offerPassengers: any[]): DuffelOrderPassenger[] {
    logger.info('[Duffel] Transforming passengers:', JSON.stringify(passengers, null, 2));

    const transformed = passengers.map((passenger, index) => {
      // Duffel expects 'm' or 'f', not 'male' or 'female'
      let gender = passenger.gender;
      if (gender === 'male') gender = 'm';
      if (gender === 'female') gender = 'f';
      if (!gender || (gender !== 'm' && gender !== 'f')) gender = 'm'; // Default to 'm'

      // Get the corresponding passenger ID from the offer
      const offerPassenger = offerPassengers[index];
      if (!offerPassenger) {
        throw new Error(`No matching passenger found in offer for passenger ${index}`);
      }

      // Validate required fields for Duffel API
      if (!passenger.phone || passenger.phone.trim() === '') {
        throw new Error(`Phone number is required for passenger ${passenger.firstName} ${passenger.lastName}`);
      }

      if (!passenger.dateOfBirth || passenger.dateOfBirth.trim() === '') {
        throw new Error(`Date of birth is required for passenger ${passenger.firstName} ${passenger.lastName}`);
      }

      if (!passenger.email || passenger.email.trim() === '') {
        throw new Error(`Email is required for passenger ${passenger.firstName} ${passenger.lastName}`);
      }

      // Strip spaces from phone number and validate E.164 format
      logger.info(`[Duffel] Original phone: "${passenger.phone}" (length: ${passenger.phone.length})`);
      const phoneWithoutSpaces = passenger.phone.replace(/\s/g, '');
      logger.info(`[Duffel] After stripping spaces: "${phoneWithoutSpaces}" (length: ${phoneWithoutSpaces.length})`);
      const phoneRegex = /^\+[1-9]\d{1,14}$/;
      if (!phoneRegex.test(phoneWithoutSpaces)) {
        logger.error(`[Duffel] Phone validation FAILED for: "${phoneWithoutSpaces}"`);
        throw new Error(`Invalid phone number format for passenger ${passenger.firstName} ${passenger.lastName}. Must be in E.164 format (e.g., +14165551234 or +1 416 555 1234)`);
      }
      logger.info(`[Duffel] Phone validation PASSED: "${phoneWithoutSpaces}"`);

      // Use user-selected passenger type (NO ASSUMPTIONS OR HARDCODING)
      if (!passenger.type || passenger.type.trim() === '') {
        throw new Error(`Passenger type is required for ${passenger.firstName} ${passenger.lastName}. Must be 'adult', 'child', or 'infant_without_seat'.`);
      }

      const passengerType = passenger.type;
      logger.info(`[Duffel] Passenger ${passenger.firstName} ${passenger.lastName}: Type=${passengerType} (user-selected), DOB=${passenger.dateOfBirth}`);

      const duffelPassenger: DuffelOrderPassenger = {
        id: offerPassenger.id,  // Use the ID from the offer!
        type: passengerType,  // Use user-selected type (NO ASSUMPTIONS)
        title: gender === 'm' ? 'mr' : 'ms',
        gender: gender,
        given_name: passenger.firstName,
        family_name: passenger.lastName,
        born_on: passenger.dateOfBirth,
        email: passenger.email,
        phone_number: phoneWithoutSpaces,  // Use space-stripped phone number
      };

      // Add passport only if all required fields are provided
      // Duffel requires expires_on to be after the return date, so we skip passport if expiry is missing
      if (
        passenger.passportNumber &&
        passenger.passportNumber !== '' &&
        passenger.passportExpiry &&
        passenger.passportExpiry !== '' &&
        passenger.passportCountry &&
        passenger.passportCountry !== ''
      ) {
        duffelPassenger.identity_documents = [
          {
            type: 'passport' as const,
            unique_identifier: passenger.passportNumber,
            expires_on: passenger.passportExpiry,
            issuing_country_code: this.countryNameToCode(passenger.passportCountry),
          },
        ];
        logger.info(`[Duffel] Added passport for ${passenger.firstName}: expires ${passenger.passportExpiry}`);
      } else if (passenger.passportNumber) {
        logger.warn(`[Duffel] Skipping incomplete passport data for ${passenger.firstName} (passport info must include expiry date and country)`);
      }

      logger.info('[Duffel] Transformed passenger:', JSON.stringify(duffelPassenger, null, 2));
      return duffelPassenger;
    });

    return transformed;
  }

  /**
   * Transform Duffel order to booking confirmation
   */
  private transformDuffelOrderToConfirmation(
    order: DuffelOrder,
    params: CreateBookingParams
  ): BookingConfirmation {
    // Reconstruct the flight offer from order slices
    const outbound = order.slices[0];
    const inbound = order.slices[1];

    // Extract fare brand name from the first slice
    const fareBrandName = outbound.fare_brand_name;

    // Extract cabin class from first segment's passenger info
    const cabinClass = outbound.segments[0]?.passengers[0]?.cabin_class || 'economy';

    // Extract cabin class marketing name from first segment
    const cabinClassMarketing = outbound.segments[0]?.passengers[0]?.cabin_class_marketing_name;

    // Extract change penalty
    const changePenalty = order.conditions.change_before_departure?.penalty_amount
      ? {
          amount: parseFloat(order.conditions.change_before_departure.penalty_amount),
          currency: order.conditions.change_before_departure.penalty_currency || order.total_currency,
        }
      : undefined;

    // Extract refund penalty
    const refundPenalty = order.conditions.refund_before_departure?.penalty_amount
      ? {
          amount: parseFloat(order.conditions.refund_before_departure.penalty_amount),
          currency: order.conditions.refund_before_departure.penalty_currency || order.total_currency,
        }
      : undefined;

    const flights: StandardizedFlightOffer = {
      id: order.id,
      provider: 'duffel',
      price: {
        total: parseFloat(order.total_amount),
        base: parseFloat(order.base_amount),
        taxes: parseFloat(order.tax_amount),
        currency: order.total_currency,
      },
      outbound: this.transformDuffelSliceSegments(outbound),
      inbound: inbound ? this.transformDuffelSliceSegments(inbound) : undefined,
      validatingAirline: order.owner.name,
      validatingAirlineCode: order.owner.iata_code,
      isRefundable: order.conditions.refund_before_departure?.allowed || false,
      isChangeable: order.conditions.change_before_departure?.allowed || false,

      // Fare information
      fareBrandName,
      cabinClass,
      cabinClassMarketing,

      // Fare flexibility
      changePenalty,
      refundPenalty,

      numberOfBookableSeats: 9,
      rawData: order,
    };

    return {
      bookingReference: order.booking_reference,
      provider: 'duffel',
      status: 'confirmed', // Duffel orders are immediately confirmed
      flights,
      passengers: params.passengers,
      totalPrice: {
        amount: parseFloat(order.total_amount),
        currency: order.total_currency,
      },
      bookingDate: order.created_at,
      ticketingDeadline: order.payment_status.payment_required_by,
      tickets: order.documents?.map((doc, index) => ({
        passengerId: doc.passenger_id,
        ticketNumber: doc.unique_identifier,
      })),
      rawData: order,
    };
  }

  /**
   * Transform Duffel seat map
   */
  private transformDuffelSeatMap(duffelSeatMap: DuffelSeatMap): SeatMap {
    return {
      segmentId: duffelSeatMap.segment_id,
      cabins: duffelSeatMap.cabins.map((cabin) => ({
        cabinClass: cabin.cabin_class,
        rows: cabin.rows.map((row) => ({
          seats: row.sections.flatMap((section) =>
            section.elements.map((element): SeatMap['cabins'][0]['rows'][0]['seats'][0] => {
              // Determine seat type
              let seatType: 'seat' | 'bassinet' | 'empty' | 'exit_row' | 'lavatory' | 'galley' = 'seat';

              if (element.type === 'bassinet') seatType = 'bassinet';
              else if (element.type === 'lavatory') seatType = 'lavatory';
              else if (element.type === 'galley') seatType = 'galley';
              else if (element.type === 'empty' || !element.designator) seatType = 'empty';
              else if (element.disclosures?.some(d => d.toLowerCase().includes('exit'))) seatType = 'exit_row';

              const hasAvailableServices = !!(element.available_services && element.available_services.length > 0);
              const firstService = element.available_services?.[0];

              return {
                designator: element.designator || '',
                available: hasAvailableServices,
                type: seatType,
                serviceId: firstService?.id,
                price: firstService
                  ? {
                      amount: parseFloat(firstService.total_amount),
                      currency: firstService.total_currency,
                    }
                  : undefined,
                disclosures: element.disclosures,
              };
            })
          ),
        })),
      })),
    };
  }
}

export default new DuffelService();
