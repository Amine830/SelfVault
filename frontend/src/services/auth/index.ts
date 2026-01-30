import type { IAuthService, AuthProviderType } from './IAuthService';
import { SupabaseAuthService } from './SupabaseAuthService';
import { LocalAuthService } from './LocalAuthService';
import { apiClient } from '../../api/client';

// Cache pour le provider détecté
let cachedProvider: AuthProviderType | null = null;
let authServiceInstance: IAuthService | null = null;

/**
 * Détecte le provider d'authentification configuré
 * Fait un appel à l'API backend pour connaître le provider
 */
async function detectAuthProvider(): Promise<AuthProviderType> {
  // Utiliser le cache si disponible
  if (cachedProvider) {
    return cachedProvider;
  }

  try {
    const response = await apiClient.get<{ provider: AuthProviderType }>('/auth/provider');
    cachedProvider = response.data.provider;
    return cachedProvider;
  } catch {
    // Par défaut, on utilise 'local' si l'API n'est pas accessible
    // ou si VITE_AUTH_PROVIDER est défini
    const envProvider = import.meta.env.VITE_AUTH_PROVIDER as AuthProviderType | undefined;
    cachedProvider = envProvider || 'supabase';
    return cachedProvider;
  }
}

/**
 * Récupère le provider depuis la variable d'environnement ou le cache
 * Version synchrone pour l'initialisation immédiate
 */
function getAuthProviderSync(): AuthProviderType {
  const envProvider = import.meta.env.VITE_AUTH_PROVIDER as AuthProviderType | undefined;
  return envProvider || cachedProvider || 'supabase';
}

/**
 * Crée le service d'authentification approprié
 */
function createAuthService(provider: AuthProviderType): IAuthService {
  switch (provider) {
    case 'supabase':
      return new SupabaseAuthService();
    case 'local':
      return new LocalAuthService();
    default:
      console.warn(`Unknown auth provider: ${provider}, falling back to local`);
      return new LocalAuthService();
  }
}

/**
 * Récupère l'instance du service d'authentification
 * Crée l'instance si elle n'existe pas encore
 */
export function getAuthService(): IAuthService {
  if (!authServiceInstance) {
    const provider = getAuthProviderSync();
    authServiceInstance = createAuthService(provider);
  }
  return authServiceInstance;
}

/**
 * Initialise le service d'authentification en détectant le provider
 * À appeler au démarrage de l'application pour une détection automatique
 */
export async function initAuthService(): Promise<IAuthService> {
  const provider = await detectAuthProvider();
  authServiceInstance = createAuthService(provider);
  return authServiceInstance;
}

/**
 * Retourne le provider d'authentification actuel
 */
export function getCurrentAuthProvider(): AuthProviderType {
  return getAuthProviderSync();
}

/**
 * Force l'utilisation d'un provider spécifique (utile pour les tests)
 */
export function setAuthProvider(provider: AuthProviderType): void {
  cachedProvider = provider;
  authServiceInstance = createAuthService(provider);
}

// Export singleton par défaut
export const authService = getAuthService();

// Re-export des types
export type { IAuthService, AuthResult, AuthTokens, AuthUser, AuthProviderType } from './IAuthService';
export { SupabaseAuthService } from './SupabaseAuthService';
export { LocalAuthService } from './LocalAuthService';
