import { Request, Response } from 'express';
import AmadeusService, { HotelSearchParams } from '../services/amadeus.service';
import { duffelStaysService } from '../services/duffel-stays.service';
import GooglePlacesService from '../services/google-places.service';
import GeocodingService from '../services/geocoding.service';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth.middleware';

/**
 * Search for hotels using Duffel Stays API
 */
export const searchHotels = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      cityCode,
      address,
      latitude,
      longitude,
      checkInDate,
      checkOutDate,
      adults,
      children,
      roomQuantity,
      radius,
    } = req.query;

    // Validation
    if (!checkInDate || !checkOutDate || !adults) {
      res.status(400).json({
        success: false,
        message: 'Missing required parameters: checkInDate, checkOutDate, adults',
      });
      return;
    }

    let finalLatitude: number;
    let finalLongitude: number;

    // Priority: coordinates > address > cityCode
    if (latitude && longitude) {
      // Use provided coordinates
      finalLatitude = parseFloat(latitude as string);
      finalLongitude = parseFloat(longitude as string);
      logger.info('Using provided coordinates', { latitude: finalLatitude, longitude: finalLongitude });
    } else if (address) {
      // Geocode the address
      const geocodeResult = await GeocodingService.geocodeAddress(address as string);

      if (!geocodeResult) {
        res.status(400).json({
          success: false,
          message: 'Could not find location for the provided address',
        });
        return;
      }

      finalLatitude = geocodeResult.latitude;
      finalLongitude = geocodeResult.longitude;
      logger.info(`Geocoded address "${address}"`, { latitude: finalLatitude, longitude: finalLongitude });
    } else if (cityCode) {
      // Geocode city code to coordinates
      // Common city mappings (can be expanded)
      const cityMapping: { [key: string]: { latitude: number; longitude: number } } = {
        'NYC': { latitude: 40.7128, longitude: -74.0060 },
        'LON': { latitude: 51.5074, longitude: -0.1278 },
        'PAR': { latitude: 48.8566, longitude: 2.3522 },
        'TYO': { latitude: 35.6762, longitude: 139.6503 },
        'LAX': { latitude: 34.0522, longitude: -118.2437 },
        'DXB': { latitude: 25.2048, longitude: 55.2708 },
        'SFO': { latitude: 37.7749, longitude: -122.4194 },
        'LOS': { latitude: 6.5244, longitude: 3.3792 },
        'ABV': { latitude: 9.0579, longitude: 7.4951 },
      };

      const coords = cityMapping[cityCode as string];
      if (coords) {
        finalLatitude = coords.latitude;
        finalLongitude = coords.longitude;
        logger.info(`Mapped city code ${cityCode} to coordinates`, { latitude: finalLatitude, longitude: finalLongitude });
      } else {
        res.status(400).json({
          success: false,
          message: `Unknown city code: ${cityCode}. Please provide coordinates or address instead.`,
        });
        return;
      }
    } else {
      res.status(400).json({
        success: false,
        message: 'Please provide either cityCode, address, or coordinates (latitude & longitude)',
      });
      return;
    }

    // Build guests array for Duffel
    const adultsCount = parseInt(adults as string) || 1;
    const childrenCount = parseInt(children as string) || 0;

    const guests = [
      ...Array(adultsCount).fill({ type: 'adult' }),
      ...Array(childrenCount).fill({ type: 'child' }),
    ];

    // Step 1: Search accommodations
    const searchResults = await duffelStaysService.searchAccommodation({
      latitude: finalLatitude,
      longitude: finalLongitude,
      radius: radius ? parseInt(radius as string) : 5,
      checkInDate: checkInDate as string,
      checkOutDate: checkOutDate as string,
      guests,
      rooms: roomQuantity ? parseInt(roomQuantity as string) : 1,
    });

    // Step 2: Fetch rates for each accommodation in parallel
    const accommodationsWithRates = await Promise.all(
      searchResults.map(async (result) => {
        try {
          const accommodation = await duffelStaysService.getRatesForSearchResult(result.id);
          return {
            searchResultId: result.id,
            accommodation,
            cheapestRate: result.cheapest_rate,
          };
        } catch (error) {
          logger.warn(`Failed to fetch rates for search result ${result.id}:`, error);
          return null;
        }
      })
    );

    // Filter out failed fetches
    const validAccommodations = accommodationsWithRates.filter(Boolean);

    logger.info(`Successfully retrieved ${validAccommodations.length} accommodations with rates`);

    res.status(200).json({
      success: true,
      message: 'Hotels retrieved successfully',
      data: validAccommodations,
      count: validAccommodations.length,
    });
  } catch (error: any) {
    logger.error('Search hotels error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to search hotels',
    });
  }
};

