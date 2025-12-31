import { IStorageAdapter } from './IStorageAdapter';
import { SupabaseStorageAdapter } from './SupabaseStorageAdapter';
import { LocalStorageAdapter } from './LocalStorageAdapter';
import { S3StorageAdapter } from './S3StorageAdapter';
import { config } from '../config';

/**
 * Factory pour créer l'adaptateur de stockage approprié
 * selon la configuration
 */
export function createStorageAdapter(): IStorageAdapter {
  switch (config.storage.provider) {
    case 'supabase':
      return new SupabaseStorageAdapter();
    case 'local':
      return new LocalStorageAdapter();
    case 's3':
      return new S3StorageAdapter();
    default:
      throw new Error('Unknown storage provider: ' + String(config.storage.provider));
  }
}

export const storageAdapter = createStorageAdapter();
