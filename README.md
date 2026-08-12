# GlobeTrotter

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
cd backend && npm install
npx prisma generate
npx prisma migrate deploy   # applies the hand-authored 20260730000000_init migration
npx prisma db seed          # creates demo@globetrotter.app / globetrotter-demo with a real trip
npm run start:dev

# in a second terminal
cd frontend && npm install && npm run dev
```

Or skip all of the above and run `docker compose -f docker/docker-compose.yml up`
— the backend container runs migrations + the seed automatically on boot.

## Status — what's actually real right now

Being direct about this instead of letting the folder structure imply more
than what's wired up:

**Real, working, backed by Postgres:**
- Auth (argon2 password hashing, JWT access/refresh with rotation)
- Trip/stop/collaborator CRUD with role-gated permissions
- Comments, persisted — including comments sent over the live WebSocket,
  which now go through the same service as the REST endpoint instead of
  just being broadcast and forgotten
- Budget aggregation off live stop data
- AI recommendations — a real Anthropic API call wrapped in a circuit
  breaker with a rule-based fallback and Postgres caching
- The frontend (dashboard, trip detail, discover, budget) calls all of the
  above through TanStack Query — nothing in those four screens reads from
  `mock-data.ts` anymore
- WebSocket presence + comment fan-out, authenticated with the same JWT as
  the REST API

**Known gaps, not papered over:**
- No trip-settings UI yet for editing `originCode`/`destinationCode`/cover
  photo after creation — new trips show "???" for origin/destination until
  you PATCH them directly
- Recommendation "dismiss" has no stable ID to key off (the AI response
  doesn't return one) — dismissal currently keys off the title, which is
  fine for a demo, not for production
- Stage 2–4 (microservices split, Kubernetes, chaos testing) are scaffolded
  as a roadmap, not built — doing that properly means splitting real
  running services against real load, not generating folders that look
  like it happened


## Regenerating structure

`python scaffold.py` is idempotent — it never overwrites a file that
already has real content in it, it only fills in what's missing. Run it
again any time you add a new entry to `generator/architecture.py`.
