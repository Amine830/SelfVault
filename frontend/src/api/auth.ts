import { supabase } from './supabase';
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
 * Connexion avec Supabase Auth
 */
export const login = async (credentials: LoginCredentials) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });

  if (error) throw error;

  // Stocker le token JWT
  if (data.session?.access_token) {
    localStorage.setItem('token', data.session.access_token);
  }

  return data;
};

/**
 * Inscription avec Supabase Auth
 */
export const register = async (userData: RegisterData) => {
  const { data, error } = await supabase.auth.signUp({
    email: userData.email,
    password: userData.password,
    options: {
      data: {
        username: userData.username,
      },
    },
  });

  if (error) throw error;

  // Stocker le token JWT si la confirmation email n'est pas requise
  if (data.session?.access_token) {
    localStorage.setItem('token', data.session.access_token);
  }

  return data;
};

/**
 * Déconnexion
 */
export const logout = async () => {
  localStorage.removeItem('token');
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
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
  return !!localStorage.getItem('token');
};
