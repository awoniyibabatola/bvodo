import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('5000'),
  API_VERSION: z.string().default('v1'),

  // Database
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url().optional(),

  // JWT
  JWT_SECRET: z.string().min(10),
  JWT_EXPIRES_IN: z.union([z.string(), z.number()]).default('24h'),
  JWT_REFRESH_SECRET: z.string().min(10).optional(),
  JWT_REFRESH_EXPIRES_IN: z.union([z.string(), z.number()]).default('7d'),

  // Redis (optional for MVP)
  REDIS_URL: z.string().optional(),

  // Amadeus
  AMADEUS_CLIENT_ID: z.string().optional(),
  AMADEUS_CLIENT_SECRET: z.string().optional(),
  AMADEUS_API_URL: z.string().url().optional(),
  AMADEUS_ENVIRONMENT: z.enum(['test', 'production']).default('test'),

  // Booking.com
  BOOKING_COM_API_KEY: z.string().optional(),

  // Google Maps/Places
  GOOGLE_MAPS_API_KEY: z.string().optional(),

  // Claude AI (optional - fallback to rule-based if not provided)
  ANTHROPIC_API_KEY: z.string().optional(),
  ENABLE_AI_CHAT: z.enum(['true', 'false']).default('false').transform(val => val === 'true'),

  // Stripe
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // Paystack
  PAYSTACK_SECRET_KEY: z.string().optional(),

  // SendGrid
  SENDGRID_API_KEY: z.string().optional(),
  SENDGRID_FROM_EMAIL: z.string().email().optional(),

  // Frontend URL
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),

  // Cors
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
});

export const env = envSchema.parse(process.env);

export type Env = z.infer<typeof envSchema>;
