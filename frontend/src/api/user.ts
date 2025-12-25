import { apiClient } from './client';
import type { User, UserSettings } from '../types';

export interface UpdateProfilePayload {
  username?: string | null;
}

export interface UpdateSettingsPayload {
  storageLimit?: string | number;
  preferences?: Record<string, unknown>;
}

export const updateProfile = async (data: UpdateProfilePayload): Promise<User> => {
  const response = await apiClient.patch<{ user: User }>('/me', data);
  return response.data.user;
};

export const getSettings = async (): Promise<UserSettings> => {
  const response = await apiClient.get<{ settings: UserSettings }>('/settings');
  return response.data.settings;
};

export const updateSettings = async (data: UpdateSettingsPayload): Promise<UserSettings> => {
  const response = await apiClient.patch<{ settings: UserSettings }>('/settings', data);
  return response.data.settings;
};
