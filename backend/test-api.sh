#!/bin/bash

# Script de test complet du backend SelfVault
# Ce script teste tous les endpoints de l'API

set -e

echo " Tests du Backend SelfVault"
echo "=============================="
echo ""

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:8080"
API_URL="${BASE_URL}/api"

# Fonction pour afficher le résultat
test_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ $2${NC}"
    else
        echo -e "${RED}✗ $2${NC}"
        exit 1
    fi
}

# 1. Test Health Check
echo "  Test Health Check..."
response=$(curl -s -o /dev/null -w "%{http_code}" "${API_URL}/health")
if [ "$response" == "200" ]; then
    test_result 0 "Health check OK"
else
    test_result 1 "Health check failed (HTTP $response)"
fi

# 2. Test API Info
echo ""
echo "  Test API Info..."
response=$(curl -s "${BASE_URL}/")
if echo "$response" | grep -q "SelfVault API"; then
    test_result 0 "API info OK"
else
    test_result 1 "API info failed"
fi

# 3. Test route inexistante (doit retourner 404)
echo ""
echo "  Test route inexistante..."
response=$(curl -s -o /dev/null -w "%{http_code}" "${API_URL}/nonexistent")
if [ "$response" == "404" ]; then
    test_result 0 "404 route OK"
else
    test_result 1 "404 handling failed (HTTP $response)"
fi

# 4. Test authentification requise (sans token)
echo ""
echo "  Test authentification requise..."
response=$(curl -s -o /dev/null -w "%{http_code}" "${API_URL}/me")
if [ "$response" == "401" ]; then
    test_result 0 "Auth middleware OK"
else
    test_result 1 "Auth middleware failed (HTTP $response)"
fi

echo ""
echo -e "${GREEN} Tous les tests de base passent !${NC}"
echo ""
echo " Pour tester les endpoints authentifiés :"
echo "   1. Créez un utilisateur sur Supabase Auth"
echo "   2. Obtenez un JWT token"
echo "   3. Utilisez le script test-with-auth.sh"
echo ""
