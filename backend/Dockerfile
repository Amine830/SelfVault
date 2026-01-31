# =============================================================================
# Stage 1: Development
# =============================================================================
FROM node:18-alpine AS development

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl openssl-dev libc6-compat

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./
COPY prisma ./prisma/

# Installer toutes les dépendances (dev incluses)
RUN npm ci

# Générer le client Prisma
RUN npx prisma generate

# Créer le dossier pour les uploads locaux
RUN mkdir -p /app/data/uploads

# Exposer le port
EXPOSE 8080

# Commande par défaut pour le dev
CMD ["npm", "run", "dev"]

# =============================================================================
# Stage 2: Build
# =============================================================================
FROM node:18-alpine AS builder

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl openssl-dev libc6-compat

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./
COPY prisma ./prisma/

# Installer les dépendances
RUN npm ci

# Copier le code source
COPY . .

# Générer le client Prisma
RUN npx prisma generate

# Compiler TypeScript
RUN npm run build

# =============================================================================
# Stage 3: Production
# =============================================================================
FROM node:18-alpine AS production

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Installer uniquement les dépendances de production
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --only=production && \
    npx prisma generate && \
    npm cache clean --force

# Copier les fichiers compilés depuis le builder
COPY --from=builder /app/dist ./dist

# Créer un utilisateur non-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Créer le dossier pour les uploads locaux
RUN mkdir -p /app/data/uploads && \
    chown -R nodejs:nodejs /app

USER nodejs

# Exposer le port
EXPOSE 8080

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Démarrer l'application
CMD ["node", "dist/index.js"]
