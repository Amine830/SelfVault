#!/bin/bash

set -e

echo " Démarrage de SelfVault..."

# Vérifier que .env existe
if [ ! -f .env ]; then
    echo " Le fichier .env n'existe pas. Veuillez exécuter ./install.sh d'abord."
    exit 1
fi

# Demander le mode de démarrage
echo "Choisissez le mode de démarrage :"
echo "1) Development (local)"
echo "2) Docker Compose"
read -p "Votre choix (1 ou 2) : " mode

if [ "$mode" = "1" ]; then
    echo " Démarrage en mode development local..."
    
    # Démarrer le backend
    echo " Démarrage du backend..."
    cd backend
    npm run dev &
    BACKEND_PID=$!
    cd ..
    
    # Attendre que le backend démarre
    sleep 3
    
    # Démarrer le frontend
    echo " Démarrage du frontend..."
    cd frontend
    npm run dev &
    FRONTEND_PID=$!
    cd ..
    
    echo ""
    echo " SelfVault est démarré !"
    echo "   Frontend : http://localhost:5173"
    echo "   Backend  : http://localhost:8080"
    echo ""
    echo "Pour arrêter, appuyez sur Ctrl+C"
    echo ""
    
    # Attendre l'arrêt
    wait $BACKEND_PID $FRONTEND_PID

elif [ "$mode" = "2" ]; then
    echo " Démarrage avec Docker Compose..."
    docker-compose up -d
    
    echo ""
    echo " SelfVault est démarré !"
    echo "   Frontend : http://localhost:5173"
    echo "   Backend  : http://localhost:8080"
    echo ""
    echo "Pour voir les logs : docker-compose logs -f"
    echo "Pour arrêter : docker-compose down"
    echo ""
else
    echo " Choix invalide. Veuillez choisir 1 ou 2."
    exit 1
fi
