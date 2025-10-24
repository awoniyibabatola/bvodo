import { Router } from 'express';
import {
  searchFlights,
  getOfferDetails,
  getFlightPrice,
  createFlightBooking,
  searchLocations,
  getSeatMaps,
  getAvailableServices,
} from '../controllers/flight.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.get('/search', searchFlights);
router.get('/offers/:offerId', getOfferDetails); // Get offer details
router.get('/offers/:offerId/seat-maps', getSeatMaps); // Get seat maps for offer
router.get('/offers/:offerId/services', getAvailableServices); // Get available services (baggage, etc.)
router.post('/price', getFlightPrice); // Legacy - for Amadeus compatibility
router.get('/locations', searchLocations);

// Protected routes
router.post('/book', authenticate, createFlightBooking);

export default router;
