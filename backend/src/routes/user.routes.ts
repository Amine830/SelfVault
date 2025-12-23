import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { userController } from '../controllers/UserController';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validation';
import { z } from 'zod';

const router = Router();

// Schéma de validation pour la mise à jour du profil
const updateProfileSchema = z.object({
  username: z.string().min(3).max(50).optional(),
});

/**
 * Routes utilisateur
 */
router.get(
  '/me',
  asyncHandler(authenticate),
  asyncHandler(userController.getMe.bind(userController))
);

router.patch(
  '/me',
  asyncHandler(authenticate),
  asyncHandler(validate(updateProfileSchema)),
  asyncHandler(userController.updateMe.bind(userController))
);

router.get(
  '/settings',
  asyncHandler(authenticate),
  asyncHandler(userController.getSettings.bind(userController))
);

router.patch(
  '/settings',
  asyncHandler(authenticate),
  asyncHandler(
    validate(
      z.object({
        storageLimit: z.string().optional(),
        preferences: z.record(z.unknown()).optional(),
      })
    )
  ),
  asyncHandler(userController.updateSettings.bind(userController))
);

export default router;
