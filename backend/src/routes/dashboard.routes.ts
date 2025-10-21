import express from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

// All dashboard routes require authentication
router.use(authenticate);

// Get dashboard stats
router.get('/stats', DashboardController.getDashboardStats);

export default router;
