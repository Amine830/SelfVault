# SelfVault

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Node](https://img.shields.io/badge/Node-18+-green)
![React](https://img.shields.io/badge/React-18-blue)
![Vite](https://img.shields.io/badge/Vite-4.0-brightgreen)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.0-teal)
![Prisma](https://img.shields.io/badge/Prisma-4.0-blueviolet)
![Docker](https://img.shields.io/badge/Docker-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14-blue)
![Jest](https://img.shields.io/badge/Jest-testing-red)

**SelfVault** est une application auto-hébergeable de stockage personnel de fichiers. Respectant la philosophie **BYOI (Bring Your Own Infrastructure)**, chaque utilisateur peut déployer son propre backend, base de données et stockage où il le souhaite.

## Philosophie du projet

- **Open-source** et **auto-hébergeable**
- **BYOI** : vous contrôlez votre infrastructure
- **Sécurité** : chiffrement, authentification robuste, bonnes pratiques
- **Portable** : architecture modulaire permettant le changement de DB/stockage/auth
- **Aucune dépendance obligatoire** : fonctionne sans service externe (Supabase, AWS, etc.)

> **"Supabase is a default provider, not a requirement."**

## Fonctionnalités

- **Authentification flexible** :
  - Supabase Auth (social login, email verification) - par défaut
  - Auth locale (JWT + bcrypt) - totalement autonome
- Upload/Download de fichiers
- Organisation par catégories
- Gestion des métadonnées (nom, taille, type MIME, hash SHA256)
- Contrôle de visibilité (privé/public/partagé)
- **Stockage flexible** :
  - Supabase Storage (par défaut)
  - Local (système de fichiers)
  - S3/MinIO (compatible AWS S3)
- **Partage de fichiers avancé** :
  - Génération de liens de partage uniques
  - Expiration configurable (1h, 24h, 7 jours, 30 jours, jamais)
  - Protection par mot de passe optionnelle
  - Limite de téléchargements
  - Révocation instantanée
- Quotas de stockage par utilisateur
- API REST complète
- Interface web moderne (React + TailwindCSS)
- Support Docker
 

## Architecture

```text
SelfVault/
├── backend/           # API REST (Node.js + Express + TypeScript + Prisma)
│   └── src/
│       ├── auth/      # Providers d'authentification (Supabase, Local)
│       └── adapters/  # Adaptateurs de stockage (Supabase, S3, Local)
├── frontend/          # Interface web (React + Vite + TypeScript + TailwindCSS)
│   └── src/
│       └── services/auth/  # Services d'auth abstrait
├── docs/              # Documentation détaillée
├── docker-compose.yml # Configuration Docker pour dev
├── .env.example       # Template des variables d'environnement
└── README.md          # Ce fichier
```

## Configurations possibles

| Configuration | Auth | Storage | Database | Dépendances externes |
|---------------|------|---------|----------|---------------------|
| **Full Supabase** | Supabase | Supabase | PostgreSQL (Supabase) | Supabase |
| **Full Self-Hosted** | Local | S3/MinIO | PostgreSQL/MySQL | Aucune |
| **Hybride** | Supabase | S3/MinIO | PostgreSQL | Supabase (auth only) |
| **Dev Local** | Local | Local | SQLite | Aucune |

## Prochaines étapes

Quelques tâches planifiées pour les prochaines versions — voir `NEXT_STEPS.md` pour le détail :

- Ajouter un `docker-compose.prod.yml` d'exemple pour la production
- Créer workflows CI (lint / test / build)
- ~~Implémenter un adaptateur S3/MinIO pour supporter un stockage BYOI~~ ✅
- ~~Implémenter l'authentification locale (sans Supabase)~~ ✅
- Ajouter guide `MIGRATION.md` et exemples Nginx / Let's Encrypt


### Stack technique

**Backend :**

- Node.js + TypeScript
- Express.js (API REST)
- Prisma (ORM multi-DB : PostgreSQL, MySQL, SQLite)
- Auth abstrait : Supabase Auth ou JWT local
- Storage abstrait : Supabase, S3/MinIO, Local
- Jest + Supertest (tests)

**Frontend :**

- React 18
- Vite
- TypeScript
- TailwindCSS
- Supabase Client

**Infrastructure :**

- Docker + Docker Compose (fichier de développement fourni)

## Installation

### Prérequis

- Node.js 18+
- Docker et Docker Compose
- Un compte Supabase (gratuit)

### Configuration Supabase

1. Créez un projet sur [supabase.com](https://supabase.com)
2. Créez un bucket de stockage nommé `files` dans Storage
3. Configurez les politiques d'accès (RLS)
4. Récupérez vos clés API (Project Settings > API)

### Installation locale

1. Clonez le repository :

```bash
git clone https://github.com/Amine830/SelfVault.git
cd selfvault
```

2. Copiez et configurez les variables d'environnement :

```bash
cp .env.example .env
# Éditez .env avec vos clés Supabase
```

3. Lancez l'installation :

```bash
chmod +x install.sh
./install.sh
```

4. Démarrez l'application :

```bash
chmod +x start.sh
./start.sh
```

L'application sera accessible sur :

- Frontend : http://localhost:5173
- Backend API : http://localhost:8080

## 🔧 Configuration manuelle

### Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Docker

### Development

```bash
docker-compose up -d
```

### Production

```bash

Le dépôt fournit `docker-compose.yml` pour le développement. Un fichier `docker-compose.prod.yml` d'exemple n'est pas inclus dans cette version (voir `NEXT_STEPS.md`).
```

## Tests

### Server Backend

```bash
cd backend
npm test                 # Tous les tests
npm run test:coverage    # Avec coverage
npm run test:watch       # Mode watch
```

### Client Frontend

```bash
cd frontend
npm test
```

## API Documentation

### Endpoints principaux

#### Authentification

- `POST /auth/register` - Inscription
- `POST /auth/login` - Connexion
- `GET /me` - Profil utilisateur

#### Fichiers

- `POST /files/upload` - Upload fichier
- `GET /files` - Liste des fichiers (pagination)
- `GET /files/:id` - Métadonnées d'un fichier
- `GET /files/:id/download` - Télécharger un fichier
- `PATCH /files/:id` - Modifier métadonnées
- `DELETE /files/:id` - Supprimer un fichier

#### Partage

- `POST /files/:id/share` - Créer un lien de partage
- `GET /files/:id/share` - Infos de partage d'un fichier
- `DELETE /files/:id/share` - Révoquer le lien de partage
- `GET /share/:token/info` - Infos publiques (sans auth)
- `GET /share/:token/download` - Télécharger via lien (sans auth)
- `POST /share/:token/url` - Obtenir URL signée (sans auth)
- `GET /public/files` - Liste des fichiers publics

#### Catégories

- `GET /categories` - Liste des catégories
- `POST /categories` - Créer catégorie
- `DELETE /categories/:id` - Supprimer catégorie

#### Paramètres

- `GET /settings` - Paramètres utilisateur
- `PATCH /settings` - Modifier paramètres

Tous les endpoints nécessitent un token JWT dans le header `Authorization: Bearer <token>`.

### Documentation API

- Swagger UI disponible sur `http://localhost:8080/docs`
- Spécification OpenAPI brute sur `http://localhost:8080/docs/openapi.json`
- Fichier source : `src/docs/openapi.json`

## Sécurité

- HTTPS/TLS obligatoire en production
- Validation des entrées (Zod)
- Protection contre injection SQL (Prisma ORM)
- Rate limiting
- Headers de sécurité (Helmet)
- CORS configuré
- Hash d'intégrité (SHA256) pour chaque fichier
- Service key Supabase jamais exposée au client

### Rotation des secrets

Il est recommandé de :

- Changer le `JWT_SECRET` tous les 90 jours
- Régénérer les clés Supabase en cas de compromission
- Faire des backups réguliers de la base de données

## Migration vers autre infrastructure (notes)

Le projet V1 utilise Supabase comme provider par défaut (Auth, Postgres, Storage). La portabilité vers une stack Postgres+MinIO/S3 est prévue mais les adaptateurs et guides détaillés ne sont pas encore fournis dans cette version. Voir `NEXT_STEPS.md` pour la liste des tâches nécessaires à la migration.


## Développement

### Structure du code backend

```text
backend/src/
├── controllers/    # Gestionnaires de routes
├── services/       # Logique métier
├── middlewares/    # Auth, validation, rate limiting
├── routes/         # Définition des routes
├── adapters/       # Adaptateurs storage (Supabase, local)
├── utils/          # Utilitaires
└── (types/)        # Types TypeScript (non fournis dans cette version)
```

### Conventions de code

- TypeScript strict mode activé
- ESLint + Prettier
- Commits conventionnels (Conventional Commits)
- Tests obligatoires pour les nouvelles fonctionnalités

## Monitoring et Logs

Les logs sont structurés avec Winston/Pino :

```bash
# Logs backend
docker-compose logs -f backend

# Logs frontend
docker-compose logs -f frontend
```

## Déploiement

### Sur VPS (Ubuntu/Debian)

1. Installez Docker et Docker Compose
2. Configurez Nginx avec Let's Encrypt :

```bash
sudo apt install nginx certbot python3-certbot-nginx
sudo certbot --nginx -d votre-domaine.com
```

3. Déployez avec Docker Compose :

```bash
git clone https://github.com/yourusername/selfvault.git
cd selfvault
cp .env.example .env
# Configurez .env
docker-compose -f docker-compose.prod.yml up -d
```

4. Configurez Nginx comme proxy reverse

### CI/CD

Workflows de CI/CD (GitHub Actions) non fournis dans cette version. Voir `NEXT_STEPS.md` pour les tâches proposées (lint/test/build, publication d'images, etc.).

## Contribution

Les contributions sont les bienvenues ! Merci de :

1. Fork le projet
2. Créer une branche (`git checkout -b feature/amazing-feature`)
3. Commit vos changements (`git commit -m 'feat: add amazing feature'`)
4. Push vers la branche (`git push origin feature/amazing-feature`)
5. Ouvrir une Pull Request

## License

Ce projet est sous licence MIT. Voir le fichier [LICENSE](./LICENSE) pour plus de détails.

## Remerciements

- [Supabase](https://supabase.com) pour l'infrastructure backend
- [Vite](https://vitejs.dev) pour le tooling frontend
- [Prisma](https://www.prisma.io) pour l'ORM

## Support

- Email : <amine.nedjar4716@gmail.com>
- Issues : [GitHub Issues](https://github.com/amine830/selfvault/issues)
- Discussions : [GitHub Discussions](https://github.com/amine830/selfvault/discussions)

---

**SelfVault** - Votre stockage, votre infrastructure, votre contrôle.
