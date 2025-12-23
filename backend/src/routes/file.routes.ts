import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { fileController } from '../controllers/FileController';
import { authenticate } from '../middlewares/auth';
import { upload, handleMulterError } from '../middlewares/upload';
import { uploadRateLimiter } from '../middlewares/rateLimiter';
import { validate } from '../middlewares/validation';
import { updateFileSchema } from '../utils/validation';

const router = Router();

/**
 * Routes fichiers
 * Toutes nécessitent une authentification
 */

// Upload avec rate limiting strict
router.post(
  '/upload',
  asyncHandler(authenticate),
  uploadRateLimiter,
  upload.single('file'),
  handleMulterError,
  asyncHandler(fileController.uploadFile.bind(fileController))
);

// Liste des fichiers
router.get(
  '/',
  asyncHandler(authenticate),
  asyncHandler(fileController.listFiles.bind(fileController))
);

// Récupérer un fichier
router.get(
  '/:id',
  asyncHandler(authenticate),
  asyncHandler(fileController.getFile.bind(fileController))
);

// Télécharger un fichier
router.get(
  '/:id/download',
  asyncHandler(authenticate),
  asyncHandler(fileController.downloadFile.bind(fileController))
);

// Obtenir une URL signée
router.get(
  '/:id/url',
  asyncHandler(authenticate),
  asyncHandler(fileController.getDownloadUrl.bind(fileController))
);

// Mettre à jour un fichier
router.patch(
  '/:id',
  asyncHandler(authenticate),
  asyncHandler(validate(updateFileSchema)),
  asyncHandler(fileController.updateFile.bind(fileController))
);

// Supprimer un fichier
router.delete(
  '/:id',
  asyncHandler(authenticate),
  asyncHandler(fileController.deleteFile.bind(fileController))
);

export default router;
