/**
 * Script de test simple pour vérifier que l'API démarre
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({
    name: 'SelfVault API - Test Mode',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  /* eslint-disable-next-line no-console */
  console.log(`Test server running on http://localhost:${PORT}`);
  /* eslint-disable-next-line no-console */
  console.log(`Health: http://localhost:${PORT}/health`);
});
