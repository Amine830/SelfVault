import { Request, Response, NextFunction } from 'express';
import { authProvider } from '../auth';
import { userService } from '../services/UserService';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { config } from '../config';

/**
 * Contrôleur pour gérer l'authentification
 * Fournit des endpoints pour login/register/logout
 * Utilisé principalement avec le LocalAuthProvider
 */
export class AuthController {
  /**
   * POST /auth/login - Connexion utilisateur
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body as { email?: string; password?: string };

      if (!email || !password) {
        throw new AppError('Email and password are required', 400);
      }

      const result = await authProvider.login(email, password);

      // S'assurer que l'utilisateur existe dans notre DB
      await userService.findOrCreateUser(result.user.id, result.user.email);

      logger.info(`User logged in: ${result.user.id}`);

      res.json({
        success: true,
        user: {
          id: result.user.id,
          email: result.user.email,
          username: result.user.username,
        },
        tokens: result.tokens,
      });
    } catch (error) {
      if (error instanceof Error) {
        next(new AppError(error.message, 401));
      } else {
        next(new AppError('Login failed', 401));
      }
    }
  }

  /**
   * POST /auth/register - Inscription utilisateur
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, username } = req.body as {
        email?: string;
        password?: string;
        username?: string;
      };

      if (!email || !password) {
        throw new AppError('Email and password are required', 400);
      }

      // Validation basique du mot de passe
      if (password.length < 8) {
        throw new AppError('Password must be at least 8 characters long', 400);
      }

      const result = await authProvider.register(email, password, { username });

      // Créer l'utilisateur dans notre DB si pas déjà fait par le provider
      await userService.findOrCreateUser(result.user.id, result.user.email);

      // Mettre à jour le username si fourni
      if (username) {
        await userService.updateUser(result.user.id, { username });
      }

      logger.info(`New user registered: ${result.user.id}`);

      res.status(201).json({
        success: true,
        user: {
          id: result.user.id,
          email: result.user.email,
          username: username || result.user.username,
        },
        tokens: result.tokens,
        // Indication si la vérification email est requise (Supabase)
        emailVerificationRequired: !result.tokens.accessToken,
      });
    } catch (error) {
      if (error instanceof Error) {
        // Personnaliser les messages d'erreur courants
        if (error.message.includes('already exists')) {
          next(new AppError('An account with this email already exists', 409));
        } else {
          next(new AppError(error.message, 400));
        }
      } else {
        next(new AppError('Registration failed', 400));
      }
    }
  }

  /**
   * POST /auth/logout - Déconnexion utilisateur
   */
  async logout(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : '';

      await authProvider.logout(token);

      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch {
      // On répond succès même en cas d'erreur (côté client, le token sera supprimé)
      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    }
  }

  /**
   * POST /auth/refresh - Rafraîchir le token d'accès
   */
  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body as { refreshToken?: string };

      if (!refreshToken) {
        throw new AppError('Refresh token is required', 400);
      }

      if (!authProvider.refreshToken) {
        throw new AppError('Token refresh is not supported by the current auth provider', 501);
      }

      const tokens = await authProvider.refreshToken(refreshToken);

      res.json({
        success: true,
        tokens,
      });
    } catch (error) {
      if (error instanceof Error) {
        next(new AppError(error.message, 401));
      } else {
        next(new AppError('Token refresh failed', 401));
      }
    }
  }

  /**
   * GET /auth/provider - Retourne le provider d'auth configuré
   * Utile pour le frontend pour savoir quel flux utiliser
   */
  async getProvider(_req: Request, res: Response): Promise<void> {
    res.json({
      provider: config.auth.provider,
      // Informations supplémentaires pour le frontend
      features: {
        emailVerification: config.auth.provider === 'supabase',
        socialLogin: config.auth.provider === 'supabase',
        tokenRefresh: true,
      },
    });
  }
}

export const authController = new AuthController();
