#!/bin/bash

set -e

echo " Installation de SelfVault..."

# Vérifier les prérequis
command -v node >/dev/null 2>&1 || { echo " Node.js n'est pas installé. Veuillez installer Node.js 18+ d'abord." >&2; exit 1; }
command -v docker >/dev/null 2>&1 || { echo " Docker n'est pas installé. Veuillez installer Docker d'abord." >&2; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo " Docker Compose n'est pas installé. Veuillez installer Docker Compose d'abord." >&2; exit 1; }

echo " Prérequis vérifiés"
# Créer le fichier .env s'il n'existe pas
if [ ! -f .env ]; then
    echo " Création du fichier .env..."
    cp .env.example .env
    echo "  IMPORTANT : Veuillez configurer vos clés Supabase dans le fichier .env"
    echo "   - SUPABASE_URL"
    echo "   - SUPABASE_ANON_KEY"
    echo "   - SUPABASE_SERVICE_KEY"
    echo "   - DATABASE_URL"
    echo "   - DIRECT_URL"
else
    echo " Le fichier .env existe déjà"
fi

# Créer les dossiers nécessaires
echo " Création des dossiers..."
mkdir -p data/uploads
mkdir -p backend/prisma/migrations

# Installation backend
echo " Installation des dépendances backend..."
cd backend
npm install
echo " Dépendances backend installées"

# Génération Prisma
echo " Génération du client Prisma..."
npx prisma generate

# Vérifier si l'utilisateur veut exécuter les migrations
read -p "Voulez-vous exécuter les migrations de base de données maintenant ? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo " Exécution des migrations..."
    npx prisma migrate deploy
    echo " Migrations exécutées"
else
    echo " N'oubliez pas d'exécuter les migrations avec : cd backend && npx prisma migrate deploy"
fi

cd ..

# Installation frontend
echo " Installation des dépendances frontend..."
cd frontend
npm install
echo " Dépendances frontend installées"

cd ..

echo ""
echo " Installation terminée avec succès !"
echo ""
echo " Prochaines étapes :"
echo "   1. Configurez vos clés Supabase dans .env"
echo "   2. Créez un bucket 'files' dans votre projet Supabase Storage"
echo "   3. Lancez l'application avec ./start.sh"
echo ""
