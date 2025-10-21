import { Router } from 'express';
import AIChatController from '../controllers/ai-chat.controller';

const router = Router();

// Parse user intent
router.post('/parse', AIChatController.parseIntent);

// Generate natural response
router.post('/generate-response', AIChatController.generateResponse);

// Check AI availability
router.get('/availability', AIChatController.checkAvailability);

export default router;
