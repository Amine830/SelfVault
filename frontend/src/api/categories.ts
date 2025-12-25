import { apiClient } from './client';
import type { Category, CategoryCreateRequest } from '../types';

/**
 * Liste les catégories
 */
export const listCategories = async (): Promise<Category[]> => {
  const response = await apiClient.get<{ categories: Category[] }>('/categories');
  return response.data.categories;
};

/**
 * Crée une catégorie
 */
export const createCategory = async (data: CategoryCreateRequest): Promise<Category> => {
  const response = await apiClient.post<{ category: Category }>('/categories', data);
  return response.data.category;
};

/**
 * Récupère une catégorie par ID
 */
export const getCategory = async (id: number): Promise<Category> => {
  const response = await apiClient.get<{ category: Category }>(`/categories/${id}`);
  return response.data.category;
};

/**
 * Met à jour une catégorie
 */
export const updateCategory = async (
  id: number,
  data: Partial<CategoryCreateRequest>
): Promise<Category> => {
  const response = await apiClient.patch<{ category: Category }>(`/categories/${id}`, data);
  return response.data.category;
};

/**
 * Supprime une catégorie
 */
export const deleteCategory = async (id: number): Promise<void> => {
  await apiClient.delete(`/categories/${id}`);
};
