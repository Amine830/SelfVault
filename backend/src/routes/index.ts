import { Router } from 'express';
import userRoutes from './user.routes';
import categoryRoutes from './category.routes';
import fileRoutes from './file.routes';
import shareRoutes from './share.routes';

const router = Router();

/**
 * Routes principales de l'API
 */
router.use('/', userRoutes);
router.use('/categories', categoryRoutes);
router.use('/files', fileRoutes);

// Routes de partage (inclut routes authentifiées et publiques)
router.use('/', shareRoutes);

// Route de santé
router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;
