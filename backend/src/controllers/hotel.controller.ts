import { Request, Response } from 'express';
import AmadeusService, { HotelSearchParams } from '../services/amadeus.service';
import GooglePlacesService from '../services/google-places.service';
import GeocodingService from '../services/geocoding.service';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth.middleware';

/**
 * Search for hotels
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
      roomQuantity,
      radius,
      radiusUnit,
      currency,
      limit,
    } = req.query;

    // Validation
    if (!checkInDate || !checkOutDate || !adults) {
      res.status(400).json({
        success: false,
        message: 'Missing required parameters: checkInDate, checkOutDate, adults',
      });
      return;
    }

    let searchParams: HotelSearchParams;

    // Priority: coordinates > address > cityCode
    if (latitude && longitude) {
      // Search by coordinates
      searchParams = {
        latitude: parseFloat(latitude as string),
        longitude: parseFloat(longitude as string),
        checkInDate: checkInDate as string,
        checkOutDate: checkOutDate as string,
        adults: parseInt(adults as string),
        roomQuantity: roomQuantity ? parseInt(roomQuantity as string) : 1,
        radius: radius ? parseInt(radius as string) : 5,
        radiusUnit: (radiusUnit as 'KM' | 'MILE') || 'KM',
        currency: currency as string,
        limit: limit ? parseInt(limit as string) : 50,
      };
    } else if (address) {
      // Geocode the address first
      const geocodeResult = await GeocodingService.geocodeAddress(address as string);

      if (!geocodeResult) {
        res.status(400).json({
          success: false,
          message: 'Could not find location for the provided address',
        });
        return;
      }

      logger.info(`Geocoded address "${address}" to coordinates: ${geocodeResult.latitude}, ${geocodeResult.longitude}`);

      searchParams = {
        latitude: geocodeResult.latitude,
        longitude: geocodeResult.longitude,
        checkInDate: checkInDate as string,
        checkOutDate: checkOutDate as string,
        adults: parseInt(adults as string),
        roomQuantity: roomQuantity ? parseInt(roomQuantity as string) : 1,
        radius: radius ? parseInt(radius as string) : 5,
        radiusUnit: (radiusUnit as 'KM' | 'MILE') || 'KM',
        currency: currency as string,
        limit: limit ? parseInt(limit as string) : 50,
      };
    } else if (cityCode) {
      // Search by city code (original method)
      searchParams = {
        cityCode: cityCode as string,
        checkInDate: checkInDate as string,
        checkOutDate: checkOutDate as string,
        adults: parseInt(adults as string),
        roomQuantity: roomQuantity ? parseInt(roomQuantity as string) : 1,
        radius: radius ? parseInt(radius as string) : 5,
        radiusUnit: (radiusUnit as 'KM' | 'MILE') || 'KM',
        currency: currency as string,
        limit: limit ? parseInt(limit as string) : 50,
      };
    } else {
      res.status(400).json({
        success: false,
        message: 'Please provide either cityCode, address, or coordinates (latitude & longitude)',
      });
      return;
    }

    const hotels = await AmadeusService.searchHotels(searchParams);

    res.status(200).json({
      success: true,
      message: 'Hotels retrieved successfully',
      data: hotels,
      count: hotels.length,
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
 * Get hotel offers by hotel ID
 */
export const getHotelOffers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { hotelId } = req.params;
    const { checkInDate, checkOutDate, adults, roomQuantity, currency, cityCode } = req.query;

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
 * Create hotel booking
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

    const { hotelOffer, guests } = req.body;

    if (!hotelOffer || !guests) {
      res.status(400).json({
        success: false,
        message: 'Missing required parameters: hotelOffer, guests',
      });
      return;
    }

    // TODO: Implement hotel booking with Amadeus
    // Note: Hotel booking requires additional setup and payment integration

    res.status(201).json({
      success: true,
      message: 'Hotel booking request received (implementation pending)',
      data: {
        hotelOffer,
        guests,
        status: 'pending',
      },
    });
  } catch (error: any) {
    logger.error('Create hotel booking error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create hotel booking',
    });
  }
};
