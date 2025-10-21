import { Router } from 'express';
import {
  searchHotels,
  getHotelOffers,
  createHotelBooking,
} from '../controllers/hotel.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.get('/search', searchHotels);
router.get('/:hotelId/offers', getHotelOffers);

// Protected routes
router.post('/book', authenticate, createHotelBooking);

export default router;
