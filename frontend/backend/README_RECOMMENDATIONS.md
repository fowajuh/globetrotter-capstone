# Discover / Recommendations — real Google Places wiring

`/backend` wasn't part of the uploaded zip, so these three files
(`src/services/googlePlaces.ts`, `src/routes/recommendations.ts`,
`src/routes/places.ts`) are new, standalone pieces to drop into your existing
backend project — they assume Express + Prisma, matching the REST shape
(`/api/v1/...`) and Prisma usage implied by `_env.example` and the login
page's `npm run prisma:seed` reference.

## What this replaces

Whatever the current `GET /trips/:tripId/recommendations` handler is doing —
if it's returning mock/placeholder rows, this replaces it with **live Google
Places results**: real names, real ratings/review counts, real photos (via
a server-side proxy so the key stays hidden), and real "open in Google Maps"
links, centered on the trip's actual stops (falling back to a geocoded
destination if the trip has no stops plotted yet).

The frontend (`src/routes/recommendations.tsx` in the app zip) already
expected exactly this shape (`photoUrl`, `rating`, `reviewCount`,
`googlePlaceId`, `googleMapsUrl`) — it was fully built for real data; it just
needed a real data source behind it. It's also been updated to dismiss/key
recommendations by `googlePlaceId` instead of by title, since Google's Place
ID is the actual stable identifier.

## 1. Environment variable (backend only — do NOT prefix with VITE_)

```
GOOGLE_PLACES_API_KEY=AIzaSy...a-server-only-key...
```

This must be a **different key** from the frontend's
`VITE_GOOGLE_MAPS_API_KEY`. Create it in Google Cloud Console, restrict it to
your server's IP (not an HTTP referrer restriction — there's no browser
involved here), and enable only the **Places API** (legacy) product on it.

## 2. Mount the routers

Wherever your Express app currently mounts the trips/auth routers under
`/api/v1`:

```ts
import { recommendationsRouter } from "./routes/recommendations";
import { placesRouter } from "./routes/places";

app.use("/api/v1", recommendationsRouter);
app.use("/api/v1", placesRouter);
```

Remove/retire the old recommendations handler so there's only one route
handling that path.

## 3. Prisma schema addition

`recommendations.ts` assumes a `DismissedRecommendation` model so dismissed
places don't reappear for that user:

```prisma
model DismissedRecommendation {
  userId    String
  placeId   String
  createdAt DateTime @default(now())

  @@id([userId, placeId])
}
```

Run `npx prisma migrate dev` after adding it.

## 4. Two assumptions you may need to adjust

`recommendations.ts` guesses at a couple of things it couldn't know without
your actual schema/middleware:

- `import { prisma } from "../prisma"` — point this at wherever your Prisma
  client singleton actually lives.
- `import { requireAuth } from "../middleware/auth"` — point this at your
  actual auth middleware; it's expected to set `req.user.id` from the
  Bearer token (the same one issued by `/auth/login`, `/auth/signup`, and
  now `/auth/oauth/clerk`).
- `trip.destinationCode`, `trip.destination`, `trip.budgetCurrency` — used
  only as a fallback geocoding hint / currency label. Rename to match your
  actual `Trip` model's fields if they differ.

## 5. What's a heuristic, not real data

Google's Places API doesn't return actual menu/ticket prices for most place
types — only a 0–4 `price_level` bucket. `PRICE_LEVEL_TO_EST_COST` turns that
into a rough per-person USD-ish estimate so the existing "Est. cost" UI has
something reasonable to show. It's a stated approximation, not pulled-from-
the-real-world pricing — worth calling out if this ships to real users.
