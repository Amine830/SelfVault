// Types pour l'utilisateur
export interface User {
  id: string;
  email: string;
  username: string | null;
  createdAt: string;
  updatedAt: string;
}

// Types pour les fichiers
export interface File {
  id: string;
  ownerId: string;
  filename: string;
  storagePath: string;
  storageProvider: string;
  mimetype: string | null;
  size: string; // BigInt sérialisé en string
  sha256: string;
  visibility: 'private' | 'public';
  categoryId: number | null;
  createdAt: string | Record<string, never>;
  updatedAt: string | Record<string, never>;
  category: Category | null;
  // Champs de partage
  shareToken?: string | null;
  shareExpiresAt?: string | null;
  shareDownloads?: number;
  shareMaxDownloads?: number | null;
}

// Types pour les catégories
export interface Category {
  id: number;
  ownerId: string;
  name: string;
  color: string;
  createdAt?: string;
  updatedAt?: string;
}

// Types pour les paramètres utilisateur
export interface UserSettings {
  storageLimit: string; // BigInt sérialisé
  preferences: Record<string, unknown>;
}

// Types pour les informations de stockage
export interface StorageInfo {
  used: string; // BigInt sérialisé
  limit: string; // BigInt sérialisé
  percentage: number;
}

// Types pour les réponses API
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
}

// Types pour les requêtes
export interface FileUploadRequest {
  file: File;
  filename?: string;
  categoryId?: number;
  visibility?: 'private' | 'public';
}

export interface CategoryCreateRequest {
  name: string;
  color?: string;
}

export interface FileUpdateRequest {
  filename?: string;
  visibility?: 'private' | 'public';
  categoryId?: number | null;
}

// Types pour le partage
export interface ShareOptions {
  expiresIn?: number; // Durée en secondes
  password?: string;
  maxDownloads?: number;
}

export interface ShareInfo {
  shared: boolean;
  shareToken?: string;
  shareUrl?: string;
  expiresAt?: string | null;
  hasPassword?: boolean;
  maxDownloads?: number | null;
  downloads?: number;
}

export interface PublicFileInfo {
  id: string;
  filename: string;
  mimetype: string | null;
  size: string;
  createdAt: string;
  hasPassword: boolean;
  ownerUsername: string | null;
}
