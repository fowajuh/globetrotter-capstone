"""
Every real file the scaffold writes lives here as a string constant, kept
separate from architecture.py (which only describes *shape*). This is the
thing you edit when a template needs to change — you never touch the tree.
"""

ROOT_README = """# GlobeTrotter

Trip planning, done like it's meant to survive contact with real users.

This repo ships in four backend stages behind one stable API contract
(`/docs/api-contract.md`). The frontend never has to change because the
infrastructure behind it gets more sophisticated — that's the whole point.

| Stage | What's running |
|---|---|
| 1 — Monolith | Single Node service + Postgres. Full product, simplest infra. |
| 2 — Microservices | Users / Itinerary / Recommendations behind a gateway. |
| 3 — Cloud | Docker + Kubernetes + CI/CD + observability. |
| 4 — Resilience | Redis, queues, circuit breakers, chaos-tested. |

## Layout

```
frontend/        React 18 + Vite + TS — the "Flight Manifest" UI
backend/         Stage 1 monolith (NestJS-style modules), splits into
                 services/ in Stage 2
services/        Stage 2+ independently deployable services
shared/           @globetrotter/contracts — Zod schemas shared by every
                 service and the frontend, so DTOs can't drift
infrastructure/  Terraform / cloud config (Stage 3+)
docker/          Per-service Dockerfiles + docker-compose for local dev
kubernetes/      Helm chart + manifests (Stage 3+)
docs/            API contract, architecture decision records, runbooks
scripts/         Dev/setup/deploy scripts
generator/       The scaffolder that built this repo shape (safe to rerun)
```

## Quickstart (Stage 1)

```bash
cp .env.example .env
docker compose -f docker/docker-compose.yml up -d db redis
cd backend && npm install && npx prisma migrate dev && npm run start:dev
cd frontend && npm install && npm run dev
```

## Regenerating structure

`python scaffold.py` is idempotent — it never overwrites a file that
already has real content in it, it only fills in what's missing. Run it
again any time you add a new entry to `generator/architecture.py`.
"""

ROOT_GITIGNORE = """node_modules/
dist/
build/
.next/
.turbo/
*.log
.env
.env.local
.DS_Store
coverage/
.vscode/
.idea/
*.tsbuildinfo
prisma/dev.db
generator/__pycache__/
.pytest_cache/
"""

ENV_EXAMPLE = """# --- Core ---
NODE_ENV=development
PORT=4000

# --- Database (Stage 1: single Postgres; Stage 2: one per service) ---
DATABASE_URL=postgresql://globetrotter:globetrotter@localhost:5432/globetrotter

# --- Auth ---
JWT_ACCESS_SECRET=change-me-access
JWT_REFRESH_SECRET=change-me-refresh
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=30d
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
APPLE_OAUTH_CLIENT_ID=

# --- AI / Recommendations ---
# Any Anthropic-compatible key. Recommendations Service degrades to a
# rules-based fallback if this is unset (see backend/src/recommendations).
ANTHROPIC_API_KEY=

# --- Realtime / Social ---
REDIS_URL=redis://localhost:6379

# --- Notifications ---
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
WEB_PUSH_PUBLIC_KEY=
WEB_PUSH_PRIVATE_KEY=

# --- Observability (Stage 3+) ---
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
"""

# ---------------------------------------------------------------------------
# Backend (Stage 1 monolith) — package.json + prisma schema + entrypoint
# ---------------------------------------------------------------------------

BACKEND_PACKAGE_JSON = """{
  "name": "@globetrotter/backend",
  "version": "1.0.0",
  "private": true,
  "description": "GlobeTrotter Stage 1 monolith — modular by design so Stage 2 is a refactor, not a rewrite.",
  "scripts": {
    "start:dev": "nest start --watch",
    "build": "nest build",
    "start:prod": "node dist/main.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "test": "jest",
    "lint": "eslint \\"src/**/*.ts\\""
  },
  "dependencies": {
    "@nestjs/common": "^10.4.0",
    "@nestjs/core": "^10.4.0",
    "@nestjs/jwt": "^10.2.0",
    "@nestjs/platform-express": "^10.4.0",
    "@nestjs/platform-ws": "^10.4.0",
    "@nestjs/websockets": "^10.4.0",
    "@prisma/client": "^5.19.0",
    "@anthropic-ai/sdk": "^0.27.0",
    "argon2": "^0.40.3",
    "opossum": "^8.1.4",
    "zod": "^3.23.8",
    "ioredis": "^5.4.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.4.5",
    "@nestjs/testing": "^10.4.0",
    "@types/node": "^20.14.0",
    "jest": "^29.7.0",
    "prisma": "^5.19.0",
    "typescript": "^5.5.4"
  }
}
"""

