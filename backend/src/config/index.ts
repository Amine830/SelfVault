import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  supabase: {
    url: string;
    anonKey: string;
    serviceKey: string;
  };
  database: {
    url: string;
    directUrl: string;
  };
  jwt: {
    secret: string;
  };
  storage: {
    provider: 'supabase' | 'local' | 's3';
    localPath: string;
  };
  s3: {
    endpoint: string;
    region: string;
    bucket: string;
    accessKeyId: string;
    secretAccessKey: string;
    forcePathStyle: boolean;
  };
  upload: {
    maxSizeBytes: number;
    maxStoragePerUserBytes: number;
  };
  cors: {
    allowedOrigins: string[];
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
}

/**
 * Valide et retourne la configuration de l'application
 * Lance une erreur si une variable requise est manquante
 */
function validateConfig(): Config {
  const storageProvider =
    (process.env.STORAGE_PROVIDER as 'supabase' | 'local' | 's3') || 'supabase';

  // Variables requises selon le provider
  const requiredEnvVars: string[] = ['DATABASE_URL', 'DIRECT_URL', 'JWT_SECRET'];

  if (storageProvider === 'supabase') {
    requiredEnvVars.push('SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_KEY');
  }

  if (storageProvider === 's3') {
    requiredEnvVars.push('S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY', 'S3_BUCKET');
  }

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }

  return {
    port: parseInt(process.env.PORT || '8080', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    supabase: {
      url: process.env.SUPABASE_URL || '',
      anonKey: process.env.SUPABASE_ANON_KEY || '',
      serviceKey: process.env.SUPABASE_SERVICE_KEY || '',
    },
    database: {
      url: process.env.DATABASE_URL!,
      directUrl: process.env.DIRECT_URL!,
    },
    jwt: {
      secret: process.env.JWT_SECRET!,
    },
    storage: {
      provider: storageProvider,
      localPath: process.env.LOCAL_STORAGE_PATH || './data/uploads',
    },
    s3: {
      endpoint: process.env.S3_ENDPOINT || '',
      region: process.env.S3_REGION || 'us-east-1',
      bucket: process.env.S3_BUCKET || 'selfvault',
      accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
    },
    upload: {
      // 100 MB par fichier par défaut (configurable via MAX_UPLOAD_SIZE_BYTES)
      maxSizeBytes: parseInt(process.env.MAX_UPLOAD_SIZE_BYTES || '104857600', 10),
      // 5 GB de stockage par utilisateur par défaut
      maxStoragePerUserBytes: parseInt(process.env.MAX_STORAGE_PER_USER_BYTES || '5368709120', 10),
    },
    cors: {
      allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5174',
      ],
    },
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    },
  };
}

export const config = validateConfig();
