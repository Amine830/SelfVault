import { apiClient } from './client';
import type { File, FileUpdateRequest } from '../types';

export interface FileListParams {
  page?: number;
  limit?: number;
  categoryId?: number;
  search?: string;
}

export interface FileListResponse {
  files: File[];
  total: number;
  page: number;
  totalPages: number;
}

/**
 * Upload un fichier
 */
export const uploadFile = async (
  file: globalThis.File,
  options?: {
    filename?: string;
    categoryId?: number;
    visibility?: 'private' | 'public';
  }
): Promise<File> => {
  const formData = new FormData();
  formData.append('file', file);
  
  if (options?.filename) {
    formData.append('filename', options.filename);
  }
  if (options?.categoryId) {
    formData.append('categoryId', options.categoryId.toString());
  }
  if (options?.visibility) {
    formData.append('visibility', options.visibility);
  }

  const response = await apiClient.post<{ file: File }>('/files/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data.file;
};

/**
 * Liste les fichiers
 */
export const listFiles = async (params?: FileListParams): Promise<FileListResponse> => {
  const response = await apiClient.get<FileListResponse>('/files', { params });
  return response.data;
};

/**
 * Récupère un fichier par ID
 */
export const getFile = async (id: string): Promise<File> => {
  const response = await apiClient.get<{ file: File }>(`/files/${id}`);
  return response.data.file;
};

/**
 * Télécharge un fichier
 */
export const downloadFile = async (id: string, filename: string): Promise<void> => {
  const response = await apiClient.get(`/files/${id}/download`, {
    responseType: 'blob',
  });

  // Créer un lien de téléchargement
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

/**
 * Obtenir une URL signée pour un fichier
 */
export const getFileUrl = async (id: string): Promise<{ url: string; expiresIn: number }> => {
  const response = await apiClient.get<{ url: string; expiresIn: number }>(`/files/${id}/url`);
  return response.data;
};

/**
 * Met à jour un fichier
 */
export const updateFile = async (id: string, data: FileUpdateRequest): Promise<File> => {
  const response = await apiClient.patch<{ file: File }>(`/files/${id}`, data);
  return response.data.file;
};

/**
 * Supprime un fichier
 */
export const deleteFile = async (id: string): Promise<void> => {
  await apiClient.delete(`/files/${id}`);
};
