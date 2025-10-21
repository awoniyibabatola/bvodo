# Claude AI Integration - Setup Guide

## Overview

The chatbot now supports **optional Claude AI integration** with automatic fallback to rule-based parsing if Claude is not enabled.

## Features

✅ **Optional** - Works with or without Claude AI
✅ **Safe Fallback** - Auto-falls back to rule-based if Claude fails or is disabled
✅ **Smart Intent Parsing** - Claude understands complex, natural queries
✅ **Conversation Memory** - Can reference previous messages
✅ **Natural Responses** - Generates human-like, contextual responses

## Setup Instructions

### Step 1: Get Claude API Key

1. Go to https://console.anthropic.com/
2. Sign up or log in
3. Navigate to "API Keys"
4. Create a new API key
5. Copy the key (starts with `sk-ant-...`)

### Step 2: Add to Environment Variables

Add these to your `backend/.env` file:

```env
# Claude AI (optional)
ANTHROPIC_API_KEY=sk-ant-api03-your-actual-key-here
ENABLE_AI_CHAT=true
```

**Important:**
- Set `ENABLE_AI_CHAT=false` to disable Claude and use only rule-based fallback
- If you don't add `ANTHROPIC_API_KEY`, it will automatically use fallback

### Step 3: Restart Backend

```bash
cd backend
npm run dev
```

You should see in the logs:
```
[INFO] Claude AI initialized successfully
```

Or if disabled:
```
[INFO] Claude AI not configured - using rule-based fallback
```

## How It Works

### 1. Intent Parsing

**Endpoint:** `POST /api/v1/ai-chat/parse`

**Request:**
```json
{
  "message": "I want to fly from Lagos to London under $500",
  "conversationHistory": [
    { "role": "user", "content": "Hi" },
    { "role": "assistant", "content": "Hello! How can I help?" }
  ]
}
```

**Response (Claude enabled):**
```json
{
  "success": true,
  "intent": {
    "type": "flight",
    "origin": "Lagos",
    "destination": "London",
    "preferences": {
      "maxPrice": 500
    },
    "needsClarification": false,
    "confidence": 95
  }
}
```

**Response (Claude disabled/error):**
```json
{
  "success": false,
  "useRuleBased": true,
  "message": "AI not enabled, use rule-based fallback"
}
```

### 2. Check Availability

**Endpoint:** `GET /api/v1/ai-chat/availability`

**Response:**
```json
{
  "success": true,
  "available": true
}
```

### 3. Generate Response

**Endpoint:** `POST /api/v1/ai-chat/generate-response`

**Request:**
```json
{
  "intent": {
    "type": "flight",
    "origin": "Lagos",
    "destination": "London"
  },
  "context": {
    "foundResults": true,
    "resultCount": 5
  }
}
```

**Response:**
```json
{
  "success": true,
  "response": "Great! I found 5 flights from Lagos to London that match your budget. Let me show you the best options! ✈️"
}
```

## Pricing

Claude 3.5 Sonnet costs approximately:
- **$3 per 1,000 conversations** (input)
- **$15 per 1,000 conversations** (output)

For most use cases:
- Average conversation: ~$0.01-0.02
- 1000 users/month: ~$10-20/month

## Safety Features

✅ **Automatic Fallback** - If Claude fails, uses rule-based system
✅ **Error Handling** - All errors caught and logged
✅ **Rate Limiting** - Built into Anthropic SDK
✅ **Validation** - All inputs validated before sending to Claude
✅ **Optional** - Easy to disable with `ENABLE_AI_CHAT=false`

## Testing

### Test 1: Check if AI is available
```bash
curl http://localhost:5000/api/v1/ai-chat/availability
```

### Test 2: Parse a simple query
```bash
curl -X POST http://localhost:5000/api/v1/ai-chat/parse \
  -H "Content-Type: application/json" \
  -d '{"message": "I want to go to Dubai"}'
```

### Test 3: Parse a complex query
```bash
curl -X POST http://localhost:5000/api/v1/ai-chat/parse \
  -H "Content-Type: application/json" \
  -d '{"message": "Find me a luxury hotel in Paris with a pool and gym, checking in December 25th for 3 nights, budget is around $300 per night"}'
```

## Troubleshooting

### "Claude AI not configured"
- Check that `ANTHROPIC_API_KEY` is set in `.env`
- Make sure the key starts with `sk-ant-`
- Restart the backend server

### "AI not enabled"
- Set `ENABLE_AI_CHAT=true` in `.env`
- Restart the backend

### All requests use fallback
- This is normal if `ENABLE_AI_CHAT=false`
- Check the logs to see why Claude isn't being used

## Next Steps

Now that the backend is set up, you need to:

1. ✅ Backend API is ready
2. ⏳ Update frontend chatbox to call the new API
3. ⏳ Test end-to-end flow

The frontend integration is next!
