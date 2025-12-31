import { randomBytes } from 'crypto';
import { prisma } from '../database/client';
import { storageAdapter } from '../adapters';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

interface ShareOptions {
  expiresIn?: number; // Durée en secondes (null = permanent)
  password?: string; // Mot de passe optionnel
  maxDownloads?: number; // Nombre max de téléchargements
}

interface ShareInfo {
  shareToken: string;
  shareUrl: string;
  expiresAt: Date | null;
  hasPassword: boolean;
  maxDownloads: number | null;
  downloads: number;
}

interface PublicFileInfo {
  id: string;
  filename: string;
  mimetype: string | null;
  size: string;
  createdAt: Date;
  hasPassword: boolean;
  ownerUsername: string | null;
}

/**
 * Service pour gérer le partage de fichiers
 */
export class ShareService {
  /**
   * Génère un token de partage unique
   */
  private generateShareToken(): string {
    return randomBytes(32).toString('base64url');
  }

  /**
   * Construit l'URL de partage
   */
  private buildShareUrl(token: string): string {
    const baseUrl = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:5173';
    return `${baseUrl}/share/${token}`;
  }

  /**
   * Crée ou met à jour un lien de partage pour un fichier
   */
  async createShareLink(
    fileId: string,
    userId: string,
    options: ShareOptions = {}
  ): Promise<ShareInfo> {
    try {
      // Vérifier que le fichier appartient à l'utilisateur
      const file = await prisma.file.findFirst({
        where: { id: fileId, ownerId: userId },
      });

      if (!file) {
        throw new AppError('File not found', 404);
      }

      const shareToken = this.generateShareToken();
      const expiresAt = options.expiresIn ? new Date(Date.now() + options.expiresIn * 1000) : null;

      // Mettre à jour le fichier avec les infos de partage
      await prisma.file.update({
        where: { id: fileId },
        data: {
          visibility: 'public',
          shareToken,
          shareExpiresAt: expiresAt,
          sharePassword: options.password || null,
          shareMaxDownloads: options.maxDownloads || null,
          shareDownloads: 0,
        },
      });

      logger.info(`Share link created for file ${fileId} by user ${userId}`);

      return {
        shareToken,
        shareUrl: this.buildShareUrl(shareToken),
        expiresAt,
        hasPassword: !!options.password,
        maxDownloads: options.maxDownloads || null,
        downloads: 0,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error in createShareLink:', error);
      throw new AppError('Failed to create share link', 500);
    }
  }

  /**
   * Obtient les infos de partage d'un fichier
   */
  async getShareInfo(fileId: string, userId: string): Promise<ShareInfo | null> {
    try {
      const file = await prisma.file.findFirst({
        where: { id: fileId, ownerId: userId },
      });

      if (!file) {
        throw new AppError('File not found', 404);
      }

      if (!file.shareToken) {
        return null;
      }

      return {
        shareToken: file.shareToken,
        shareUrl: this.buildShareUrl(file.shareToken),
        expiresAt: file.shareExpiresAt,
        hasPassword: !!file.sharePassword,
        maxDownloads: file.shareMaxDownloads,
        downloads: file.shareDownloads,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error in getShareInfo:', error);
      throw new AppError('Failed to get share info', 500);
    }
  }

  /**
   * Supprime le partage d'un fichier
   */
  async revokeShareLink(fileId: string, userId: string): Promise<void> {
    try {
      const file = await prisma.file.findFirst({
        where: { id: fileId, ownerId: userId },
      });

      if (!file) {
        throw new AppError('File not found', 404);
      }

      await prisma.file.update({
        where: { id: fileId },
        data: {
          visibility: 'private',
          shareToken: null,
          shareExpiresAt: null,
          sharePassword: null,
          shareMaxDownloads: null,
          shareDownloads: 0,
        },
      });

      logger.info(`Share link revoked for file ${fileId}`);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error in revokeShareLink:', error);
      throw new AppError('Failed to revoke share link', 500);
    }
  }

  /**
   * Récupère les infos publiques d'un fichier partagé (par token)
   */
  async getPublicFileInfo(shareToken: string): Promise<PublicFileInfo> {
    try {
      const file = await prisma.file.findUnique({
        where: { shareToken },
        include: { owner: { select: { username: true } } },
      });

      if (!file) {
        throw new AppError('Share link not found or expired', 404);
      }

      // Vérifier l'expiration
      if (file.shareExpiresAt && file.shareExpiresAt < new Date()) {
        throw new AppError('Share link has expired', 410);
      }

      // Vérifier le nombre de téléchargements
      if (file.shareMaxDownloads && file.shareDownloads >= file.shareMaxDownloads) {
        throw new AppError('Download limit reached', 410);
      }

      return {
        id: file.id,
        filename: file.filename,
        mimetype: file.mimetype,
        size: file.size.toString(),
        createdAt: file.createdAt,
        hasPassword: !!file.sharePassword,
        ownerUsername: file.owner.username,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error in getPublicFileInfo:', error);
      throw new AppError('Failed to get public file info', 500);
    }
  }

  /**
   * Télécharge un fichier partagé
   */
  async downloadSharedFile(
    shareToken: string,
    password?: string
  ): Promise<{
    buffer: Buffer;
    filename: string;
    mimetype: string | null;
  }> {
    try {
      const file = await prisma.file.findUnique({
        where: { shareToken },
      });

      if (!file) {
        throw new AppError('Share link not found', 404);
      }

      // Vérifier l'expiration
      if (file.shareExpiresAt && file.shareExpiresAt < new Date()) {
        throw new AppError('Share link has expired', 410);
      }

      // Vérifier le nombre de téléchargements
      if (file.shareMaxDownloads && file.shareDownloads >= file.shareMaxDownloads) {
        throw new AppError('Download limit reached', 410);
      }

      // Vérifier le mot de passe
      if (file.sharePassword && file.sharePassword !== password) {
        throw new AppError('Invalid password', 401);
      }

      // Incrémenter le compteur de téléchargements
      await prisma.file.update({
        where: { id: file.id },
        data: { shareDownloads: file.shareDownloads + 1 },
      });

      // Télécharger depuis le storage
      const buffer = await storageAdapter.downloadFile(file.storagePath);

      logger.info(`Shared file downloaded: ${file.id} via token`);

      return {
        buffer,
        filename: file.filename,
        mimetype: file.mimetype,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error in downloadSharedFile:', error);
      throw new AppError('Failed to download shared file', 500);
    }
  }

  /**
   * Liste les fichiers publics (sans authentification)
   * Uniquement les fichiers publics sans expiration et sans mot de passe
   */
  async listPublicFiles(options: { page?: number; limit?: number } = {}): Promise<{
    files: PublicFileInfo[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const page = options.page || 1;
      const limit = Math.min(options.limit || 20, 100);
      const skip = (page - 1) * limit;

      const where = {
        visibility: 'public',
        shareToken: { not: null },
        OR: [{ shareExpiresAt: null }, { shareExpiresAt: { gt: new Date() } }],
        sharePassword: null, // Seulement les fichiers sans mot de passe
      };

      const [files, total] = await Promise.all([
        prisma.file.findMany({
          where,
          include: { owner: { select: { username: true } } },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.file.count({ where }),
      ]);

      return {
        files: files.map((f) => ({
          id: f.id,
          filename: f.filename,
          mimetype: f.mimetype,
          size: f.size.toString(),
          createdAt: f.createdAt,
          hasPassword: false,
          ownerUsername: f.owner.username,
        })),
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error('Error in listPublicFiles:', error);
      throw new AppError('Failed to list public files', 500);
    }
  }

  /**
   * Génère une URL signée pour un fichier partagé
   */
  async getSharedFileUrl(shareToken: string, password?: string, expiresIn = 3600): Promise<string> {
    try {
      const file = await prisma.file.findUnique({
        where: { shareToken },
      });

      if (!file) {
        throw new AppError('Share link not found', 404);
      }

      // Vérifier l'expiration
      if (file.shareExpiresAt && file.shareExpiresAt < new Date()) {
        throw new AppError('Share link has expired', 410);
      }

      // Vérifier le mot de passe
      if (file.sharePassword && file.sharePassword !== password) {
        throw new AppError('Invalid password', 401);
      }

      return await storageAdapter.getSignedUrl(file.storagePath, expiresIn);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error in getSharedFileUrl:', error);
      throw new AppError('Failed to generate download URL', 500);
    }
  }
}

export const shareService = new ShareService();
