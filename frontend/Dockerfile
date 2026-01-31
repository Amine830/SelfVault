# =============================================================================
# Stage 1: Development
# =============================================================================
FROM node:20-alpine AS development

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer toutes les dépendances
RUN npm ci

# Exposer le port Vite
EXPOSE 5173

# Commande par défaut pour le dev
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# =============================================================================
# Stage 2: Build
# =============================================================================
FROM node:20-alpine AS builder

# Build args pour les variables d'environnement Vite
ARG VITE_API_URL
ARG VITE_AUTH_PROVIDER
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci

# Copier le code source
COPY . .

# Build de production avec les variables d'environnement
RUN npm run build

# =============================================================================
# Stage 3: Production avec Nginx
# =============================================================================
FROM nginx:alpine AS production

# Copier la configuration nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copier les fichiers buildés
COPY --from=builder /app/dist /usr/share/nginx/html

# Exposer le port
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
