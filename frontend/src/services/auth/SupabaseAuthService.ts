import { supabase } from '../../api/supabase';
import type { IAuthService, AuthResult, AuthTokens, AuthUser } from './IAuthService';

const TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refreshToken';

/**
 * Service d'authentification Supabase
 *
 * Utilise le SDK Supabase côté client pour :
 * - L'inscription et la connexion
 * - La gestion des sessions
 * - Le rafraîchissement automatique des tokens
 */
export class SupabaseAuthService implements IAuthService {
  /**
   * Connexion avec email/password via Supabase
   */
  async login(email: string, password: string): Promise<AuthResult> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user || !data.session) {
      throw new Error('Login failed: no user or session returned');
    }

    // Stocker les tokens
    localStorage.setItem(TOKEN_KEY, data.session.access_token);
    if (data.session.refresh_token) {
      localStorage.setItem(REFRESH_TOKEN_KEY, data.session.refresh_token);
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email || '',
        username: data.user.user_metadata?.username,
      },
      tokens: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresIn: data.session.expires_in || 3600,
      },
    };
  }

  /**
   * Inscription via Supabase
   */
  async register(email: string, password: string, username?: string): Promise<AuthResult> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('Registration failed: no user returned');
    }

    // Note: Supabase peut ne pas retourner de session si la confirmation email est requise
    const hasSession = !!data.session;

    if (hasSession && data.session) {
      localStorage.setItem(TOKEN_KEY, data.session.access_token);
      if (data.session.refresh_token) {
        localStorage.setItem(REFRESH_TOKEN_KEY, data.session.refresh_token);
      }
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email || '',
        username,
      },
      tokens: data.session
        ? {
            accessToken: data.session.access_token,
            refreshToken: data.session.refresh_token,
            expiresIn: data.session.expires_in || 3600,
          }
        : {
            accessToken: '',
            expiresIn: 0,
          },
      emailVerificationRequired: !hasSession,
    };
  }

  /**
   * Déconnexion
   */
  async logout(): Promise<void> {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    await supabase.auth.signOut();
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
   * Rafraîchit le token via Supabase
   */
  async refreshToken(): Promise<AuthTokens> {
    const { data, error } = await supabase.auth.refreshSession();

    if (error || !data.session) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      throw new Error(error?.message || 'Failed to refresh token');
    }

    localStorage.setItem(TOKEN_KEY, data.session.access_token);
    if (data.session.refresh_token) {
      localStorage.setItem(REFRESH_TOKEN_KEY, data.session.refresh_token);
    }

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresIn: data.session.expires_in || 3600,
    };
  }

  /**
   * Écoute les changements d'état d'authentification
   */
  onAuthStateChange(callback: (user: AuthUser | null) => void): () => void {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        // Mettre à jour le token stocké
        localStorage.setItem(TOKEN_KEY, session.access_token);
        if (session.refresh_token) {
          localStorage.setItem(REFRESH_TOKEN_KEY, session.refresh_token);
        }

        callback({
          id: session.user.id,
          email: session.user.email || '',
          username: session.user.user_metadata?.username,
        });
      } else {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        callback(null);
      }
    });

    return () => subscription.unsubscribe();
  }
}
