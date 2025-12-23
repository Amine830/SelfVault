import { join } from 'path';

// Minimal Prisma 7 config file to provide datasource connection URLs
// Prisma will read this file during CLI operations (migrate/generate)

const config = {
  datasources: {
    db: {
      provider: 'postgresql',
      url: process.env.DATABASE_URL,
      directUrl: process.env.DIRECT_URL,
    },
  },
};

export default config;
