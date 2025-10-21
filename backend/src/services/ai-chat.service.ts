import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env';
import { logger } from '../utils/logger';

// Initialize Claude client (only if API key provided)
let anthropic: Anthropic | null = null;

if (env.ANTHROPIC_API_KEY) {
  anthropic = new Anthropic({
    apiKey: env.ANTHROPIC_API_KEY,
  });
  logger.info('Claude AI initialized successfully');
} else {
  logger.info('Claude AI not configured - using rule-based fallback');
}

export interface ChatIntent {
  type: 'flight' | 'hotel' | 'both' | 'unclear';
  origin?: string;
  destination?: string;
  location?: string;
  dates?: {
    checkIn?: string;
    checkOut?: string;
    departure?: string;
    return?: string;
  };
  preferences?: {
    maxPrice?: number;
    minPrice?: number;
    minRating?: number;
    amenities?: string[];
    directFlight?: boolean;
    cabinClass?: string;
  };
  needsClarification?: boolean;
  clarificationQuestion?: string;
  confidence: number; // 0-100
}

export class AIChatService {
  /**
   * Parse user message and extract travel intent using Claude AI
   */
  static async parseIntent(userMessage: string, conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []): Promise<ChatIntent> {
    // If AI is not enabled or no API key, return null to trigger fallback
    if (!env.ENABLE_AI_CHAT || !anthropic) {
      logger.debug('AI chat disabled, using rule-based fallback');
      throw new Error('AI_NOT_ENABLED');
    }

    try {
      logger.info('Parsing intent with Claude AI:', { message: userMessage });

      const messages: Anthropic.MessageParam[] = [
        ...conversationHistory.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })),
        {
          role: 'user',
          content: userMessage,
        },
      ];

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: `You are a travel booking assistant AI. Your job is to parse user messages and extract travel intent.

Analyze the user's message and respond with a JSON object containing:
{
  "type": "flight" | "hotel" | "both" | "unclear",
  "origin": "city name or null",
  "destination": "city name or null",
  "location": "city/location for hotel or null",
  "dates": {
    "checkIn": "YYYY-MM-DD or null",
    "checkOut": "YYYY-MM-DD or null",
    "departure": "YYYY-MM-DD or null",
    "return": "YYYY-MM-DD or null"
  },
  "preferences": {
    "maxPrice": number or null,
    "minPrice": number or null,
    "minRating": number or null,
    "amenities": ["pool", "wifi", etc] or [],
    "directFlight": boolean or null,
    "cabinClass": "economy" | "business" | "first" or null
  },
  "needsClarification": boolean,
  "clarificationQuestion": "question to ask user or null",
  "confidence": 0-100
}

Rules:
- Extract ALL information you can find in the message
- Be smart about dates: "tomorrow", "next week", "December 25th", etc.
- For vague queries like "I want to go to Dubai" where the user mentions a destination but doesn't specify if they need a flight or hotel:
  * Set type="both" (assume they might need both)
  * Set needsClarification=true
  * Set clarificationQuestion to ask what they need (e.g., "Great! Are you looking for flights, hotels, or both for your trip to Dubai?")
- Set confidence based on how clear the intent is (100 = very clear, 0 = very unclear)
- If user just greets or thanks (no travel intent at all), set type="unclear" and confidence=0
- Return ONLY valid JSON, no explanations`,
        messages,
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response format from Claude');
      }

      // Extract JSON from response
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not extract JSON from Claude response');
      }

      const intent: ChatIntent = JSON.parse(jsonMatch[0]);
      logger.info('Claude parsed intent:', intent);

      return intent;
    } catch (error: any) {
      if (error.message === 'AI_NOT_ENABLED') {
        throw error;
      }

      logger.error('Claude AI error:', error);
      // On any error, trigger fallback to rule-based system
      throw new Error('AI_ERROR');
    }
  }

  /**
   * Generate a natural response using Claude
   */
  static async generateResponse(
    intent: ChatIntent,
    context: {
      foundResults?: boolean;
      resultCount?: number;
      error?: string;
    }
  ): Promise<string> {
    if (!env.ENABLE_AI_CHAT || !anthropic) {
      throw new Error('AI_NOT_ENABLED');
    }

    try {
      const prompt = `Based on this travel intent and context, generate a friendly, helpful response:

Intent: ${JSON.stringify(intent)}
Context: ${JSON.stringify(context)}

Generate a natural, conversational response that:
- Acknowledges what the user wants
- If results found, expresses excitement
- If no results, is empathetic and helpful
- Uses emojis sparingly (max 1-2)
- Keeps it brief (2-3 sentences max)
- Sounds human and warm

Response:`;

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 256,
        messages: [{
          role: 'user',
          content: prompt,
        }],
      });

      const content = response.content[0];
      if (content.type === 'text') {
        return content.text.trim();
      }

      throw new Error('Unexpected response format');
    } catch (error) {
      logger.error('Claude response generation error:', error);
      throw new Error('AI_ERROR');
    }
  }

  /**
   * Check if AI is available
   */
  static isAvailable(): boolean {
    return env.ENABLE_AI_CHAT && anthropic !== null;
  }
}

export default AIChatService;
