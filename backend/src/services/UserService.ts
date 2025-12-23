import { prisma } from '../database/client';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * Service pour gérer les utilisateurs
 */
export class UserService {
  /**
   * Récupère ou crée un utilisateur
   * Appelé après l'authentification Supabase
   */
  async findOrCreateUser(
    userId: string,
    email: string
  ): Promise<{
    id: string;
    email: string;
    username: string | null;
    createdAt: Date;
  }> {
    try {
      let user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        // Créer l'utilisateur et ses settings par défaut
        user = await prisma.user.create({
          data: {
            id: userId,
            email,
            userSettings: {
              create: {},
            },
          },
        });

        logger.info(`New user created: ${userId}`);
      }

      return user;
    } catch (error) {
      logger.error('Error in findOrCreateUser:', error);
      throw new AppError('Failed to get user', 500);
    }
  }

  /**
   * Récupère les informations d'un utilisateur
   */
  async getUserById(userId: string): Promise<{
    id: string;
    email: string;
    username: string | null;
    createdAt: Date;
    updatedAt: Date;
  }> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      return user;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error in getUserById:', error);
      throw new AppError('Failed to get user', 500);
    }
  }

  /**
   * Met à jour le profil utilisateur
   */
  async updateUser(
    userId: string,
    data: { username?: string }
  ): Promise<{
    id: string;
    email: string;
    username: string | null;
  }> {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data,
        select: {
          id: true,
          email: true,
          username: true,
        },
      });

      logger.info(`User updated: ${userId}`);
      return user;
    } catch (error) {
      logger.error('Error in updateUser:', error);
      throw new AppError('Failed to update user', 500);
    }
  }

  /**
   * Récupère les paramètres utilisateur
   */
  async getUserSettings(userId: string): Promise<{
    storageLimit: bigint;
    preferences: unknown;
  }> {
    try {
      const settings = await prisma.userSettings.findUnique({
        where: { ownerId: userId },
      });

      if (!settings) {
        // Créer les settings par défaut si inexistants
        return await prisma.userSettings.create({
          data: { ownerId: userId },
        });
      }

      return settings;
    } catch (error) {
      logger.error('Error in getUserSettings:', error);
      throw new AppError('Failed to get settings', 500);
    }
  }

  /**
   * Met à jour les paramètres utilisateur
   */
  async updateUserSettings(
    userId: string,
    data: { storageLimit?: bigint; preferences?: unknown }
  ): Promise<{
    storageLimit: bigint;
    preferences: unknown;
  }> {
    try {
      const updateData: { storageLimit?: bigint; preferences?: object } = {};
      if (data.storageLimit !== undefined) {
        updateData.storageLimit = data.storageLimit;
      }
      if (data.preferences !== undefined) {
        updateData.preferences = data.preferences as object;
      }

      const settings = await prisma.userSettings.upsert({
        where: { ownerId: userId },
        update: updateData,
        create: {
          ownerId: userId,
          ...updateData,
        },
      });

      logger.info(`Settings updated for user: ${userId}`);
      return settings;
    } catch (error) {
      logger.error('Error in updateUserSettings:', error);
      throw new AppError('Failed to update settings', 500);
    }
  }

  /**
   * Calcule l'espace de stockage utilisé par un utilisateur
   */
  async getStorageUsed(userId: string): Promise<bigint> {
    try {
      const result = await prisma.file.aggregate({
        where: { ownerId: userId },
        _sum: { size: true },
      });

      return result._sum.size || BigInt(0);
    } catch (error) {
      logger.error('Error in getStorageUsed:', error);
      throw new AppError('Failed to calculate storage', 500);
    }
  }
}

export const userService = new UserService();
