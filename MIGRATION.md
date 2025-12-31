# Migration Guide: Supabase → Self-Hosted (PostgreSQL + MinIO)

This guide documents how to migrate SelfVault from a Supabase-hosted setup to a fully self-hosted deployment using PostgreSQL and MinIO.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Architecture Overview](#architecture-overview)
3. [Database Migration](#database-migration)
4. [Storage Migration](#storage-migration)
5. [Configuration Changes](#configuration-changes)
6. [Docker Deployment](#docker-deployment)
7. [Data Migration Script](#data-migration-script)
8. [Rollback Plan](#rollback-plan)
9. [Post-Migration Verification](#post-migration-verification)

---

## Prerequisites

Before starting the migration, ensure you have:

- [ ] Docker and Docker Compose installed
- [ ] Access to your Supabase project (database URL and storage credentials)
- [ ] Sufficient disk space for PostgreSQL data and MinIO storage
- [ ] Backup of your Supabase database
- [ ] At least 2GB RAM available for the services

### Required Tools

```bash
# Install PostgreSQL client tools
apt-get install postgresql-client

# Install MinIO client (mc)
wget https://dl.min.io/client/mc/release/linux-amd64/mc
chmod +x mc
sudo mv mc /usr/local/bin/
```

---

## Architecture Overview

### Before (Supabase)

```
┌─────────────────────────────────────────────────────────────┐
│                     Supabase Cloud                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  PostgreSQL │  │   Storage   │  │   Authentication    │  │
│  │  (Managed)  │  │  (S3-like)  │  │     (GoTrue)        │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   Backend   │
                    │  (Express)  │
                    └─────────────┘
```

### After (Self-Hosted)

```
┌────────────────────────────────────────────────────────────┐
│                   Your Infrastructure                      │
├────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  PostgreSQL │  │    MinIO    │  │   Auth (Supabase    │ │
│  │  (Docker)   │  │  (Docker)   │  │   or Custom*)       │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│         │                │                    │            │
│         └────────────────┼────────────────────┘            │
│                          ▼                                 │
│                   ┌─────────────┐                          │
│                   │   Backend   │                          │
│                   │  (Docker)   │                          │
│                   └─────────────┘                          │
│                          │                                 │
│                          ▼                                 │
│                   ┌─────────────┐                          │
│                   │  Frontend   │                          │
│                   │   (Nginx)   │                          │
│                   └─────────────┘                          │
└────────────────────────────────────────────────────────────┘

* Custom auth endpoints planned for issue #9
```

---

## Database Migration

### Step 1: Export Data from Supabase

```bash
# Export your Supabase database
pg_dump \
  "postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres" \
  --no-owner \
  --no-acl \
  --format=custom \
  --file=supabase_backup.dump

# Or export as SQL for inspection
pg_dump \
  "postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres" \
  --no-owner \
  --no-acl \
  --schema=public \
  > supabase_backup.sql
```

### Step 2: Start PostgreSQL Container

```bash
# Start only PostgreSQL from the production compose file
docker compose -f docker-compose.prod.yml up -d postgres

# Wait for PostgreSQL to be ready
sleep 10
```

### Step 3: Import Data

```bash
# Restore the database backup
docker compose -f docker-compose.prod.yml exec -T postgres \
  pg_restore \
  --username=selfvault \
  --dbname=selfvault \
  --no-owner \
  --no-acl \
  supabase_backup.dump

# Or import SQL file
docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U selfvault -d selfvault < supabase_backup.sql
```

### Step 4: Run Prisma Migrations

```bash
# Ensure schema is up to date
cd backend
DATABASE_URL="postgresql://selfvault:password@localhost:5432/selfvault" \
  npx prisma migrate deploy
```

---

## Storage Migration

### Step 1: Configure MinIO

```bash
# Start MinIO
docker compose -f docker-compose.prod.yml up -d minio

# Configure MinIO client
mc alias set selfvault http://localhost:9000 minioadmin your-minio-password

# Create the bucket
mc mb selfvault/selfvault

# Set bucket policy for private access
mc anonymous set none selfvault/selfvault
```

### Step 2: Export Files from Supabase Storage

You'll need to use Supabase's API to list and download all files:

```javascript
// scripts/export-supabase-storage.js
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function exportStorage() {
  const bucket = 'user-files'; // Your bucket name
  const exportDir = './supabase-export';
  
  // List all files
  const { data: files, error } = await supabase.storage
    .from(bucket)
    .list('', { limit: 10000 });
  
  if (error) throw error;
  
  // Download each file
  for (const file of files) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(file.name);
    
    if (error) {
      console.error(`Failed to download ${file.name}:`, error);
      continue;
    }
    
    const filePath = path.join(exportDir, file.name);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, Buffer.from(await data.arrayBuffer()));
    console.log(`Exported: ${file.name}`);
  }
}

exportStorage();
```

### Step 3: Import Files to MinIO

```bash
# Upload all exported files to MinIO
mc cp --recursive ./supabase-export/ selfvault/selfvault/

# Verify the upload
mc ls selfvault/selfvault/
```

### Step 4: Update File References

The database stores file paths. Ensure the paths match the MinIO structure:

```sql
-- Check current file paths
SELECT id, name, storage_path FROM "File" LIMIT 10;

-- Update paths if needed (example: remove bucket prefix)
UPDATE "File" 
SET storage_path = REPLACE(storage_path, 'user-files/', '')
WHERE storage_path LIKE 'user-files/%';
```

---

## Configuration Changes

### Backend Environment Variables

Create your `.env` file from the MinIO template:

```bash
cp backend/.env.minio.example backend/.env
```

Update the following variables:

```env
# Change from 'supabase' to 's3'
STORAGE_PROVIDER=s3

# Configure S3/MinIO connection
S3_ENDPOINT=http://minio:9000
S3_REGION=us-east-1
S3_BUCKET=selfvault
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=your-secure-password
S3_FORCE_PATH_STYLE=true

# Update database URL
DATABASE_URL=postgresql://selfvault:password@postgres:5432/selfvault
DIRECT_URL=postgresql://selfvault:password@postgres:5432/selfvault
```

### Frontend Configuration

No changes needed - the frontend communicates only with the backend API.

---

## Docker Deployment

### Full Stack Deployment

```bash
# Copy and configure environment
cp .env.prod.example .env.prod
# Edit .env.prod with your values

# Build and start all services
docker compose -f docker-compose.prod.yml up -d --build

# Check service status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f
```

### Service Health Checks

```bash
# PostgreSQL
docker compose -f docker-compose.prod.yml exec postgres pg_isready

# MinIO
curl http://localhost:9000/minio/health/live

# Backend
curl http://localhost:8080/api/health

# Frontend
curl http://localhost:80
```

---

## Data Migration Script

For a complete automated migration, use this script:

```bash
#!/bin/bash
# scripts/migrate-from-supabase.sh

set -e

echo "=== SelfVault Migration: Supabase → Self-Hosted ==="

# Configuration
SUPABASE_DB_URL="${SUPABASE_DB_URL:-}"
SUPABASE_URL="${SUPABASE_URL:-}"
SUPABASE_SERVICE_KEY="${SUPABASE_SERVICE_KEY:-}"
TARGET_DB_URL="${TARGET_DB_URL:-postgresql://selfvault:password@localhost:5432/selfvault}"
MINIO_ALIAS="${MINIO_ALIAS:-selfvault}"
MINIO_BUCKET="${MINIO_BUCKET:-selfvault}"

# Validate inputs
if [ -z "$SUPABASE_DB_URL" ]; then
    echo "Error: SUPABASE_DB_URL is required"
    exit 1
fi

# Step 1: Backup Supabase database
echo "Step 1: Exporting Supabase database..."
pg_dump "$SUPABASE_DB_URL" \
    --no-owner --no-acl \
    --format=custom \
    --file=migration_backup.dump

# Step 2: Start local services
echo "Step 2: Starting local services..."
docker compose -f docker-compose.prod.yml up -d postgres minio
sleep 15

# Step 3: Import database
echo "Step 3: Importing database..."
docker compose -f docker-compose.prod.yml exec -T postgres \
    pg_restore -U selfvault -d selfvault \
    --no-owner --no-acl < migration_backup.dump || true

# Step 4: Run Prisma migrations
echo "Step 4: Running Prisma migrations..."
cd backend
DATABASE_URL="$TARGET_DB_URL" npx prisma migrate deploy
cd ..

# Step 5: Export and import storage files
echo "Step 5: Migrating storage files..."
if [ -n "$SUPABASE_URL" ] && [ -n "$SUPABASE_SERVICE_KEY" ]; then
    node scripts/export-supabase-storage.js
    mc cp --recursive ./supabase-export/ "$MINIO_ALIAS/$MINIO_BUCKET/"
fi

# Step 6: Start remaining services
echo "Step 6: Starting backend and frontend..."
docker compose -f docker-compose.prod.yml up -d --build

echo "=== Migration Complete ==="
echo "Access your application at http://localhost"
echo "MinIO Console: http://localhost:9001"
```

---

## Rollback Plan

If the migration fails, you can rollback:

### Database Rollback

```bash
# Stop local services
docker compose -f docker-compose.prod.yml down

# Your Supabase data is unchanged - just point your app back to Supabase
cp backend/.env.supabase.example backend/.env
# Update with your Supabase credentials
```

### Keeping Supabase as Fallback

During migration, you can run both environments:

1. Keep Supabase running (read-only mode if possible)
2. Test the self-hosted setup thoroughly
3. Only switch DNS/load balancer after validation
4. Keep Supabase backup for 30 days after successful migration

---

## Post-Migration Verification

### Checklist

- [ ] All users can log in
- [ ] Files can be uploaded
- [ ] Files can be downloaded
- [ ] File previews work
- [ ] Categories can be created/edited
- [ ] Storage quota displays correctly
- [ ] No errors in backend logs
- [ ] Database queries perform well

### Verification Commands

```bash
# Check database records
docker compose -f docker-compose.prod.yml exec postgres \
  psql -U selfvault -d selfvault -c "SELECT COUNT(*) FROM \"User\";"

# Check storage files
mc ls selfvault/selfvault/ --recursive | wc -l

# Test API endpoints
curl http://localhost:8080/api/health
curl -H "Authorization: Bearer TOKEN" http://localhost:8080/api/users/me

# Check for errors
docker compose -f docker-compose.prod.yml logs backend | grep -i error
```

### Performance Baseline

After migration, establish a performance baseline:

```bash
# Database query performance
docker compose -f docker-compose.prod.yml exec postgres \
  psql -U selfvault -d selfvault -c "EXPLAIN ANALYZE SELECT * FROM \"File\" LIMIT 100;"

# Storage latency
time mc cp testfile.txt selfvault/selfvault/test/
time mc cat selfvault/selfvault/test/testfile.txt > /dev/null
mc rm selfvault/selfvault/test/testfile.txt
```

---

## Troubleshooting

### Common Issues

#### Database Connection Refused

```bash
# Check PostgreSQL is running
docker compose -f docker-compose.prod.yml ps postgres

# Check logs
docker compose -f docker-compose.prod.yml logs postgres

# Verify network
docker network ls
docker network inspect selfvault_default
```

#### MinIO Access Denied

```bash
# Verify credentials
mc admin info selfvault

# Check bucket exists
mc ls selfvault

# Recreate bucket with correct permissions
mc mb selfvault/selfvault --ignore-existing
```

#### Prisma Migration Errors

```bash
# Reset and reapply migrations (WARNING: destroys data)
DATABASE_URL="..." npx prisma migrate reset --force

# Or manually fix specific migration
DATABASE_URL="..." npx prisma migrate resolve --applied MIGRATION_NAME
```

---

## Future: Removing Supabase Auth Dependency

Currently, authentication still relies on Supabase Auth (GoTrue). 

To fully self-host, see **Issue #9: Server-side authentication endpoints** which will add:

- Local user registration
- Email/password authentication
- JWT token generation
- Password reset flow

Once implemented, you can remove all Supabase dependencies and run a 100% self-hosted stack.

---

## Support

If you encounter issues during migration:

1. Check the [GitHub Issues](https://github.com/your-repo/selfvault/issues)
2. Review the [Backend README](./backend/README.md)
3. Open a new issue with:
   - Migration step where it failed
   - Error messages
   - Your environment (OS, Docker version)