BACKEND_TSCONFIG = """{
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2021",
    "strict": true,
    "esModuleInterop": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "paths": { "@globetrotter/contracts": ["../shared/contracts/src"] }
  },
  "include": ["src/**/*.ts"]
}
"""

BACKEND_MAIN_TS = """import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

/**
 * Stage 1 entrypoint. Every module below (auth/users/trips/itinerary/
 * recommendations/budget/notifications) owns its own DTOs and service
 * layer and never reaches into another module's repository directly —
 * that boundary is what makes the Stage 2 microservice split a copy/paste
 * of a folder instead of a rewrite.
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.enableCors();
  await app.listen(process.env.PORT ?? 4000);
  // eslint-disable-next-line no-console
  console.log(`GlobeTrotter API on :${process.env.PORT ?? 4000}`);
}
bootstrap();
"""

BACKEND_APP_MODULE_TS = """import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TripsModule } from './modules/trips/trips.module';
import { ItineraryModule } from './modules/itinerary/itinerary.module';
import { RecommendationsModule } from './modules/recommendations/recommendations.module';
import { BudgetModule } from './modules/budget/budget.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    TripsModule,
    ItineraryModule,
    RecommendationsModule,
    BudgetModule,
    NotificationsModule,
    RealtimeModule,
  ],
})
export class AppModule {}
"""

PRISMA_SCHEMA = """// Stage 1 baseline schema (§6 of the brief). Splits per-service in Stage 2:
// Users owns users/sessions, Itinerary owns trips/stops/collaborators/comments,
// Recommendations owns recommendations_cache and reads a read-replica of trips.

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String?
  name         String
  avatarUrl    String?
  travelStyle  String?  // shoestring | comfort | luxury
  homeCurrency String   @default("USD")
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  trips         Trip[]              @relation("owner")
  collaborates  TripCollaborator[]
  comments      Comment[]
  notifications Notification[]
  sessions      Session[]
}

model Session {
  id               String   @id @default(uuid())
  userId           String
  user             User     @relation(fields: [userId], references: [id])
  refreshTokenHash String
  expiresAt        DateTime
  createdAt        DateTime @default(now())
}

model Trip {
  id            String   @id @default(uuid())
  ownerId       String
  owner         User     @relation("owner", fields: [ownerId], references: [id])
  name          String
  coverPhotoUrl String?
  startDate     DateTime
  endDate       DateTime
  budgetPlanned Decimal  @default(0)
  status        String   @default("draft") // draft | upcoming | active | past
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  stops         Stop[]
  collaborators TripCollaborator[]
}

model TripCollaborator {
  tripId String
  userId String
  role   String // owner | editor | viewer
  trip   Trip   @relation(fields: [tripId], references: [id])
  user   User   @relation(fields: [userId], references: [id])

  @@id([tripId, userId])
}

model Stop {
  id         String   @id @default(uuid())
  tripId     String
  trip       Trip     @relation(fields: [tripId], references: [id])
  dayIndex   Int
  orderIndex Int
  name       String
  lat        Float?
  lng        Float?
  startTime  DateTime?
  endTime    DateTime?
  cost       Decimal  @default(0)
  currency   String   @default("USD")
  notes      String?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  comments Comment[]
}

model Comment {
  id        String   @id @default(uuid())
  stopId    String
  stop      Stop     @relation(fields: [stopId], references: [id])
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  body      String
  createdAt DateTime @default(now())
}

model RecommendationCache {
  id          String   @id @default(uuid())
  contextHash String   @unique
  payloadJson Json
  expiresAt   DateTime
}

model Notification {
  id         String    @id @default(uuid())
  userId     String
  user       User      @relation(fields: [userId], references: [id])
  type       String
  payloadJson Json
  readAt     DateTime?
  createdAt  DateTime  @default(now())
}
"""

