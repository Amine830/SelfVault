import { config } from '../config';
import type { IAuthProvider } from './IAuthProvider';
import { SupabaseAuthProvider } from './SupabaseAuthProvider';
import { LocalAuthProvider } from './LocalAuthProvider';

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
    case 'supabase':
      return new SupabaseAuthProvider();
    case 'local':
      return new LocalAuthProvider();
    default: {
      const exhaustiveCheck: never = provider;
      throw new Error(`Unknown auth provider: ${exhaustiveCheck as string}`);
    }
  }
}

// Export de l'instance singleton
export const authProvider = createAuthProvider();

// Re-export des types et interfaces
export type {
  IAuthProvider,
  AuthUser,
  AuthResult,
  AuthTokens,
  AuthMetadata,
} from './IAuthProvider';
