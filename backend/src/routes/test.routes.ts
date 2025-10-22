import express from 'express';
import { testEmail } from '../controllers/test-email.controller';

const router = express.Router();

// Test email endpoint (no authentication required for testing)
router.post('/email', testEmail);

export default router;