RECOMMENDATIONS_SERVICE_TS = """import { Injectable, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import CircuitBreaker from 'opossum';
import { PrismaService } from '../../prisma/prisma.service';
import { createHash } from 'crypto';

/**
 * Real AI recommendations, with graceful degradation baked in from day one
 * (this becomes load-bearing in Stage 4, but the fallback path exists now
 * so "AI is down" is never a broken screen — see §5 Stage 4).
 */
@Injectable()
export class RecommendationsService {
  private readonly logger = new Logger(RecommendationsService.name);
  private readonly client = process.env.ANTHROPIC_API_KEY
    ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    : null;

  private readonly breaker = new CircuitBreaker(
    (prompt: string) => this.callModel(prompt),
    { timeout: 8000, errorThresholdPercentage: 50, resetTimeout: 15000 },
  );

  constructor(private prisma: PrismaService) {
    this.breaker.fallback(() => null); // -> caller serves cached/rule-based results
  }

  private async callModel(prompt: string) {
    if (!this.client) throw new Error('no api key configured');
    const res = await this.client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = res.content.find((b) => b.type === 'text');
    return text ? JSON.parse((text as any).text) : null;
  }

  async getRecommendations(tripId: string, interests: string[], budgetStyle: string) {
    const contextHash = createHash('sha1')
      .update(JSON.stringify({ tripId, interests, budgetStyle }))
      .digest('hex');

    const cached = await this.prisma.recommendationCache.findUnique({ where: { contextHash } });
    if (cached && cached.expiresAt > new Date()) return cached.payloadJson;

    const prompt = `Return ONLY JSON: a list of 8 travel recommendations (destinations/activities/
restaurants) for a trip with interests=${interests.join(',')} and budget style=${budgetStyle}.
Each item: {"title","category","blurb","estCost","currency"}.`;

    const result = await this.breaker.fire(prompt).catch(() => null);

    if (result) {
      await this.prisma.recommendationCache.upsert({
        where: { contextHash },
        update: { payloadJson: result, expiresAt: new Date(Date.now() + 6 * 3600_000) },
        create: { contextHash, payloadJson: result, expiresAt: new Date(Date.now() + 6 * 3600_000) },
      });
      return result;
    }

    this.logger.warn('AI unavailable, serving rule-based fallback');
    return this.ruleBasedFallback(interests, budgetStyle);
  }

  private ruleBasedFallback(interests: string[], budgetStyle: string) {
    return interests.slice(0, 8).map((i) => ({
      title: `Explore ${i}`,
      category: i,
      blurb: `Popular ${budgetStyle}-friendly picks tagged "${i}" — refreshed once AI is back.`,
      estCost: budgetStyle === 'luxury' ? 250 : budgetStyle === 'comfort' ? 90 : 25,
      currency: 'USD',
    }));
  }
}
"""

REALTIME_GATEWAY_TS = """import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'ws';

/**
 * Presence + live comment/stop updates for a trip (§3.6, §7 `WS /ws/trips/:id`).
 * Stage 1: in-process. Stage 4: swap the room registry for Redis pub/sub so
 * presence works across multiple gateway instances — nothing above this
 * class needs to change.
 */
@WebSocketGateway({ path: '/ws/trips' })
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private presence = new Map<string, Set<string>>(); // tripId -> set of userIds

  handleConnection(client: Socket) {
    // auth handshake + tripId parsed from query string in production
  }

  handleDisconnect(client: Socket) {
    for (const [tripId, users] of this.presence) {
      users.forEach((u) => this.presence.get(tripId)?.delete(u));
    }
  }

  @SubscribeMessage('join')
  onJoin(_client: Socket, payload: { tripId: string; userId: string }) {
    if (!this.presence.has(payload.tripId)) this.presence.set(payload.tripId, new Set());
    this.presence.get(payload.tripId)!.add(payload.userId);
    this.broadcastPresence(payload.tripId);
  }

  @SubscribeMessage('comment')
  onComment(_client: Socket, payload: { tripId: string; stopId: string; body: string; userId: string }) {
    this.server.clients.forEach((c) => c.send(JSON.stringify({ type: 'comment', ...payload })));
  }

  private broadcastPresence(tripId: string) {
    const users = Array.from(this.presence.get(tripId) ?? []);
    this.server.clients.forEach((c) => c.send(JSON.stringify({ type: 'presence', tripId, users })));
  }
}
"""

CONTRACTS_PACKAGE_JSON = """{
  "name": "@globetrotter/contracts",
  "version": "1.0.0",
  "description": "Zod schemas shared by backend, services, and frontend so DTOs cannot silently drift (§5 Stage 2).",
  "main": "src/index.ts",
  "dependencies": { "zod": "^3.23.8" }
}
"""

CONTRACTS_INDEX_TS = """import { z } from 'zod';

export const TripSchema = z.object({
  id: z.string().uuid(),
  ownerId: z.string().uuid(),
  name: z.string().min(1).max(120),
  coverPhotoUrl: z.string().url().nullable(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  budgetPlanned: z.number().nonnegative(),
  status: z.enum(['draft', 'upcoming', 'active', 'past']),
});
export type Trip = z.infer<typeof TripSchema>;

export const StopSchema = z.object({
  id: z.string().uuid(),
  tripId: z.string().uuid(),
  dayIndex: z.number().int().nonnegative(),
  orderIndex: z.number().int().nonnegative(),
  name: z.string().min(1),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  cost: z.number().nonnegative(),
  currency: z.string().length(3),
  notes: z.string().nullable(),
});
export type Stop = z.infer<typeof StopSchema>;

export const CreateTripDto = TripSchema.pick({
  name: true,
  coverPhotoUrl: true,
  startDate: true,
  endDate: true,
  budgetPlanned: true,
});

export const RecommendationSchema = z.object({
  title: z.string(),
  category: z.string(),
  blurb: z.string(),
  estCost: z.number().nonnegative(),
  currency: z.string().length(3),
});
"""

