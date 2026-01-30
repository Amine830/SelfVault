import { Request, Response, NextFunction } from 'express';
import { authProvider } from '../auth';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * Interface pour l'utilisateur authentifié ajouté à la requête
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

/**
 * Middleware d'authentification
 * Vérifie le JWT via le provider d'auth configuré (Supabase ou Local)
 */
export const authenticate = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }

    const token = authHeader.substring(7);

    // Vérifier le token via le provider d'auth abstrait
    const user = await authProvider.verifyToken(token);

    if (!user) {
      logger.warn('Authentication failed: invalid or expired token');
      throw new AppError('Invalid or expired token', 401);
    }

    // Ajouter l'utilisateur à la requête
    req.user = {
      id: user.id,
      email: user.email,
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError('Authentication failed', 401));
    }
  }
};

/**
 * Middleware optionnel d'authentification
 * N'échoue pas si pas de token, mais ajoute l'utilisateur si token valide
 */
export const optionalAuth = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.substring(7);
    const user = await authProvider.verifyToken(token);

    if (user) {
      req.user = {
        id: user.id,
        email: user.email,
      };
    }

    next();
  } catch {
    // En cas d'erreur, on continue sans utilisateur
    next();
  }
};
