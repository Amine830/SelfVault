import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { categoryService } from '../services/CategoryService';
import { AppError } from '../utils/errors';

/**
 * Contrôleur pour gérer les catégories
 */
export class CategoryController {
  /**
   * GET /categories - Liste toutes les catégories
   */
  async listCategories(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      const categories = await categoryService.getCategories(req.user.id);

      res.json({ categories });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /categories/:id - Récupère une catégorie
   */
  async getCategory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      const categoryId = parseInt(req.params.id, 10);
      const category = await categoryService.getCategoryById(categoryId, req.user.id);

      res.json({ category });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /categories - Crée une catégorie
   */
  async createCategory(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      const { name, color } = req.body as unknown as { name: string; color?: string };
      const category = await categoryService.createCategory(req.user.id, { name, color });

      res.status(201).json({ category });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /categories/:id - Met à jour une catégorie
   */
  async updateCategory(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      const categoryId = parseInt(req.params.id, 10);
      const { name, color } = req.body as unknown as { name?: string; color?: string };

      const category = await categoryService.updateCategory(categoryId, req.user.id, {
        name,
        color,
      });

      res.json({ category });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /categories/:id - Supprime une catégorie
   */
  async deleteCategory(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      const categoryId = parseInt(req.params.id, 10);
      await categoryService.deleteCategory(categoryId, req.user.id);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const categoryController = new CategoryController();
