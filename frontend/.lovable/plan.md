
# GlobeTrotter — Build Plan

Your spec is a full 4-stage product. I'll scope this iteration honestly instead of pretending one turn ships all of it. This plan covers **Stage 1 frontend + design system**, which is the prerequisite for everything else and the piece that makes the "no AI slop" bar visible.

## What ships in this iteration

### 1. Design system ("Flight Manifest")
- Tokens in `src/styles.css`: `departure-navy #16223F`, `cloud-white #FAF8F4`, `runway-sand #E7DCC5`, `beacon-amber #F2A03D`, `horizon-teal #2E7D6B`, `runway-red #E15241`, `ink-90 #0E1626`. Mapped to Tailwind v4 `@theme` semantic tokens (`--color-background`, `--color-primary`, etc.).
- Fonts loaded via `<link>` in `__root.tsx`: Fraunces (display), IBM Plex Sans (UI), IBM Plex Mono (data). Utility classes `font-display`, `font-sans`, `font-mono`.
- Signature CSS motif: perforated / torn-ticket edge as a reusable class using `mask-image` with repeating radial gradients — no images.
- House easing token `--ease-manifest: cubic-bezier(0.22, 1, 0.36, 1)`.
- `prefers-reduced-motion` handling globally.

### 2. Core primitives (mini component library first — before screens)
- `ManifestStub` — torn-ticket card with perforated top/bottom edges.
- `ManifestStrip` — vertical list of stubs joined by dashed perforation dividers.
- `Sheet` — Vaul-style bottom sheet with 3 snap points, perforation drag handle, desktop popover fallback. Uses Framer Motion drag + `@use-gesture/react`.
- `FlipCountdown` — departure-board flip digits in IBM Plex Mono.
- `Button` variants: `primary` (amber), `ghost`, `stamp` (customs-stamp outline).
- Skeleton primitives (no spinners).

### 3. Screens (Stage 1 slice, mock data via TanStack Query)
- **Onboarding** (4 steps, swipeable, perforation progress strip that tears off per step; low-poly globe via `react-globe.gl`).
- **Trips Dashboard** (horizontal upcoming carousel with parallax + flip countdown; vertical past-trip stubs with swipe actions).
- **Trip Detail** (manifest strip, sticky parallax header, inline expand-on-tap stop, horizontal day swipe with tear animation, peek budget sheet).
- **Recommendations** (swipe card stack).
- **Budget** (restyled Recharts).
- **Settings** with circular-reveal theme toggle.
- **404 / offline** in the same visual language.

All screens: entrance transition, skeleton loading, empty state, error state, ≥1 gesture, keyboard nav, focus rings.

### 4. Routing + state
- TanStack Router (already the stack — React Router v6 is not compatible with this template; I'll flag this deviation and use TanStack Router equivalents: data loaders, code-split routes).
- TanStack Query for server state with mocked fetchers (swap for real API in step 2).
- Zustand for UI state (sheet, onboarding, theme).
- Zod schemas in `src/lib/contracts/` — the seed of the future `@globetrotter/contracts` package.

### 5. PWA scaffolding
- Manifest + service worker (vite-plugin-pwa) caching last-viewed trips.

## What is explicitly **not** in this iteration

- Stage 1 backend (Nest monolith + Postgres), Stages 2–4 (microservices, Docker, k8s, Redis, queues, circuit breakers, chaos test).
- Real auth, real DB, real Mapbox integration (screens will use mock data and a styled static map placeholder until backend + `VITE_MAPBOX_TOKEN` exist).
- Real-time presence / WebSockets (needs backend).
- AI recommendations (needs backend + Lovable AI Gateway).

Those are large enough to be their own iterations. After this ships, tell me which to tackle next and I'll build it against the stable contract in §7.

## Technical notes

- **Router deviation**: your spec says React Router v6; this Lovable template is TanStack Start / TanStack Router and swapping routers would break SSR, the route tree, and auth middleware. I'll implement the same routing behavior (data loaders, code splitting, nested layouts, directional page transitions) using TanStack Router. Contract-level behavior is identical.
- **Backend when we get there**: Lovable Cloud (Supabase under the hood) is the fastest path to Stage 1's auth + Postgres + storage without external accounts. The Nest monolith described in §5 is possible but requires external hosting. I'll ask before we start Stage 1 backend.
- Fonts from the reference image (Movault, Balimo, Allio, Hightone, Honest, Intrade, etc.) are commercial fonts not on Google Fonts; I'll use Fraunces + IBM Plex per your written spec, which is the identity that actually matches "Flight Manifest." If you have licenses for the pinned display faces, drop the `.woff2` files and I'll wire them in.

## Deliverable of this iteration

A polished, gesture-first, mobile-first Stage 1 **frontend** running on mock data, with the Flight Manifest design system fully realized, ready to point at the real API once we build it.

Reply **go** to build this, or tell me to reshape scope (e.g. "skip PWA + onboarding globe, ship dashboard + trip detail only first").
