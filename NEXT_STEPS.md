# Prochaines étapes — SelfVault

> Suivi des évolutions et tâches restantes.

## ✅ Éléments implémentés

- **Adaptateur S3/MinIO** (`S3StorageAdapter.ts`)
  - Compatible avec AWS S3, MinIO, DigitalOcean Spaces, etc.
  - Configuration via variables d'environnement (`S3_ENDPOINT`, `S3_BUCKET`, etc.)

- **docker-compose.prod.yml**
  - PostgreSQL local
  - MinIO pour le stockage S3-compatible
  - Backend + Frontend conteneurisés
  - Initialisation automatique du bucket MinIO
  - Migrations Prisma au démarrage

- **Affichage du quota** (Dashboard)
  - Composant `QuotaBar` affichant l'espace utilisé/disponible
  - Intégré via `GET /me` qui retourne `storage.used`, `storage.limit`, `storage.percentage`

- **CI/CD GitHub Actions** (`.github/workflows/ci.yml`)
  - Lint + Type check + Build pour backend et frontend
  - Build Docker des images
  - Exécuté sur push/PR vers `main` et `develop`

- **Documentation OpenAPI / Swagger UI**
  - Spec complète dans `backend/src/docs/openapi.json`
  - Interface Swagger sur `/docs`

## 🔄 En cours / Partiel

- **Endpoints d'authentification serveur (`POST /auth/register`, `POST /auth/login`)**
  - État : non implémenté côté API (utilisation de Supabase Auth côté client).
  - Suggestion : si besoin d'un mode 100% self-hosted sans Supabase, ajouter un module `auth` backend avec JWT local.

- **Visibilité "shared" (partage de fichiers)**
  - État : enum `visibility` existe (`private|public`), mais pas de flux de partage avec lien/token.
  - Suggestion : ajouter un endpoint `POST /files/:id/share` générant un token temporaire.

## 📋 Tâches restantes

### Haute priorité

1. **Tester le déploiement Docker complet**
   - Valider `docker-compose.prod.yml` en conditions réelles
   - Documenter les étapes de déploiement dans le README

2. **Guide de migration (`MIGRATION.md`)**
   - Migration Supabase → PostgreSQL local + MinIO
   - Commandes, points d'attention, scripts d'export/import

### Moyenne priorité

3. **Exemples Nginx / Let's Encrypt**
   - Fournir `nginx.example.conf` pour reverse proxy
   - Script ou guide certbot pour HTTPS

4. **Améliorer les tests**
   - Activer les tests dans le workflow CI (actuellement commentés)
   - Ajouter tests d'intégration pour les adaptateurs S3/local

5. **Mode authentification locale**
   - Optionnel : implémenter `routes/auth.ts` pour inscription/login sans Supabase
   - Utile pour déploiements 100% self-hosted

### Basse priorité

6. **Monitoring / Alerting**
   - Exemples Prometheus/Grafana ou healthchecks avancés
   - Scripts de backup automatisés

7. **Amélioration UX frontend**
   - Preview des images/PDF inline
   - Drag & drop pour l'upload
   - Recherche avancée avec filtres

## 📁 Structure actuelle des adaptateurs

```
backend/src/adapters/
├── index.ts                  # Factory (switch sur STORAGE_PROVIDER)
├── IStorageAdapter.ts        # Interface commune
├── SupabaseStorageAdapter.ts # Pour Supabase Storage
├── LocalStorageAdapter.ts    # Pour filesystem local
└── S3StorageAdapter.ts       # Pour S3/MinIO ✅ NEW
```

## 🔧 Variables d'environnement clés

```env
# Storage provider: supabase | local | s3
STORAGE_PROVIDER=s3

# S3/MinIO (si STORAGE_PROVIDER=s3)
S3_ENDPOINT=http://minio:9000
S3_REGION=us-east-1
S3_BUCKET=selfvault
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=your-secret
S3_FORCE_PATH_STYLE=true
```

## 🚀 Démarrage rapide (production)

```bash
# 1. Copier et configurer l'environnement
cp .env.prod.example .env

# 2. Lancer la stack
docker-compose -f docker-compose.prod.yml up -d

# 3. Accéder à l'application
# Frontend: http://localhost
# API: http://localhost:8080
# MinIO Console: http://localhost:9001
```

---

*Dernière mise à jour : 31 décembre 2025*
