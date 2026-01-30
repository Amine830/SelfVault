import { apiClient } from '../../api/client';
import type { IAuthService, AuthResult, AuthTokens, AuthUser } from './IAuthService';

const TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refreshToken';

/**
 * Service d'authentification local
 *
 * Utilise l'API backend pour l'authentification autonome :
 * - Pas de dépendance à Supabase
 * - JWT généré par le backend
 * - Idéal pour les déploiements MySQL + MinIO ou Postgres standalone
 */
export class LocalAuthService implements IAuthService {
  /**
   * Connexion via l'API backend
   */
  async login(email: string, password: string): Promise<AuthResult> {
    const response = await apiClient.post<{
      success: boolean;
      user: AuthUser;
      tokens: AuthTokens;
    }>('/auth/login', { email, password });

    const { user, tokens } = response.data;

    // Stocker les tokens
    localStorage.setItem(TOKEN_KEY, tokens.accessToken);
    if (tokens.refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    }

    return { user, tokens };
  }

  /**
   * Inscription via l'API backend
   */
  async register(email: string, password: string, username?: string): Promise<AuthResult> {
    const response = await apiClient.post<{
      success: boolean;
      user: AuthUser;
      tokens: AuthTokens;
      emailVerificationRequired?: boolean;
    }>('/auth/register', { email, password, username });

    const { user, tokens, emailVerificationRequired } = response.data;

    // Stocker les tokens si présents
    if (tokens.accessToken) {
      localStorage.setItem(TOKEN_KEY, tokens.accessToken);
      if (tokens.refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
      }
    }

    return { user, tokens, emailVerificationRequired };
  }

  /**
   * Déconnexion
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignorer les erreurs, on déconnecte quand même côté client
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  /**
   * Récupère le token d'accès
   */
  getAccessToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  /**
   * Vérifie si l'utilisateur est authentifié
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem(TOKEN_KEY);
  }

  /**
   * Rafraîchit le token via l'API backend
   */
  async refreshToken(): Promise<AuthTokens> {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiClient.post<{
      success: boolean;
      tokens: AuthTokens;
    }>('/auth/refresh', { refreshToken });

    const { tokens } = response.data;

    localStorage.setItem(TOKEN_KEY, tokens.accessToken);
    if (tokens.refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    }

    return tokens;
  }

  /**
   * Pas de listener d'état en mode local (stateless)
   * Le frontend doit gérer l'état manuellement
   */
  onAuthStateChange(_callback: (user: AuthUser | null) => void): () => void {
    // En mode local, pas de listener automatique
    // Retourne une fonction de cleanup vide
    return () => {};
  }
}
