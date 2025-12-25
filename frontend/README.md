# Frontend — SelfVault

Le frontend de SelfVault est une application React (Vite + TypeScript) qui consomme l'API backend et utilise Supabase côté client pour l'authentification et le stockage. Ce README donne les informations minimales pour démarrer et contribuer côté interface.

## Prérequis

- Node.js 18+ (ou version compatible avec les dépendances)
- npm ou yarn
- Variables d'environnement (voir section suivante)

## Variables d'environnement

Le frontend attend les variables suivantes (préfixées par `VITE_`) :

- `VITE_SUPABASE_URL` — URL du projet Supabase
- `VITE_SUPABASE_ANON_KEY` — clé publique (anon) Supabase
- `VITE_API_URL` — URL du backend (ex. `http://localhost:8080`)

Installez et configurez ces variables (par exemple dans un fichier `.env.local` ou via votre gestionnaire d'environnement). Reportez-vous également au fichier `.env.example` à la racine du dépôt pour les exemples de valeurs.

## Installation et lancement

1. Installer les dépendances :

```bash
cd frontend
npm install
```

2. Lancer le serveur de développement :

```bash
npm run dev
```

3. Construire pour la production :

```bash
npm run build
npm run preview
```

## Scripts utiles

- `npm run dev` — démarrage en développement (Vite)
- `npm run build` — build (TypeScript + Vite)
- `npm run preview` — prévisualiser la build
- `npm run lint` — exécute ESLint
- `npm run test` — exécuter les tests (si configuré)

## Structure minimale

Les fichiers principaux du frontend se trouvent dans `src/` et incluent :

- `src/main.tsx` — point d'entrée
- `src/App.tsx` — routage et layout
- `src/api/` — clients Supabase et API (variables d'environnement utilisées ici)
- `src/components/` — composants réutilisables
- `src/pages/` — vues/pages principales
- `public/` — assets statiques

## Tests et linting

- `npm run lint` — vérifier et corriger les problèmes de lint
- `npm run test` — lancer la suite de tests (si présente)

## Contribution

1. Forkez le projet
2. Créez une branche (`git checkout -b feature/AmazingFeature`)
3. Commitez (`git commit -m "Add AmazingFeature"`)
4. Pushez (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request et décrivez les changements

## Licence

MIT License — voir [LICENSE](../LICENSE)

## Liens utiles

- Vite : <https://vitejs.dev/>
- TypeScript : <https://www.typescriptlang.org/>
- React : <https://reactjs.org/>
- Tailwind CSS : <https://tailwindcss.com/docs>
- ESLint : <https://eslint.org/>
- Prettier : <https://prettier.io/>
- Supabase : <https://supabase.com/>

------------------

Dernière mise à jour : 25 décembre 2025
