// Hotel controller - updated to skip bulk rate fetching
import { Request, Response } from 'express';
import AmadeusService, { HotelSearchParams } from '../services/amadeus.service';
import { duffelStaysService } from '../services/duffel-stays.service';
import GooglePlacesService from '../services/google-places.service';
import GeocodingService from '../services/geocoding.service';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth.middleware';
import PolicyService from '../services/policy.service';

/**
 * Search for hotels using Duffel Stays API or Amadeus API
 *
 * Provider can be specified via query parameter: ?provider=amadeus or ?provider=duffel
 * Default: amadeus (since Duffel Stays requires API access approval)
 */
export const searchHotels = async (req: AuthRequest, res: Response): Promise<void> => {
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
      radiusUnit,
      currency,
      limit,
      provider, // New: 'amadeus' or 'duffel'
    } = req.query;

    // Validation
    if (!checkInDate || !checkOutDate || !adults) {
      res.status(400).json({
        success: false,
        message: 'Missing required parameters: checkInDate, checkOutDate, adults',
      });
      return;
    }

    // Determine which provider to use (default: amadeus)
    const selectedProvider = (provider as string)?.toLowerCase() || 'amadeus';

    logger.info(`Hotel search using provider: ${selectedProvider}`);

    // Route to appropriate provider
    if (selectedProvider === 'amadeus') {
      // Use Amadeus API
      await searchHotelsWithAmadeus(req, res);
    } else if (selectedProvider === 'duffel') {
      // Use Duffel Stays API
      await searchHotelsWithDuffel(req, res);
    } else {
      res.status(400).json({
        success: false,
        message: `Invalid provider: ${selectedProvider}. Supported providers: amadeus, duffel`,
      });
    }
  } catch (error: any) {
    logger.error('Search hotels error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to search hotels',
    });
  }
};

/**
 * Search hotels using Amadeus API
 */
