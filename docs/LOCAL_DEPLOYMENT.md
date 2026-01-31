# Local Deployment (100% Self-Hosted)

This guide explains how to deploy SelfVault **without any external dependencies** (no Supabase, no AWS, etc.).

## Architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│                    SelfVault Self-Hosted                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │  (React)     │    │  (Express)   │    │              │       │
│  │  Port 5173   │    │  Port 8080   │    │  Port 5432   │       │
│  └──────────────┘    └──────┬───────┘    └──────────────┘       │
│                             │                                   │
│                             ▼                                   │
│                      ┌──────────────┐                           │
│                      │    MinIO     │                           │
│                      │ (S3 Storage) │                           │
│                      │ Port 9000/01 │                           │
│                      └──────────────┘                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Prerequisites

- Docker and Docker Compose
- Git

## Quick Start (Development)

### 1. Clone the project

```bash
git clone https://github.com/yourusername/selfvault.git
cd selfvault
```

### 2. Launch with Docker Compose

```bash
docker compose up -d
```

### 3. Access services

| Service | URL | Credentials |
| --------- | ----- | -------------- |
| **Frontend** | <http://localhost:5173> | - |
| **Backend API** | <http://localhost:8080/api> | - |
| **MinIO Console** | <http://localhost:9001> | `minioadmin` / `minioadmin123` |
| **PostgreSQL** | <localhost:5432> | `selfvault` / `selfvault123` |

### 4. Create an account

Go to <http://localhost:5173> and create a new account. Authentication is managed locally (no Supabase).

## Production Deployment

### 1. Copy and configure environment

```bash
cp .env.example .env
```

Edit `.env` and change default values:

```env
# Secure passwords
POSTGRES_PASSWORD=your-secure-postgres-password
MINIO_ROOT_PASSWORD=your-secure-minio-password

# JWT Secret (IMPORTANT - generate with: openssl rand -base64 64)
JWT_SECRET=your-very-long-jwt-secret-minimum-32-characters

# Your domain
VITE_API_URL=https://api.your-domain.com
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

### 2. Launch in production

```bash
docker compose -f docker-compose.prod.yml up -d
```

### 3. Check services

```bash
# View logs
docker compose -f docker-compose.prod.yml logs -f

# Check health
curl http://localhost:8080/api/health
```

## Advanced Configuration

### Change authentication provider

By default, `AUTH_PROVIDER=local` (no Supabase). To use Supabase:

```env
AUTH_PROVIDER=supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
```

### Storage limits

```env
# 100MB max per file
MAX_UPLOAD_SIZE_BYTES=104857600

# 10GB max per user
MAX_STORAGE_PER_USER_BYTES=10737418240
```

### HTTPS with Traefik (optional)

Uncomment the Traefik section in `docker-compose.prod.yml` to enable automatic HTTPS with Let's Encrypt.

## Useful Commands

```bash
# Start
docker compose up -d

# Stop
docker compose down

# View logs
docker compose logs -f backend

# Rebuild after changes
docker compose up -d --build

# Delete data (WARNING: irreversible)
docker compose down -v
```

## Troubleshooting

### Backend won't start

```bash
# Check logs
docker compose logs backend

# Rerun migrations
docker compose run --rm migrations
```

### MinIO is not accessible

```bash
# Check that MinIO is healthy
docker compose ps

# Recreate bucket
docker compose run --rm minio-init
```

### Database connection error

```bash
# Check PostgreSQL
docker compose exec postgres pg_isready

# Reset database (WARNING: data loss)
docker compose down -v
docker compose up -d
```

## Backup

### Backup PostgreSQL

```bash
docker compose exec postgres \
  pg_dump -U selfvault selfvault > backup_$(date +%Y%m%d).sql
```

### Backup MinIO

MinIO files are stored in the Docker volume `minio-data`. You can also use `mc mirror`:

```bash
# Install mc (MinIO Client)
docker run --rm -it --network selfvault-network minio/mc \
  mc alias set selfvault http://minio:9000 minioadmin minioadmin123

# Copy files locally
docker run --rm -it --network selfvault-network -v $(pwd)/backup:/backup minio/mc \
  mc mirror selfvault/selfvault /backup/
```

## Migration from Supabase

If you are currently using Supabase and want to migrate to a local installation:

1. Export your Supabase data (PostgreSQL dump)
2. Change `AUTH_PROVIDER=local` in `.env`
3. Users will need to recreate their accounts (Supabase passwords are not exportable)
4. Migrate files from Supabase Storage to MinIO

See [AUTHENTICATION.md](AUTHENTICATION.md) for more details.

