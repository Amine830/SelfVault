# SelfVault Backend

Backend API pour SelfVault - Solution de stockage de fichiers auto-hébergée avec chiffrement et gestion de métadonnées.

## Fonctionnalités

- **Authentification JWT** via Supabase Auth
- **Gestion de fichiers** : Upload, download, mise à jour, suppression
- **Stockage flexible** : Supabase Storage ou local (adaptateur)
- **Catégorisation** : Organisation des fichiers par catégories
- **Déduplication** : Détection via hash SHA256
- **URLs signées** : Accès temporaire sécurisé (1h)
- **Partage de fichiers** : Liens de partage avec options avancées
  - Expiration configurable (1h, 24h, 7 jours, 30 jours, jamais)
  - Protection par mot de passe optionnelle
  - Limite de téléchargements
  - Révocation à tout moment
- **API REST** : Architecture MVC avec validation Zod
- **Logging structuré** : Pino avec rotation
- **Rate limiting** : Protection anti-abus
- **Sécurité** : Helmet, CORS, sanitization

## Stack technique

- **Runtime** : Node.js 18+
- **Language** : TypeScript (strict mode)
- **Framework** : Express.js
- **ORM** : Prisma
- **Base de données** : PostgreSQL (Supabase)
- **Stockage** : Supabase Storage
- **Authentification** : Supabase Auth (JWT)
- **Validation** : Zod
- **Upload** : Multer
- **Logging** : Pino
- **Tests** : Jest + Supertest

## Installation

### Prérequis

- Node.js 18+ et npm
- Compte Supabase
- PostgreSQL (via Supabase)

### 1. Cloner et installer

```bash
git clone https://github.com/yourusername/selfvault.git
cd SelfVault/backend
npm install
```

### 2. Configuration Supabase

