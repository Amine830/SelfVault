import { IStorageAdapter } from './IStorageAdapter';
import { SupabaseStorageAdapter } from './SupabaseStorageAdapter';
import { LocalStorageAdapter } from './LocalStorageAdapter';
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
      // TODO: Implémenter S3StorageAdapter
      throw new Error('S3 storage adapter not implemented yet');
    default:
      throw new Error('Unknown storage provider: ' + String(config.storage.provider));
  }
}

export const storageAdapter = createStorageAdapter();
