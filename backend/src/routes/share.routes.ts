import { Router, RequestHandler } from 'express';
import asyncHandler from 'express-async-handler';
import { shareController } from '../controllers/ShareController';
import { authenticate } from '../middlewares/auth';
import { globalRateLimiter } from '../middlewares/rateLimiter';

const router = Router();

/**
 * Routes de partage
 */

// === Routes authentifiées (gestion des partages) ===

// Créer un lien de partage pour un fichier
router.post(
  '/files/:id/share',
  asyncHandler(authenticate),
  asyncHandler(shareController.createShareLink.bind(shareController))
);

// Récupérer les infos de partage d'un fichier
router.get(
  '/files/:id/share',
  asyncHandler(authenticate),
  asyncHandler(shareController.getShareInfo.bind(shareController))
);

// Révoquer le partage d'un fichier
router.delete(
  '/files/:id/share',
  asyncHandler(authenticate),
  asyncHandler(shareController.revokeShareLink.bind(shareController))
);

// === Routes publiques (accès aux fichiers partagés) ===

// Liste des fichiers publics
router.get(
  '/public/files',
  globalRateLimiter,
  asyncHandler(shareController.listPublicFiles.bind(shareController) as RequestHandler)
);

// Infos d'un fichier partagé (par token)
router.get(
  '/share/:token',
  globalRateLimiter,
  asyncHandler(shareController.getPublicFileInfo.bind(shareController) as RequestHandler)
);

// Télécharger un fichier partagé (GET avec password en query)
router.get(
  '/share/:token/download',
  globalRateLimiter,
  asyncHandler(shareController.downloadSharedFile.bind(shareController) as RequestHandler)
);

// Télécharger un fichier partagé (POST avec password en body)
router.post(
  '/share/:token/download',
  globalRateLimiter,
  asyncHandler(
    shareController.downloadSharedFileWithPassword.bind(shareController) as RequestHandler
  )
);

// Obtenir une URL signée pour un fichier partagé
router.get(
  '/share/:token/url',
  globalRateLimiter,
  asyncHandler(shareController.getSharedFileUrl.bind(shareController) as RequestHandler)
);

export default router;
