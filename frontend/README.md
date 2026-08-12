# Manifest Travel

GlobeTrotter — Master Build Prompt

> Copy this entire document into Claude Code / Cursor / your agent of choice as the system brief. It is written to be handed to an AI builder directly. Every section is a hard requirement, not a suggestion — sections marked NON-NEGOTIABLE will be checked against the shipped product.

---

0. What GlobeTrotter is

GlobeTrotter is a trip-planning app: people build multi-city itineraries, get AI-assisted recommendations, track budget, and share trips with travel companions. It ships in four engineering stages (below), but the product experience must feel finished from Stage 1 — the same polished frontend sits on top of a backend that gets more sophisticated underneath it. Users should never see a "student project," and by Stage 4 the infra should survive real production load.

---

1. Design Philosophy — NON-NEGOTIABLE

Do not default to what every AI-generated app looks like right now. Specifically banned, no exceptions:

- Cream/off-white background (`#F4F1EA`-ish) with a serif display headline and a terracotta/clay accent.
- Near-black background with a single neon-green or neon-vermilion accent.
- Generic centered hero card, big number + small label, purple-blue gradient blob, rounded-xl-everything shadcn defaults left untouched.
- Inter/system-ui as the only typeface. Generic 8px-grid "Material-but-not" spacing with no personality.
- Numbered feature markers (01 / 02 / 03) used as decoration rather than because the content is actually sequential.

Instead, commit to this concrete identity (ground everything you build in it — do not reinterpret):

Visual identity: "Flight Manifest"
The whole app is grounded in the physical objects of travel — boarding passes, ticket stubs, luggage tags, manifest sheets, customs stamps — reinterpreted as a clean modern interface, not a skeuomorphic pastiche.

Color tokens
| Token | Hex | Use |
|---|---|---|
| `departure-navy` | `#16223F` | primary dark surface, headers, nav |
| `cloud-white` | `#FAF8F4` | primary light surface |
| `runway-sand` | `#E7DCC5` | secondary surface, cards on dark |
| `beacon-amber` | `#F2A03D` | primary CTA, active states |
| `horizon-teal` | `#2E7D6B` | confirmed/success, "booked" states |
| `runway-red` | `#E15241` | alerts, over-budget, delays |
| `ink-90` | `#0E1626` | body text on light |

Typography
- Display: Fraunces (variable, use optical size + soft weight) for trip names, city headers — set with slightly negative tracking at large sizes for a printed-ticket feel.
- Body/UI: IBM Plex Sans — humanist, slightly technical, ties to the manifest aesthetic.
- Data/numeric: IBM Plex Mono for all prices, dates, flight times, coordinates, countdown timers — this is what makes it feel like real travel data, not a generic app.

Signature element (the one thing this app is remembered by):
The itinerary is rendered as a vertical manifest strip — each day is a torn-ticket-stub card connected by a perforated divider (real CSS, not an image: `border-top: dashed` + a repeating semicircle mask cut into each edge). Scrolling through a trip feels like unfolding a boarding pass booklet. This motif reappears at smaller scale for the bottom sheet drag-handle (looks like a ticket perforation) and for the tab bar's active-state notch.

Motion direction: confident and mechanical, not bouncy-cute. Think airport departure-board flips and paper-fold transitions, not spring-jelly overshoot. Use `cubic-bezier(0.22, 1, 0.36, 1)` as the house easing. One orchestrated signature moment (see onboarding, §3.6) — do not scatter micro-animations everywhere just to prove motion was used.

---

2. Frontend Stack

