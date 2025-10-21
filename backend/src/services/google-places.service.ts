import axios from 'axios';
import { env } from '../config/env';
import { logger } from '../utils/logger';

interface PlacePhoto {
  photoReference: string;
  height: number;
  width: number;
  htmlAttributions: string[];
}

interface PlaceDetails {
  placeId: string;
  name: string;
  photos: PlacePhoto[];
  rating?: number;
  userRatingsTotal?: number;
}

export class GooglePlacesService {
  private static readonly BASE_URL = 'https://maps.googleapis.com/maps/api/place';
  private static readonly apiKey = env.GOOGLE_MAPS_API_KEY;

  /**
   * Search for a place by hotel name and location
   */
  static async findPlace(hotelName: string, cityName?: string): Promise<string | null> {
    try {
      if (!this.apiKey || this.apiKey === 'your-google-maps-api-key') {
        logger.warn('Google Maps API key not configured');
        return null;
      }

      const query = cityName ? `${hotelName} ${cityName}` : hotelName;

      const response = await axios.get(`${this.BASE_URL}/findplacefromtext/json`, {
        params: {
          input: query,
          inputtype: 'textquery',
          fields: 'place_id,name',
          key: this.apiKey,
        },
      });

      if (response.data.status === 'OK' && response.data.candidates?.length > 0) {
        return response.data.candidates[0].place_id;
      }

      logger.warn(`No place found for hotel: ${hotelName}`);
      return null;
    } catch (error: any) {
      logger.error('Google Places find place error:', error.message);
      return null;
    }
  }

  /**
   * Get place details including photos and additional information
   */
  static async getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
    try {
      if (!this.apiKey || this.apiKey === 'your-google-maps-api-key') {
        logger.warn('Google Maps API key not configured');
        return null;
      }

      const response = await axios.get(`${this.BASE_URL}/details/json`, {
        params: {
          place_id: placeId,
          fields: 'name,photos,rating,user_ratings_total,formatted_address,formatted_phone_number,website,opening_hours,types,price_level,reviews',
          key: this.apiKey,
        },
      });

      if (response.data.status === 'OK' && response.data.result) {
        const result = response.data.result;

        return {
          placeId,
          name: result.name,
          rating: result.rating,
          userRatingsTotal: result.user_ratings_total,
          photos: (result.photos || []).map((photo: any) => ({
            photoReference: photo.photo_reference,
            height: photo.height,
            width: photo.width,
            htmlAttributions: photo.html_attributions || [],
          })),
        };
      }

      return null;
    } catch (error: any) {
      logger.error('Google Places get details error:', error.message);
      return null;
    }
  }

  /**
   * Get photo URL from photo reference
   */
  static getPhotoUrl(photoReference: string, maxWidth: number = 800): string {
    if (!this.apiKey || this.apiKey === 'your-google-maps-api-key') {
      return '';
    }

    return `${this.BASE_URL}/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${this.apiKey}`;
  }

  /**
   * Get hotel photos by hotel name and city
   * Returns array of photo URLs (up to 10 photos)
   */
  static async getHotelPhotos(hotelName: string, cityName?: string): Promise<string[]> {
    try {
      // Find the place
      const placeId = await this.findPlace(hotelName, cityName);
      if (!placeId) {
        return [];
      }

      // Get place details with photos
      const details = await this.getPlaceDetails(placeId);
      if (!details || !details.photos || details.photos.length === 0) {
        return [];
      }

      // Generate photo URLs (limit to 10 photos)
      const photoUrls = details.photos
        .slice(0, 10)
        .map(photo => this.getPhotoUrl(photo.photoReference, 800));

      logger.info(`Found ${photoUrls.length} photos for hotel: ${hotelName}`);
      return photoUrls;
    } catch (error: any) {
      logger.error('Get hotel photos error:', error.message);
      return [];
    }
  }

  /**
   * Get room-specific photos for a hotel room type
   * Uses a combination of hotel name and room type to find relevant images
   */
  static async getRoomPhotos(hotelName: string, roomType: string, cityName?: string): Promise<string[]> {
    try {
      // Search for room-specific images by combining hotel name and room type
      const searchQuery = `${hotelName} ${roomType} room ${cityName || ''}`.trim();

      const placeId = await this.findPlace(searchQuery);
      if (!placeId) {
        // Fallback to hotel photos if room-specific not found
        return this.getHotelPhotos(hotelName, cityName).then(photos => photos.slice(0, 3));
      }

      const details = await this.getPlaceDetails(placeId);
      if (!details || !details.photos || details.photos.length === 0) {
        // Fallback to hotel photos
        return this.getHotelPhotos(hotelName, cityName).then(photos => photos.slice(0, 3));
      }

      // Return up to 3 room photos
      const photoUrls = details.photos
        .slice(0, 3)
        .map(photo => this.getPhotoUrl(photo.photoReference, 600));

      logger.info(`Found ${photoUrls.length} room photos for: ${roomType} at ${hotelName}`);
      return photoUrls;
    } catch (error: any) {
      logger.error('Get room photos error:', error.message);
      // Fallback to hotel photos on error
      return this.getHotelPhotos(hotelName, cityName).then(photos => photos.slice(0, 3));
    }
  }
}

export default GooglePlacesService;
