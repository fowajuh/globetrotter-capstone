#!/usr/bin/env bash
set -euo pipefail
echo "Starting infra..."
docker compose -f docker/docker-compose.yml up -d db redis
echo "Installing deps..."
(cd backend && npm install)
(cd frontend && npm install)
echo "Migrating db..."
(cd backend && npx prisma migrate dev)
echo "Ready. Run backend: cd backend && npm run start:dev"
echo "        frontend: cd frontend && npm run dev"