- React 18 + Vite, TypeScript strict mode.
- Routing: React Router v6 (data router) with route-level code splitting.
- State: TanStack Query for all server state (caching, retries, optimistic updates baked in from Stage 1 so it's trivial to point at new services later); Zustand for local/UI state (active bottom sheet, onboarding step, theme).
- Animation: Framer Motion for layout/page transitions and shared-element transitions (e.g., a destination card morphing into the trip detail hero); Lenis for smooth scroll; native CSS `@starting-style`/view-transitions API where supported, Framer as fallback.
- Gestures: `@use-gesture/react` + Framer Motion `drag` for swipe-to-dismiss, swipe-between-days, pull-to-refresh, drag-to-reorder itinerary stops.
- Bottom sheets: build a custom `<Sheet>` primitive (Vaul-style) with three snap points (peek / half / full), rubber-band overscroll, and the perforated drag handle from §1. Every secondary action (filters, trip settings, add-stop, share) opens in a sheet on mobile widths, a popover/panel on desktop — same component, responsive behavior.
- Maps: Mapbox GL JS (custom style matching the navy/sand palette — no default Mapbox blue).
- Forms: React Hook Form + Zod schema validation shared with backend DTOs (see §7).
- Styling: Tailwind for utility/layout + CSS variables for the design tokens above (no hard-coded hex in components) + a small number of hand-written CSS files for the manifest/perforation motifs, which are too bespoke for utility classes.
- PWA: installable, offline-capable itinerary viewing (service worker caches last-viewed trips), so the app behaves like a native billion-dollar app on mobile.

---

3. Screens & Required Interaction Detail

Every screen below must ship with: entrance transition, empty state, loading (skeleton, not spinner), error state, and at least one gesture or micro-interaction beyond click.

3.1 Onboarding (first launch only)
4-step flow, swipeable (not just "Next" button): Where do you dream of going → How do you travel (solo/partner/family/friends) → Budget style (shoestring/comfort/luxury) → Notification permission. Background is a slowly rotating low-poly globe (WebGL, `react-globe.gl` or custom three.js) that tilts toward the region the user taps. Progress indicator is a manifest perforation strip that "tears off" one stub per completed step. Skippable, but skip button is deliberately understated (ghost text, bottom corner) so the flow itself sells the app.

3.2 Home / Trips Dashboard
- Horizontal "upcoming trip" card carousel with parallax cover photos and a countdown in `IBM Plex Mono`.
- Below it, a vertical list of past/draft trips as manifest-stub rows; swipe left on a row reveals Archive/Delete; swipe right reveals Duplicate.
- Pull-to-refresh with a custom departure-board "flip" animation instead of a generic spinner.
- Floating action button morphs (shared layout animation) into the "New Trip" full-screen composer when tapped, not a hard navigation cut.

3.3 Trip Detail (the manifest strip)
- Sticky header photo that parallax-scrolls and crossfades into a compact navy bar with trip name once scrolled.
- Day-by-day manifest strip (see §1). Long-press a stop to enter reorder mode (haptic-style scale+shadow pop via Framer, drag with `@use-gesture`).
- Tapping a stop expands it inline (shared element, not a new page) into details: time, map thumbnail, cost, notes, attached booking confirmation.
- Bottom sheet, peek state always visible: running budget bar (spent vs. planned) in horizon-teal/runway-red.
- Swipe between days horizontally like tabs, with the manifest perforation animating a "tear" between them.

3.4 Recommendations
- Card stack (Tinder-style swipe: right = add to trip, left = dismiss, up = save for later) for AI-generated destination/activity suggestions, physics-based with rotation on drag.
- Filter sheet (bottom sheet) with chips for interests, budget, pace.
- Adding a card triggers a shared-element flight from the card's position into the manifest strip on the trip screen (cross-screen animation via a global animation layer/context).

3.5 Budget
- Animated stacked bar / radial chart (D3 or Recharts, restyled with the palette — no default chart-library look) that morphs when switching between "by category" and "by day" — not a hard reload.
- Over-budget triggers a subtle runway-red pulse on the relevant manifest stub, not a modal interruption.

3.6 Social / Sharing
- Real-time presence avatars (who else is viewing/editing this trip) — this is the feature that needs Stage 2+ infra (see §5) to actually work live.
- Comment threads attached to specific itinerary stops, opened as a bottom sheet.
- Share sheet uses the native Web Share API on mobile, custom share card generator (canvas-rendered "boarding pass" image of the trip) for social/link sharing.

3.7 Settings / Profile
- Standard, but even here: theme toggle (light manifest / dark departure-navy) animates via a circular reveal from the toggle's position, not a flash.

Global requirements across all screens: page transitions are directional (forward = slide+fade in from right, back = reverse), respect `prefers-reduced-motion` by disabling non-essential motion, full keyboard navigation and visible focus rings even though the app is gesture-first, and a real 404/offline screen in the same visual language (not a browser default).

---

4. Product Feature Set (full list, backend-relevant)

- Auth (email+password, OAuth Google/Apple, magic link)
- Trip CRUD, multi-city itineraries with ordered stops, dates, notes, attachments
- Collaborators per trip (owner/editor/viewer roles)
- Recommendations engine (destinations, activities, restaurants) based on profile + trip context
- Budget tracking with per-stop cost and currency conversion
- Real-time presence + comments on trips
- Notifications (push + email): trip reminders, price drops, collaborator activity
- Search (destinations, past trips, within a trip)

---

5. Backend Evolution — the four stages

The same REST/GraphQL contract (§7) should remain externally stable across all four stages; only what's behind the API gateway changes. This is the point of the exercise: the frontend never has to change because of infra evolution.

Stage 1 — Monolith
- Single Node.js (NestJS or Express) service, single Postgres database.
- Modules: `auth`, `users`, `trips`, `itinerary`, `recommendations`, `budget`, `notifications` — organized as folders/modules within the monolith from day one, using clean module boundaries (own DTOs, own service layer, no reaching into another module's repository directly) so the Stage 2 split is a refactor, not a rewrite.
- REST API, JWT auth, Postgres via Prisma or TypeORM.
- Goal: ship the full product experience end-to-end on the simplest possible infra.

Stage 2 — Microservices
Split the monolith along its existing module boundaries into independently deployable services:
- Users Service — auth, profile, preferences. Owns the `users`, `sessions` tables.
- Itinerary Service — trips, stops, collaborators, comments. Owns `trips`, `stops`, `collaborators`, `comments`.
- Recommendations Service — destination/activity suggestions; can be the one service that calls an external LLM/embeddings API. Owns `recommendation_cache`, reads a read-replica of itinerary data.
- Budget & Notifications can start as sub-modules of Itinerary and be split out later if load justifies it — don't over-decompose prematurely.

Introduce:
- API Gateway (e.g., Kong, or a thin Express/NestJS gateway) — single entry point for the frontend, handles auth verification, request routing, rate limiting.
- Service-to-service communication over internal REST or gRPC; each service owns its own database/schema (database-per-service) — no cross-service joins.
- Shared contracts via a small internal `@globetrotter/contracts` package (Zod schemas) so DTOs can't silently drift between services and the frontend.

Stage 3 — Cloud Deployment
- Docker: every service gets its own multi-stage Dockerfile (build stage + slim runtime stage, non-root user, health-check endpoint).
- docker-compose for local dev spinning up all services + Postgres + Redis + a message broker in one command.
- Orchestration/deploy target: containers behind an Application Load Balancer, deployed to ECS Fargate, GKE, or a Kubernetes cluster (pick one and be consistent — Kubernetes manifests with a Helm chart is the more "resume-real" choice if the course wants k8s depth).
- Auto-scaling: horizontal pod/task autoscaling on CPU + request-latency metrics; Recommendations Service in particular should scale independently since it's the spikiest (bursty AI calls).
- CI/CD: GitHub Actions — lint/test/build/push-image/deploy pipeline per service, with a shared reusable workflow.
- Observability: structured logging (pino/winston) shipped to a central place, basic metrics (Prometheus) + dashboards (Grafana), distributed tracing (OpenTelemetry) across the gateway → services boundary so a single request can be followed end-to-end.

Stage 4 — Resilience
- Caching: Redis in front of Recommendations (cache AI responses per user-context hash) and Itinerary reads (cache-aside for trip detail, invalidated on write). Cache the API Gateway's auth/session lookups too.
- Message queues: RabbitMQ or Kafka for anything that doesn't need a synchronous response — notification dispatch, recommendation pre-computation, comment fan-out to collaborators, analytics events. Itinerary Service publishes `trip.updated` events; Notifications Service and a search-index updater both consume them independently.
- Fault tolerance:
  - Circuit breakers (e.g., Opossum for Node) around every cross-service call and the external LLM call, with sane fallbacks (serve cached/stale recommendations rather than erroring).
  - Retry with exponential backoff + jitter for transient failures; idempotency keys on write endpoints so retried requests can't double-book/double-charge.
  - Bulkheads: isolate the Recommendations Service's thread/connection pool so a slow AI provider can't starve the rest of the gateway.
  - Graceful degradation: if Recommendations is down, the trip experience still fully works — recommendations panel shows a "come back later" state, not a broken app.
  - Database: read replicas for Itinerary reads, connection pooling (PgBouncer), automated backups + point-in-time recovery.
  - Chaos testing pass at the end: kill a service instance mid-demo and show the app survives (this is the actual "wow" moment of the course).

---

6. Database (Stage 1 baseline schema, later split per-service)

Core tables to start from (Postgres, UUID PKs, `created_at`/`updated_at` on everything):

- `users(id, email, password_hash, name, avatar_url, travel_style, home_currency)`
- `trips(id, owner_id, name, cover_photo_url, start_date, end_date, budget_planned, status)`
- `trip_collaborators(trip_id, user_id, role)` — role: owner/editor/viewer
- `stops(id, trip_id, day_index, order_index, name, location(lat,lng), start_time, end_time, cost, currency, notes)`
- `comments(id, stop_id, user_id, body, created_at)`
- `recommendations_cache(id, context_hash, payload_json, expires_at)`
- `notifications(id, user_id, type, payload_json, read_at)`
- `sessions(id, user_id, refresh_token_hash, expires_at)`

---

7. API Contract Shape (stays stable across all 4 stages)

REST, versioned under `/api/v1`. Representative endpoints:

```
POST   /api/v1/auth/signup
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh

GET    /api/v1/trips                    # list current user's trips
POST   /api/v1/trips
GET    /api/v1/trips/:id
PATCH  /api/v1/trips/:id
DELETE /api/v1/trips/:id

POST   /api/v1/trips/:id/stops
PATCH  /api/v1/stops/:id
PATCH  /api/v1/stops/:id/reorder

GET    /api/v1/trips/:id/recommendations
POST   /api/v1/recommendations/:id/dismiss

GET    /api/v1/trips/:id/budget-summary

WS     /ws/trips/:id                     # presence + live comment/stop updates
```

Every mutating endpoint accepts an `Idempotency-Key` header (needed for Stage 4 retry safety). Every list endpoint is cursor-paginated from day one so it doesn't need to change when data volume grows in Stage 3.

---

8. Build Order (suggested)

1. Design tokens + core primitives (`Sheet`, `ManifestStrip`, buttons, inputs) as a mini component library before any real screen — this prevents "AI slop drift" screen by screen.
2. Auth + Trips CRUD monolith, wired to the polished frontend, deployed somewhere simple (Render/Fly.io) so there's a working v1 fast.
3. Fill out Recommendations, Budget, Social on top of the same monolith.
4. Split into microservices behind the gateway; frontend should require zero changes if the contract in §7 was respected.
5. Containerize, deploy with load balancing + autoscaling, add CI/CD.
6. Layer in caching, queues, circuit breakers; run the chaos test.

---

9. Definition of Done Checklist

- [ ] No screen uses a spinner as its only loading state — skeletons everywhere.
- [ ] No screen looks correct only at desktop width — mobile-first, gesture-first.
- [ ] At least one shared-element / cross-screen animation (card → detail).
- [ ] Bottom sheets used for every secondary action on mobile.
- [ ] Onboarding has a real signature moment, not a generic 3-slide carousel with dots.
- [ ] Reduced-motion respected; keyboard nav fully works.
- [ ] Same frontend runs unmodified against monolith and microservices backends.
- [ ] Killing one backend service in Stage 4 does not crash the whole/full app .This is a billion dollar app so respect that. (no ai slop will be tolerated).  using all the font in the given image above in this app

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/76525abc-a362-4536-8bd1-1227534698e9).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
