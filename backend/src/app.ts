import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { logger } from './utils/logger';
import { errorMiddleware } from './middleware/error.middleware';

// Import routes
import authRoutes from './routes/auth.routes';
import flightRoutes from './routes/flight.routes';
import hotelRoutes from './routes/hotel.routes';
import aiChatRoutes from './routes/ai-chat.routes';
import bookingRoutes from './routes/booking.routes';
import dashboardRoutes from './routes/dashboard.routes';
import companyAdminRoutes from './routes/company-admin.routes';
import superAdminRoutes from './routes/super-admin.routes';
// import userRoutes from './routes/user.routes';
// import organizationRoutes from './routes/organization.routes';
// import creditRoutes from './routes/credit.routes';

const app: Application = express();

// Security middleware
app.use(helmet());

// CORS configuration - allow multiple frontend ports for development
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3003',
  'http://localhost:3004',
  'http://localhost:3005',
  'http://localhost:3006',
  env.CORS_ORIGIN,
  env.FRONTEND_URL,
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP request logger
app.use(
  morgan('combined', {
    stream: {
      write: (message) => logger.http(message.trim()),
    },
  })
);

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// API routes
const apiPrefix = `/api/${env.API_VERSION}`;

// Mount routes
app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}/flights`, flightRoutes);
app.use(`${apiPrefix}/hotels`, hotelRoutes);
app.use(`${apiPrefix}/ai-chat`, aiChatRoutes);
app.use(`${apiPrefix}/bookings`, bookingRoutes);
app.use(`${apiPrefix}/dashboard`, dashboardRoutes);
app.use(`${apiPrefix}/company-admin`, companyAdminRoutes);
app.use(`${apiPrefix}/super-admin`, superAdminRoutes);
// app.use(`${apiPrefix}/users`, userRoutes);
// app.use(`${apiPrefix}/organizations`, organizationRoutes);
// app.use(`${apiPrefix}/credits`, creditRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Resource not found',
  });
});

// Error handling middleware (must be last)
app.use(errorMiddleware);

export default app;
