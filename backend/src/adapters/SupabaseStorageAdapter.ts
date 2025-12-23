import { createClient } from '@supabase/supabase-js';
import { IStorageAdapter, StorageUploadResult } from './IStorageAdapter';
import { config } from '../config';
import { generateStoragePath, sanitizeFilename } from '../utils/file';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * Adaptateur de stockage pour Supabase Storage
 * Utilise le service role key pour les opérations côté serveur
 */
export class SupabaseStorageAdapter implements IStorageAdapter {
  private client: ReturnType<typeof createClient>;
  private bucketName = 'files';

  constructor() {
    this.client = createClient(config.supabase.url, config.supabase.serviceKey, {
      auth: {
        persistSession: false,
      },
    });
  }

  async uploadFile(
    userId: string,
    filename: string,
    buffer: Buffer,
    mimetype?: string
  ): Promise<StorageUploadResult> {
    try {
      const sanitizedFilename = sanitizeFilename(filename);
      const storagePath = generateStoragePath(userId, sanitizedFilename);

      const { data, error } = await this.client.storage
        .from(this.bucketName)
        .upload(storagePath, buffer, {
          contentType: mimetype,
          upsert: false,
        });

      if (error) {
        logger.error('Supabase upload error:', error);
        throw new AppError(`Failed to upload file: ${error.message}`, 500);
      }

      logger.info(`File uploaded successfully: ${data.path}`);

      return {
        storagePath: data.path,
        provider: 'supabase',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Upload error:', error);
      throw new AppError('Failed to upload file', 500);
    }
  }

  async downloadFile(storagePath: string): Promise<Buffer> {
    try {
      const { data, error } = await this.client.storage.from(this.bucketName).download(storagePath);

      if (error) {
        logger.error('Supabase download error:', error);
        throw new AppError(`Failed to download file: ${error.message}`, 500);
      }

      const arrayBuffer = await data.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Download error:', error);
      throw new AppError('Failed to download file', 500);
    }
  }

  async deleteFile(storagePath: string): Promise<void> {
    try {
      const { error } = await this.client.storage.from(this.bucketName).remove([storagePath]);

      if (error) {
        logger.error('Supabase delete error:', error);
        throw new AppError(`Failed to delete file: ${error.message}`, 500);
      }

      logger.info(`File deleted successfully: ${storagePath}`);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Delete error:', error);
      throw new AppError('Failed to delete file', 500);
    }
  }

  async getSignedUrl(storagePath: string, expiresIn = 3600): Promise<string> {
    try {
      const { data, error } = await this.client.storage
        .from(this.bucketName)
        .createSignedUrl(storagePath, expiresIn);

      if (error) {
        logger.error('Supabase signed URL error:', error);
        throw new AppError(`Failed to generate signed URL: ${error.message}`, 500);
      }

      return data.signedUrl;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Signed URL error:', error);
      throw new AppError('Failed to generate signed URL', 500);
    }
  }

  async fileExists(storagePath: string): Promise<boolean> {
    try {
      const { data, error } = await this.client.storage
        .from(this.bucketName)
        .list(storagePath.substring(0, storagePath.lastIndexOf('/')), {
          search: storagePath.substring(storagePath.lastIndexOf('/') + 1),
        });

      if (error) {
        return false;
      }

      return data.length > 0;
    } catch {
      return false;
    }
  }
}
