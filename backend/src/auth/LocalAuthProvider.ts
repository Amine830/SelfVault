import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../database/client';
import { config } from '../config';
import { logger } from '../utils/logger';
import type {
  IAuthProvider,
  AuthUser,
  AuthResult,
  AuthTokens,
  AuthMetadata,
} from './IAuthProvider';

// Constantes de configuration
const SALT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRY = '1h';
const REFRESH_TOKEN_EXPIRY = '7d';
const ACCESS_TOKEN_EXPIRY_SECONDS = 3600;

/**
 * Provider d'authentification local
 *
 * Gère l'authentification de manière autonome sans dépendance externe :
 * - Stockage des utilisateurs dans la base de données locale (Prisma)
 * - Hashage des mots de passe avec bcrypt
 * - Génération des JWT par le backend lui-même
 *
 * Idéal pour les déploiements sans Supabase (MySQL + MinIO, Postgres standalone, etc.)
 */
export class LocalAuthProvider implements IAuthProvider {
  /**
   * Vérifie un token JWT local
   */
  async verifyToken(token: string): Promise<AuthUser | null> {
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as {
        userId: string;
        email: string;
        type?: string;
      };

      // Vérifier que c'est un access token
      if (decoded.type && decoded.type !== 'access') {
        return null;
      }

      // Vérifier que l'utilisateur existe toujours
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        username: user.username || undefined,
        emailVerified: true, // En local, pas de vérification email par défaut
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        logger.debug('Token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        logger.debug('Invalid token:', error.message);
      } else {
        logger.error('Error verifying token:', error);
      }
      return null;
    }
  }

  /**
   * Récupère un utilisateur par son ID
   */
  async getUser(userId: string): Promise<AuthUser | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        username: user.username || undefined,
        emailVerified: true,
      };
    } catch (error) {
      logger.error('Error getting user:', error);
      return null;
    }
  }

  /**
   * Connexion avec email/password
   */
  async login(email: string, password: string): Promise<AuthResult> {
    // Rechercher l'utilisateur avec son hash de mot de passe
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Vérifier que l'utilisateur a un mot de passe (auth locale)
    if (!user.passwordHash) {
      throw new Error(
        'This account was created with an external provider. Please use that provider to login.'
      );
    }

    // Vérifier le mot de passe
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Générer les tokens
    const tokens = this.generateTokens(user.id, user.email);

    logger.info(`User logged in: ${user.id}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username || undefined,
        emailVerified: true,
      },
      tokens,
    };
  }

  /**
   * Inscription d'un nouvel utilisateur
   */
  async register(email: string, password: string, metadata?: AuthMetadata): Promise<AuthResult> {
    // Valider le mot de passe
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new Error('An account with this email already exists');
    }

    // Hasher le mot de passe
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Créer l'utilisateur avec son mot de passe et ses settings
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        username: metadata?.username || null,
        passwordHash,
        userSettings: {
          create: {},
        },
      },
    });

    // Générer les tokens
    const tokens = this.generateTokens(user.id, user.email);

    logger.info(`New user registered: ${user.id}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username || undefined,
        emailVerified: true,
      },
      tokens,
    };
  }

  /**
   * Déconnexion
   * Note: En mode JWT stateless, on ne peut pas vraiment invalider le token côté serveur
   * Le client doit supprimer le token de son stockage
   */
  async logout(_token: string): Promise<void> {
    // En mode JWT stateless, pas d'action serveur nécessaire
    // Pour une sécurité accrue, on pourrait implémenter une blacklist de tokens
    logger.debug('Logout requested (stateless mode)');
  }

  /**
   * Rafraîchit un token expiré
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.secret) as {
        userId: string;
        email: string;
        type: string;
      };

      // Vérifier que c'est un refresh token
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      // Vérifier que l'utilisateur existe toujours
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Générer de nouveaux tokens
      return this.generateTokens(user.id, user.email);
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Refresh token expired');
      }
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Génère une paire de tokens (access + refresh)
   */
  private generateTokens(userId: string, email: string): AuthTokens {
    const accessToken = jwt.sign(
      {
        userId,
        email,
        type: 'access',
      },
      config.jwt.secret,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    const refreshToken = jwt.sign(
      {
        userId,
        email,
        type: 'refresh',
      },
      config.jwt.secret,
      { expiresIn: REFRESH_TOKEN_EXPIRY }
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: ACCESS_TOKEN_EXPIRY_SECONDS,
    };
  }
}
