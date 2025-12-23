/**
 * Interface pour les adaptateurs de stockage
 * Permet de changer facilement de provider (Supabase, S3, local, etc.)
 */
export interface IStorageAdapter {
  /**
   * Upload un fichier vers le stockage
   */
  uploadFile(
    userId: string,
    filename: string,
    buffer: Buffer,
    mimetype?: string
  ): Promise<StorageUploadResult>;

  /**
   * Télécharge un fichier depuis le stockage
   */
  downloadFile(storagePath: string): Promise<Buffer>;

  /**
   * Supprime un fichier du stockage
   */
  deleteFile(storagePath: string): Promise<void>;

  /**
   * Génère une URL signée pour téléchargement temporaire
   */
  getSignedUrl(storagePath: string, expiresIn?: number): Promise<string>;

  /**
   * Vérifie si un fichier existe
   */
  fileExists(storagePath: string): Promise<boolean>;
}

export interface StorageUploadResult {
  storagePath: string;
  url?: string;
  provider: string;
}
