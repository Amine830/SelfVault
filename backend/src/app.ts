import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from './config';
import { errorHandler } from './utils/errors';
import { requestLogger } from './middlewares/logger';
import { sanitizeInput } from './middlewares/validation';
import { globalRateLimiter } from './middlewares/rateLimiter';
import routes from './routes';

/**
 * Crée et configure l'application Express
 */
export function createApp(): Application {
  const app = express();

  // Middlewares de sécurité
  app.use(helmet());
  app.use(
    cors({
      origin: config.cors.allowedOrigins,
      credentials: true,
    })
  );

  // Compression des réponses
  app.use(compression());

  // Parsing des requêtes
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Middlewares custom
  app.use(requestLogger);
  app.use(sanitizeInput);
  app.use(globalRateLimiter);

  // Routes
  app.use('/api', routes);

  // Route racine
  app.get('/', (_req, res) => {
    res.json({
      name: 'SelfVault API',
      version: '1.0.0',
      description: 'Self-hosted file storage solution',
      docs: '/api/health',
    });
  });

  // Gestion des routes non trouvées
  app.use((_req, res) => {
    res.status(404).json({
      status: 'error',
      message: 'Route not found',
    });
  });

  // Gestionnaire d'erreurs global
  app.use(errorHandler);

  return app;
}
