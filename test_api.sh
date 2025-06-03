#!/bin/bash

echo "=== TEST DE L'API - Champ user_id ==="

# Test 1: Obtenir un token d'authentification (remplacez par vos identifiants)
echo "1. Test de connexion..."
TOKEN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"password"}')

echo "Réponse de connexion: $TOKEN_RESPONSE"

# Extraire le token (adaptez selon la structure de votre réponse)
TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"access_token":"[^"]*"' | sed 's/"access_token":"\([^"]*\)"/\1/')

if [ -z "$TOKEN" ]; then
  echo "❌ Impossible d'obtenir le token d'authentification"
  echo "Veuillez vérifier vos identifiants de connexion ou l'état de l'API"
  exit 1
fi

echo "✅ Token obtenu: ${TOKEN:0:20}..."

# Test 2: Essayer de créer un cours avec user_id
echo "2. Test de création de cours avec user_id..."
CREATE_RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/courses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "intitule": "Test Cours API",
    "day": "2025-06-10",
    "start_hour": "2025-06-10T09:00:00.000Z",
    "end_hour": "2025-06-10T10:00:00.000Z",
    "group_id": "828baedf-505a-444b-a806-a92083caf89e",
    "user_id": "26bbc5ba-568e-4b5a-9f1e-c3a65bde0106"
  }')

echo "Réponse de création: $CREATE_RESPONSE"

# Vérifier si l'erreur "property user_id should not exist" est présente
if echo "$CREATE_RESPONSE" | grep -q "property user_id should not exist"; then
  echo "❌ L'API refuse toujours le champ user_id"
  echo "⚠️  Les modifications ne sont pas prises en compte par l'API"
else
  echo "✅ L'API accepte le champ user_id"
fi

echo "=== FIN DU TEST ===" 