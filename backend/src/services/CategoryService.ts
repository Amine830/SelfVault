import { prisma } from '../database/client';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * Service pour gérer les catégories
 */
export class CategoryService {
  /**
   * Récupère toutes les catégories d'un utilisateur
   */
  async getCategories(userId: string): Promise<
    Array<{
      id: number;
      name: string;
      color: string | null;
      _count: { files: number };
    }>
  > {
    try {
      const categories = await prisma.category.findMany({
        where: { ownerId: userId },
        include: {
          _count: {
            select: { files: true },
          },
        },
        orderBy: { name: 'asc' },
      });

      return categories;
    } catch (error) {
      logger.error('Error in getCategories:', error);
      throw new AppError('Failed to get categories', 500);
    }
  }

  /**
   * Récupère une catégorie par ID
   */
  async getCategoryById(
    categoryId: number,
    userId: string
  ): Promise<{
    id: number;
    name: string;
    color: string | null;
  }> {
    try {
      const category = await prisma.category.findFirst({
        where: {
          id: categoryId,
          ownerId: userId,
        },
      });

      if (!category) {
        throw new AppError('Category not found', 404);
      }

      return category;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error in getCategoryById:', error);
      throw new AppError('Failed to get category', 500);
    }
  }

  /**
   * Crée une nouvelle catégorie
   */
  async createCategory(
    userId: string,
    data: { name: string; color?: string }
  ): Promise<{
    id: number;
    name: string;
    color: string | null;
  }> {
    try {
      const category = await prisma.category.create({
        data: {
          ownerId: userId,
          name: data.name,
          color: data.color || '#6366f1',
        },
      });

      logger.info(`Category created: ${category.id} by user ${userId}`);
      return category;
    } catch (error) {
      logger.error('Error in createCategory:', error);

      // Erreur de contrainte unique (nom déjà existant)
      if ((error as { code?: string }).code === 'P2002') {
        throw new AppError('Category name already exists', 409);
      }

      throw new AppError('Failed to create category', 500);
    }
  }

  /**
   * Met à jour une catégorie
   */
  async updateCategory(
    categoryId: number,
    userId: string,
    data: { name?: string; color?: string }
  ): Promise<{
    id: number;
    name: string;
    color: string | null;
  }> {
    try {
      // Vérifier que la catégorie appartient à l'utilisateur
      await this.getCategoryById(categoryId, userId);

      const category = await prisma.category.update({
        where: { id: categoryId },
        data,
      });

      logger.info(`Category updated: ${categoryId}`);
      return category;
    } catch (error) {
      if (error instanceof AppError) throw error;

      // Erreur de contrainte unique
      if ((error as { code?: string }).code === 'P2002') {
        throw new AppError('Category name already exists', 409);
      }

      logger.error('Error in updateCategory:', error);
      throw new AppError('Failed to update category', 500);
    }
  }

  /**
   * Supprime une catégorie
   */
  async deleteCategory(categoryId: number, userId: string): Promise<void> {
    try {
      // Vérifier que la catégorie appartient à l'utilisateur
      await this.getCategoryById(categoryId, userId);

      await prisma.category.delete({
        where: { id: categoryId },
      });

      logger.info(`Category deleted: ${categoryId}`);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error in deleteCategory:', error);
      throw new AppError('Failed to delete category', 500);
    }
  }
}

export const categoryService = new CategoryService();
