import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { authController } from '../controllers/AuthController';
import { validate } from '../middlewares/validation';
import { z } from 'zod';

const router = Router();

// Schémas de validation
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  username: z.string().min(3).max(50).optional(),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

/**
 * Routes d'authentification
 *
 * Ces routes sont utilisées par tous les providers d'authentification.
 * - Pour LocalAuthProvider : toute la logique est gérée côté backend
 * - Pour SupabaseAuthProvider : le frontend peut aussi utiliser directement Supabase
 */

// POST /auth/login - Connexion
router.post(
  '/login',
  asyncHandler(validate(loginSchema)),
  asyncHandler(authController.login.bind(authController))
);

// POST /auth/register - Inscription
router.post(
  '/register',
  asyncHandler(validate(registerSchema)),
  asyncHandler(authController.register.bind(authController))
);

// POST /auth/logout - Déconnexion
router.post('/logout', asyncHandler(authController.logout.bind(authController)));

// POST /auth/refresh - Rafraîchir le token
router.post(
  '/refresh',
  asyncHandler(validate(refreshTokenSchema)),
  asyncHandler(authController.refreshToken.bind(authController))
);

// GET /auth/provider - Obtenir le provider configuré
router.get('/provider', asyncHandler(authController.getProvider.bind(authController)));

export default router;
