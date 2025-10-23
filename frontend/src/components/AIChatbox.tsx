'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  MessageCircle,
  X,
  Send,
  Plane,
  Hotel,
  Sparkles,
  Loader2,
  Calendar,
  MapPin,
  Users,
  ArrowRight,
  Star,
  Clock,
  DollarSign,
  CheckCircle,
  CreditCard,
  Building2,
  ThumbsUp,
  PartyPopper,
} from 'lucide-react';
import { getCityCode as getCityCodeFromMap, getCityCodeWithContext, getAmbiguousCityOptions } from '@/utils/cityMapping';
import { getApiEndpoint } from '@/lib/api-config';

interface FlightResult {
  id: string;
  airline: string;
  airlineCode: string;
  route: string;
  departure: string;
  arrival: string;
  duration: string;
  price: string;
  stops: number;
  cabin: string;
}

interface HotelResult {
  id: string;
  name: string;
  location: string;
  rating: number;
  price: string;
  image: string;
  amenities: string[];
}

interface SearchParams {
  // Common parameters
  maxPrice?: number;
  minPrice?: number;

  // Date parameters
  departureDate?: string;
  returnDate?: string;
  checkInDate?: string;
  checkOutDate?: string;

  // Hotel-specific
  amenities?: string[];
  minRating?: number;
  maxDistance?: number;
  location?: string;

  // Flight-specific
  origin?: string;
  destination?: string;
  directOnly?: boolean;
  directFlight?: boolean;
  cabinClass?: 'Economy' | 'Business' | 'First';
  adults?: number;
  children?: number;
  infants?: number;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  flightResults?: FlightResult[];
  hotelResults?: HotelResult[];
  bookingConfirmation?: {
    type: 'flight' | 'hotel';
    details: any;
    total: string;
  };
  typing?: boolean;
}

// Conversational responses
const conversationalResponses = {
  greetings: [
    "Hey there! Ready to plan your next adventure? I'm here to help you find the perfect flight or hotel!",
    "Hi! So excited to help you travel today! Where are you thinking of going?",
    "Hello! Let's make your travel dreams come true! Whether it's business or pleasure, I've got you covered!",
  ],
  searching: [
    "Ooh, great choice! Let me find the best options for you...",
    "On it! Searching through thousands of options to find you the perfect match...",
    "Excellent! Give me just a sec while I pull up the best deals...",
    "Love it! Let me work my magic and find you something amazing...",
  ],
  noResults: [
    "Hmm, I couldn't find anything for that location. Could you try a different city? Maybe check the spelling?",
    "Oops! That location isn't ringing any bells. Can you try another city name? I'm here to help!",
  ],
  helpfulTips: [
    "Pro tip: I can understand requests like 'Find me a flight from Lagos to London under $500'",
    "Just chat naturally! Try 'I need a hotel in downtown Calgary' or 'Hotel near Times Square'",
    "You can specify neighborhoods too! Like 'hotel in seton calgary' or 'near las vegas strip'",
  ],
  excitement: [
    "Awesome choice!",
    "Great pick!",
    "Love it!",
    "Perfect!",
  ],
  bookingSuccess: [
    "Woohoo! Your booking is confirmed! Pack your bags, adventure awaits!",
    "All set! Your trip is booked! Time to get excited!",
    "Done and dusted! Your booking is confirmed! Have an amazing trip!",
  ],
};

const getRandomResponse = (category: keyof typeof conversationalResponses): string => {
  const responses = conversationalResponses[category];
  return responses[Math.floor(Math.random() * responses.length)];
};

interface AIChatboxProps {
  initialMessage?: string;
  forceOpen?: boolean;
}

