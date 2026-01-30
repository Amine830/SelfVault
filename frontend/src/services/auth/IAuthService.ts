/**
 * Interface pour les services d'authentification frontend
 * Permet de changer facilement de provider (Supabase, Local, etc.)
 *
 * Philosophie BYOI :
 * Le frontend ne doit pas dépendre directement d'un fournisseur d'authentification.
 */

export interface IAuthService {
  /**
   * Connexion avec email/password
   */
  login(email: string, password: string): Promise<AuthResult>;

  /**
   * Inscription d'un nouvel utilisateur
   */
  register(email: string, password: string, username?: string): Promise<AuthResult>;

  /**
   * Déconnexion
   */
  logout(): Promise<void>;

  /**
   * Récupère le token d'accès actuel (depuis le stockage local)
   */
  getAccessToken(): string | null;

  /**
   * Vérifie si l'utilisateur est authentifié
   */
  isAuthenticated(): boolean;

  /**
   * Rafraîchit le token d'accès (si supporté)
   */
  refreshToken?(): Promise<AuthTokens>;

  /**
   * Écoute les changements d'état d'authentification
   */
  onAuthStateChange?(callback: (user: AuthUser | null) => void): () => void;
}

/**
 * Résultat d'une authentification
 */
export interface AuthResult {
  user: AuthUser;
  tokens: AuthTokens;
  emailVerificationRequired?: boolean;
}

/**
 * Informations utilisateur
 */
export interface AuthUser {
  id: string;
  email: string;
  username?: string;
}

/**
 * Tokens d'authentification
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

/**
 * Type du provider d'authentification
 */
export type AuthProviderType = 'supabase' | 'local';
