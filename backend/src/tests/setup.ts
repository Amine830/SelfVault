/**
 * Configuration globale pour les tests Jest
 */

// Mock des variables d'environnement pour les tests
process.env.NODE_ENV = 'test';
process.env.PORT = '8080';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_KEY = 'test-service-key';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.DIRECT_URL = 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET = 'test-jwt-secret-32-characters-min';
process.env.STORAGE_PROVIDER = 'local';
process.env.LOCAL_STORAGE_PATH = './test-uploads';
process.env.MAX_UPLOAD_SIZE_BYTES = '10485760';
process.env.MAX_STORAGE_PER_USER_BYTES = '1073741824';
process.env.ALLOWED_ORIGINS = 'http://localhost:3000';
process.env.RATE_LIMIT_WINDOW_MS = '900000';
process.env.RATE_LIMIT_MAX_REQUESTS = '100';

// Timeout global pour les tests
jest.setTimeout(30000);
