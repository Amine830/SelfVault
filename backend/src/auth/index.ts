import { config } from '../config';
import type { IAuthProvider } from './IAuthProvider';

export type AuthProviderType = 'supabase' | 'local';

/**
 * Factory pour créer le provider d'authentification approprié
 * selon la configuration (AUTH_PROVIDER dans .env)
 *
 * Philosophie BYOI :
 * - supabase : Utilise Supabase Auth (par défaut en V1)
 * - local : Authentification autonome (JWT + bcrypt)
 */
export function createAuthProvider(): IAuthProvider {
  const provider = config.auth.provider;

  switch (provider) {
    case 'supabase': {
      // Import dynamique pour éviter de charger Supabase si non utilisé
      const { SupabaseAuthProvider } = require('./SupabaseAuthProvider');
      return new SupabaseAuthProvider();
    }
    case 'local': {
      const { LocalAuthProvider } = require('./LocalAuthProvider');
      return new LocalAuthProvider();
    }
    default:
      throw new Error(`Unknown auth provider: ${provider}`);
  }
}

// Export de l'instance singleton
export const authProvider = createAuthProvider();

// Re-export des types et interfaces
export type { IAuthProvider, AuthUser, AuthResult, AuthTokens, AuthMetadata } from './IAuthProvider';
