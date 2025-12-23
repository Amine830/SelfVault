import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { categoryController } from '../controllers/CategoryController';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validation';
import { createCategorySchema, updateCategorySchema } from '../utils/validation';

const router = Router();

/**
 * Routes catégories
 * Toutes nécessitent une authentification
 */
router.get(
  '/',
  asyncHandler(authenticate),
  asyncHandler(categoryController.listCategories.bind(categoryController))
);

router.get(
  '/:id',
  asyncHandler(authenticate),
  asyncHandler(categoryController.getCategory.bind(categoryController))
);

router.post(
  '/',
  asyncHandler(authenticate),
  asyncHandler(validate(createCategorySchema)),
  asyncHandler(categoryController.createCategory.bind(categoryController))
);

router.patch(
  '/:id',
  asyncHandler(authenticate),
  asyncHandler(validate(updateCategorySchema)),
  asyncHandler(categoryController.updateCategory.bind(categoryController))
);

router.delete(
  '/:id',
  asyncHandler(authenticate),
  asyncHandler(categoryController.deleteCategory.bind(categoryController))
);

export default router;
