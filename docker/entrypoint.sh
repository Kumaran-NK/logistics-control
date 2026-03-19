#!/bin/sh
set -e

# Extract host and port from DATABASE_URL if set, otherwise fall back to env vars
if [ -n "$DATABASE_URL" ]; then
  DB_HOST=$(echo "$DATABASE_URL" | sed 's/.*@\([^:/]*\).*/\1/')
  DB_PORT=$(echo "$DATABASE_URL" | sed 's/.*:\([0-9]*\)\/.*/\1/')
  DB_USER=$(echo "$DATABASE_URL" | sed 's/.*\/\/\([^:]*\):.*/\1/')
  DB_PORT=${DB_PORT:-5432}
else
  DB_HOST="${PGHOST:-postgres}"
  DB_PORT="${PGPORT:-5432}"
  DB_USER="${PGUSER:-logistics}"
fi

echo "==> Waiting for PostgreSQL at ${DB_HOST}:${DB_PORT}..."
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" 2>/dev/null; do
  sleep 1
done
echo "==> PostgreSQL is ready."

if [ "${RUN_DB_SETUP:-}" = "1" ]; then
  echo "==> Pushing database schema..."
  pnpm --filter @workspace/db run push-force
  echo "==> Schema synced."

  echo "==> Seeding sample data..."
  pnpm --filter @workspace/db run seed
  echo "==> Seed complete."
else
  echo "==> Skipping schema push/seed (set RUN_DB_SETUP=1 to enable)."
fi

echo "==> Starting LOGI.AI API Server on port ${PORT:-8080}..."
if [ "${NODE_ENV:-}" = "production" ]; then
  exec pnpm --filter @workspace/api-server run start
else
  exec pnpm --filter @workspace/api-server run dev
fi