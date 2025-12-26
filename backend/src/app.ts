import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import compression from 'compression';
import { config } from './config';
import { errorHandler } from './utils/errors';
import { requestLogger } from './middlewares/logger';
import { sanitizeInput } from './middlewares/validation';
import { globalRateLimiter } from './middlewares/rateLimiter';
import routes from './routes';

const openApiCandidates = [
  path.join(__dirname, 'docs/openapi.json'),
  path.join(__dirname, '../docs/openapi.json'),
  path.join(process.cwd(), 'src/docs/openapi.json'),
  path.join(process.cwd(), 'docs/openapi.json'),
  path.join(process.cwd(), 'openapi/openapi.json'),
];

const openApiPath = openApiCandidates.find((candidate) => fs.existsSync(candidate));

let swaggerDocument: Record<string, unknown> | undefined;

if (openApiPath) {
  try {
    const source = fs.readFileSync(openApiPath, 'utf8');
    swaggerDocument = JSON.parse(source);
  } catch (error) {
    console.error('Failed to load OpenAPI document:', error);
  }
}

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

  if (swaggerDocument) {
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    app.get('/docs/openapi.json', (_req, res) => {
      res.json(swaggerDocument);
    });
  } else {
    console.warn('OpenAPI document not found. Skipping /docs route.');
  }

  // Route racine
  app.get('/', (_req, res) => {
    res.json({
      name: 'SelfVault API',
      version: '1.0.0',
      description: 'Self-hosted file storage solution',
      docs: swaggerDocument ? '/docs' : null,
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
