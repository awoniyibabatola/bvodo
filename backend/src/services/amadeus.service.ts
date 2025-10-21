// @ts-ignore - Amadeus SDK doesn't have TypeScript definitions
import Amadeus from 'amadeus';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { cache } from '../utils/cache';
import GooglePlacesService from './google-places.service';

// Initialize Amadeus client
// @ts-ignore
const amadeus = new Amadeus({
  clientId: env.AMADEUS_CLIENT_ID,
  clientSecret: env.AMADEUS_CLIENT_SECRET || '',
  hostname: env.AMADEUS_ENVIRONMENT === 'production' ? 'production' : 'test',
});

export interface FlightSearchParams {
  originLocationCode: string;
  destinationLocationCode: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  children?: number;
  infants?: number;
  travelClass?: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
  nonStop?: boolean;
  currencyCode?: string;
  maxPrice?: number;
  max?: number;
}

export interface HotelSearchParams {
  cityCode?: string;
  latitude?: number;
  longitude?: number;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  roomQuantity?: number;
  radius?: number;
  radiusUnit?: 'KM' | 'MILE';
  currency?: string;
  limit?: number;
}

export class AmadeusService {
  /**
   * Search for flight offers
   */
  static async searchFlights(params: FlightSearchParams) {
    try {
      logger.info('Searching flights with Amadeus:', params);

      const response = await amadeus.shopping.flightOffersSearch.get({
        originLocationCode: params.originLocationCode,
        destinationLocationCode: params.destinationLocationCode,
        departureDate: params.departureDate,
        returnDate: params.returnDate,
        adults: params.adults,
        children: params.children || 0,
        infants: params.infants || 0,
        travelClass: params.travelClass || 'ECONOMY',
        nonStop: params.nonStop || false,
        currencyCode: params.currencyCode || 'USD',
        maxPrice: params.maxPrice,
        max: params.max || 50,
      });

      logger.info(`Found ${response.data.length} flight offers`);
      return response.data;
    } catch (error: any) {
      logger.error('Amadeus flight search error:', error.response?.body || error);
      throw new Error(error.response?.body?.errors?.[0]?.detail || 'Failed to search flights');
    }
  }

  /**
   * Get flight price for specific offer
   */
  static async getFlightPrice(flightOffers: any[]) {
    try {
      const response = await amadeus.shopping.flightOffers.pricing.post(
        JSON.stringify({
          data: {
            type: 'flight-offers-pricing',
            flightOffers: flightOffers,
          },
        })
      );

      return response.data;
    } catch (error: any) {
      logger.error('Amadeus flight pricing error:', error.response?.body || error);
      throw new Error('Failed to get flight price');
    }
  }

  /**
   * Create flight order (booking)
   */
  static async createFlightOrder(flightOffers: any[], travelers: any[]) {
    try {
      const response = await amadeus.booking.flightOrders.post(
        JSON.stringify({
          data: {
            type: 'flight-order',
            flightOffers: flightOffers,
            travelers: travelers,
          },
        })
      );

      logger.info('Flight order created successfully');
      return response.data;
    } catch (error: any) {
      logger.error('Amadeus flight booking error:', error.response?.body || error);
      throw new Error('Failed to create flight order');
    }
  }

