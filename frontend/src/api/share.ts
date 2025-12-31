import { apiClient } from './client';
import type { ShareInfo, ShareOptions, PublicFileInfo } from '../types';

/**
 * Crée un lien de partage pour un fichier
 */
export const createShareLink = async (fileId: string, options?: ShareOptions): Promise<ShareInfo> => {
  const response = await apiClient.post<Omit<ShareInfo, 'shared'>>(`/files/${fileId}/share`, options || {});
  return { shared: true, ...response.data };
};

/**
 * Récupère les infos de partage d'un fichier
 */
export const getShareInfo = async (fileId: string): Promise<ShareInfo> => {
  const response = await apiClient.get<ShareInfo>(`/files/${fileId}/share`);
  return response.data;
};

/**
 * Révoque le partage d'un fichier
 */
export const revokeShareLink = async (fileId: string): Promise<void> => {
  await apiClient.delete(`/files/${fileId}/share`);
};

/**
 * Récupère les infos publiques d'un fichier partagé (par token)
 * Endpoint public - pas besoin d'authentification
 */
export const getPublicFileInfo = async (shareToken: string): Promise<PublicFileInfo> => {
  const response = await apiClient.get<PublicFileInfo>(`/share/${shareToken}`);
  return response.data;
};

/**
 * Télécharge un fichier partagé
 * Endpoint public - pas besoin d'authentification
 */
export const downloadSharedFile = async (shareToken: string, password?: string): Promise<void> => {
  const params = password ? { password } : {};
  const response = await apiClient.get(`/share/${shareToken}/download`, {
    params,
    responseType: 'blob',
  });

  // Récupérer le nom du fichier depuis le header Content-Disposition
  const contentDisposition = response.headers['content-disposition'];
  let filename = 'download';
  if (contentDisposition) {
    const match = contentDisposition.match(/filename="(.+)"/);
    if (match) {
      filename = decodeURIComponent(match[1]);
    }
  }

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
 * Télécharge un fichier partagé avec mot de passe (via POST)
 * Endpoint public - pas besoin d'authentification
 */
export const downloadSharedFileWithPassword = async (
  shareToken: string,
  password: string
): Promise<void> => {
  const response = await apiClient.post(
    `/share/${shareToken}/download`,
    { password },
    { responseType: 'blob' }
  );

  // Récupérer le nom du fichier depuis le header Content-Disposition
  const contentDisposition = response.headers['content-disposition'];
  let filename = 'download';
  if (contentDisposition) {
    const match = contentDisposition.match(/filename="(.+)"/);
    if (match) {
      filename = decodeURIComponent(match[1]);
    }
  }

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
 * Obtient une URL signée pour un fichier partagé
 * Endpoint public - pas besoin d'authentification
 */
export const getSharedFileUrl = async (
  shareToken: string,
  password?: string
): Promise<{ url: string; expiresIn: number }> => {
  const params = password ? { password } : {};
  const response = await apiClient.get<{ url: string; expiresIn: number }>(
    `/share/${shareToken}/url`,
    { params }
  );
  return response.data;
};

/**
 * Liste les fichiers publics
 * Endpoint public - pas besoin d'authentification
 */
export const listPublicFiles = async (params?: {
  page?: number;
  limit?: number;
}): Promise<{
  files: PublicFileInfo[];
  total: number;
  page: number;
  totalPages: number;
}> => {
  const response = await apiClient.get('/public/files', { params });
  return response.data;
};
