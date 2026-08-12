#!/bin/sh
set -e

echo "[entrypoint] applying migrations..."
npx prisma migrate deploy

if [ "$SKIP_SEED" != "true" ]; then
  echo "[entrypoint] seeding demo data (safe to rerun, uses upsert)..."
  node -e "require('ts-node/register')" 2>/dev/null || true
  npx prisma db seed || echo "[entrypoint] seed skipped/failed — continuing"
fi

echo "[entrypoint] starting server..."
exec "$@"
