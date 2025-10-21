import { Router } from 'express';
import {
  searchFlights,
  getFlightPrice,
  createFlightBooking,
  searchLocations,
} from '../controllers/flight.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.get('/search', searchFlights);
router.post('/price', getFlightPrice);
router.get('/locations', searchLocations);

// Protected routes
router.post('/book', authenticate, createFlightBooking);

export default router;