# ---------------------------------------------------------------------------
# Docker / Kubernetes / CI
# ---------------------------------------------------------------------------

DOCKER_COMPOSE = """# Local dev: everything Stage 1 needs in one command.
# `docker compose -f docker/docker-compose.yml up`
version: "3.9"
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: globetrotter
      POSTGRES_PASSWORD: globetrotter
      POSTGRES_DB: globetrotter
    ports: ["5432:5432"]
    volumes: [db-data:/var/lib/postgresql/data]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U globetrotter"]
      interval: 5s
      timeout: 5s
      retries: 10

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  backend:
    build:
      context: ../backend
      dockerfile: ../docker/backend.Dockerfile
    env_file: ../.env
    depends_on: [db, redis]
    ports: ["4000:4000"]

  frontend:
    build:
      context: ../frontend
      dockerfile: ../docker/frontend.Dockerfile
    ports: ["5173:5173"]
    depends_on: [backend]

volumes:
  db-data:
"""

BACKEND_DOCKERFILE = """# Multi-stage: build stage + slim non-root runtime (§5 Stage 3)
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate && npm run build

FROM node:20-alpine AS runtime
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
USER app
EXPOSE 4000
HEALTHCHECK --interval=15s --timeout=3s CMD wget -qO- http://localhost:4000/api/v1/health || exit 1
CMD ["node", "dist/main.js"]
"""

FRONTEND_DOCKERFILE = """FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS runtime
RUN adduser -D -H -u 1001 app
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 5173
HEALTHCHECK --interval=15s --timeout=3s CMD wget -qO- http://localhost:5173 || exit 1
CMD ["nginx", "-g", "daemon off;"]
"""

K8S_DEPLOYMENT = """# Stage 3: one Deployment per service. Recommendations gets its own
# HPA (below) because it's the spikiest — bursty AI calls (§5 Stage 3).
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  labels: { app: globetrotter-backend }
spec:
  replicas: 2
  selector:
    matchLabels: { app: globetrotter-backend }
  template:
    metadata:
      labels: { app: globetrotter-backend }
    spec:
      containers:
        - name: backend
          image: globetrotter/backend:latest
          ports: [{ containerPort: 4000 }]
          envFrom:
            - secretRef: { name: globetrotter-secrets }
          readinessProbe:
            httpGet: { path: /api/v1/health, port: 4000 }
            initialDelaySeconds: 5
          livenessProbe:
            httpGet: { path: /api/v1/health, port: 4000 }
            initialDelaySeconds: 15
---
apiVersion: v1
kind: Service
metadata: { name: backend }
spec:
  selector: { app: globetrotter-backend }
  ports: [{ port: 80, targetPort: 4000 }]
"""

K8S_HPA = """apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata: { name: recommendations-hpa }
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: recommendations
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource: { name: cpu, target: { type: Utilization, averageUtilization: 60 } }
    - type: Pods
      pods:
        metric: { name: http_request_duration_p95_ms }
        target: { type: AverageValue, averageValue: "400" }
"""

GH_ACTIONS_CI = """name: ci
on:
  push: { branches: [main] }
  pull_request:
jobs:
  build-test:
    strategy:
      matrix:
        service: [backend, frontend]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
        working-directory: ${{ matrix.service }}
      - run: npm run lint
        working-directory: ${{ matrix.service }}
      - run: npm test --if-present
        working-directory: ${{ matrix.service }}
      - run: npm run build
        working-directory: ${{ matrix.service }}
"""

# ---------------------------------------------------------------------------
# Docs / scripts
# ---------------------------------------------------------------------------

API_CONTRACT_MD = """# API Contract — stable across all 4 stages (§7)

Base: `/api/v1`. Every mutating endpoint accepts `Idempotency-Key`.
Every list endpoint is cursor-paginated.

See root README for the full endpoint table. This file is the source of
truth the frontend codes against — if a Stage 2 split changes anything
here, that's a bug, not a refactor.
"""

DEV_SCRIPT_SH = """#!/usr/bin/env bash
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
"""

SETUP_SCRIPT_SH = """#!/usr/bin/env bash
set -euo pipefail
cp -n .env.example .env || true
echo "Copied .env.example -> .env. Fill in ANTHROPIC_API_KEY and OAuth secrets."
"""

GITKEEP = ""
