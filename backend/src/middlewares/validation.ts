import { Request, Response, NextFunction } from 'express';
import { AnyZodObject } from 'zod';
import { AppError } from '../utils/errors';

/* eslint-disable @typescript-eslint/no-unsafe-argument */

/**
 * Middleware de validation avec Zod
 * Valide le body, query ou params selon le schéma fourni
 */
export const validate =
  (schema: AnyZodObject, source: 'body' | 'query' | 'params' = 'body') =>
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const result = await schema.safeParseAsync(req[source] as unknown);
      if (!result.success) {
        const messages = result.error.errors.map((err) => `${err.path.join('.')}: ${err.message}`);
        next(new AppError(`Validation error: ${messages.join(', ')}`, 400));
        return;
      }
      next();
    } catch (error) {
      next(new AppError('Validation error', 400));
    }
  };

/**
 * Sanitize les entrées utilisateur
 * Supprime les propriétés dangereuses
 */
export const sanitizeInput = (req: Request, _res: Response, next: NextFunction): void => {
  const sanitize = (obj: Record<string, unknown>): Record<string, unknown> => {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      // Ignorer les propriétés prototype
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        sanitized[key] = sanitize(value as Record<string, unknown>);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  };

  if (req.body && typeof req.body === 'object') {
    req.body = sanitize(req.body);
  }

  if (req.query && typeof req.query === 'object') {
    req.query = sanitize(req.query as Record<string, unknown>) as Record<string, string>;
  }

  next();
};
