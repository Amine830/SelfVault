# Déploiement Local (100% Self-Hosted)

Ce guide explique comment déployer SelfVault **sans aucune dépendance externe** (pas de Supabase, pas d'AWS, etc.).

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    SelfVault Self-Hosted                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Frontend   │───▶│   Backend    │───▶│  PostgreSQL  │      │
│  │  (React)     │    │  (Express)   │    │              │      │
│  │  Port 5173   │    │  Port 8080   │    │  Port 5432   │      │
│  └──────────────┘    └──────┬───────┘    └──────────────┘      │
│                             │                                   │
│                             ▼                                   │
│                      ┌──────────────┐                          │
│                      │    MinIO     │                          │
│                      │ (S3 Storage) │                          │
│                      │ Port 9000/01 │                          │
│                      └──────────────┘                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Prérequis

- Docker et Docker Compose
- Git

## Démarrage Rapide (Développement)

### 1. Cloner le projet

```bash
git clone https://github.com/yourusername/selfvault.git
cd selfvault
```

### 2. Lancer avec Docker Compose

```bash
docker-compose -f docker-compose.local.yml up -d
```

### 3. Accéder aux services

| Service | URL | Identifiants |
|---------|-----|--------------|
| **Frontend** | http://localhost:5173 | - |
| **Backend API** | http://localhost:8080/api | - |
| **MinIO Console** | http://localhost:9001 | `minioadmin` / `minioadmin123` |
| **PostgreSQL** | localhost:5432 | `selfvault` / `selfvault123` |

### 4. Créer un compte

Accédez à http://localhost:5173 et créez un nouveau compte. L'authentification est gérée localement (pas de Supabase).

## Déploiement Production

### 1. Copier et configurer l'environnement

```bash
cp .env.docker.example .env
```

Éditez `.env` et changez les valeurs par défaut :

```env
# Mots de passe sécurisés
POSTGRES_PASSWORD=votre-mot-de-passe-postgres-securise
MINIO_ROOT_PASSWORD=votre-mot-de-passe-minio-securise

# JWT Secret (IMPORTANT - générer avec: openssl rand -base64 64)
JWT_SECRET=votre-secret-jwt-tres-long-minimum-32-caracteres

# Votre domaine
VITE_API_URL=https://api.votre-domaine.com
ALLOWED_ORIGINS=https://votre-domaine.com,https://www.votre-domaine.com
```

### 2. Lancer en production

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 3. Vérifier les services

```bash
# Voir les logs
docker-compose -f docker-compose.prod.yml logs -f

# Vérifier la santé
curl http://localhost:8080/api/health
```

## Configuration Avancée

### Changer le provider d'authentification

Par défaut, `AUTH_PROVIDER=local` (pas de Supabase). Pour utiliser Supabase :

```env
AUTH_PROVIDER=supabase
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_ANON_KEY=votre-anon-key
SUPABASE_SERVICE_KEY=votre-service-key
```

### Limites de stockage

```env
# 100MB max par fichier
MAX_UPLOAD_SIZE_BYTES=104857600

# 10GB max par utilisateur
MAX_STORAGE_PER_USER_BYTES=10737418240
```

### HTTPS avec Traefik (optionnel)

Décommentez la section Traefik dans `docker-compose.prod.yml` pour activer HTTPS automatique avec Let's Encrypt.

## Commandes Utiles

```bash
# Démarrer
docker-compose -f docker-compose.local.yml up -d

# Arrêter
docker-compose -f docker-compose.local.yml down

# Voir les logs
docker-compose -f docker-compose.local.yml logs -f backend

# Reconstruire après modifications
docker-compose -f docker-compose.local.yml up -d --build

# Supprimer les données (ATTENTION: irréversible)
docker-compose -f docker-compose.local.yml down -v
```

## Dépannage

### Le backend ne démarre pas

```bash
# Vérifier les logs
docker-compose -f docker-compose.local.yml logs backend

# Relancer les migrations
docker-compose -f docker-compose.local.yml run --rm migrations
```

### MinIO n'est pas accessible

```bash
# Vérifier que MinIO est healthy
docker-compose -f docker-compose.local.yml ps

# Recréer le bucket
docker-compose -f docker-compose.local.yml run --rm minio-init
```

### Erreur de connexion à la base de données

```bash
# Vérifier PostgreSQL
docker-compose -f docker-compose.local.yml exec postgres pg_isready

# Réinitialiser la base (ATTENTION: perte de données)
docker-compose -f docker-compose.local.yml down -v
docker-compose -f docker-compose.local.yml up -d
```

## Sauvegarde

### Sauvegarder PostgreSQL

```bash
docker-compose -f docker-compose.local.yml exec postgres \
  pg_dump -U selfvault selfvault > backup_$(date +%Y%m%d).sql
```

### Sauvegarder MinIO

Les fichiers MinIO sont stockés dans le volume Docker `minio-data`. Vous pouvez aussi utiliser `mc mirror` :

```bash
# Installer mc (MinIO Client)
docker run --rm -it --network selfvault-network minio/mc \
  mc alias set selfvault http://minio:9000 minioadmin minioadmin123

# Copier les fichiers localement
docker run --rm -it --network selfvault-network -v $(pwd)/backup:/backup minio/mc \
  mc mirror selfvault/selfvault /backup/
```

## Migration depuis Supabase

Si vous utilisez actuellement Supabase et souhaitez migrer vers une installation locale :

1. Exportez vos données Supabase (PostgreSQL dump)
2. Changez `AUTH_PROVIDER=local` dans `.env`
3. Les utilisateurs devront recréer leurs comptes (les mots de passe Supabase ne sont pas exportables)
4. Migrez les fichiers de Supabase Storage vers MinIO

Voir [AUTHENTICATION.md](AUTHENTICATION.md) pour plus de détails.
