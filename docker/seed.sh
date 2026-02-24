#!/bin/bash
# Seed local Supabase database with migrations and admin user
# Usage: npm run docker:seed

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
MIGRATIONS_DIR="$PROJECT_DIR/supabase/migrations"
CONTAINER="vibecodes-db"
API_URL="http://localhost:54321"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNjQxNzY5MjAwLCJleHAiOjE3OTk1MzU2MDB9.-U5d7p4rwb1fDPQ46dBtyJ1kb8io-dIftC8dMVGi6dw"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE2NDE3NjkyMDAsImV4cCI6MTc5OTUzNTYwMH0.m7TCAReMYZji8KX1FC0M9oBGrqF-XdxnErGmvzltKNk"

echo "Waiting for database to be ready..."
until docker exec "$CONTAINER" pg_isready -h 127.0.0.1 -q 2>/dev/null; do
  sleep 1
done
echo "Database is ready!"

echo ""
echo "Setting role passwords..."
docker exec "$CONTAINER" psql -U supabase_admin -d postgres -c \
  "ALTER USER supabase_auth_admin WITH PASSWORD 'postgres';
   ALTER USER supabase_storage_admin WITH PASSWORD 'postgres';
   ALTER USER authenticator WITH PASSWORD 'postgres';" -q 2>/dev/null
echo "  Passwords set"

echo ""
echo "Restarting auth service..."
docker compose restart auth > /dev/null 2>&1
sleep 3

echo ""
echo "Applying migrations..."
for migration in "$MIGRATIONS_DIR"/*.sql; do
  if [ -f "$migration" ]; then
    filename=$(basename "$migration")
    echo "  Applying: $filename"
    docker exec -i "$CONTAINER" psql -U supabase_admin -d postgres -q < "$migration" 2>/dev/null || {
      echo "    (already applied or skipped)"
    }
  fi
done

echo ""
echo "Starting Kong..."
docker compose up -d kong > /dev/null 2>&1

echo ""
echo "Waiting for API gateway..."
until curl -sf -H "apikey: $ANON_KEY" "$API_URL/auth/v1/health" > /dev/null 2>&1; do
  sleep 1
done
echo "API gateway is ready!"

echo ""
echo "Creating admin user..."
RESULT=$(curl -sf -X POST "$API_URL/auth/v1/admin/users" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "AdminPass123", "email_confirm": true}' 2>/dev/null || echo '{"error":"failed"}')

if echo "$RESULT" | grep -q '"id"'; then
  USER_ID=$(echo "$RESULT" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  echo "  Created user: admin@example.com (ID: $USER_ID)"

  # Make user admin
  echo "  Granting admin privileges..."
  docker exec "$CONTAINER" psql -U supabase_admin -d postgres -c \
    "UPDATE public.users SET is_admin = true, ai_enabled = true WHERE id = '$USER_ID';" -q 2>/dev/null
elif echo "$RESULT" | grep -q "email_exists"; then
  echo "  User admin@example.com already exists"
else
  echo "  Warning: Could not create admin user"
fi

echo ""
echo "Creating guest user (non-admin, for testing visibility)..."
RESULT2=$(curl -sf -X POST "$API_URL/auth/v1/admin/users" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email": "guest@example.com", "password": "GuestPass123", "email_confirm": true}' 2>/dev/null || echo '{"error":"failed"}')

if echo "$RESULT2" | grep -q '"id"'; then
  GUEST_ID=$(echo "$RESULT2" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  echo "  Created user: guest@example.com (ID: $GUEST_ID)"

  # Set display name
  docker exec "$CONTAINER" psql -U supabase_admin -d postgres -c \
    "UPDATE public.users SET full_name = 'Guest User' WHERE id = '$GUEST_ID';" -q 2>/dev/null
elif echo "$RESULT2" | grep -q "email_exists"; then
  echo "  User guest@example.com already exists"
else
  echo "  Warning: Could not create guest user"
fi

echo ""
echo "Done! You can log in with:"
echo ""
echo "  Admin:  admin@example.com / AdminPass123"
echo "  Guest:  guest@example.com / GuestPass123"
