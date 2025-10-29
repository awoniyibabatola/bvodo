import app from './app';
import { env } from './config/env';
import { logger } from './utils/logger';
import { prisma } from './config/database';

const PORT = env.PORT || 5000;

async function startServer() {
  try {
    // Test database connection
    // Updated: Fixed guest creation with required fields
    await prisma.$connect();
    logger.info('✅ Database connected successfully');

    // Start Express server
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📝 Environment: ${env.NODE_ENV}`);
      logger.info(`🔗 API: http://localhost:${PORT}/api/${env.API_VERSION}`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`\n${signal} signal received: closing HTTP server`);

      server.close(async () => {
        logger.info('HTTP server closed');

        // Close database connection
        await prisma.$disconnect();
        logger.info('Database connection closed');

        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
