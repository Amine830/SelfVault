import { prisma } from '../database/client';
import { storageAdapter } from '../adapters';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { calculateSha256 } from '../utils/file';
import { userService } from './UserService';

interface FileMetadata {
  id: string;
  filename: string;
  storagePath: string;
  storageProvider: string;
  mimetype: string | null;
  size: bigint;
  sha256: string;
  visibility: string;
  categoryId: number | null;
  createdAt: Date;
  updatedAt: Date;
}

interface FileWithCategory extends FileMetadata {
  category: { id: number; name: string; color: string | null } | null;
}

/**
 * Service pour gérer les fichiers
 */
export class FileService {
  /**
   * Upload un fichier
   */
  async uploadFile(
    userId: string,
    file: Express.Multer.File,
    metadata: {
      filename?: string;
      categoryId?: number;
      visibility?: string;
    }
  ): Promise<FileWithCategory> {
    try {
      // Vérifier le quota de stockage
      const settings = await userService.getUserSettings(userId);
      const storageUsed = await userService.getStorageUsed(userId);

      if (storageUsed + BigInt(file.size) > settings.storageLimit) {
        throw new AppError('Storage quota exceeded', 413);
      }

      // Calculer le hash du fichier
      const sha256 = calculateSha256(file.buffer);

      // Vérifier si le fichier existe déjà (déduplication)
      const existingFile = await prisma.file.findFirst({
        where: {
          ownerId: userId,
          sha256,
        },
      });

      if (existingFile) {
        throw new AppError('File already exists', 409);
      }

      // Upload vers le storage
      const uploadResult = await storageAdapter.uploadFile(
        userId,
        metadata.filename || file.originalname,
        file.buffer,
        file.mimetype
      );

      // Enregistrer les métadonnées en DB
      const fileRecord = await prisma.file.create({
        data: {
          ownerId: userId,
          filename: metadata.filename || file.originalname,
          storagePath: uploadResult.storagePath,
          storageProvider: uploadResult.provider,
          mimetype: file.mimetype,
          size: file.size,
          sha256,
          visibility: metadata.visibility || 'private',
          categoryId: metadata.categoryId,
        },
        include: {
          category: true,
        },
      });

      logger.info(`File uploaded: ${fileRecord.id} by user ${userId}`);
      return fileRecord;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error in uploadFile:', error);
      throw new AppError('Failed to upload file', 500);
    }
  }

  /**
   * Liste les fichiers d'un utilisateur avec pagination
   */
  async listFiles(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      categoryId?: number;
      search?: string;
    }
  ): Promise<{
    files: FileWithCategory[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const page = options.page || 1;
      const limit = Math.min(options.limit || 20, 100);
      const skip = (page - 1) * limit;

      const where = {
        ownerId: userId,
        ...(options.categoryId && { categoryId: options.categoryId }),
        ...(options.search && {
          filename: {
            contains: options.search,
            mode: 'insensitive' as const,
          },
        }),
      };

      const [files, total] = await Promise.all([
        prisma.file.findMany({
          where,
          include: {
            category: true,
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.file.count({ where }),
      ]);

      return {
        files,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error('Error in listFiles:', error);
      throw new AppError('Failed to list files', 500);
    }
  }

  /**
   * Récupère un fichier par ID
   */
  async getFileById(fileId: string, userId: string): Promise<FileWithCategory> {
    try {
      const file = await prisma.file.findFirst({
        where: {
          id: fileId,
          ownerId: userId,
        },
        include: {
          category: true,
        },
      });

      if (!file) {
        throw new AppError('File not found', 404);
      }

      return file;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error in getFileById:', error);
      throw new AppError('Failed to get file', 500);
    }
  }

  /**
   * Télécharge un fichier
   */
  async downloadFile(
    fileId: string,
    userId: string
  ): Promise<{
    buffer: Buffer;
    filename: string;
    mimetype: string | null;
  }> {
    try {
      const file = await this.getFileById(fileId, userId);
      const buffer = await storageAdapter.downloadFile(file.storagePath);

      return {
        buffer,
        filename: file.filename,
        mimetype: file.mimetype,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error in downloadFile:', error);
      throw new AppError('Failed to download file', 500);
    }
  }

  /**
   * Génère une URL signée pour téléchargement
   */
  async getDownloadUrl(fileId: string, userId: string, expiresIn = 3600): Promise<string> {
    try {
      const file = await this.getFileById(fileId, userId);
      return await storageAdapter.getSignedUrl(file.storagePath, expiresIn);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error in getDownloadUrl:', error);
      throw new AppError('Failed to generate download URL', 500);
    }
  }

  /**
   * Met à jour les métadonnées d'un fichier
   */
  async updateFile(
    fileId: string,
    userId: string,
    data: {
      filename?: string;
      visibility?: string;
      categoryId?: number | null;
    }
  ): Promise<FileWithCategory> {
    try {
      // Vérifier que le fichier appartient à l'utilisateur
      await this.getFileById(fileId, userId);

      const file = await prisma.file.update({
        where: { id: fileId },
        data,
        include: {
          category: true,
        },
      });

      logger.info(`File updated: ${fileId}`);
      return file;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error in updateFile:', error);
      throw new AppError('Failed to update file', 500);
    }
  }

  /**
   * Supprime un fichier
   */
  async deleteFile(fileId: string, userId: string): Promise<void> {
    try {
      const file = await this.getFileById(fileId, userId);

      // Supprimer du storage
      await storageAdapter.deleteFile(file.storagePath);

      // Supprimer de la DB
      await prisma.file.delete({
        where: { id: fileId },
      });

      logger.info(`File deleted: ${fileId}`);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error in deleteFile:', error);
      throw new AppError('Failed to delete file', 500);
    }
  }
}

export const fileService = new FileService();
