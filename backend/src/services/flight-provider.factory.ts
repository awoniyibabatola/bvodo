import { env } from '../config/env';
import { logger } from '../utils/logger';
import {
  IFlightProvider,
  FlightSearchParams,
  StandardizedFlightOffer,
  CreateBookingParams,
  BookingConfirmation,
  ProviderType,
} from '../interfaces/flight-provider.interface';
import DuffelService from './duffel.service';
// Note: AmadeusService will be imported once we create the adapter

/**
 * Flight Provider Factory
 *
 * Manages multiple flight providers (Duffel, Amadeus) and provides:
 * - Provider selection based on configuration
 * - Automatic fallback if primary provider fails
 * - Provider-specific error handling
 */
export class FlightProviderFactory {
  /**
   * Get a flight provider instance by name
   */
  static getProvider(providerName?: ProviderType): IFlightProvider {
    const provider = providerName || env.PRIMARY_FLIGHT_PROVIDER;

    logger.info(`[Provider Factory] Getting provider: ${provider}`);

    switch (provider) {
      case 'duffel':
        if (!env.DUFFEL_ACCESS_TOKEN) {
          throw new Error('Duffel access token not configured');
        }
        return DuffelService;

      case 'amadeus':
        // For now, we'll handle Amadeus separately
        // Once we create the Amadeus adapter, we'll import it here
        throw new Error('Amadeus provider adapter not yet implemented');

      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  /**
   * Search flights with automatic fallback
   *
   * Tries primary provider first, falls back to secondary if configured
   */
  static async searchFlightsWithFallback(
    params: FlightSearchParams,
    preferredProvider?: ProviderType
  ): Promise<{
    offers: StandardizedFlightOffer[];
    provider: ProviderType;
    usedFallback: boolean;
  }> {
    const primaryProvider = preferredProvider || env.PRIMARY_FLIGHT_PROVIDER;
    const enableFallback = env.ENABLE_PROVIDER_FALLBACK;

    try {
      logger.info(`[Provider Factory] Searching with primary provider: ${primaryProvider}`);
      const provider = this.getProvider(primaryProvider);
      const offers = await provider.searchFlights(params);

      return {
        offers,
        provider: primaryProvider,
        usedFallback: false,
      };
    } catch (primaryError: any) {
      logger.error(`[Provider Factory] Primary provider ${primaryProvider} failed:`, primaryError.message);

      // Try fallback if enabled
      if (enableFallback) {
        const fallbackProvider = primaryProvider === 'duffel' ? 'amadeus' : 'duffel';

        try {
          logger.warn(`[Provider Factory] Attempting fallback to: ${fallbackProvider}`);
          const provider = this.getProvider(fallbackProvider);
          const offers = await provider.searchFlights(params);

          return {
            offers,
            provider: fallbackProvider,
            usedFallback: true,
          };
        } catch (fallbackError: any) {
          logger.error(`[Provider Factory] Fallback provider ${fallbackProvider} also failed:`, fallbackError.message);
          // Both providers failed, throw the original error
          throw primaryError;
        }
      } else {
        // Fallback disabled, throw original error
        throw primaryError;
      }
    }
  }

  /**
   * Get offer details from specific provider
   */
  static async getOfferDetails(
    offerId: string,
    provider: ProviderType
  ): Promise<StandardizedFlightOffer> {
    try {
      logger.info(`[Provider Factory] Getting offer details from ${provider}: ${offerId}`);
      const providerInstance = this.getProvider(provider);
      return await providerInstance.getOfferDetails(offerId);
    } catch (error: any) {
      logger.error(`[Provider Factory] Get offer details failed:`, error.message);
      throw error;
    }
  }

  /**
   * Create booking with specific provider
   */
  static async createBooking(
    params: CreateBookingParams,
    provider: ProviderType
  ): Promise<BookingConfirmation> {
    try {
      logger.info(`[Provider Factory] Creating booking with ${provider}`);
      const providerInstance = this.getProvider(provider);
      return await providerInstance.createBooking(params);
    } catch (error: any) {
      logger.error(`[Provider Factory] Create booking failed:`, error.message);
      throw error;
    }
  }

  /**
   * Get seat maps if provider supports it
   */
  static async getSeatMaps(
    offerId: string,
    provider: ProviderType
  ): Promise<any[] | null> {
    try {
      logger.info(`[Provider Factory] Getting seat maps from ${provider}`);
      const providerInstance = this.getProvider(provider);

      if (!providerInstance.getSeatMaps) {
        logger.warn(`[Provider Factory] Provider ${provider} does not support seat maps`);
        return null;
      }

      return await providerInstance.getSeatMaps(offerId);
    } catch (error: any) {
      logger.error(`[Provider Factory] Get seat maps failed:`, error.message);
      return null;
    }
  }

  /**
   * Get available services if provider supports it
   */
  static async getAvailableServices(
    offerId: string,
    provider: ProviderType
  ): Promise<any[] | null> {
    try {
      logger.info(`[Provider Factory] Getting available services from ${provider}`);
      const providerInstance = this.getProvider(provider);

      if (!providerInstance.getAvailableServices) {
        logger.warn(`[Provider Factory] Provider ${provider} does not support ancillary services`);
        return null;
      }

      return await providerInstance.getAvailableServices(offerId);
    } catch (error: any) {
      logger.error(`[Provider Factory] Get available services failed:`, error.message);
      return null;
    }
  }

  /**
   * Check provider availability
   */
  static isProviderAvailable(provider: ProviderType): boolean {
    switch (provider) {
      case 'duffel':
        return !!env.DUFFEL_ACCESS_TOKEN;
      case 'amadeus':
        return !!(env.AMADEUS_CLIENT_ID && env.AMADEUS_CLIENT_SECRET);
      default:
        return false;
    }
  }

  /**
   * Get list of available providers
   */
  static getAvailableProviders(): ProviderType[] {
    const providers: ProviderType[] = [];

    if (this.isProviderAvailable('duffel')) {
      providers.push('duffel');
    }

    if (this.isProviderAvailable('amadeus')) {
      providers.push('amadeus');
    }

    return providers;
  }

  /**
   * Get provider capabilities
   */
  static getProviderCapabilities(provider: ProviderType): {
    supportsSearch: boolean;
    supportsBooking: boolean;
    supportsSeatMaps: boolean;
    supportsAncillaries: boolean;
    supportsCancellation: boolean;
  } {
    // Different providers have different capabilities
    const capabilities = {
      duffel: {
        supportsSearch: true,
        supportsBooking: true,
        supportsSeatMaps: true,
        supportsAncillaries: true,
        supportsCancellation: true,
      },
      amadeus: {
        supportsSearch: true,
        supportsBooking: true,
        supportsSeatMaps: false,
        supportsAncillaries: false,
        supportsCancellation: false,
      },
    };

    return capabilities[provider] || {
      supportsSearch: false,
      supportsBooking: false,
      supportsSeatMaps: false,
      supportsAncillaries: false,
      supportsCancellation: false,
    };
  }
}

export default FlightProviderFactory;
