import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config';
import { logger } from '../utils/logger';
import type {
  IAuthProvider,
  AuthUser,
  AuthResult,
  AuthTokens,
  AuthMetadata,
} from './IAuthProvider';

// Type pour les métadonnées utilisateur Supabase
type UserMetadata = Record<string, unknown>;

/**
 * Provider d'authentification Supabase
 *
 * Utilise Supabase Auth pour :
 * - La vérification des tokens JWT
 * - La gestion des utilisateurs
 * - L'inscription et la connexion
 */
export class SupabaseAuthProvider implements IAuthProvider {
  private supabase: SupabaseClient<never, 'public', never>;
  private supabaseAdmin: SupabaseClient<never, 'public', never>;

  constructor() {
    // Client standard pour les opérations utilisateur
    this.supabase = createClient<never, 'public', never>(
      config.supabase.url,
      config.supabase.anonKey
    );

    // Client admin pour les opérations privilégiées
    this.supabaseAdmin = createClient<never, 'public', never>(
      config.supabase.url,
      config.supabase.serviceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }

  /**
   * Vérifie un token JWT Supabase
   */
  async verifyToken(token: string): Promise<AuthUser | null> {
    try {
      const {
        data: { user },
        error,
      } = await this.supabase.auth.getUser(token);

      if (error || !user) {
        logger.debug('Token verification failed:', error?.message);
        return null;
      }

      const metadata = user.user_metadata as UserMetadata;
      return {
        id: user.id,
        email: user.email || '',
        username: metadata?.username as string | undefined,
        emailVerified: user.email_confirmed_at !== null,
        metadata,
      };
    } catch (err) {
      logger.error('Error verifying token:', err);
      return null;
    }
  }

  /**
   * Récupère un utilisateur par son ID via l'API Admin
   */
  async getUser(userId: string): Promise<AuthUser | null> {
    try {
      const {
        data: { user },
        error,
      } = await this.supabaseAdmin.auth.admin.getUserById(userId);

      if (error || !user) {
        return null;
      }

      const metadata = user.user_metadata as UserMetadata;
      return {
        id: user.id,
        email: user.email || '',
        username: metadata?.username as string | undefined,
        emailVerified: user.email_confirmed_at !== null,
        metadata,
      };
    } catch (err) {
      logger.error('Error getting user:', err);
      return null;
    }
  }

  /**
   * Connexion avec email/password via Supabase
   */
  async login(email: string, password: string): Promise<AuthResult> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      logger.warn('Login failed:', error.message);
      throw new Error(error.message);
    }

    if (!data.user || !data.session) {
      throw new Error('Login failed: no user or session returned');
    }

    const userMetadata = data.user.user_metadata as UserMetadata;
    return {
      user: {
        id: data.user.id,
        email: data.user.email || '',
        username: userMetadata?.username as string | undefined,
        emailVerified: data.user.email_confirmed_at !== null,
        metadata: userMetadata,
      },
      tokens: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresIn: data.session.expires_in || 3600,
      },
    };
  }

  /**
   * Inscription d'un nouvel utilisateur via Supabase
   */
  async register(email: string, password: string, metadata?: AuthMetadata): Promise<AuthResult> {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });

    if (error) {
      logger.warn('Registration failed:', error.message);
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('Registration failed: no user returned');
    }

    // Note: Supabase peut ne pas retourner de session si la confirmation email est requise
    const tokens: AuthTokens = data.session
      ? {
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token,
          expiresIn: data.session.expires_in || 3600,
        }
      : {
          accessToken: '',
          expiresIn: 0,
        };

    const userMetadata = data.user.user_metadata as UserMetadata;
    return {
      user: {
        id: data.user.id,
        email: data.user.email || '',
        username: metadata?.username,
        emailVerified: data.user.email_confirmed_at !== null,
        metadata: userMetadata,
      },
      tokens,
    };
  }

  /**
   * Déconnexion (invalide la session Supabase)
   */
  async logout(_token: string): Promise<void> {
    try {
      await this.supabase.auth.signOut();
    } catch (error) {
      logger.error('Error during logout:', error);
      // On ne lance pas d'erreur car la déconnexion côté client suffit
    }
  }

  /**
   * Rafraîchit un token via Supabase
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const { data, error } = await this.supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session) {
      throw new Error(error?.message || 'Failed to refresh token');
    }

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresIn: data.session.expires_in || 3600,
    };
  }
}
