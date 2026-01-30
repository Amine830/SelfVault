import { authService } from '../services/auth';
import { apiClient } from './client';
import type { User } from '../types';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  username?: string;
}

/**
 * Connexion avec le service d'auth abstrait
 * Utilise automatiquement Supabase ou Local selon la configuration
 */
export const login = async (credentials: LoginCredentials) => {
  const result = await authService.login(credentials.email, credentials.password);
  return {
    user: result.user,
    session: {
      access_token: result.tokens.accessToken,
    },
  };
};

/**
 * Inscription avec le service d'auth abstrait
 */
export const register = async (userData: RegisterData) => {
  const result = await authService.register(
    userData.email,
    userData.password,
    userData.username
  );
  return {
    user: result.user,
    session: result.tokens.accessToken
      ? { access_token: result.tokens.accessToken }
      : null,
    emailVerificationRequired: result.emailVerificationRequired,
  };
};

/**
 * Déconnexion
 */
export const logout = async () => {
  await authService.logout();
};

/**
 * Récupérer le profil utilisateur depuis notre API
 */
export const getCurrentUser = async (): Promise<User> => {
  const response = await apiClient.get<{ user: User }>('/me');
  return response.data.user;
};

/**
 * Vérifier si l'utilisateur est authentifié
 */
export const isAuthenticated = (): boolean => {
  return authService.isAuthenticated();
};

/**
 * Récupérer le token d'accès actuel
 */
export const getAccessToken = (): string | null => {
  return authService.getAccessToken();
};