  /**
   * Search for hotels by city or coordinates
   */
  static async searchHotels(params: HotelSearchParams) {
    try {
      logger.info('Searching hotels with Amadeus:', params);

      let response;

      // Use coordinate-based search if lat/lon provided, otherwise use city code
      if (params.latitude && params.longitude) {
        // @ts-ignore
        response = await amadeus.referenceData.locations.hotels.byGeocode.get({
          latitude: params.latitude,
          longitude: params.longitude,
          radius: params.radius || 5,
          radiusUnit: params.radiusUnit || 'KM',
        });
      } else if (params.cityCode) {
        // @ts-ignore
        response = await amadeus.referenceData.locations.hotels.byCity.get({
          cityCode: params.cityCode,
        });
      } else {
        throw new Error('Either cityCode or coordinates (latitude & longitude) must be provided');
      }

      logger.info(`Found ${response.data.length} hotels`);

      // Limit hotels based on params (default 50, no maximum - let API determine availability)
      const limit = params.limit || 50;
      const hotels = response.data.slice(0, limit);

      // Fetch photos and pricing for each hotel (in parallel for performance)
      const hotelsWithData = await Promise.all(
        hotels.map(async (hotel: any) => {
          // Get city name from address for better Google Places search
          const cityName = hotel.address?.cityName || params.cityCode;

          // Fetch photos from Google Places
          const photos = await GooglePlacesService.getHotelPhotos(hotel.name, cityName);

          // Try to fetch offers/pricing for this hotel
          let offers: any[] = [];
          try {
            const offersResponse = await amadeus.shopping.hotelOffersSearch.get({
              hotelIds: hotel.hotelId,
              checkInDate: params.checkInDate,
              checkOutDate: params.checkOutDate,
              adults: params.adults,
              roomQuantity: params.roomQuantity || 1,
              currency: params.currency || 'USD',
              bestRateOnly: true, // Only get the cheapest rate for list view
            });

            if (offersResponse.data && offersResponse.data.length > 0) {
              offers = offersResponse.data[0].offers || [];
            }
          } catch (offerError: any) {
            // If offers fetch fails, just log it and continue without pricing
            logger.warn(`Failed to fetch offers for hotel ${hotel.hotelId}:`, offerError.message);
          }

          return {
            hotel: {
              hotelId: hotel.hotelId,
              name: hotel.name,
              rating: hotel.rating,
              address: hotel.address,
              distance: hotel.distance,
              amenities: hotel.amenities || [],
              media: photos.length > 0
                ? photos.map(url => ({ uri: url }))
                : hotel.media || [], // Use Google photos, fallback to Amadeus media
              description: hotel.name ? `Experience luxury and comfort at ${hotel.name}` : 'A wonderful hotel experience awaits you',
            },
            offers: offers,
          };
        })
      );

      return hotelsWithData;
    } catch (error: any) {
      logger.error('Amadeus hotel search error:', {
        message: error.message,
        statusCode: error.response?.statusCode,
        body: error.response?.body,
        description: error.description,
        code: error.code
      });
      const errorDetail = error.response?.body?.errors?.[0]?.detail || error.message || 'Failed to search hotels';
      throw new Error(errorDetail);
    }
  }

  /**
   * Get hotel offers by hotel ID
   */
  static async getHotelOffers(hotelId: string, params: Omit<HotelSearchParams, 'cityCode'>) {
    try {
      logger.info(`Fetching hotel offers for ${hotelId}:`, params);

      // @ts-ignore
      const response = await amadeus.shopping.hotelOffersSearch.get({
        hotelIds: hotelId,
        checkInDate: params.checkInDate,
        checkOutDate: params.checkOutDate,
        adults: params.adults,
        roomQuantity: params.roomQuantity || 1,
        currency: params.currency || 'USD',
        bestRateOnly: false, // Get all available rates, not just the best one
        paymentPolicy: 'NONE',
        // Removed boardType to get all meal plan options (ROOM_ONLY, BREAKFAST, HALF_BOARD, etc.)
      });

      logger.info(`Found ${response.data.length} hotel(s) with offers for ${hotelId}`);
      if (response.data.length > 0 && response.data[0].offers) {
        logger.info(`Total offers available: ${response.data[0].offers.length}`);
        // Debug: Log first offer structure to see boardType location
        if (response.data[0].offers[0]) {
          logger.info('Sample offer structure:', JSON.stringify(response.data[0].offers[0], null, 2).substring(0, 500));
        }
      }
      return response.data;
    } catch (error: any) {
      logger.error('Amadeus hotel offers error:', {
        hotelId,
        error: error.response?.body || error.message,
        statusCode: error.response?.statusCode,
        description: error.description
      });

      const errorDetail = error.response?.body?.errors?.[0]?.detail || error.message || 'Failed to get hotel offers';
      const errorCode = error.response?.body?.errors?.[0]?.code;

      // Provide more specific error messages
      if (errorCode === '4926' || errorDetail.includes('availability')) {
        throw new Error('No rooms available for the selected dates at this hotel');
      } else if (errorCode === '477' || errorDetail.includes('Invalid format')) {
        throw new Error('Invalid hotel ID or search parameters');
      } else if (errorCode === '38189' || errorDetail.includes('Resource not found')) {
        throw new Error('Hotel not found or no longer available');
      }

      throw new Error(errorDetail);
    }
  }

  /**
   * Search for airport/city by keyword
   */
  static async searchLocation(keyword: string) {
    try {
      const response = await amadeus.referenceData.locations.get({
        keyword: keyword,
        subType: Amadeus.location.any,
      });

      return response.data;
    } catch (error: any) {
      logger.error('Amadeus location search error:', error.response?.body || error);
      throw new Error('Failed to search locations');
    }
  }

  /**
   * Get airport/city details
   */
  static async getLocationDetails(locationId: string) {
    try {
      const response = await amadeus.referenceData.location(locationId).get();
      return response.data;
    } catch (error: any) {
      logger.error('Amadeus location details error:', error.response?.body || error);
      throw new Error('Failed to get location details');
    }
  }
}

export default AmadeusService;

