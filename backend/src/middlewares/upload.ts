import multer from 'multer';
import { config } from '../config';
import { AppError } from '../utils/errors';

/**
 * Configuration Multer pour l'upload de fichiers
 * Stockage en mémoire pour traitement avant envoi au storage
 */
const storage = multer.memoryStorage();

/**
 * Filtre pour valider les fichiers uploadés
 */
const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  // Liste des types MIME interdits
  const forbiddenMimeTypes = [
    'application/x-msdownload',
    'application/x-executable',
    'application/x-dosexec',
    'application/x-sh',
  ];

  if (forbiddenMimeTypes.includes(file.mimetype)) {
    cb(new AppError('File type not allowed', 400));
    return;
  }

  cb(null, true);
};

/**
 * Middleware Multer configuré
 */
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxSizeBytes,
    files: 1, // Un seul fichier à la fois
  },
});

/**
 * Handler d'erreurs Multer
 */
export const handleMulterError = (
  err: Error,
  _req: Express.Request,
  _res: Express.Response,
  next: (error?: Error) => void
): void => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      next(new AppError('File too large', 413));
      return;
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      next(new AppError('Too many files', 400));
      return;
    }
    next(new AppError(`Upload error: ${err.message}`, 400));
    return;
  }
  next(err);
};
