import { createApp } from './app';
import { config } from './config';
import { logger } from './utils/logger';
import { prisma } from './database/client';

/**
 * Point d'entrée de l'application
 */
async function startServer(): Promise<void> {
  try {
    // Vérifier la connexion à la base de données
    await prisma.$connect();
    logger.info('Database connection established');

    // Créer l'application Express
    const app = createApp();

    // Démarrer le serveur
    const server = app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
      logger.info(`Storage provider: ${config.storage.provider}`);
      logger.info(`API URL: http://localhost:${config.port}/api`);
    });

    // Gestion de l'arrêt gracieux
    const gracefulShutdown = (signal: string): void => {
      logger.info(`${signal} received. Shutting down gracefully...`);

      server.close(() => {
        logger.info('HTTP server closed');

        prisma
          .$disconnect()
          .then(() => {
            logger.info('Database connection closed');
            process.exit(0);
          })
          .catch((error) => {
            logger.error('Error during shutdown:', error);
            process.exit(1);
          });
      });

      // Forcer l'arrêt après 10 secondes
      setTimeout(() => {
        logger.error('Could not close connections in time, forcing shutdown');
        process.exit(1);
      }, 10000);
    };

    // Écouter les signaux d'arrêt
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Gestion des erreurs non capturées
    process.on('unhandledRejection', (reason: Error) => {
      logger.error('Unhandled Rejection:', reason);
    });

    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception:', error);
      console.error('Full error:', error);
      console.error('Stack:', error.stack);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Démarrer le serveur
void startServer();
