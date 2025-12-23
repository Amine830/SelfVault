import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { userService } from '../services/UserService';
import { AppError } from '../utils/errors';

/**
 * Contrôleur pour gérer les utilisateurs
 */
export class UserController {
  /**
   * GET /me - Récupère le profil de l'utilisateur connecté
   */
  async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      const user = await userService.findOrCreateUser(req.user.id, req.user.email);
      const settings = await userService.getUserSettings(req.user.id);
      const storageUsed = await userService.getStorageUsed(req.user.id);

      res.json({
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          createdAt: user.createdAt,
        },
        storage: {
          used: storageUsed.toString(),
          limit: settings.storageLimit.toString(),
          percentage: Number((storageUsed * BigInt(100)) / settings.storageLimit),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /me - Met à jour le profil
   */
  async updateMe(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      const { username } = req.body as unknown as { username?: string };
      const user = await userService.updateUser(req.user.id, { username });

      res.json({ user });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /settings - Récupère les paramètres
   */
  async getSettings(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      const settings = await userService.getUserSettings(req.user.id);

      res.json({
        settings: {
          storageLimit: settings.storageLimit.toString(),
          preferences: settings.preferences,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /settings - Met à jour les paramètres
   */
  async updateSettings(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      const { storageLimit, preferences } = req.body as unknown as {
        storageLimit?: string | number | bigint;
        preferences?: unknown;
      };
      const data: { storageLimit?: bigint; preferences?: unknown } = {};

      if (storageLimit) {
        data.storageLimit = BigInt(storageLimit);
      }
      if (preferences) {
        data.preferences = preferences;
      }

      const settings = await userService.updateUserSettings(req.user.id, data);

      res.json({
        settings: {
          storageLimit: settings.storageLimit.toString(),
          preferences: settings.preferences,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
