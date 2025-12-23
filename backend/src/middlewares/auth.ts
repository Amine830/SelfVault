import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config';
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
 * Vérifie le JWT Supabase dans le header Authorization
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

    // Créer un client Supabase pour vérifier le token
    const supabase = createClient(config.supabase.url, config.supabase.anonKey);

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      logger.warn('Authentication failed:', error?.message);
      throw new AppError('Invalid or expired token', 401);
    }

    // Ajouter l'utilisateur à la requête
    req.user = {
      id: user.id,
      email: user.email || '',
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
    const supabase = createClient(config.supabase.url, config.supabase.anonKey);

    const {
      data: { user },
    } = await supabase.auth.getUser(token);

    if (user) {
      req.user = {
        id: user.id,
        email: user.email || '',
      };
    }

    next();
  } catch {
    // En cas d'erreur, on continue sans utilisateur
    next();
  }
};
