import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

/**
 * Client Prisma singleton
 * Évite de créer plusieurs instances du client
 */
class DatabaseClient {
  private static instance: PrismaClient | null = null;

  static getInstance(): PrismaClient {
    if (!DatabaseClient.instance) {
      DatabaseClient.instance = new PrismaClient({
        log:
          process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
      });

      DatabaseClient.instance
        .$connect()
        .then(() => {
          logger.info('Database connected successfully');
        })
        .catch((error) => {
          logger.error('Database connection failed:', error);
          process.exit(1);
        });
    }

    return DatabaseClient.instance;
  }

  static async disconnect(): Promise<void> {
    if (DatabaseClient.instance) {
      await DatabaseClient.instance.$disconnect();
      DatabaseClient.instance = null;
      logger.info('Database disconnected');
    }
  }
}

export const prisma = DatabaseClient.getInstance();
