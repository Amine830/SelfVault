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
  const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_KEY',
    'DATABASE_URL',
    'DIRECT_URL',
    'JWT_SECRET',
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }

  return {
    port: parseInt(process.env.PORT || '8080', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    supabase: {
      url: process.env.SUPABASE_URL!,
      anonKey: process.env.SUPABASE_ANON_KEY!,
      serviceKey: process.env.SUPABASE_SERVICE_KEY!,
    },
    database: {
      url: process.env.DATABASE_URL!,
      directUrl: process.env.DIRECT_URL!,
    },
    jwt: {
      secret: process.env.JWT_SECRET!,
    },
    storage: {
      provider: (process.env.STORAGE_PROVIDER as 'supabase' | 'local' | 's3') || 'supabase',
      localPath: process.env.LOCAL_STORAGE_PATH || './data/uploads',
    },
    upload: {
      maxSizeBytes: parseInt(process.env.MAX_UPLOAD_SIZE_BYTES || '10485760', 10),
      maxStoragePerUserBytes: parseInt(process.env.MAX_STORAGE_PER_USER_BYTES || '1073741824', 10),
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