/**
 * Get hotel rates by search result ID (Duffel Stays)
 */
export const getHotelRates = async (req: Request, res: Response): Promise<void> => {
  try {
    const { searchResultId } = req.params;

    logger.info('Fetching hotel rates', { searchResultId });

    // Fetch all rates for this accommodation from Duffel
    const accommodation = await duffelStaysService.getRatesForSearchResult(searchResultId);

    res.status(200).json({
      success: true,
      message: 'Hotel rates retrieved successfully',
      data: accommodation,
    });
  } catch (error: any) {
    logger.error('Get hotel rates error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get hotel rates',
    });
  }
};

/**
 * Legacy endpoint - Get hotel offers by hotel ID (Amadeus)
 * Kept for backward compatibility during migration
 */
export const getHotelOffers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { hotelId } = req.params;
    const { checkInDate, checkOutDate, adults, roomQuantity, currency, cityCode } = req.query;

    logger.warn('Legacy getHotelOffers endpoint called. Consider migrating to getHotelRates.', { hotelId });

    if (!checkInDate || !checkOutDate || !adults) {
      res.status(400).json({
        success: false,
        message: 'Missing required parameters: checkInDate, checkOutDate, adults',
      });
      return;
    }

    const params = {
      checkInDate: checkInDate as string,
      checkOutDate: checkOutDate as string,
      adults: parseInt(adults as string),
      roomQuantity: roomQuantity ? parseInt(roomQuantity as string) : 1,
      currency: currency as string,
    };

    let offersData;
    let hotel;
    let offers;

    try {
      offersData = await AmadeusService.getHotelOffers(hotelId, params);

      // Extract hotel and offers from response
      hotel = offersData && offersData.length > 0 ? offersData[0].hotel : null;
      offers = offersData && offersData.length > 0 ? offersData[0].offers : [];
    } catch (amadeusError: any) {
      // If Amadeus API fails (common in test environment), try to get hotel info from search
      logger.warn(`Amadeus hotel offers failed for ${hotelId}, attempting to retrieve basic hotel info:`, amadeusError.message);

      // Try to get basic hotel information using hotelId directly
      try {
        // Extract city code from hotelId (first 3 letters after first 2 chars are usually city code)
        // E.g., RDNYC879 -> NYC, or use provided cityCode from query
        const extractedCityCode = cityCode as string || hotelId.substring(2, 5);

        logger.info(`Attempting to retrieve hotel info using city code: ${extractedCityCode}`);

        // Get hotel name and basic info from Amadeus hotel list
        // @ts-ignore
        const hotelListResponse = await AmadeusService.searchHotels({
          cityCode: extractedCityCode,
          checkInDate: params.checkInDate,
          checkOutDate: params.checkOutDate,
          adults: params.adults,
          roomQuantity: params.roomQuantity,
        });

        const hotelData = hotelListResponse.find((h: any) => h.hotel.hotelId === hotelId);

        if (hotelData) {
          hotel = hotelData.hotel;
          offers = []; // No offers available from Amadeus test API

          logger.info(`Retrieved basic hotel info for ${hotelId}, but no offers available in test environment`);
        } else {
          // If not found in search, create a basic hotel object with the ID
          logger.warn(`Hotel ${hotelId} not found in search results. Using minimal hotel data.`);
          hotel = {
            hotelId: hotelId,
            name: `Hotel ${hotelId}`,
            address: {
              cityName: extractedCityCode,
            },
            amenities: [],
            media: [],
          };
          offers = [];
        }
      } catch (searchError) {
        logger.error('Failed to retrieve hotel info from search:', searchError);
        // Create minimal hotel object as last resort
        hotel = {
          hotelId: hotelId,
          name: `Hotel ${hotelId}`,
          address: {},
          amenities: [],
          media: [],
        };
        offers = [];
      }
    }

    if (!hotel) {
      res.status(404).json({
        success: false,
        message: 'Hotel not found or no offers available',
      });
      return;
    }

    // Fetch photos from Google Places if hotel name is available
    let photos: string[] = [];
    if (hotel.name) {
      const cityName = hotel.address?.cityName || (cityCode as string);
      photos = await GooglePlacesService.getHotelPhotos(hotel.name, cityName);

      // Add photos to hotel media if we got any
      if (photos.length > 0) {
        hotel.media = photos.map(url => ({ uri: url }));
        logger.info(`Added ${photos.length} photos to hotel ${hotelId}`);
      }
    }

    // If no offers available, return hotel info with message
    if (!offers || offers.length === 0) {
      res.status(200).json({
        success: true,
        message: 'Hotel information retrieved, but no room offers are currently available. This may be due to Amadeus test API limitations.',
        data: {
          hotel,
          offers: [],
          note: 'No availability data from Amadeus Test API. In production, real offers would be displayed here.',
        },
      });
      return;
    }

    // Room photos are already included in the Amadeus API response
    // No need to fetch external photos - use the actual room images from Amadeus

    res.status(200).json({
      success: true,
      message: 'Hotel offers retrieved successfully',
      data: {
        hotel,
        offers,
      },
    });
  } catch (error: any) {
    logger.error('Get hotel offers error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get hotel offers',
    });
  }
};