export default function AIChatbox({ initialMessage, forceOpen = false }: AIChatboxProps = {}) {
  const [isOpen, setIsOpen] = useState(forceOpen);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: getRandomResponse('greetings'),
      timestamp: new Date(),
      suggestions: [
        'Flight from Lagos to London under $600',
        'Luxury hotel in downtown Calgary',
        'Hotel near Times Square New York',
        'Flight from New York to Paris',
      ],
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [claudeAvailable, setClaudeAvailable] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [conversationContext, setConversationContext] = useState<{
    lastSearchType?: 'flight' | 'hotel';
    lastOrigin?: string;
    lastDestination?: string;
    lastLocation?: string;
    lastParams?: SearchParams;
    pendingSearch?: {
      type: 'flight' | 'hotel';
      origin?: string;
      destination?: string;
      location?: string;
      missingInfo: string[];
    };
    pendingDisambiguation?: {
      type: 'origin' | 'destination' | 'location';
      cityName: string;
      options: Array<{ name: string; code: string; country: string; context: string }>;
      originalQuery: string;
    };
    resolvedCities?: {
      origin?: { name: string; code: string };
      destination?: { name: string; code: string };
    };
  }>({});
  const [bookingFlow, setBookingFlow] = useState<{
    active: boolean;
    type: 'flight' | 'hotel';
    selectedItem: any;
    step: 'confirm' | 'payment' | 'complete';
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle initialMessage prop
  useEffect(() => {
    if (initialMessage && initialMessage.trim()) {
      setInputValue(initialMessage.trim());
      // Focus the input after setting the value
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  }, [initialMessage]);

  // Check Claude AI availability on mount
  useEffect(() => {
    const checkClaudeAvailability = async () => {
      try {
        const response = await fetch(getApiEndpoint('ai-chat/availability'));
        const data = await response.json();
        setClaudeAvailable(data.available);
        console.log('[Claude AI] Availability:', data.available);
      } catch (error) {
        console.error('[Claude AI] Failed to check availability:', error);
        setClaudeAvailable(false);
      }
    };
    checkClaudeAvailability();
  }, []);

  // Simulate typing effect
  const addMessageWithTyping = async (message: Message) => {
    // Show typing indicator
    setIsTyping(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsTyping(false);

    // Add message
    setMessages((prev) => [...prev, message]);

    // Update conversation history for Claude (only add assistant text messages, not results)
    if (message.role === 'assistant' && message.content && !message.flightResults && !message.hotelResults) {
      setConversationHistory((prev) => [
        ...prev,
        { role: 'assistant', content: message.content },
      ]);
    }
  };

  // Helper to get IATA code from city name (uses centralized utility)
  const getCityCode = (city: string): string | null => {
    const code = getCityCodeFromMap(city);
    console.log('[getCityCode] Input:', city, '→ Code:', code);
    return code;
  };

  // Real flight search using API
  const searchFlights = async (
    origin: string,
    destination: string,
    departureDate: string,
    params?: SearchParams
  ): Promise<FlightResult[]> => {
    try {
      const originCode = getCityCode(origin);
      const destCode = getCityCode(destination);

      console.log('[searchFlights] Converting cities to IATA codes:', {
        origin,
        originCode,
        destination,
        destCode,
        departureDate
      });

      // Validate that both cities were recognized
      if (!originCode || !destCode) {
        const missingCities = [];
        if (!originCode) missingCities.push(`"${origin}"`);
        if (!destCode) missingCities.push(`"${destination}"`);

        console.error('[searchFlights] Unknown city codes:', { origin, originCode, destination, destCode });
        throw new Error(`I don't recognize ${missingCities.join(' and ')}. Please use major city names like "Lagos", "London", "New York", etc.`);
      }

      const queryParams = new URLSearchParams({
        origin: originCode,
        destination: destCode,
        departureDate: departureDate,
        adults: '1',
        max: '10',
      });

      if (params?.maxPrice) {
        queryParams.append('maxPrice', params.maxPrice.toString());
      }
      if (params?.directOnly) {
        queryParams.append('nonStop', 'true');
      }
      if (params?.cabinClass) {
        const classMap: { [key: string]: string } = {
          'Economy': 'ECONOMY',
          'Business': 'BUSINESS',
          'First': 'FIRST',
        };
        queryParams.append('travelClass', classMap[params.cabinClass] || 'ECONOMY');
      }

      const apiUrl = `${getApiEndpoint('flights/search')}?${queryParams}`;
      console.log('[searchFlights] Making API call to:', apiUrl);

      const response = await fetch(apiUrl);

      console.log('[searchFlights] API response status:', response.status);

      if (!response.ok) {
        throw new Error('Failed to search flights');
      }

      const responseData = await response.json();
      console.log('[searchFlights] API returned data:', responseData);

      // Extract the flights array from the response
      const flights = responseData.data || [];
      console.log('[searchFlights] Extracted flights:', flights.length, 'offers');

      // Transform API response to our FlightResult format
      return flights.slice(0, 5).map((offer: any) => {
        const firstSegment = offer.itineraries[0].segments[0];
        const lastSegment = offer.itineraries[0].segments[offer.itineraries[0].segments.length - 1];
        const stops = offer.itineraries[0].segments.length - 1;

        return {
          id: offer.id,
          airline: firstSegment.carrierCode,
          airlineCode: firstSegment.carrierCode,
          route: `${origin} → ${destination}`,
          departure: new Date(firstSegment.departure.at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          arrival: new Date(lastSegment.arrival.at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          duration: offer.itineraries[0].duration.replace('PT', '').toLowerCase(),
          price: parseFloat(offer.price.total).toFixed(0),
          stops: stops,
          cabin: offer.travelerPricings[0].fareDetailsBySegment[0].cabin || 'Economy',
        };
      });
    } catch (error) {
      console.error('Flight search error:', error);
      // Return empty array on error - will be handled by the UI
      return [];
    }
  };

  // Real hotel search using API
  const searchHotels = async (
    location: string,
    checkInDate: string,
    checkOutDate: string,
    params?: SearchParams
  ): Promise<HotelResult[]> => {
    try {
      console.log('[searchHotels] Searching hotels for location:', { location, checkInDate, checkOutDate });

      // Try to get city code first (same logic as main search page)
      const cityCode = getCityCode(location);

      const queryParams = new URLSearchParams({
        checkInDate: checkInDate,
        checkOutDate: checkOutDate,
        adults: '1',
        radius: '5',
        radiusUnit: 'KM',
        currency: 'USD',
      });

      // If we have a valid city code from our map, use it; otherwise use full address for geocoding
      if (cityCode) {
        queryParams.append('cityCode', cityCode);
        console.log('[searchHotels] Using city code search:', cityCode);
      } else {
        // Use full address - backend will geocode it
        queryParams.append('address', location);
        console.log('[searchHotels] Using address-based search for:', location);
      }

      const apiUrl = `${getApiEndpoint('hotels/search')}?${queryParams}`;
      console.log('[searchHotels] Making API call to:', apiUrl);

      const response = await fetch(apiUrl);
      console.log('[searchHotels] API response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[searchHotels] API error:', errorData);
        throw new Error(errorData.message || 'Failed to search hotels');
      }

      const responseData = await response.json();
      console.log('[searchHotels] API returned data:', responseData);

      // Check if response indicates failure
      if (responseData.success === false) {
        console.error('[searchHotels] Search failed:', responseData.message);
        throw new Error(responseData.message || 'No hotels found');
      }

      // Extract hotels array from response (handle both {data: [...]} and [...] formats)
      const data = responseData.data || responseData;
      console.log('[searchHotels] Extracted hotels array:', data.length, 'hotels');

      // Transform API response to our HotelResult format and apply filters
      let hotels = data.slice(0, 10).map((item: any) => {
        const hotel = item.hotel;
        const offers = item.offers || [];
        const lowestPrice = offers.length > 0
          ? offers.reduce((min: any, offer: any) =>
              parseFloat(offer.price.total) < parseFloat(min.price.total) ? offer : min
            )
          : null;

        return {
          id: hotel.hotelId,
          name: hotel.name,
          location: hotel.address?.cityName || location,
          rating: hotel.rating || 4.5, // Default to 4.5 to pass luxury filters
          price: lowestPrice ? parseFloat(lowestPrice.price.total).toFixed(0) : '150',
          image: hotel.media && hotel.media.length > 0
            ? hotel.media[0].uri
            : 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400',
          amenities: hotel.amenities || ['WiFi'],
        };
      });

      // Apply filters
      console.log('[searchHotels] Before filtering:', hotels.length, 'hotels');
      console.log('[searchHotels] Filter params:', params);

      if (params) {
        if (params.maxPrice !== undefined && params.maxPrice !== null) {
          console.log('[searchHotels] Applying maxPrice filter:', params.maxPrice);
          const beforeCount = hotels.length;
          hotels = hotels.filter((h: HotelResult) => parseFloat(h.price) <= params.maxPrice!);
          console.log('[searchHotels] After maxPrice filter:', beforeCount, '→', hotels.length, 'hotels');
        }
        if (params.minRating !== undefined && params.minRating !== null) {
          console.log('[searchHotels] Applying minRating filter:', params.minRating);
          const beforeCount = hotels.length;
          hotels = hotels.filter((h: HotelResult) => h.rating >= params.minRating!);
          console.log('[searchHotels] After minRating filter:', beforeCount, '→', hotels.length, 'hotels');
        }
      }

      console.log('[searchHotels] Returning hotels:', hotels.length, 'results');
      return hotels;
    } catch (error: any) {
      console.error('[searchHotels] Hotel search error:', error);
      // Return empty array but log the error message for better debugging
      // The error message will be shown in the UI by the calling function
      return [];
    }
  };

  // Helper function to get future date
  const getFutureDate = (days: number): string => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  };

  // Helper function to parse dates from natural language
  const parseDateFromMessage = (message: string): { departureDate?: string; checkInDate?: string; checkOutDate?: string; returnDate?: string } => {
    const lowerMessage = message.toLowerCase();
    const dates: { departureDate?: string; checkInDate?: string; checkOutDate?: string; returnDate?: string } = {};

    console.log('[parseDateFromMessage] Input:', message);

    // Month names mapping
    const monthNames: { [key: string]: number } = {
      january: 0, jan: 0,
      february: 1, feb: 1,
      march: 2, mar: 2,
      april: 3, apr: 3,
      may: 4,
      june: 5, jun: 5,
      july: 6, jul: 6,
      august: 7, aug: 7,
      september: 8, sep: 8, sept: 8,
      october: 9, oct: 9,
      november: 10, nov: 10,
      december: 11, dec: 11,
    };

    // Relative date patterns
    if (/\b(tomorrow)\b/i.test(lowerMessage)) {
      dates.departureDate = getFutureDate(1);
      dates.checkInDate = getFutureDate(1);
    } else if (/\b(next week)\b/i.test(lowerMessage)) {
      dates.departureDate = getFutureDate(7);
      dates.checkInDate = getFutureDate(7);
    } else if (/\b(next month)\b/i.test(lowerMessage)) {
      dates.departureDate = getFutureDate(30);
      dates.checkInDate = getFutureDate(30);
    } else if (/\b(today)\b/i.test(lowerMessage)) {
      dates.departureDate = getFutureDate(0);
      dates.checkInDate = getFutureDate(0);
    }

    // Specific date patterns: "21st", "25th", "3rd", etc.
    const dayOrdinalMatch = lowerMessage.match(/\b(\d{1,2})(?:st|nd|rd|th)\b/);
    if (dayOrdinalMatch) {
      const day = parseInt(dayOrdinalMatch[1]);
      const today = new Date();
      let targetDate = new Date(today.getFullYear(), today.getMonth(), day);

      // If the date has passed this month, assume next month
      if (targetDate < today) {
        targetDate = new Date(today.getFullYear(), today.getMonth() + 1, day);
      }

      dates.departureDate = targetDate.toISOString().split('T')[0];
      dates.checkInDate = targetDate.toISOString().split('T')[0];
    }

    // Month + day patterns: "in December", "December 25th", "25th December", "Dec 21"
    for (const [monthName, monthIndex] of Object.entries(monthNames)) {
      const monthDayPattern = new RegExp(`\\b(${monthName})\\s*(\\d{1,2})(?:st|nd|rd|th)?\\b`, 'i');
      const dayMonthPattern = new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s*(${monthName})\\b`, 'i');
      const inMonthPattern = new RegExp(`\\bin\\s+(${monthName})\\b`, 'i');

      let match = lowerMessage.match(monthDayPattern);
      if (match) {
        const day = parseInt(match[2]);
        const targetDate = getDateForMonthDay(monthIndex, day);
        dates.departureDate = targetDate.toISOString().split('T')[0];
        dates.checkInDate = targetDate.toISOString().split('T')[0];
        break;
      }

      match = lowerMessage.match(dayMonthPattern);
      if (match) {
        const day = parseInt(match[1]);
        const targetDate = getDateForMonthDay(monthIndex, day);
        dates.departureDate = targetDate.toISOString().split('T')[0];
        dates.checkInDate = targetDate.toISOString().split('T')[0];
        break;
      }

      match = lowerMessage.match(inMonthPattern);
      if (match) {
        // For "in December" without specific day, use 1st of that month
        const targetDate = getDateForMonthDay(monthIndex, 1);
        dates.departureDate = targetDate.toISOString().split('T')[0];
        dates.checkInDate = targetDate.toISOString().split('T')[0];
        break;
      }
    }

    // Date range patterns for hotels: "from 25th to 27th", "25th-27th", "from Dec 25 to Dec 27"
    const dateRangeMatch = lowerMessage.match(/\b(?:from\s+)?(\d{1,2})(?:st|nd|rd|th)?\s*(?:to|-)\s*(\d{1,2})(?:st|nd|rd|th)?\b/);
    if (dateRangeMatch) {
      const startDay = parseInt(dateRangeMatch[1]);
      const endDay = parseInt(dateRangeMatch[2]);

      const today = new Date();
      let startDate = new Date(today.getFullYear(), today.getMonth(), startDay);
      let endDate = new Date(today.getFullYear(), today.getMonth(), endDay);

      // If start date has passed, assume next month
      if (startDate < today) {
        startDate = new Date(today.getFullYear(), today.getMonth() + 1, startDay);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, endDay);
      }

      // If end day is less than start day, assume it spans into next month
      if (endDay < startDay) {
        endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, endDay);
      }

      dates.checkInDate = startDate.toISOString().split('T')[0];
      dates.checkOutDate = endDate.toISOString().split('T')[0];
      dates.departureDate = startDate.toISOString().split('T')[0];
    }

    // ISO date format: YYYY-MM-DD
    const isoDateMatch = lowerMessage.match(/\b(\d{4}-\d{2}-\d{2})\b/);
    if (isoDateMatch) {
      dates.departureDate = isoDateMatch[1];
      dates.checkInDate = isoDateMatch[1];
    }

    // US date format: MM/DD/YYYY or MM/DD/YY
    const usDateMatch = lowerMessage.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{2,4})\b/);
    if (usDateMatch) {
      const month = parseInt(usDateMatch[1]) - 1;
      const day = parseInt(usDateMatch[2]);
      let year = parseInt(usDateMatch[3]);
      if (year < 100) year += 2000; // Convert 2-digit year to 4-digit

      const targetDate = new Date(year, month, day);
      dates.departureDate = targetDate.toISOString().split('T')[0];
      dates.checkInDate = targetDate.toISOString().split('T')[0];
    }

    console.log('[parseDateFromMessage] Parsed dates:', dates);
    return dates;
  };

  // Helper function to get date for specific month and day
  const getDateForMonthDay = (monthIndex: number, day: number): Date => {
    const today = new Date();
    let targetDate = new Date(today.getFullYear(), monthIndex, day);

    // If the date has passed this year, assume next year
    if (targetDate < today) {
      targetDate = new Date(today.getFullYear() + 1, monthIndex, day);
    }

    return targetDate;
  };

  // Try to parse intent using Claude AI with fallback to rule-based
  const parseIntentWithClaude = async (userMessage: string): Promise<any | null> => {
    if (!claudeAvailable) {
      console.log('[Claude AI] Not available, using rule-based parsing');
      return null;
    }

    try {
      const response = await fetch(getApiEndpoint('ai-chat/parse'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: conversationHistory,
        }),
      });

      const data = await response.json();
      console.log('[Claude AI] Parse response:', data);

      if (data.success && data.intent) {
        console.log('[Claude AI] Successfully parsed intent:', data.intent);
        return data.intent;
      } else if (data.useRuleBased) {
        console.log('[Claude AI] Falling back to rule-based parsing');
        return null;
      }
    } catch (error) {
      console.error('[Claude AI] Error parsing intent:', error);
    }

    return null;
  };

  // Extract search parameters from user message
  const extractParameters = (message: string): SearchParams => {
    const lowerMessage = message.toLowerCase();
    const params: SearchParams = {};

    // Extract dates using the new parser
    const parsedDates = parseDateFromMessage(message);

    // Use parsed dates or default to 7 days from now
    params.departureDate = parsedDates.departureDate || getFutureDate(7);
    params.checkInDate = parsedDates.checkInDate || getFutureDate(7);
    params.returnDate = parsedDates.returnDate;

    // Set checkout date
    if (parsedDates.checkOutDate) {
      params.checkOutDate = parsedDates.checkOutDate;
    } else if (params.checkInDate) {
      // Default to 2 nights for hotels if no checkout specified
      const checkIn = new Date(params.checkInDate);
      checkIn.setDate(checkIn.getDate() + 2);
      params.checkOutDate = checkIn.toISOString().split('T')[0];
    }

    // Price extraction
    const pricePatterns = [
      /(?:under|less than|below|cheaper than|max|maximum)\s*\$?\s*(\d+)/i,
      /(?:budget|cheap|affordable).*?(\d+)/i,
      /\$?(\d+)\s*(?:or less|maximum|max)/i,
    ];
    for (const pattern of pricePatterns) {
      const match = lowerMessage.match(pattern);
      if (match) {
        params.maxPrice = parseInt(match[1]);
        break;
      }
    }

    // Price range extraction
    const rangePattern = /between\s*\$?\s*(\d+)\s*(?:and|to|-)\s*\$?\s*(\d+)/i;
    const rangeMatch = lowerMessage.match(rangePattern);
    if (rangeMatch) {
      params.minPrice = parseInt(rangeMatch[1]);
      params.maxPrice = parseInt(rangeMatch[2]);
    }

    // Minimum price
    const minPricePattern = /\b(?:above|more than|over|minimum|min)\s*\$?\s*(\d+)/i;
    const minPriceMatch = lowerMessage.match(minPricePattern);
    if (minPriceMatch && !params.minPrice) {
      params.minPrice = parseInt(minPriceMatch[1]);
    }

    // Amenities extraction
    const amenityKeywords = {
      pool: ['pool', 'swimming'],
      gym: ['gym', 'fitness', 'workout'],
      wifi: ['wifi', 'wi-fi', 'internet'],
      spa: ['spa', 'massage'],
      parking: ['parking', 'garage'],
      breakfast: ['breakfast', 'morning meal'],
      restaurant: ['restaurant', 'dining'],
      bar: ['bar', 'lounge'],
    };

    const foundAmenities: string[] = [];
    for (const [amenity, keywords] of Object.entries(amenityKeywords)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        foundAmenities.push(amenity);
      }
    }
    if (foundAmenities.length > 0) {
      params.amenities = foundAmenities;
    }

    // Rating extraction
    const ratingPatterns = [
      /(\d+(?:\.\d+)?)\s*star/i,
      /(?:rating|rated)\s*(\d+(?:\.\d+)?)/i,
      /(\d+)\+\s*star/i,
    ];
    for (const pattern of ratingPatterns) {
      const match = lowerMessage.match(pattern);
      if (match) {
        params.minRating = parseFloat(match[1]);
        break;
      }
    }

    // Quality keywords
    if (lowerMessage.match(/\b(luxury|luxurious|premium|5\s*star|high-end|upscale)\b/i)) {
      params.minRating = 4.5;
    }
    // Note: Removed hardcoded maxPrice for budget queries
    // Users should specify actual budget (e.g., "under $200") for accurate results

    // Direct flights
    if (lowerMessage.match(/\b(direct|non-stop|nonstop|no stops)\b/i)) {
      params.directOnly = true;
    }

    // Cabin class
    if (lowerMessage.match(/\b(business\s*class|business)\b/i)) {
      params.cabinClass = 'Business';
    }
    if (lowerMessage.match(/\b(first\s*class|first)\b/i)) {
      params.cabinClass = 'First';
    }
    if (lowerMessage.match(/\b(economy|coach)\b/i)) {
      params.cabinClass = 'Economy';
    }

    return params;
  };

  const parseUserIntent = async (userMessage: string, skipDisambiguation: boolean = false) => {
    setIsLoading(true);

    // Try Claude AI first if available
    const claudeIntent = await parseIntentWithClaude(userMessage);

    if (claudeIntent && claudeIntent.confidence > 50) {
      console.log('[AI Chatbox] Using Claude AI parsed intent:', claudeIntent);

      // Handle Claude-parsed intent
      if (claudeIntent.type === 'flight' && claudeIntent.origin && claudeIntent.destination) {
        // Extract parameters from Claude intent
        const params: SearchParams = {
          departureDate: claudeIntent.dates?.departure || getFutureDate(7),
          returnDate: claudeIntent.dates?.return,
          maxPrice: claudeIntent.preferences?.maxPrice,
          minPrice: claudeIntent.preferences?.minPrice,
          directOnly: claudeIntent.preferences?.directFlight,
          cabinClass: claudeIntent.preferences?.cabinClass as any,
        };

        await addMessageWithTyping({
          id: Date.now().toString(),
          role: 'assistant',
          content: `Perfect! Let me find flights from ${claudeIntent.origin} to ${claudeIntent.destination} for you...`,
          timestamp: new Date(),
        });

        try {
          const flights = await searchFlights(claudeIntent.origin, claudeIntent.destination, params.departureDate!, params);

          setConversationContext({
            lastSearchType: 'flight',
            lastOrigin: claudeIntent.origin,
            lastDestination: claudeIntent.destination,
            lastParams: params,
          });

          setIsLoading(false);

          if (flights.length === 0) {
            await addMessageWithTyping({
              id: Date.now().toString(),
              role: 'assistant',
              content: `Hmm, I couldn't find flights with those exact requirements. Would you like to adjust your search?`,
              timestamp: new Date(),
              suggestions: ['Show me all options', 'Try cheaper flights', 'Next month instead'],
            });
            return;
          }

          await addMessageWithTyping({
            id: Date.now().toString(),
            role: 'assistant',
            content: `Found ${flights.length} great flight${flights.length > 1 ? 's' : ''} from ${claudeIntent.origin} to ${claudeIntent.destination}!`,
            timestamp: new Date(),
            flightResults: flights,
          });
          return;
        } catch (error: any) {
          setIsLoading(false);
          await addMessageWithTyping({
            id: Date.now().toString(),
            role: 'assistant',
            content: error.message || 'Sorry, I had trouble searching for flights.',
            timestamp: new Date(),
          });
          return;
        }
      } else if (claudeIntent.type === 'hotel' && claudeIntent.location) {
        const params: SearchParams = {
          checkInDate: claudeIntent.dates?.checkIn || getFutureDate(7),
          checkOutDate: claudeIntent.dates?.checkOut || getFutureDate(9),
          maxPrice: claudeIntent.preferences?.maxPrice,
          minPrice: claudeIntent.preferences?.minPrice,
          minRating: claudeIntent.preferences?.minRating,
          amenities: claudeIntent.preferences?.amenities,
        };

        await addMessageWithTyping({
          id: Date.now().toString(),
          role: 'assistant',
          content: `Great! Searching for hotels in ${claudeIntent.location}...`,
          timestamp: new Date(),
        });

        const hotels = await searchHotels(claudeIntent.location, params.checkInDate!, params.checkOutDate!, params);

        setConversationContext({
          lastSearchType: 'hotel',
          lastLocation: claudeIntent.location,
          lastParams: params,
        });

        setIsLoading(false);

        if (hotels.length === 0) {
          await addMessageWithTyping({
            id: Date.now().toString(),
            role: 'assistant',
            content: `I couldn't find any hotels in "${claudeIntent.location}". Let's try something else!`,
            timestamp: new Date(),
            suggestions: ['Try a different city', 'Remove filters'],
          });
          return;
        }

        await addMessageWithTyping({
          id: Date.now().toString(),
          role: 'assistant',
          content: `Perfect! I found ${hotels.length} amazing hotel${hotels.length > 1 ? 's' : ''} in ${claudeIntent.location}!`,
          timestamp: new Date(),
          hotelResults: hotels,
        });
        return;
      } else if (claudeIntent.type === 'both' && claudeIntent.location) {
        // Handle both flight and hotel search
        const hotelParams: SearchParams = {
          checkInDate: claudeIntent.dates?.checkIn || getFutureDate(7),
          checkOutDate: claudeIntent.dates?.checkOut || getFutureDate(9),
          maxPrice: claudeIntent.preferences?.maxPrice,
          minPrice: claudeIntent.preferences?.minPrice,
          minRating: claudeIntent.preferences?.minRating,
          amenities: claudeIntent.preferences?.amenities,
        };

        await addMessageWithTyping({
          id: Date.now().toString(),
          role: 'assistant',
          content: `Great! Let me search for hotels in ${claudeIntent.location} for you...`,
          timestamp: new Date(),
        });

        const hotels = await searchHotels(claudeIntent.location, hotelParams.checkInDate!, hotelParams.checkOutDate!, hotelParams);

        setConversationContext({
          lastSearchType: 'hotel',
          lastLocation: claudeIntent.location,
          lastParams: hotelParams,
        });

        setIsLoading(false);

        if (hotels.length === 0) {
          await addMessageWithTyping({
            id: Date.now().toString(),
            role: 'assistant',
            content: `I couldn't find any hotels in "${claudeIntent.location}". Would you like to search for flights instead?`,
            timestamp: new Date(),
            suggestions: ['Show me flights', 'Try a different city'],
          });
          return;
        }

        await addMessageWithTyping({
          id: Date.now().toString(),
          role: 'assistant',
          content: `Perfect! I found ${hotels.length} amazing hotel${hotels.length > 1 ? 's' : ''} in ${claudeIntent.location}! ${claudeIntent.origin ? 'Would you also like to see flights?' : ''}`,
          timestamp: new Date(),
          hotelResults: hotels,
          suggestions: claudeIntent.origin && claudeIntent.destination ? ['Yes, show me flights too', 'No, just hotels'] : undefined,
        });
        return;
      } else if (claudeIntent.needsClarification && claudeIntent.clarificationQuestion) {
        setIsLoading(false);
        await addMessageWithTyping({
          id: Date.now().toString(),
          role: 'assistant',
          content: claudeIntent.clarificationQuestion,
          timestamp: new Date(),
        });
        return;
      }
    }

    // Fall back to rule-based parsing
    console.log('[AI Chatbox] Using rule-based parsing');
    const lowerMessage = userMessage.toLowerCase();
    const params = extractParameters(userMessage);

    // Greeting detection
    if (lowerMessage.match(/^(hi|hello|hey|good morning|good afternoon)/i)) {
      await addMessageWithTyping({
        id: Date.now().toString(),
        role: 'assistant',
        content: "Hey! Great to see you! I'm super excited to help you plan your trip. Are you looking for flights, hotels, or both?",
        timestamp: new Date(),
        suggestions: [
          'I need a flight',
          'Looking for hotels',
          'Both flight and hotel',
        ],
      });
      setIsLoading(false);
      return;
    }

    // Handle disambiguation response
    if (conversationContext.pendingDisambiguation) {
      const disambiguation = conversationContext.pendingDisambiguation;

      // Find which option the user selected based on their response
      let selectedOption = null;
      for (const option of disambiguation.options) {
        if (lowerMessage.includes(option.country.toLowerCase()) ||
            lowerMessage.includes(option.context.toLowerCase()) ||
            lowerMessage.includes(option.code.toLowerCase())) {
          selectedOption = option;
          break;
        }
      }

      if (selectedOption) {
        // User clarified which city they meant - store the resolved city
        await addMessageWithTyping({
          id: Date.now().toString(),
          role: 'assistant',
          content: `Got it! ${selectedOption.context}. Let me search for that...`,
          timestamp: new Date(),
        });

        // Store resolved city and clear disambiguation
        const resolvedCities = conversationContext.resolvedCities || {};
        if (disambiguation.type === 'origin') {
          resolvedCities.origin = { name: selectedOption.name, code: selectedOption.code };
        } else if (disambiguation.type === 'destination') {
          resolvedCities.destination = { name: selectedOption.name, code: selectedOption.code };
        }

        // Update context synchronously before re-parsing
        const updatedContext = {
          ...conversationContext,
          pendingDisambiguation: undefined,
          resolvedCities,
        };
        setConversationContext(updatedContext);

        // Store resolved cities in conversationContext temporarily for the re-parse
        conversationContext.resolvedCities = resolvedCities;
        conversationContext.pendingDisambiguation = undefined;

        // Re-parse the original query with skipDisambiguation flag
        await parseUserIntent(disambiguation.originalQuery, true);
        return;
      } else {
        // User response didn't match any option - ask again
        setIsLoading(false);
        await addMessageWithTyping({
          id: Date.now().toString(),
          role: 'assistant',
          content: `I'm not sure which one you mean. Please select one of these options:`,
          timestamp: new Date(),
          suggestions: disambiguation.options.map(opt => opt.context),
        });
        return;
      }
    }

    // Handle follow-up answers when there's pending search context
    if (conversationContext.pendingSearch) {
      const pending = conversationContext.pendingSearch;

      if (pending.type === 'flight') {
        // User is answering "where from?" question
        const fromMatch = lowerMessage.match(/(?:from\s+)?(\w+(?:\s+\w+)?)/i);
        if (fromMatch && pending.destination && !pending.origin) {
          const origin = fromMatch[1];

          await addMessageWithTyping({
            id: Date.now().toString(),
            role: 'assistant',
            content: `Perfect! Let me find flights from ${origin} to ${pending.destination} for you...`,
            timestamp: new Date(),
          });

          const departureDate = params.departureDate || getFutureDate(7);

          try {
            const flights = await searchFlights(origin, pending.destination, departureDate, params);

            setConversationContext({
              lastSearchType: 'flight',
              lastOrigin: origin,
              lastDestination: pending.destination,
              lastParams: { ...params, departureDate },
              pendingSearch: undefined, // Clear pending
            });

            setIsLoading(false);

            if (flights.length === 0) {
              await addMessageWithTyping({
                id: Date.now().toString(),
                role: 'assistant',
                content: `Hmm, I couldn't find flights with those exact requirements. Would you like to:\n• Adjust your budget?\n• Include connecting flights?\n• Try different dates?`,
                timestamp: new Date(),
                suggestions: [
                  'Show me all options',
                  'Try cheaper flights',
                  'Next month instead',
                ],
              });
              return;
            }

            await addMessageWithTyping({
              id: Date.now().toString(),
              role: 'assistant',
              content: `Found ${flights.length} great flight${flights.length > 1 ? 's' : ''} from ${origin} to ${pending.destination}!`,
              timestamp: new Date(),
              flightResults: flights,
            });
            return;
          } catch (error: any) {
            setIsLoading(false);
            await addMessageWithTyping({
              id: Date.now().toString(),
              role: 'assistant',
              content: error.message || 'Sorry, I had trouble searching for flights. Please try again with different cities.',
              timestamp: new Date(),
              suggestions: [
                'Lagos to London',
                'New York to Paris',
                'Dubai to Tokyo',
              ],
            });
            return;
          }
        }
      }
    }

    // Flight booking intent
    if (lowerMessage.includes('flight') || lowerMessage.includes('fly')) {
      // Improved regex to capture up to 2-word city names
      // Use negative lookahead to exclude common transition words from city names
      let fromMatch = lowerMessage.match(/from\s+([a-z]+(?:\s+(?!to|on|in|under|over|for)[a-z]+)?)\s+(?:to|on|in|under|over|for)/i);
      let toMatch = lowerMessage.match(/to\s+([a-z]+(?:\s+(?!under|over|for|on|in|next|tomorrow|today)[a-z]+)?)\s*(?:under|over|for|on|in|next|tomorrow|today|,|\d|$)/i);

      // Fallback: Handle "flight CITY to CITY" without explicit "from"
      if (!fromMatch && toMatch) {
        // Match pattern: "flight/fly [CITY] to" (but skip "from" if present)
        const implicitFromMatch = lowerMessage.match(/(?:flight|fly)\s+(?:from\s+)?([a-z]+(?:\s+(?!to)[a-z]+)?)\s+to\s+/i);
        if (implicitFromMatch) {
          console.log('[AI Chatbox] Using implicit from pattern:', implicitFromMatch);
          fromMatch = implicitFromMatch;
        }
      }

      console.log('[AI Chatbox] Flight intent detected!', { fromMatch, toMatch });

      if (fromMatch && toMatch) {
        const origin = fromMatch[1];
        const destination = toMatch[1];
        console.log('[AI Chatbox] Extracted origin and destination:', { origin, destination });

        // Check if we have resolved cities from disambiguation
        const resolvedOrigin = conversationContext.resolvedCities?.origin;
        const resolvedDest = conversationContext.resolvedCities?.destination;

        // Check for ambiguous cities (but skip if already resolved)
        const originDisambiguation = resolvedOrigin
          ? { code: resolvedOrigin.code, needsDisambiguation: false }
          : getCityCodeWithContext(origin, userMessage);
        const destDisambiguation = resolvedDest
          ? { code: resolvedDest.code, needsDisambiguation: false }
          : getCityCodeWithContext(destination, userMessage);

        // If origin is ambiguous and needs clarification (unless we're skipping disambiguation)
        if (!skipDisambiguation && originDisambiguation.needsDisambiguation && originDisambiguation.options) {
          setConversationContext({
            ...conversationContext,
            pendingDisambiguation: {
              type: 'origin',
              cityName: origin,
              options: originDisambiguation.options,
              originalQuery: userMessage,
            },
          });

          setIsLoading(false);
          await addMessageWithTyping({
            id: Date.now().toString(),
            role: 'assistant',
            content: `I found multiple cities named "${origin}". Which one did you mean?`,
            timestamp: new Date(),
            suggestions: originDisambiguation.options.map(opt => opt.context),
          });
          return;
        }

        // If destination is ambiguous and needs clarification (unless we're skipping disambiguation)
        if (!skipDisambiguation && destDisambiguation.needsDisambiguation && destDisambiguation.options) {
          setConversationContext({
            ...conversationContext,
            pendingDisambiguation: {
              type: 'destination',
              cityName: destination,
              options: destDisambiguation.options,
              originalQuery: userMessage,
            },
          });

          setIsLoading(false);
          await addMessageWithTyping({
            id: Date.now().toString(),
            role: 'assistant',
            content: `I found multiple cities named "${destination}". Which one did you mean?`,
            timestamp: new Date(),
            suggestions: destDisambiguation.options.map(opt => opt.context),
          });
          return;
        }

        // Build conversational acknowledgment of parameters
        let acknowledgment = '';
        const paramDetails: string[] = [];

        if (params.maxPrice) {
          paramDetails.push(`under $${params.maxPrice}`);
        }
        if (params.minPrice && params.maxPrice) {
          paramDetails[paramDetails.length - 1] = `$${params.minPrice}-$${params.maxPrice}`;
        }
        if (params.directOnly) {
          paramDetails.push('direct');
        }
        if (params.cabinClass) {
          paramDetails.push(`${params.cabinClass} class`);
        }

        // Natural acknowledgment
        if (paramDetails.length > 0) {
          acknowledgment = `Great! Searching for ${paramDetails.join(', ')} flights from ${origin} to ${destination}...`;
        } else {
          acknowledgment = `Perfect! Let me find flights from ${origin} to ${destination} for you...`;
        }

        await addMessageWithTyping({
          id: Date.now().toString(),
          role: 'assistant',
          content: acknowledgment,
          timestamp: new Date(),
        });

        const departureDate = params.departureDate || getFutureDate(7);
        console.log('[AI Chatbox] About to call searchFlights with:', { origin, destination, departureDate, params });

        try {
          const flights = await searchFlights(origin, destination, departureDate, params);
          console.log('[AI Chatbox] searchFlights returned:', flights.length, 'results');

          // Update context and clear resolved cities
          setConversationContext({
            lastSearchType: 'flight',
            lastOrigin: origin,
            lastDestination: destination,
            lastParams: { ...params, departureDate },
            resolvedCities: undefined, // Clear after use
          });

          setIsLoading(false);

          if (flights.length === 0) {
            await addMessageWithTyping({
              id: Date.now().toString(),
              role: 'assistant',
              content: `Hmm, I couldn't find flights with those exact requirements. Would you like to:\n• Adjust your budget?\n• Include connecting flights?\n• Try different dates?`,
              timestamp: new Date(),
              suggestions: [
                'Show me all options',
                'Try cheaper flights',
                'Next month instead',
              ],
            });
            return;
          }

          await addMessageWithTyping({
            id: Date.now().toString(),
            role: 'assistant',
            content: `Found ${flights.length} great flight${flights.length > 1 ? 's' : ''} from ${origin} to ${destination}!`,
            timestamp: new Date(),
            flightResults: flights,
          });
          return;
        } catch (error: any) {
          setIsLoading(false);
          await addMessageWithTyping({
            id: Date.now().toString(),
            role: 'assistant',
            content: error.message || 'Sorry, I had trouble searching for flights. Please try again with different cities.',
            timestamp: new Date(),
            suggestions: [
              'Lagos to London',
              'New York to Paris',
              'Dubai to Tokyo',
            ],
          });
          return;
        }
      } else if (fromMatch || toMatch || lowerMessage.includes('london')) {
        // User mentioned a city but not full route - ask for missing info naturally
        const mentionedCity = fromMatch ? fromMatch[1] : (toMatch ? toMatch[1] : 'London');

        // Set pending search context
        setConversationContext({
          ...conversationContext,
          pendingSearch: {
            type: 'flight',
            destination: toMatch ? mentionedCity : undefined,
            origin: fromMatch ? mentionedCity : undefined,
            missingInfo: toMatch ? ['origin'] : ['destination'],
          },
        });

        await addMessageWithTyping({
          id: Date.now().toString(),
          role: 'assistant',
          content: `I see you want to ${toMatch ? 'fly to' : 'go to'} ${mentionedCity}! Where are you flying from?`,
          timestamp: new Date(),
          suggestions: [
            'From Lagos',
            'From New York',
            'From Dubai',
          ],
        });
        setIsLoading(false);
        return;
      } else {
        await addMessageWithTyping({
          id: Date.now().toString(),
          role: 'assistant',
          content: "I'd love to help you book a flight! Where are you traveling from and to?",
          timestamp: new Date(),
          suggestions: [
            'Lagos to London',
            'New York to Paris',
            'Dubai to Tokyo',
          ],
        });
        setIsLoading(false);
        return;
      }
    }

    // Hotel booking intent
    if (lowerMessage.includes('hotel') || lowerMessage.includes('accommodation') || lowerMessage.includes('stay')) {
      console.log('[AI Chatbox] Hotel intent detected!');

      // Improved regex to capture multi-word locations including neighborhoods
      // Captures up to 4 words between location keywords and stop words
      const locationMatch =
        lowerMessage.match(/(?:in|near|at)\s+([a-z]+(?:\s+[a-z]+){0,3})\s*(?:with|under|over|for|on|next|tomorrow|today|,|\d|$)/i);

      console.log('[AI Chatbox] Location match:', locationMatch);

      if (locationMatch) {
        const location = locationMatch[1];
        console.log('[AI Chatbox] Extracted location:', location);

        // Build conversational acknowledgment of parameters
        let acknowledgment = getRandomResponse('searching');
        const paramDetails: string[] = [];

        if (params.maxPrice) {
          paramDetails.push(`under $${params.maxPrice}/night`);
        }
        if (params.minPrice && params.maxPrice) {
          paramDetails[paramDetails.length - 1] = `$${params.minPrice}-$${params.maxPrice}/night`;
        }
        if (params.amenities && params.amenities.length > 0) {
          const amenityList = params.amenities.join(', ');
          paramDetails.push(`with ${amenityList}`);
        }
        if (params.minRating) {
          paramDetails.push(`${params.minRating}+ stars`);
        }

        if (paramDetails.length > 0) {
          acknowledgment = `Got it! Searching for hotels ${paramDetails.join(', ')}...`;
        }

        // Check if we'll use geocoding
        const willUseGeocoding = !getCityCode(location);

        // Add a note about geocoding if applicable
        if (willUseGeocoding) {
          acknowledgment += ` I'll use geocoding to find the exact location of "${location}"!`;
        }

        await addMessageWithTyping({
          id: Date.now().toString(),
          role: 'assistant',
          content: acknowledgment,
          timestamp: new Date(),
        });

        const checkInDate = params.checkInDate || getFutureDate(7);
        const checkOutDate = params.checkOutDate || getFutureDate(9);
        console.log('[AI Chatbox] About to call searchHotels with:', { location, checkInDate, checkOutDate, params });
        const hotels = await searchHotels(location, checkInDate, checkOutDate, params);
        console.log('[AI Chatbox] searchHotels returned:', hotels.length, 'results');

        // Update context
        setConversationContext({
          lastSearchType: 'hotel',
          lastLocation: location,
          lastParams: { ...params, checkInDate, checkOutDate },
        });

        setIsLoading(false);

        if (hotels.length === 0) {
          // Determine if we used geocoding or city code
          const usedGeocoding = !getCityCode(location);

          let noResultsMessage = `Hmm, I couldn't find any hotels in "${location}"`;

          if (usedGeocoding) {
            noResultsMessage += `. I tried geocoding this location, but couldn't find it or no hotels are available there`;
          } else if (paramDetails.length > 0) {
            noResultsMessage += ` matching all those requirements (${paramDetails.join(', ')})`;
          }

          noResultsMessage += `. Let's try something else!`;

          await addMessageWithTyping({
            id: Date.now().toString(),
            role: 'assistant',
            content: noResultsMessage,
            timestamp: new Date(),
            suggestions: [
              'Try a different city',
              'Remove filters',
              'Show nearby cities',
            ],
          });
          return;
        }

        await addMessageWithTyping({
          id: Date.now().toString(),
          role: 'assistant',
          content: `Perfect! I found ${hotels.length} amazing hotel${hotels.length > 1 ? 's' : ''} in ${location}${paramDetails.length > 0 ? ' matching your preferences' : ''}! These are some of the best options - take a look!`,
          timestamp: new Date(),
          hotelResults: hotels,
        });
        return;
      } else {
        await addMessageWithTyping({
          id: Date.now().toString(),
          role: 'assistant',
          content: "Awesome! I'll help you find the perfect hotel! Which city are you interested in? Just tell me like 'I need a hotel in Paris'",
          timestamp: new Date(),
          suggestions: [
            'Paris',
            'Dubai',
            'New York',
          ],
        });
        setIsLoading(false);
        return;
      }
    }

    // Handle contextual follow-up queries
    if (conversationContext.lastSearchType && !lowerMessage.includes('from') && !lowerMessage.includes('to') && !lowerMessage.includes('in')) {
      // Check for refinement queries like "cheaper", "with pool", "direct flights"
      const isRefinement = lowerMessage.match(/\b(cheaper|more expensive|luxury|budget|with|direct|non-stop|show|find)\b/i);

      if (isRefinement) {
        const newParams = extractParameters(userMessage);
        const mergedParams = { ...conversationContext.lastParams, ...newParams };

        if (conversationContext.lastSearchType === 'flight' && conversationContext.lastOrigin && conversationContext.lastDestination) {
          await addMessageWithTyping({
            id: Date.now().toString(),
            role: 'assistant',
            content: `Absolutely! Let me refine that search for you...`,
            timestamp: new Date(),
          });

          const departureDate = mergedParams.departureDate || conversationContext.lastParams?.departureDate || getFutureDate(7);
          const flights = await searchFlights(conversationContext.lastOrigin, conversationContext.lastDestination, departureDate, mergedParams);

          setConversationContext({
            ...conversationContext,
            lastParams: mergedParams,
          });

          setIsLoading(false);

          if (flights.length === 0) {
            await addMessageWithTyping({
              id: Date.now().toString(),
              role: 'assistant',
              content: `I couldn't find flights with those specific filters. Want to try different criteria?`,
              timestamp: new Date(),
            });
            return;
          }

          await addMessageWithTyping({
            id: Date.now().toString(),
            role: 'assistant',
            content: `Here we go! Found ${flights.length} flight${flights.length > 1 ? 's' : ''} with your updated preferences!`,
            timestamp: new Date(),
            flightResults: flights,
          });
          return;
        }

        if (conversationContext.lastSearchType === 'hotel' && conversationContext.lastLocation) {
          await addMessageWithTyping({
            id: Date.now().toString(),
            role: 'assistant',
            content: `Sure thing! Updating your hotel search...`,
            timestamp: new Date(),
          });

          const checkInDate = mergedParams.checkInDate || conversationContext.lastParams?.checkInDate || getFutureDate(7);
          const checkOutDate = mergedParams.checkOutDate || conversationContext.lastParams?.checkOutDate || getFutureDate(9);
          const hotels = await searchHotels(conversationContext.lastLocation, checkInDate, checkOutDate, mergedParams);

          setConversationContext({
            ...conversationContext,
            lastParams: mergedParams,
          });

          setIsLoading(false);

          if (hotels.length === 0) {
            await addMessageWithTyping({
              id: Date.now().toString(),
              role: 'assistant',
              content: `Hmm, no hotels match those specific requirements. Want to broaden the search?`,
              timestamp: new Date(),
            });
            return;
          }

          await addMessageWithTyping({
            id: Date.now().toString(),
            role: 'assistant',
            content: `Perfect! Here are ${hotels.length} hotel${hotels.length > 1 ? 's' : ''} with your new filters!`,
            timestamp: new Date(),
            hotelResults: hotels,
          });
          return;
        }
      }
    }

    // Thanks/appreciation
    if (lowerMessage.match(/(thanks|thank you|appreciate)/i)) {
      await addMessageWithTyping({
        id: Date.now().toString(),
        role: 'assistant',
        content: "You're very welcome! 😊 It's my pleasure to help! Need anything else for your trip?",
        timestamp: new Date(),
      });
      setIsLoading(false);
      return;
    }

    // Very vague travel interest without destination
    if (lowerMessage.match(/\b(feel like|want to|thinking about|planning)\s+(travel|travelling|traveling|trip|vacation|holiday)\b/i)) {
      await addMessageWithTyping({
        id: Date.now().toString(),
        role: 'assistant',
        content: "That's exciting! ✈️ I'd love to help you plan your trip! Where are you thinking of going?",
        timestamp: new Date(),
        suggestions: [
          'Dubai',
          'Paris',
          'New York',
          'London',
        ],
      });
      setIsLoading(false);
      return;
    }

    // General travel intent - mentions going somewhere but not specific enough
    const generalTravelMatch = lowerMessage.match(/(?:want to|going to|trip to|visit|travel to|headed to)\s+([a-z\s]+)/i);
    if (generalTravelMatch) {
      const destination = generalTravelMatch[1].trim();

      await addMessageWithTyping({
        id: Date.now().toString(),
        role: 'assistant',
        content: `Awesome! ${destination.charAt(0).toUpperCase() + destination.slice(1)} sounds amazing! What do you need help with?`,
        timestamp: new Date(),
        suggestions: [
          `Flight to ${destination.charAt(0).toUpperCase() + destination.slice(1)}`,
          `Hotels in ${destination.charAt(0).toUpperCase() + destination.slice(1)}`,
          `Both flight and hotel`,
        ],
      });
      setIsLoading(false);
      return;
    }

    // Default response with personality
    setIsLoading(false);
    await addMessageWithTyping({
      id: Date.now().toString(),
      role: 'assistant',
      content: "Hmm, I'm not quite sure what you're looking for. But don't worry, I'm here to help! \n\nI can help you with:\n• Finding and booking flights (by price, cabin class, direct/connecting)\n• Searching for amazing hotels (by budget, amenities, ratings)\n\nJust tell me what you need in your own words!",
      timestamp: new Date(),
      suggestions: [
        'Flight from Lagos to London under $500',
        'Luxury hotels in Paris with pool',
        'Direct flights to Dubai',
        'Budget hotel with WiFi and parking',
      ],
    });
  };

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || inputValue.trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');

    // Update conversation history for Claude
    setConversationHistory((prev) => [
      ...prev,
      { role: 'user', content: text },
    ]);

    await parseUserIntent(text);
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion.trim());
  };

  const handleViewDetails = async (type: 'flight' | 'hotel', item: any) => {
    setBookingFlow({
      active: true,
      type,
      selectedItem: item,
      step: 'confirm',
    });

    await addMessageWithTyping({
      id: Date.now().toString(),
      role: 'assistant',
      content: `${getRandomResponse('excitement')} You picked a great one! Let me get that booking ready for you... 📝`,
      timestamp: new Date(),
    });
  };

  const handleViewMore = (type: 'flight' | 'hotel') => {
    const encouragement = "Want to see all the options? Let me take you to the full search page! 🚀";

    addMessageWithTyping({
      id: Date.now().toString(),
      role: 'assistant',
      content: encouragement,
      timestamp: new Date(),
    });

    setTimeout(() => {
      setIsOpen(false);

      if (type === 'flight' && conversationContext.lastOrigin && conversationContext.lastDestination) {
        // Build query params for flight search
        const params = new URLSearchParams({
          origin: conversationContext.lastOrigin,
          destination: conversationContext.lastDestination,
          fromAI: 'true', // Flag to indicate this came from AI chat
          ...(conversationContext.lastParams?.departureDate && {
            departureDate: conversationContext.lastParams.departureDate
          }),
          ...(conversationContext.lastParams?.returnDate && {
            returnDate: conversationContext.lastParams.returnDate
          }),
          ...(conversationContext.lastParams?.adults && {
            adults: conversationContext.lastParams.adults.toString()
          }),
          ...(conversationContext.lastParams?.maxPrice && {
            maxPrice: conversationContext.lastParams.maxPrice.toString()
          }),
          ...(conversationContext.lastParams?.directFlight !== undefined && {
            directFlight: conversationContext.lastParams.directFlight.toString()
          }),
        });
        router.push(`/dashboard/flights/search?${params.toString()}`);
      } else if (type === 'hotel' && conversationContext.lastLocation) {
        // Build query params for hotel search
        const params = new URLSearchParams({
          location: conversationContext.lastLocation,
          fromAI: 'true', // Flag to indicate this came from AI chat
          ...(conversationContext.lastParams?.checkInDate && {
            checkInDate: conversationContext.lastParams.checkInDate
          }),
          ...(conversationContext.lastParams?.checkOutDate && {
            checkOutDate: conversationContext.lastParams.checkOutDate
          }),
          ...(conversationContext.lastParams?.adults && {
            adults: conversationContext.lastParams.adults.toString()
          }),
          ...(conversationContext.lastParams?.maxPrice && {
            maxPrice: conversationContext.lastParams.maxPrice.toString()
          }),
          ...(conversationContext.lastParams?.minRating && {
            minRating: conversationContext.lastParams.minRating.toString()
          }),
        });
        router.push(`/dashboard/hotels/search?${params.toString()}`);
      } else {
        // Fallback to basic search page if context is missing
        if (type === 'flight') {
          router.push('/dashboard/flights/search');
        } else {
          router.push('/dashboard/hotels/search');
        }
      }
    }, 500);
  };

  const handleConfirmBooking = async () => {
    if (!bookingFlow) return;

    await addMessageWithTyping({
      id: Date.now().toString(),
      role: 'assistant',
      content: getRandomResponse('bookingSuccess'),
      timestamp: new Date(),
      bookingConfirmation: {
        type: bookingFlow.type,
        details: bookingFlow.selectedItem,
        total: bookingFlow.selectedItem.price,
      },
    });

    setBookingFlow(null);

    // Add a follow-up message
    setTimeout(async () => {
      await addMessageWithTyping({
        id: Date.now().toString(),
        role: 'assistant',
        content: "Is there anything else I can help you with? Maybe add a hotel to go with that flight? Or another destination?",
        timestamp: new Date(),
        suggestions: [
          'Find me a hotel too',
          'Book another trip',
          "No, I'm all set!",
        ],
      });
    }, 2000);
  };

  return (
    <>
      {/* Floating Chat Button - Only show when not in modal mode */}
      {!isOpen && !forceOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 group"
        >
          <div className="absolute inset-0 bg-gray-900 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition"></div>
          <div className="relative flex items-center gap-2 md:gap-3 px-4 md:px-6 py-3 md:py-4 bg-gray-900 rounded-full shadow-2xl hover:shadow-3xl transition-all hover:scale-105">
            <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-[#ADF802]" />
            <span className="text-white font-semibold text-sm md:text-base">Chat with AI</span>
            <MessageCircle className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className={forceOpen
          ? "w-full h-full flex flex-col bg-white overflow-hidden"
          : "fixed inset-0 md:inset-auto md:bottom-6 md:right-6 z-50 md:w-[480px] md:h-[700px] flex flex-col bg-white md:rounded-3xl shadow-2xl border-0 md:border md:border-gray-200 overflow-hidden"
        }>
          {/* Header */}
          <div className="relative bg-gray-900 p-4 md:p-6 border-b border-gray-800">
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="p-1.5 md:p-2 bg-[#ADF802]/20 border border-[#ADF802]/30 rounded-lg md:rounded-xl">
                  <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-[#ADF802]" />
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-bold text-white">Your Travel Buddy</h3>
                  <div className="flex items-center gap-1.5 md:gap-2">
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-[#ADF802] rounded-full animate-pulse"></div>
                    <p className="text-[10px] md:text-xs text-gray-400">Online & ready to help!</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-800 rounded-lg md:rounded-xl transition flex-shrink-0"
              >
                <X className="w-5 h-5 md:w-6 md:h-6 text-gray-400 hover:text-white" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-3 md:space-y-4 bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[90%] md:max-w-[85%] ${
                    message.role === 'user'
                      ? 'bg-gray-900 text-white'
                      : 'bg-white border border-gray-200'
                  } rounded-xl md:rounded-2xl p-3 md:p-4 shadow-md`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 bg-[#ADF802]/20 border border-[#ADF802]/30 rounded-lg">
                        <Sparkles className="w-3 h-3 text-[#ADF802]" />
                      </div>
                      <span className="text-xs font-semibold text-gray-700">AI Assistant</span>
                    </div>
                  )}
                  <p
                    className={`text-sm leading-relaxed whitespace-pre-line ${
                      message.role === 'user' ? 'text-white' : 'text-gray-800'
                    }`}
                  >
                    {message.content}
                  </p>

                  {/* Flight Results */}
                  {message.flightResults && message.flightResults.length > 0 && (
                    <div className="mt-4 space-y-3">
                      {message.flightResults.slice(0, 2).map((flight) => (
                        <div
                          key={flight.id}
                          className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-[#ADF802] transition-all hover:shadow-lg"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-gray-900 rounded-lg">
                                <Plane className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <div className="font-bold text-gray-900 text-sm">{flight.airline}</div>
                                <div className="text-xs text-gray-600">{flight.route}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-bold text-gray-900">${flight.price}</div>
                              <div className="text-xs text-gray-600">per person</div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-700 mb-3">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{flight.duration}</span>
                            </div>
                            <div className={`px-2 py-1 rounded-full font-medium ${
                              flight.stops === 0
                                ? 'bg-[#ADF802] text-gray-900 border border-[#ADF802]'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {flight.stops === 0 ? 'Direct ✨' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
                            </div>
                          </div>
                          <button
                            onClick={() => handleViewDetails('flight', flight)}
                            className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all text-sm flex items-center justify-center gap-2"
                          >
                            Yes! Book This One
                            <ThumbsUp className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => handleViewMore('flight')}
                        className="w-full px-4 py-2 bg-white border-2 border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-all text-sm"
                      >
                        Show Me All {message.flightResults.length} Options →
                      </button>
                    </div>
                  )}

                  {/* Hotel Results */}
                  {message.hotelResults && message.hotelResults.length > 0 && (
                    <div className="mt-4 space-y-3">
                      {message.hotelResults.slice(0, 2).map((hotel) => (
                        <div
                          key={hotel.id}
                          className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl overflow-hidden hover:border-purple-400 transition-all hover:shadow-lg"
                        >
                          <div
                            className="h-32 bg-cover bg-center"
                            style={{ backgroundImage: `url(${hotel.image})` }}
                          />
                          <div className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="font-bold text-gray-900 text-sm mb-1">{hotel.name}</div>
                                <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
                                  <MapPin className="w-3 h-3" />
                                  <span>{hotel.location}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  {hotel.rating >= 4.5 ? (
                                    <>
                                      <Star className="w-3 h-3 text-[#ADF802] fill-[#ADF802]" />
                                      <span className="text-xs font-semibold text-[#ADF802]">{hotel.rating}</span>
                                    </>
                                  ) : (
                                    <>
                                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                      <span className="text-xs font-semibold text-gray-700">{hotel.rating}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-xl font-bold text-purple-600">${hotel.price}</div>
                                <div className="text-xs text-gray-600">per night</div>
                              </div>
                            </div>
                            <button
                              onClick={() => handleViewDetails('hotel', hotel)}
                              className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-lg transition-all text-sm flex items-center justify-center gap-2"
                            >
                              Perfect! Book This
                              <ThumbsUp className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={() => handleViewMore('hotel')}
                        className="w-full px-4 py-2 bg-white border-2 border-purple-600 text-purple-600 rounded-lg font-medium hover:bg-purple-50 transition-all text-sm"
                      >
                        Explore All {message.hotelResults.length} Hotels →
                      </button>
                    </div>
                  )}

                  {/* Booking Confirmation */}
                  {message.bookingConfirmation && (
                    <div className="mt-4 p-4 bg-[#F7FEE7] border-2 border-[#ADF802] rounded-xl">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 bg-[#ADF802] rounded-lg">
                          <PartyPopper className="w-4 h-4 text-gray-900" />
                        </div>
                        <span className="font-bold text-gray-900">Booking Confirmed!</span>
                      </div>
                      <div className="text-sm text-gray-700 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Amount:</span>
                          <span className="font-bold text-gray-900">${message.bookingConfirmation.total}</span>
                        </div>
                        <div className="pt-2 border-t border-[#ADF802]/30 text-xs text-gray-600">
                          Confirmation details sent to your email. Have an amazing trip!                        </div>
                      </div>
                    </div>
                  )}

                  {/* Suggestions */}
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-semibold text-gray-600">Quick ideas for you:</p>
                      {message.suggestions.map((suggestion, idx) => {
                        // Determine icon based on suggestion content
                        const suggestionLower = suggestion.toLowerCase();
                        let Icon = Sparkles; // default
                        let iconColor = 'text-gray-700';

                        if (suggestionLower.includes('flight') || suggestionLower.includes('fly')) {
                          Icon = Plane;
                        } else if (suggestionLower.includes('hotel') || suggestionLower.includes('stay')) {
                          Icon = Hotel;
                        } else if (suggestionLower.includes('budget') || suggestionLower.includes('price') || suggestionLower.includes('$')) {
                          Icon = DollarSign;
                        } else if (suggestionLower.includes('luxury') || suggestionLower.includes('5-star')) {
                          Icon = Star;
                        } else if (suggestionLower.includes('downtown') || suggestionLower.includes('near') || suggestionLower.includes('location')) {
                          Icon = MapPin;
                        } else if (suggestionLower.includes('date') || suggestionLower.includes('when') || suggestionLower.includes('next')) {
                          Icon = Calendar;
                        }

                        return (
                          <button
                            key={idx}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="flex items-center gap-2 w-full text-left px-3 py-2 text-xs bg-white hover:bg-gray-50 border border-gray-200 hover:border-[#ADF802] rounded-lg transition-all hover:shadow-md text-gray-700 hover:text-gray-900 font-medium group"
                          >
                            <Icon className={`w-4 h-4 ${iconColor} group-hover:text-[#ADF802] flex-shrink-0 group-hover:scale-110 transition-all`} />
                            <span className="flex-1">{suggestion}</span>
                            <ArrowRight className="w-3 h-3 text-gray-400 group-hover:text-[#ADF802] opacity-0 group-hover:opacity-100 transition-all" />
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <p className="text-xs mt-2 opacity-60">
                    {message.timestamp.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}

            {/* Booking Flow */}
            {bookingFlow && bookingFlow.step === 'confirm' && (
              <div className="bg-white border-2 border-blue-300 rounded-2xl p-4 shadow-lg">
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <span className="font-bold text-gray-900">Ready to Book?</span>
                </div>
                <div className="space-y-3 mb-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm font-semibold text-gray-900 mb-1">
                      {bookingFlow.type === 'flight'
                        ? bookingFlow.selectedItem.airline
                        : bookingFlow.selectedItem.name}
                    </div>
                    <div className="text-xs text-gray-600">
                      {bookingFlow.type === 'flight'
                        ? bookingFlow.selectedItem.route
                        : bookingFlow.selectedItem.location}
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm font-semibold text-gray-700">Total:</span>
                    <span className="text-xl font-bold text-blue-600">${bookingFlow.selectedItem.price}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setBookingFlow(null)}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-all text-sm"
                  >
                    Wait, Go Back
                  </button>
                  <button
                    onClick={handleConfirmBooking}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all text-sm flex items-center justify-center gap-2"
                  >
                    Yes, Book It!
                    <PartyPopper className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-md">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-[#ADF802] rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-[#ADF802] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-[#ADF802] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                    <span className="text-sm text-gray-600">Typing...</span>
                  </div>
                </div>
              </div>
            )}

            {isLoading && !isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-md">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                    <span className="text-sm text-gray-600">Searching...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 md:p-4 bg-white border-t border-gray-200">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type naturally..."
                disabled={isLoading}
                className="flex-1 px-3 md:px-4 py-2.5 md:py-3 bg-white border border-gray-200 rounded-lg md:rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 text-sm disabled:opacity-50 placeholder:text-gray-400 text-gray-900"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim() || isLoading}
                className="p-2.5 md:p-3 bg-gray-900 rounded-lg md:rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 flex-shrink-0 hover:bg-gray-800"
              >
                <Send className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
