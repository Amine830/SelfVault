import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { IStorageAdapter, StorageUploadResult } from './IStorageAdapter';
import { config } from '../config';
import { generateStoragePath, sanitizeFilename } from '../utils/file';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * Adaptateur de stockage S3/MinIO
 * Compatible avec tout service compatible S3 (AWS S3, MinIO, DigitalOcean Spaces, etc.)
 */
export class S3StorageAdapter implements IStorageAdapter {
  private client: S3Client;
  private bucketName: string;

  constructor() {
    this.bucketName = config.s3.bucket;

    this.client = new S3Client({
      region: config.s3.region,
      endpoint: config.s3.endpoint || undefined,
      forcePathStyle: config.s3.forcePathStyle,
      credentials: {
        accessKeyId: config.s3.accessKeyId,
        secretAccessKey: config.s3.secretAccessKey,
      },
    });

    logger.info(`S3 storage adapter initialized for bucket: ${this.bucketName}`);
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

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: storagePath,
        Body: buffer,
        ContentType: mimetype || 'application/octet-stream',
      });

      await this.client.send(command);

      logger.info(`File uploaded to S3: ${storagePath}`);

      return {
        storagePath,
        provider: 's3',
      };
    } catch (error) {
      logger.error('S3 upload error:', error);
      throw new AppError('Failed to upload file to S3', 500);
    }
  }

  async downloadFile(storagePath: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: storagePath,
      });

      const response = await this.client.send(command);

      if (!response.Body) {
        throw new AppError('File not found', 404);
      }

      // Convertir le stream en buffer
      const chunks: Uint8Array[] = [];
      const stream = response.Body as AsyncIterable<Uint8Array>;

      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      return Buffer.concat(chunks);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('S3 download error:', error);
      throw new AppError('Failed to download file from S3', 500);
    }
  }

  async deleteFile(storagePath: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: storagePath,
      });

      await this.client.send(command);

      logger.info(`File deleted from S3: ${storagePath}`);
    } catch (error) {
      logger.error('S3 delete error:', error);
      throw new AppError('Failed to delete file from S3', 500);
    }
  }

  async getSignedUrl(storagePath: string, expiresIn = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: storagePath,
      });

      const url = await getSignedUrl(this.client, command, { expiresIn });

      return url;
    } catch (error) {
      logger.error('S3 signed URL error:', error);
      throw new AppError('Failed to generate signed URL', 500);
    }
  }

  async fileExists(storagePath: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: storagePath,
      });

      await this.client.send(command);
      return true;
    } catch {
      return false;
    }
  }
}