async function searchHotelsWithAmadeus(req: Request, res: Response): Promise<void> {
  const {
    cityCode,
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

  logger.info('Searching hotels with Amadeus');

  const searchParams: HotelSearchParams = {
    checkInDate: checkInDate as string,
    checkOutDate: checkOutDate as string,
    adults: parseInt(adults as string),
    roomQuantity: roomQuantity ? parseInt(roomQuantity as string) : 1,
    currency: currency as string || 'USD',
    radius: radius ? parseInt(radius as string) : 5,
    radiusUnit: (radiusUnit as 'KM' | 'MILE') || 'KM',
    limit: limit ? parseInt(limit as string) : 20,
  };

  // Add location parameters
  if (latitude && longitude) {
    searchParams.latitude = parseFloat(latitude as string);
    searchParams.longitude = parseFloat(longitude as string);
  } else if (cityCode) {
    searchParams.cityCode = cityCode as string;
  } else {
    res.status(400).json({
      success: false,
      message: 'Please provide either cityCode or coordinates (latitude & longitude)',
    });
    return;
  }

  const hotels = await AmadeusService.searchHotels(searchParams);

  logger.info(`Amadeus returned ${hotels.length} hotels`);

  // Policy Filtering (if user is authenticated)
  let policyInfo = null;
  let filteredHotels = hotels;

  if (req.user) {
    try {
      // Get user's effective policy
      const policy = await PolicyService.getPolicyForUser(
        req.user.userId,
        req.user.organizationId
      );

      if (policy) {
        // Get effective limits (exception overrides base policy)
        const effectiveHotelMaxPerNight =
          policy.exception?.hotelMaxAmountPerNight || policy.hotelMaxAmountPerNight;
        const effectiveHotelMaxTotal =
          policy.exception?.hotelMaxAmountTotal || policy.hotelMaxAmountTotal;

        // Calculate number of nights
        const checkIn = new Date(checkInDate as string);
        const checkOut = new Date(checkOutDate as string);
        const numberOfNights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

        // Filter hotels by policy limits
        if (effectiveHotelMaxPerNight || effectiveHotelMaxTotal) {
          filteredHotels = hotels.filter((hotel: any) => {
            const totalPrice = parseFloat(hotel.price || hotel.totalPrice || 0);
            const perNightPrice = totalPrice / numberOfNights;

            let allowed = true;

            // Check per-night limit
            if (effectiveHotelMaxPerNight) {
              const maxPerNight = Number(effectiveHotelMaxPerNight);
              if (perNightPrice > maxPerNight) {
                allowed = false;
              }
            }

            // Check total limit
            if (effectiveHotelMaxTotal) {
              const maxTotal = Number(effectiveHotelMaxTotal);
              if (totalPrice > maxTotal) {
                allowed = false;
              }
            }

            return allowed;
          });
        }

        // Prepare policy info for response
        policyInfo = {
          policyId: policy.id,
          policyName: policy.name,
          limits: {
            hotelMaxAmountPerNight: effectiveHotelMaxPerNight
              ? Number(effectiveHotelMaxPerNight)
              : null,
            hotelMaxAmountTotal: effectiveHotelMaxTotal
              ? Number(effectiveHotelMaxTotal)
              : null,
          },
          hasException: !!policy.exception,
          requiresApprovalAbove: policy.requiresApprovalAbove
            ? Number(policy.requiresApprovalAbove)
            : null,
        };
      }
    } catch (policyError) {
      logger.warn('Error applying policy filters:', policyError);
      // Continue without policy filtering if there's an error
    }
  }

  res.status(200).json({
    success: true,
    message: 'Hotels retrieved successfully',
    data: filteredHotels,
    count: filteredHotels.length,
    provider: 'amadeus',
    meta: {
      total: hotels.length,
    },
    policy: policyInfo,
  });
}

/**
 * Search hotels using Duffel Stays API
 */
async function searchHotelsWithDuffel(req: Request, res: Response): Promise<void> {
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
      // North America
      'NYC': { latitude: 40.7128, longitude: -74.0060 },
      'LAX': { latitude: 34.0522, longitude: -118.2437 },
      'SFO': { latitude: 37.7749, longitude: -122.4194 },
      'YYZ': { latitude: 43.6532, longitude: -79.3832 }, // Toronto
      'YYC': { latitude: 51.0447, longitude: -114.0719 }, // Calgary
      'YVR': { latitude: 49.2827, longitude: -123.1207 }, // Vancouver
      'ORD': { latitude: 41.8781, longitude: -87.6298 }, // Chicago
      'MIA': { latitude: 25.7617, longitude: -80.1918 }, // Miami
      'SEA': { latitude: 47.6062, longitude: -122.3321 }, // Seattle
      // Europe
      'LON': { latitude: 51.5074, longitude: -0.1278 },
      'PAR': { latitude: 48.8566, longitude: 2.3522 },
      'BCN': { latitude: 41.3851, longitude: 2.1734 }, // Barcelona
      'AMS': { latitude: 52.3676, longitude: 4.9041 }, // Amsterdam
      'BER': { latitude: 52.5200, longitude: 13.4050 }, // Berlin
      'ROM': { latitude: 41.9028, longitude: 12.4964 }, // Rome
      // Asia
      'TYO': { latitude: 35.6762, longitude: 139.6503 },
      'DXB': { latitude: 25.2048, longitude: 55.2708 },
      'SIN': { latitude: 1.3521, longitude: 103.8198 }, // Singapore
      'HKG': { latitude: 22.3193, longitude: 114.1694 }, // Hong Kong
      'BKK': { latitude: 13.7563, longitude: 100.5018 }, // Bangkok
      // Africa
      'LOS': { latitude: 6.5244, longitude: 3.3792 },
      'ABV': { latitude: 9.0579, longitude: 7.4951 },
      'JNB': { latitude: -26.2041, longitude: 28.0473 }, // Johannesburg
      'CAI': { latitude: 30.0444, longitude: 31.2357 }, // Cairo
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

  logger.info('Searching hotels with Duffel Stays');

  // Step 1: Search accommodations
  let searchResults;
  try {
    searchResults = await duffelStaysService.searchAccommodation({
      latitude: finalLatitude,
      longitude: finalLongitude,
      radius: radius ? parseInt(radius as string) : 5,
      checkInDate: checkInDate as string,
      checkOutDate: checkOutDate as string,
      guests,
      rooms: roomQuantity ? parseInt(roomQuantity as string) : 1,
    });
  } catch (error: any) {
    logger.error('Duffel Stays search failed:', error);

    // Check if it's a 403 error (API access not enabled)
    if (error.response?.status === 403 || error.message?.includes('403')) {
      res.status(403).json({
        success: false,
        message: 'Duffel Stays API access not enabled. Please contact Duffel support to enable Stays API access for your account, or use provider=amadeus instead.',
        error: 'API_ACCESS_DENIED',
        suggestion: 'Try adding ?provider=amadeus to your request',
      });
      return;
    }

    // Other errors
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to search accommodations with Duffel Stays',
      error: 'SEARCH_FAILED',
    });
    return;
  }

  // Validate search results
  if (!Array.isArray(searchResults)) {
    logger.error('Search results is not an array:', searchResults);
    res.status(500).json({
      success: false,
      message: 'Invalid response from Duffel Stays API',
      error: 'INVALID_RESPONSE',
    });
    return;
  }

  if (searchResults.length === 0) {
    logger.info('No hotels found in this location');
    res.status(200).json({
      success: true,
      message: 'No hotels found in this location',
      data: [],
      count: 0,
      provider: 'duffel',
    });
    return;
  }

  // Step 2: SKIP bulk rate fetching to avoid rate limits
  // Fetching rates for 100+ hotels simultaneously hits Duffel's rate limit (429)
  // Instead, we'll fetch rates on-demand when user clicks on a specific hotel
  // The search response already includes the cheapest rate, which is enough for listings
  logger.info(`Skipping bulk rate fetching for ${searchResults.length} hotels (will fetch on-demand)`);

  // Create empty rates map - we'll fetch rates individually when needed
  const ratesMap = new Map<string, any>();

  // Transform Duffel search results to match expected format
  // Now enriched with full room data from rates endpoint
  const hotels = await Promise.all(searchResults.map(async (result, index) => {
    // Extract the search result ID
    const searchResultId = result.id || result.accommodation.id;
    const hasSearchResultId = !!result.id;

    // Get full accommodation data with all rooms if available
    const fullAccommodation = result.id ? ratesMap.get(result.id) : null;

    // If address is not available, try reverse geocoding to get city name
    let addressData = fullAccommodation?.address || result.accommodation.address;
    if (!addressData && result.accommodation.location?.geographic_coordinates) {
      try {
        const { latitude, longitude } = result.accommodation.location.geographic_coordinates;
        const geocoded = await GeocodingService.reverseGeocode(latitude, longitude);
        if (geocoded) {
          addressData = {
            line_one: geocoded.street || '',
            city_name: geocoded.city || '',
            region: geocoded.state || '',
            country_code: geocoded.country || '',
            postal_code: geocoded.postalCode || '',
          };
        }
      } catch (error) {
        logger.error('Error reverse geocoding hotel location:', error);
      }
    }

    // Debug logging for first result
    if (index === 0) {
      logger.info('=== FIRST HOTEL TRANSFORMATION ===');
      logger.info(`Search Result ID: ${searchResultId}`);
      logger.info(`Has full rate data: ${!!fullAccommodation}`);
      logger.info(`Room count: ${fullAccommodation?.rooms?.length || 0}`);
      logger.info(`Photos from fullAccommodation: ${fullAccommodation?.photos?.length || 0}`);
      logger.info(`Photos from result.accommodation: ${result.accommodation.photos?.length || 0}`);
      logger.info(`First photo URL: ${(fullAccommodation?.photos || result.accommodation.photos)?.[0]?.url || 'NO URL'}`);
      logger.info('=== ADDRESS DEBUG ===');
      logger.info(`Address from result.accommodation:`, JSON.stringify(result.accommodation.address, null, 2));
      logger.info(`Address from fullAccommodation:`, JSON.stringify(fullAccommodation?.address, null, 2));
      logger.info(`Final addressData (after geocoding):`, JSON.stringify(addressData, null, 2));
      logger.info('================================');
    }

    // Build offers array - use full room data if available, otherwise fallback to cheapest rate
    let offers = [];

    if (fullAccommodation && fullAccommodation.rooms && fullAccommodation.rooms.length > 0) {
      // We have full room data from rates endpoint - use it!
      // Each room has a 'rates' array with different rate options (policies, board types)
      // We'll create an offer for each rate in each room
      offers = fullAccommodation.rooms.flatMap((room: any) => {
        // If room has no rates, skip it
        if (!room.rates || room.rates.length === 0) {
          return [];
        }

        // Create an offer for each rate (different cancellation policies, board types)
        return room.rates.map((rate: any) => ({
          id: rate.id,
          rateId: rate.id, // Store rate ID for booking
          price: {
            total: rate.total_amount,
            currency: rate.total_currency,
            base: rate.base_amount || rate.total_amount,
            public: rate.public_amount || rate.total_amount,
            // Duffel Go-Live requirement: separate taxes and fees
            taxes: rate.tax_amount || '0',
            fees: rate.fee_amount || '0',
            // Calculate fees if not provided
            ...((!rate.fee_amount && rate.base_amount && rate.tax_amount) ? {
              fees: (parseFloat(rate.total_amount) - parseFloat(rate.base_amount) - parseFloat(rate.tax_amount || '0')).toFixed(2)
            } : {}),
            // Duffel Go-Live requirement: amount due at accommodation
            dueAtAccommodation: rate.payment_type === 'pay_later' ? rate.total_amount : '0',
          },
          room: {
            type: room.name || 'Standard Room',
            typeEstimated: {
              category: room.name || 'Standard Room',
              beds: room.beds && room.beds.length > 0 ? room.beds[0].count : 1,
              bedType: room.beds && room.beds.length > 0 ? room.beds[0].type : 'Unknown',
            },
            // Only include description if the room has a UNIQUE description (not hotel's generic one)
            description: room.description ? {
              text: room.description,
            } : undefined,
            // Extract bed info from beds array
            beds: room.beds && room.beds.length > 0 ? room.beds[0].count : undefined,
            bedType: room.beds && room.beds.length > 0 ? room.beds[0].type : undefined,
            // Use room photos if available, otherwise fall back to hotel photos
            media: (room.photos && room.photos.length > 0 ? room.photos : result.accommodation.photos)?.map((photo: any) => ({
              uri: typeof photo === 'string' ? photo : photo.url,
              url: typeof photo === 'string' ? photo : photo.url,
            })) || [],
          },
          boardType: rate.board_type, // 'room_only', 'breakfast', 'half_board', 'full_board'
          paymentType: rate.payment_type, // 'pay_now' or 'pay_later'
          // Duffel Go-Live requirement: full cancellation timeline
          policies: {
            cancellation: rate.cancellation_timeline ? {
              timeline: rate.cancellation_timeline,
              type: rate.cancellation_timeline && rate.cancellation_timeline.length > 0 ? 'REFUNDABLE' : 'NON_REFUNDABLE',
            } : {
              type: 'NON_REFUNDABLE',
              timeline: [],
            },
            // Duffel Go-Live requirement: check-in and check-out times
            checkIn: result.accommodation?.check_in_information ? {
              from: result.accommodation.check_in_information.check_in_after_time || '15:00',
              to: result.accommodation.check_in_information.check_in_before_time || '23:00',
            } : {
              from: '15:00',
              to: '23:00',
            },
            checkOut: result.accommodation?.check_in_information ? {
              before: result.accommodation.check_in_information.check_out_before_time || '11:00',
            } : {
              before: '11:00',
            },
            paymentType: rate.payment_type,
          },
          conditions: rate.conditions || [],
          guests: result.guests,
          available: rate.quantity_available > 0,
          quantityAvailable: rate.quantity_available,
          // Duffel Go-Live requirement: supplier info for T&C display
          supplier: (rate as any).supplier || 'unknown',
        }));
      });
    } else {
      // Fallback: use cheapest rate from search results
      offers = [{
        id: `offer_${result.accommodation.id}_cheapest`,
        price: {
          total: result.cheapest_rate_total_amount,
          currency: result.cheapest_rate_currency,
          base: result.cheapest_rate_base_amount,
          public: result.cheapest_rate_public_amount,
          taxes: (parseFloat(result.cheapest_rate_total_amount) - parseFloat(result.cheapest_rate_base_amount)).toString(),
        },
        room: {
          type: 'Standard Room',
          typeEstimated: {
            category: 'Standard Room',
            beds: 1,
            bedType: 'Double',
          },
          // No description for fallback offers (would just repeat hotel description)
          description: undefined,
          media: result.accommodation.photos?.map((photo: any) => ({
            uri: photo.url,
            url: photo.url,
          })) || [],
        },
        policies: {
          cancellation: {
            type: 'AVAILABLE',
          },
        },
        guests: result.guests,
        available: true,
      }];
    }

    // Extract deal information from cheapest rate
    const dealTypes = result.cheapest_rate_deal_types || [];
    const hasPromo = result.cheapest_rate_conditions?.some((c: any) =>
      c.title?.toLowerCase().includes('promo') ||
      c.description?.toLowerCase().includes('promo')
    ) || false;

    // Calculate distance from search center to hotel (in kilometers)
    const hotelLat = result.accommodation.location?.geographic_coordinates?.latitude;
    const hotelLng = result.accommodation.location?.geographic_coordinates?.longitude;
    let distanceFromCenter = null;

    if (hotelLat && hotelLng && finalLatitude && finalLongitude) {
      // Haversine formula to calculate distance between two points
      const R = 6371; // Radius of the Earth in km
      const dLat = (hotelLat - finalLatitude) * Math.PI / 180;
      const dLon = (hotelLng - finalLongitude) * Math.PI / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(finalLatitude * Math.PI / 180) * Math.cos(hotelLat * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      distanceFromCenter = R * c; // Distance in km
    }

    // Determine if rate is refundable based on cancellation conditions
    const conditions = result.cheapest_rate_conditions || [];
    const isRefundable = conditions.some((c: any) =>
      c.title?.toLowerCase().includes('refund') ||
      c.title?.toLowerCase().includes('cancel') ||
      c.description?.toLowerCase().includes('refund')
    );

    return {
      // CRITICAL: Use search result ID (srr_xxx) not accommodation ID (acc_xxx)
      // Search result IDs are required to fetch detailed rates via /stays/search_results/{id}/actions/fetch_all_rates
      searchResultId: result.id || searchResultId,  // Prioritize result.id which is the search result ID
      hasSearchResultId: !!result.id,
      hasFullRoomData: !!fullAccommodation,
      hotel: {
        hotelId: result.accommodation.id,  // This is the accommodation ID (acc_xxx) for reference
        name: fullAccommodation?.name || result.accommodation.name,
        description: fullAccommodation?.description || result.accommodation.description,
        rating: result.accommodation.rating?.toString() || result.accommodation.review_count?.toString() || '0',
        reviewScore: result.accommodation.review_score || null,
        reviewCount: result.accommodation.review_count || null,
        // Transform photos to media format expected by frontend
        media: (fullAccommodation?.photos || result.accommodation.photos)?.map((photo: any) => ({
          uri: typeof photo === 'string' ? photo : photo.url,
          url: typeof photo === 'string' ? photo : photo.url,
        })) || [],
        location: fullAccommodation?.location || result.accommodation.location,
        address: addressData,
        amenities: fullAccommodation?.amenities || result.accommodation.amenities || [],
        checkInInfo: fullAccommodation?.check_in_information || result.accommodation.check_in_information,
        loyaltyProgramme: fullAccommodation?.supported_loyalty_programme || result.accommodation.supported_loyalty_programme,
        // Add distance from search center (city center)
        distance: distanceFromCenter !== null ? {
          value: parseFloat(distanceFromCenter.toFixed(1)),
          unit: 'KM',
        } : null,
      },
      price: {
        total: result.cheapest_rate_total_amount,
        currency: result.cheapest_rate_currency,
        base: result.cheapest_rate_base_amount,
        public: result.cheapest_rate_public_amount,
      },
      // Add deal information for frontend display
      deals: {
        types: dealTypes,
        hasPromo: hasPromo,
        paymentType: result.cheapest_rate_payment_type,
      },
      // Add cancellation/refundability info
      isRefundable: isRefundable,
      cancellationConditions: conditions,
      offers: offers,
      checkInDate: result.check_in_date,
      checkOutDate: result.check_out_date,
      rooms: result.rooms,
      guests: result.guests,
    };
  }));

  logger.info(`Successfully retrieved ${hotels.length} hotels`);

  // Policy Filtering (if user is authenticated)
  let policyInfo = null;
  let filteredHotels = hotels;

  if (req.user) {
    try {
      // Get user's effective policy
      const policy = await PolicyService.getPolicyForUser(
        req.user.userId,
        req.user.organizationId
      );

      if (policy) {
        // Get effective limits (exception overrides base policy)
        const effectiveHotelMaxPerNight =
          policy.exception?.hotelMaxAmountPerNight || policy.hotelMaxAmountPerNight;
        const effectiveHotelMaxTotal =
          policy.exception?.hotelMaxAmountTotal || policy.hotelMaxAmountTotal;

        // Calculate number of nights
        const checkIn = new Date(checkInDate as string);
        const checkOut = new Date(checkOutDate as string);
        const numberOfNights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

        // Filter hotels by policy limits
        if (effectiveHotelMaxPerNight || effectiveHotelMaxTotal) {
          filteredHotels = hotels.filter((hotel: any) => {
            // For Duffel, check the cheapest offer price
            const totalPrice = parseFloat(hotel.cheapestPrice || hotel.price || hotel.totalPrice || 0);
            const perNightPrice = totalPrice / numberOfNights;

            let allowed = true;

            // Check per-night limit
            if (effectiveHotelMaxPerNight) {
              const maxPerNight = Number(effectiveHotelMaxPerNight);
              if (perNightPrice > maxPerNight) {
                allowed = false;
              }
            }

            // Check total limit
            if (effectiveHotelMaxTotal) {
              const maxTotal = Number(effectiveHotelMaxTotal);
              if (totalPrice > maxTotal) {
                allowed = false;
              }
            }

            return allowed;
          });
        }

        // Prepare policy info for response
        policyInfo = {
          policyId: policy.id,
          policyName: policy.name,
          limits: {
            hotelMaxAmountPerNight: effectiveHotelMaxPerNight
              ? Number(effectiveHotelMaxPerNight)
              : null,
            hotelMaxAmountTotal: effectiveHotelMaxTotal
              ? Number(effectiveHotelMaxTotal)
              : null,
          },
          hasException: !!policy.exception,
          requiresApprovalAbove: policy.requiresApprovalAbove
            ? Number(policy.requiresApprovalAbove)
            : null,
        };
      }
    } catch (policyError) {
      logger.warn('Error applying policy filters:', policyError);
      // Continue without policy filtering if there's an error
    }
  }

  res.status(200).json({
    success: true,
    message: 'Hotels retrieved successfully',
    data: filteredHotels,
    count: filteredHotels.length,
    provider: 'duffel',
    meta: {
      total: hotels.length,
    },
    policy: policyInfo,
  });
}

