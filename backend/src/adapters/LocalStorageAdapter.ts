import { promises as fs } from 'fs';
import path from 'path';
import { IStorageAdapter, StorageUploadResult } from './IStorageAdapter';
import { config } from '../config';
import { generateStoragePath, sanitizeFilename, ensureDirectory } from '../utils/file';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * Adaptateur de stockage local (filesystem)
 * Pour fallback ou déploiement sans cloud storage
 */
export class LocalStorageAdapter implements IStorageAdapter {
  private basePath: string;

  constructor() {
    this.basePath = path.resolve(config.storage.localPath);
    this.initStorage().catch((error) => {
      logger.error('Failed to initialize local storage:', error);
    });
  }

  private async initStorage(): Promise<void> {
    await ensureDirectory(this.basePath);
    logger.info(`Local storage initialized at: ${this.basePath}`);
  }

  async uploadFile(
    userId: string,
    filename: string,
    buffer: Buffer,
    _mimetype?: string
  ): Promise<StorageUploadResult> {
    try {
      const sanitizedFilename = sanitizeFilename(filename);
      const storagePath = generateStoragePath(userId, sanitizedFilename);
      const fullPath = path.join(this.basePath, storagePath);

      await ensureDirectory(path.dirname(fullPath));
      await fs.writeFile(fullPath, buffer);

      logger.info(`File uploaded locally: ${storagePath}`);

      return {
        storagePath,
        provider: 'local',
      };
    } catch (error) {
      logger.error('Local upload error:', error);
      throw new AppError('Failed to upload file locally', 500);
    }
  }

  async downloadFile(storagePath: string): Promise<Buffer> {
    try {
      const fullPath = path.join(this.basePath, storagePath);
      return await fs.readFile(fullPath);
    } catch (error) {
      logger.error('Local download error:', error);
      throw new AppError('Failed to download file', 404);
    }
  }

  async deleteFile(storagePath: string): Promise<void> {
    try {
      const fullPath = path.join(this.basePath, storagePath);
      await fs.unlink(fullPath);
      logger.info(`File deleted locally: ${storagePath}`);
    } catch (error) {
      logger.error('Local delete error:', error);
      throw new AppError('Failed to delete file', 500);
    }
  }

  getSignedUrl(storagePath: string, _expiresIn = 3600): Promise<string> {
    // Pour le stockage local, on retourne simplement l'URL de l'API
    // qui servira le fichier après vérification de l'authentification
    return Promise.resolve(`/api/files/download/${encodeURIComponent(storagePath)}`);
  }

  async fileExists(storagePath: string): Promise<boolean> {
    try {
      const fullPath = path.join(this.basePath, storagePath);
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }
}
