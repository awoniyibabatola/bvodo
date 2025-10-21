/**
 * Centralized API Configuration
 * This file provides the base URL for all API requests
 * Uses environment variables with fallback to localhost for development
 */

export const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  version: process.env.NEXT_PUBLIC_API_VERSION || 'v1',
} as const;

/**
 * Get the full API URL with version
 * @example getApiUrl() // Returns: "http://localhost:5000/api/v1"
 */
export const getApiUrl = (): string => {
  return `${API_CONFIG.baseURL}/api/${API_CONFIG.version}`;
};

/**
 * Get the full API endpoint URL
 * @param endpoint - The endpoint path (e.g., "/auth/login")
 * @example getApiEndpoint("/auth/login") // Returns: "http://localhost:5000/api/v1/auth/login"
 */
export const getApiEndpoint = (endpoint: string): string => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${getApiUrl()}/${cleanEndpoint}`;
};

/**
 * Export individual URLs for convenience
 */
export const API_ENDPOINTS = {
  // Auth
  login: getApiEndpoint('auth/login'),
  register: getApiEndpoint('auth/register'),
  logout: getApiEndpoint('auth/logout'),

  // Base paths for dynamic endpoints
  auth: `${getApiUrl()}/auth`,
  users: `${getApiUrl()}/users`,
  bookings: `${getApiUrl()}/bookings`,
  flights: `${getApiUrl()}/flights`,
  hotels: `${getApiUrl()}/hotels`,
  dashboard: `${getApiUrl()}/dashboard`,
  superAdmin: `${getApiUrl()}/super-admin`,
} as const;
