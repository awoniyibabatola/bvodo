import { Router } from 'express';
import {
  searchHotels,
  getHotelOffers,
  getHotelRates,
  createHotelQuote,
  createHotelBooking,
} from '../controllers/hotel.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Public routes - Duffel Stays (NEW)
router.get('/search', searchHotels); // Updated to use Duffel Stays
router.get('/rates/:searchResultId', getHotelRates); // NEW: Get rates for a search result
router.post('/quotes', createHotelQuote); // NEW: Create quote to validate rate

// Legacy routes - Amadeus (kept for backward compatibility)
router.get('/:hotelId/offers', getHotelOffers); // LEGACY: Use /rates/:searchResultId instead

// Protected routes
router.post('/book', authenticate, createHotelBooking);

export default router;
