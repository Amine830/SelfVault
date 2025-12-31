import { apiClient } from './client';
import type { User, UserSettings, StorageInfo } from '../types';

export interface UpdateProfilePayload {
  username?: string | null;
}

export interface UpdateSettingsPayload {
  storageLimit?: string | number;
  preferences?: Record<string, unknown>;
}

export interface MeResponse {
  user: User;
  storage: StorageInfo;
}

export const getMe = async (): Promise<MeResponse> => {
  const response = await apiClient.get<MeResponse>('/me');
  return response.data;
};

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