/**
 * Create a hotel quote (Duffel Stays)
 *
 * IMPORTANT: Quotes must be created before booking to:
 * 1. Validate rate availability
 * 2. Lock pricing temporarily
 * 3. Prevent booking failures
 */
export const createHotelQuote = async (req: Request, res: Response): Promise<void> => {
  try {
    const { rateId } = req.body;

    if (!rateId) {
      res.status(400).json({
        success: false,
        message: 'Missing required parameter: rateId',
      });
      return;
    }

    logger.info('Creating hotel quote', { rateId });

    // Create quote to validate rate availability and lock pricing
    const quote = await duffelStaysService.createQuote(rateId);

    res.status(200).json({
      success: true,
      message: 'Quote created successfully',
      data: quote,
    });
  } catch (error: any) {
    logger.error('Create quote error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create quote. Rate may no longer be available.',
    });
  }
};

/**
 * Create hotel booking (Duffel Stays)
 *
 * NOTE: This endpoint is for direct booking creation.
 * In practice, hotel bookings go through the standard booking.controller.ts flow
 * which handles payment, approval workflow, and then creates the Duffel booking.
 */
export const createHotelBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    const { quoteId, email, phoneNumber, guests, specialRequests, loyaltyProgramme } = req.body;

    if (!quoteId || !email || !phoneNumber || !guests || guests.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Missing required parameters: quoteId, email, phoneNumber, guests',
      });
      return;
    }

    logger.info('Creating hotel booking', { quoteId, guestCount: guests.length });

    // Create Duffel Stays booking
    const bookingParams: any = {
      quote_id: quoteId,
      email,
      phone_number: phoneNumber,
      guests,
    };

    // Add optional fields if provided
    if (specialRequests) {
      bookingParams.accommodation_special_requests = specialRequests;
    }

    if (loyaltyProgramme) {
      bookingParams.loyalty_programme = loyaltyProgramme;
    }

    const duffelBooking = await duffelStaysService.createBooking(bookingParams);

    res.status(201).json({
      success: true,
      message: 'Hotel booking created successfully',
      data: duffelBooking,
    });
  } catch (error: any) {
    logger.error('Create hotel booking error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create hotel booking',
    });
  }
};
