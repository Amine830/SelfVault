# Prochaines étapes — SelfVault

> Liste des éléments mentionnés dans le README mais non présents (ou partiellement implémentés) dans le dépôt actuel.

## Résumé des items manquants / partiels

- **Endpoints d'authentification serveur (`POST /auth/register`, `POST /auth/login`)**
  - État : non implémenté côté API (le projet utilise Supabase Auth côté client).
  - Suggestion : décider si l'inscription/connexion doivent passer par le backend. Si oui, ajouter `routes/controllers/services` d'`auth` et tests.

- **`docker-compose.prod.yml` et configuration de production**
  - État : absent.
  - Suggestion : fournir un `docker-compose.prod.yml` d'exemple (backend, frontend, proxy, postgres/minio, volumes, secrets).

- **Configuration Nginx / Let's Encrypt (proxy reverse)**
  - État : guide présent dans le README mais pas de fichiers de config exemples.
  - Suggestion : ajouter un exemple `nginx.conf` et un script/guide pour certbot.

- **Workflows GitHub Actions (CI/CD)**
  - État : pas de `.github/workflows` détecté.
  - Suggestion : créer workflows pour `lint`, `test`, `build` et publication optionnelle d'image.

- **`MIGRATION.md` (guide de migration)**
  - État : mentionné dans README mais absent.
  - Suggestion : rédiger un guide de migration (Supabase → Postgres local + MinIO), commandes et points d'attention.

- **Adaptateur MinIO / S3 (backend/src/adapters)**
  - État : `SupabaseStorageAdapter` et `LocalStorageAdapter` présents ; pas d'adaptateur S3/MinIO.
  - Suggestion : implémenter un `S3StorageAdapter` réutilisable pour MinIO.

- **`backend/src/repositories/` et `backend/src/types/`**
  - État : mentionnés dans le README mais pas présents.
  - Suggestion : soit retirer la mention, soit créer l'abstraction `repositories/` pour isoler Prisma, et ajouter `types/` si nécessaire.

- **Visibilité "partagé" (shared)**
  - État : la colonne `visibility` existe mais le flux de partage n'est pas clair.
  - Suggestion : définir un enum de visibilité (`private|public|shared`) et ajouter endpoints/UX pour partager des fichiers.

- **Affichage du quota / usage côté frontend**
  - État : l'API renvoie `storage` via `GET /me`, mais le Dashboard ne l'affiche pas.
  - Suggestion : ajouter un composant `QuotaBar` dans le Dashboard et une page `Settings` pour gérer le quota.

- **Fichiers de production & monitoring**
  - État : exemples manquants pour monitoring, alerting, backups.
  - Suggestion : fournir playbooks de backup, exemples Prometheus/Grafana ou instructions simples.

## Propositions d'actions prioritaires

1. Créer un workflow GitHub Actions de base : `lint`, `test` (faible effort, grande valeur).
2. Ajouter affichage du quota dans le Dashboard (frontend) : utiliser `GET /me`.
3. Ajouter `docker-compose.prod.yml` minimal pour déploiement (exemple).
4. Implémenter `S3/MinIO` adapter si besoin de stocker localement en production.
5. Décider et implémenter les endpoints d'`auth` côté backend (optionnel si Supabase suffit).
6. Rédiger `MIGRATION.md` et exemples Nginx/Let's Encrypt.
