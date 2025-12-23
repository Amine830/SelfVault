import { Request, Response, NextFunction } from 'express';

/**
 * Type pour les erreurs de l'application
 */
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Handler global d'erreurs
 * Gère les erreurs et retourne une réponse appropriée
 */
export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
    return;
  }

  // Erreur non prévue
  console.error('ERROR ', err);
  res.status(500).json({
    status: 'error',
    message: 'Something went wrong!',
  });
};
