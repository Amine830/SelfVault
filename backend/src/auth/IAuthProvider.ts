/**
 * Interface pour les providers d'authentification
 * Permet de changer facilement de provider (Supabase, Local, Keycloak, etc.)
 *
 * Philosophie BYOI (Bring Your Own Infrastructure) :
 * L'authentification ne doit JAMAIS dépendre directement d'un fournisseur.
 * Supabase, Keycloak, Auth0, ou un auth "maison" doivent être interchangeables.
 */
export interface IAuthProvider {
  /**
   * Vérifie un token JWT et retourne les informations utilisateur
   */
  verifyToken(token: string): Promise<AuthUser | null>;

  /**
   * Récupère un utilisateur par son ID
   */
  getUser(userId: string): Promise<AuthUser | null>;

  /**
   * Connexion avec email/password
   * Retourne les tokens et informations utilisateur
   */
  login(email: string, password: string): Promise<AuthResult>;

  /**
   * Inscription d'un nouvel utilisateur
   */
  register(email: string, password: string, metadata?: AuthMetadata): Promise<AuthResult>;

  /**
   * Déconnexion (invalide le token si possible)
   */
  logout(token: string): Promise<void>;

  /**
   * Rafraîchit un token expiré (si supporté par le provider)
   */
  refreshToken?(refreshToken: string): Promise<AuthTokens>;
}

/**
 * Informations de l'utilisateur authentifié
 */
export interface AuthUser {
  id: string;
  email: string;
  username?: string;
  emailVerified?: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * Résultat d'une authentification (login/register)
 */
export interface AuthResult {
  user: AuthUser;
  tokens: AuthTokens;
}

/**
 * Tokens d'authentification
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number; // en secondes
}

/**
 * Métadonnées optionnelles lors de l'inscription
 */
export interface AuthMetadata {
  username?: string;
  [key: string]: unknown;
}
