import axios from 'axios';
import { env } from '../config/env';
import { logger } from '../utils/logger';

interface GeocodeResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  city?: string;
  country?: string;
}

export class GeocodingService {
  private static readonly BASE_URL = 'https://maps.googleapis.com/maps/api/geocode/json';
  private static readonly apiKey = env.GOOGLE_MAPS_API_KEY;

  /**
   * Enrich address with additional context to improve geocoding accuracy
   */
  private static enrichAddressContext(address: string): string {
    const lowerAddress = address.toLowerCase();

    // Map of known cities/regions to their full context
    const cityContextMap: { [key: string]: string } = {
      // Canadian cities
      'calgary': 'Calgary, Alberta, Canada',
      'toronto': 'Toronto, Ontario, Canada',
      'vancouver': 'Vancouver, British Columbia, Canada',
      'montreal': 'Montreal, Quebec, Canada',
      'ottawa': 'Ottawa, Ontario, Canada',
      'edmonton': 'Edmonton, Alberta, Canada',

      // Calgary neighborhoods/areas
      'seton': 'Seton, Calgary, Alberta, Canada',
      'downtown calgary': 'Downtown Calgary, Alberta, Canada',
      'beltline': 'Beltline, Calgary, Alberta, Canada',
      'kensington': 'Kensington, Calgary, Alberta, Canada',
      '17th avenue': '17th Avenue, Calgary, Alberta, Canada',

      // If already has context, don't modify
    };

    // Check if address already contains country/state context
    const hasContext = /\b(canada|usa|united states|uk|france|germany|australia|alberta|ontario|texas|california|florida|new york)\b/i.test(address);

    if (hasContext) {
      // Address already has sufficient context
      return address;
    }

    // Check for known cities and add context
    for (const [city, fullContext] of Object.entries(cityContextMap)) {
      if (lowerAddress.includes(city)) {
        // Check if it's specifically mentioning the city
        const cityRegex = new RegExp(`\\b${city}\\b`, 'i');
        if (cityRegex.test(lowerAddress)) {
          // Replace just the city name with full context
          return address.replace(cityRegex, fullContext);
        }
      }
    }

    return address;
  }

  /**
   * Geocode an address to coordinates
   */
  static async geocodeAddress(address: string): Promise<GeocodeResult | null> {
    try {
      if (!this.apiKey || this.apiKey === 'your-google-maps-api-key') {
        logger.warn('Google Maps API key not configured for geocoding');
        return null;
      }

      // Detect if address contains city/region names and add them for better context
      const enrichedAddress = this.enrichAddressContext(address);

      const response = await axios.get(this.BASE_URL, {
        params: {
          address: enrichedAddress,
          key: this.apiKey,
          // Add region biasing for more relevant results
          // This tells Google to prefer results from these regions
          region: 'us', // Default to US, but address components will override
        },
      });

      if (response.data.status === 'OK' && response.data.results?.length > 0) {
        const result = response.data.results[0];
        const location = result.geometry.location;

        // Extract city and country from address components
        let city: string | undefined;
        let country: string | undefined;

        result.address_components.forEach((component: any) => {
          if (component.types.includes('locality')) {
            city = component.long_name;
          }
          if (component.types.includes('country')) {
            country = component.long_name;
          }
        });

        return {
          latitude: location.lat,
          longitude: location.lng,
          formattedAddress: result.formatted_address,
          city,
          country,
        };
      }

      logger.warn(`Geocoding failed for address: ${address}`);
      return null;
    } catch (error: any) {
      logger.error('Geocoding error:', error.message);
      return null;
    }
  }

  /**
   * Reverse geocode coordinates to address with detailed components
   */
  static async reverseGeocode(latitude: number, longitude: number): Promise<{
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    formattedAddress?: string;
  } | null> {
    try {
      if (!this.apiKey || this.apiKey === 'your-google-maps-api-key') {
        logger.warn('Google Maps API key not configured for reverse geocoding');
        return null;
      }

      const response = await axios.get(this.BASE_URL, {
        params: {
          latlng: `${latitude},${longitude}`,
          key: this.apiKey,
        },
      });

      if (response.data.status === 'OK' && response.data.results?.length > 0) {
        const result = response.data.results[0];

        // Extract address components
        let street: string | undefined;
        let city: string | undefined;
        let state: string | undefined;
        let country: string | undefined;
        let postalCode: string | undefined;

        result.address_components.forEach((component: any) => {
          if (component.types.includes('route')) {
            street = component.long_name;
          } else if (component.types.includes('street_number')) {
            street = component.long_name + (street ? ' ' + street : '');
          } else if (component.types.includes('locality')) {
            city = component.long_name;
          } else if (component.types.includes('administrative_area_level_1')) {
            state = component.short_name;
          } else if (component.types.includes('country')) {
            country = component.short_name;
          } else if (component.types.includes('postal_code')) {
            postalCode = component.long_name;
          }
        });

        return {
          street,
          city,
          state,
          country,
          postalCode,
          formattedAddress: result.formatted_address,
        };
      }

      return null;
    } catch (error: any) {
      logger.error('Reverse geocoding error:', error.message);
      return null;
    }
  }
}

export default GeocodingService;