Créer un projet sur [Supabase](https://supabase.com) et récupérer :
- URL du projet
- Clé `anon` (public)
- Clé `service_role` (privée)

### 3. Variables d'environnement

Créer un fichier `.env` :

```env
# Supabase
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_ANON_KEY=votre_anon_key
SUPABASE_SERVICE_KEY=votre_service_role_key

# Base de données
DATABASE_URL=postgresql://postgres:[password]@db.votre-projet.supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:[password]@db.votre-projet.supabase.co:5432/postgres

# Application
PORT=8080
NODE_ENV=development
JWT_SECRET=votre_secret_tres_long_et_securise
STORAGE_PROVIDER=supabase
MAX_FILE_SIZE=52428800
```

### 4. Créer les tables

Les tables ont été créées via l'outil MCP Supabase. Schéma Prisma disponible dans `prisma/schema.prisma`.

Pour générer le client Prisma :

```bash
npm run prisma:generate
```

### 5. Créer le bucket de stockage

Le bucket `files` a déjà été créé dans Supabase Storage avec une limite de 50MB par fichier.

## Démarrage

### Mode développement

```bash
npm run dev
```

Le serveur démarre sur `http://localhost:8080`

### Mode production

```bash
npm run build
npm start
```

### Documentation API

- Swagger UI disponible sur `http://localhost:8080/docs`
- Spécification OpenAPI brute sur `http://localhost:8080/docs/openapi.json`
- Fichier source : `src/docs/openapi.json`

## Structure du projet

```txt
backend/
├── src/
│   ├── adapters/           # Adaptateurs de stockage
│   │   ├── StorageAdapter.ts
│   │   ├── SupabaseStorageAdapter.ts
│   │   └── LocalStorageAdapter.ts
│   ├── controllers/        # Contrôleurs HTTP
│   │   ├── FileController.ts
│   │   ├── CategoryController.ts
│   │   └── UserController.ts
│   ├── database/           # Configuration DB
│   │   └── client.ts
│   ├── middlewares/        # Middlewares Express
│   │   ├── auth.ts
│   │   ├── upload.ts
│   │   ├── errorHandler.ts
│   │   └── rateLimiter.ts
│   ├── routes/             # Routes API
│   │   ├── index.ts
│   │   ├── files.routes.ts
│   │   ├── categories.routes.ts
│   │   └── users.routes.ts
│   ├── services/           # Logique métier
│   │   ├── FileService.ts
│   │   ├── CategoryService.ts
│   │   └── UserService.ts
│   ├── docs/              # Documentation API
│   │   └── openapi.json
│   ├── utils/              # Utilitaires
│   │   ├── logger.ts
│   │   ├── errors.ts
│   │   ├── file.utils.ts
│   │   ├── serializer.ts   # Fix BigInt
│   │   └── validators/
│   ├── types/              # Types TypeScript
│   │   └── index.ts
│   ├── app.ts              # Configuration Express
│   └── index.ts            # Point d'entrée
├── prisma/
│   └── schema.prisma       # Schéma de base de données
├── scripts/
│   └── reset-test-user.js  # Création utilisateur test
├── tests/                  # Tests unitaires
├── .env                    # Variables d'environnement
├── .env.example            # Exemple de configuration
├── package.json
├── tsconfig.json
├── TESTS.md                # Documentation des tests
└── README.md
```

## API Endpoints

### Authentification

Tous les endpoints (sauf `/` et `/api/health`) nécessitent un header :

```
Authorization: Bearer <JWT_TOKEN>
```

### Endpoints publics

```
GET  /                    Welcome message
GET  /api/health          Statut du serveur
```

### Utilisateurs

```
GET  /api/me              Profil de l'utilisateur connecté
PATCH /api/me             Mettre à jour le profil
GET  /api/settings        Paramètres utilisateur
PATCH /api/settings       Mettre à jour les paramètres
```

### Catégories

```
GET    /api/categories           Liste des catégories
POST   /api/categories           Créer une catégorie
GET    /api/categories/:id       Détails d'une catégorie
PATCH  /api/categories/:id       Mettre à jour une catégorie
DELETE /api/categories/:id       Supprimer une catégorie
```

### Fichiers

```
POST   /api/files/upload         Upload un fichier
GET    /api/files                Liste paginée des fichiers
GET    /api/files/:id            Détails d'un fichier
GET    /api/files/:id/download   Télécharger un fichier
GET    /api/files/:id/url        Obtenir une URL signée
PATCH  /api/files/:id            Mettre à jour les métadonnées
DELETE /api/files/:id            Supprimer un fichier
```

**Paramètres de requête pour `/api/files`** :

### Partage de fichiers

```
POST   /api/files/:id/share      Créer un lien de partage
GET    /api/files/:id/share      Obtenir les infos de partage
DELETE /api/files/:id/share      Révoquer le lien de partage
```

**Endpoints publics de partage (sans authentification)** :

```
GET    /api/share/:token/info    Infos publiques du fichier partagé
GET    /api/share/:token/download Télécharger via lien de partage
POST   /api/share/:token/url     Obtenir URL signée (avec mot de passe si requis)
GET    /api/public/files         Liste des fichiers publics
```

**Options de partage** :
- `expiresIn` : Durée de validité (1h, 24h, 7d, 30d, never)
- `password` : Mot de passe optionnel pour protéger le lien
- `maxDownloads` : Nombre maximum de téléchargements autorisés

**Paramètres de requête pour `/api/files`** :
- `page` : Numéro de page (défaut: 1)
- `limit` : Résultats par page (défaut: 20)
- `categoryId` : Filtrer par catégorie
- `search` : Rechercher par nom

## Sécurité

### Mesures implémentées

- **CORS** : Configuration restrictive
- **Helmet** : Headers de sécurité HTTP
- **Rate Limiting** : 100 requêtes / 15 min
- **Validation** : Zod schemas pour toutes les entrées
- **Sanitization** : Noms de fichiers nettoyés
- **JWT** : Authentification sans état
- **HTTPS** : Recommandé en production
- **Logging** : Toutes les erreurs loggées

## Scripts npm

```bash
npm run dev              # Développement avec watch
npm run build            # Compilation TypeScript
npm start                # Démarrer en production
npm test                 # Tests unitaires
npm run lint             # Vérifier le code
npm run lint:fix         # Corriger automatiquement
npm run format           # Formater avec Prettier
npm run prisma:generate  # Générer client Prisma
npm run prisma:studio    # Interface DB visuelle
```

## Performance

- **Upload** : Streaming avec Multer (memory storage)
- **Download** : Buffering optimisé
- **Logging** : Async avec Pino
- **DB** : Connection pooling Prisma
- **Cache** : Considérer Redis pour production

## Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit (`git commit -m 'Add AmazingFeature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## Licence

MIT License - Voir [LICENSE](../LICENSE)

## Liens utiles

- [Documentation Supabase](https://supabase.com/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Express.js Guide](https://expressjs.com/)

---

Dernière mise à jour : 26 décembre 2025
