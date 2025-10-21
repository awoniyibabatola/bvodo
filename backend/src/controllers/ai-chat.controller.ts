import { Request, Response } from 'express';
import AIChatService from '../services/ai-chat.service';
import { logger } from '../utils/logger';

export class AIChatController {
  /**
   * Parse user intent from message
   */
  static async parseIntent(req: Request, res: Response) {
    try {
      const { message, conversationHistory } = req.body;

      if (!message || typeof message !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Message is required and must be a string',
        });
      }

      // Check if AI is available
      if (!AIChatService.isAvailable()) {
        return res.status(200).json({
          success: false,
          useRuleBased: true,
          message: 'AI not enabled, use rule-based fallback',
        });
      }

      const intent = await AIChatService.parseIntent(message, conversationHistory || []);

      return res.status(200).json({
        success: true,
        intent,
      });
    } catch (error: any) {
      if (error.message === 'AI_NOT_ENABLED' || error.message === 'AI_ERROR') {
        return res.status(200).json({
          success: false,
          useRuleBased: true,
          message: 'Falling back to rule-based parsing',
        });
      }

      logger.error('AI chat parse error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to parse intent',
      });
    }
  }

  /**
   * Generate natural response
   */
  static async generateResponse(req: Request, res: Response) {
    try {
      const { intent, context } = req.body;

      if (!intent) {
        return res.status(400).json({
          success: false,
          error: 'Intent is required',
        });
      }

      if (!AIChatService.isAvailable()) {
        return res.status(200).json({
          success: false,
          useRuleBased: true,
        });
      }

      const response = await AIChatService.generateResponse(intent, context || {});

      return res.status(200).json({
        success: true,
        response,
      });
    } catch (error: any) {
      if (error.message === 'AI_NOT_ENABLED' || error.message === 'AI_ERROR') {
        return res.status(200).json({
          success: false,
          useRuleBased: true,
        });
      }

      logger.error('AI response generation error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to generate response',
      });
    }
  }

  /**
   * Check AI availability
   */
  static checkAvailability(req: Request, res: Response) {
    return res.status(200).json({
      success: true,
      available: AIChatService.isAvailable(),
    });
  }
}

export default AIChatController;