/**
 * Get hotel rates by search result ID (Duffel Stays)
 */
export const getHotelRates = async (req: Request, res: Response): Promise<void> => {
  try {
    const { searchResultId } = req.params;

    logger.info('Fetching hotel rates', { searchResultId });

    // Check if this is an accommodation ID instead of a search result ID
    // Accommodation IDs start with "acc_", search result IDs have different format
    if (searchResultId.startsWith('acc_')) {
      logger.warn(`Received accommodation ID instead of search result ID: ${searchResultId}`);
      logger.info('Duffel Stays requires search result IDs to fetch rates. Accommodation ID cannot be used directly.');

      res.status(400).json({
        success: false,
        message: 'Invalid search result ID. Please search for hotels again to get valid search result IDs.',
        error: {
          code: 'INVALID_SEARCH_RESULT_ID',
          detail: 'The provided ID is an accommodation ID, not a search result ID. Search result IDs are only available immediately after a search.',
          suggestion: 'Return to the search page and perform a new search'
        }
      });
      return;
    }

    // Fetch all rates for this accommodation from Duffel
    const accommodation = await duffelStaysService.getRatesForSearchResult(searchResultId);

    // Transform the accommodation data into the format frontend expects
    // Similar to searchHotelsWithDuffel transformation
    const offers = accommodation.rooms && accommodation.rooms.length > 0
      ? accommodation.rooms.flatMap((room: any) => {
          if (!room.rates || room.rates.length === 0) {
            return [];
          }

          return room.rates.map((rate: any) => ({
            id: rate.id,
            rateId: rate.id,
            price: {
              total: rate.total_amount,
              currency: rate.total_currency,
              base: rate.base_amount || rate.total_amount,
              public: rate.public_amount || rate.total_amount,
              // Duffel Go-Live requirement: separate taxes and fees
              taxes: rate.tax_amount || '0',
              fees: rate.fee_amount || '0',
              // Calculate fees if not provided (total - base - taxes)
              ...((!rate.fee_amount && rate.base_amount && rate.tax_amount) ? {
                fees: (parseFloat(rate.total_amount) - parseFloat(rate.base_amount) - parseFloat(rate.tax_amount || '0')).toFixed(2)
              } : {}),
              // Duffel Go-Live requirement: amount due at accommodation
              dueAtAccommodation: rate.payment_type === 'pay_later' ? rate.total_amount : '0',
            },
            room: {
              type: room.name || 'Standard Room',
              typeEstimated: {
                category: room.name || 'Standard Room',
                beds: room.beds && room.beds.length > 0 ? room.beds[0].count : 1,
                bedType: room.beds && room.beds.length > 0 ? room.beds[0].type : 'Unknown',
              },
              // Only include description if the room has a UNIQUE description (not hotel's generic one)
              description: room.description ? {
                text: room.description,
              } : undefined,
              beds: room.beds && room.beds.length > 0 ? room.beds[0].count : undefined,
              bedType: room.beds && room.beds.length > 0 ? room.beds[0].type : undefined,
              media: (room.photos && room.photos.length > 0 ? room.photos : accommodation.photos)?.map((photo: any) => ({
                uri: typeof photo === 'string' ? photo : photo.url,
                url: typeof photo === 'string' ? photo : photo.url,
              })) || [],
            },
            boardType: rate.board_type,
            paymentType: rate.payment_type,
            // Duffel Go-Live requirement: full cancellation timeline
            policies: {
              cancellation: rate.cancellation_timeline ? {
                timeline: rate.cancellation_timeline,
                type: rate.cancellation_timeline && rate.cancellation_timeline.length > 0 ? 'REFUNDABLE' : 'NON_REFUNDABLE',
              } : {
                type: 'NON_REFUNDABLE',
                timeline: [],
              },
              // Duffel Go-Live requirement: check-in and check-out times
              checkIn: (accommodation as any).check_in_information ? {
                from: (accommodation as any).check_in_information.check_in_after_time || '15:00',
                to: (accommodation as any).check_in_information.check_in_before_time || '23:00',
              } : {
                from: '15:00',
                to: '23:00',
              },
              checkOut: (accommodation as any).check_in_information ? {
                before: (accommodation as any).check_in_information.check_out_before_time || '11:00',
              } : {
                before: '11:00',
              },
              paymentType: rate.payment_type,
            },
            conditions: rate.conditions || [],
            available: rate.quantity_available > 0,
            quantityAvailable: rate.quantity_available,
            // Duffel Go-Live requirement: supplier info for T&C display
            supplier: (rate as any).supplier || 'unknown',
          }));
        })
      : [];

    // Return transformed data in the same format as search results
    const transformedData = {
      hotel: {
        hotelId: accommodation.id,
        name: accommodation.name,
        description: accommodation.description,
        rating: accommodation.rating,
        // Transform photos to media format expected by frontend
        media: accommodation.photos?.map((photo: any) => ({
          uri: typeof photo === 'string' ? photo : photo.url,
          url: typeof photo === 'string' ? photo : photo.url,
        })) || [],
        location: accommodation.location,
        address: accommodation.address,
        amenities: accommodation.amenities?.map((amenity: any) =>
          typeof amenity === 'string' ? amenity : (amenity.description || amenity.type || '')
        ) || [],
        checkInInfo: (accommodation as any).check_in_information,
        loyaltyProgramme: (accommodation as any).supported_loyalty_programme,
      },
      offers: offers,
    };

    logger.info(`Transformed ${offers.length} offers from ${accommodation.rooms?.length || 0} rooms`);

    res.status(200).json({
      success: true,
      message: 'Hotel rates retrieved successfully',
      data: transformedData,
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
