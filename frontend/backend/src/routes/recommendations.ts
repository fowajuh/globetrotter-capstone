import { Router } from "express";
import { nearbySearch, findPlaceLocation, type GooglePlace } from "../services/googlePlaces";
// Adjust these two imports to match your actual project structure —
// they're the two things this file needs from "the rest of the backend"
// that weren't included in this zip.
import { prisma } from "../prisma"; // your Prisma client singleton
import { requireAuth } from "../middleware/auth"; // sets req.user from the access token

export const recommendationsRouter = Router();

/** Maps GlobeTrotter's interest tags (frontend ALL_INTERESTS) to Google
 * Places "type" values. Extend this if you add more interests. */
const INTEREST_TO_PLACE_TYPE: Record<string, string> = {
  food: "restaurant",
  culture: "museum",
  outdoors: "park",
  nightlife: "bar",
  art: "art_gallery",
  shopping: "shopping_mall",
};

/** Maps GlobeTrotter's budget style to Google's 0–4 price_level range. */
const BUDGET_TO_PRICE_RANGE: Record<string, { minPrice?: number; maxPrice?: number }> = {
  shoestring: { maxPrice: 1 },
  comfort: { minPrice: 1, maxPrice: 3 },
  luxury: { minPrice: 3 },
};

/** Google doesn't return real prices for most place types — price_level is
 * a 0-4 bucket, not a currency amount. This turns that bucket into a rough
 * per-person cost estimate so the existing "Est. cost" UI has something
 * honest-ish to show. Treat as a heuristic, not real pricing data. */
const PRICE_LEVEL_TO_EST_COST: Record<number, number> = {
  0: 8,
  1: 18,
  2: 35,
  3: 70,
  4: 150,
};

type Recommendation = {
  id: string;
  title: string;
  category: string;
  blurb: string;
  estCost: number;
  currency: string;
  city?: string;
  country?: string;
  lat: number;
  lng: number;
  photoUrl?: string;
  googlePlaceId: string;
  googleMapsUrl: string;
  rating?: number;
  reviewCount?: number;
};

function buildBlurb(place: GooglePlace, category: string): string {
  const bits: string[] = [];
  if (place.rating) bits.push(`Rated ${place.rating.toFixed(1)}/5`);
  if (place.user_ratings_total) {
    bits.push(`from ${place.user_ratings_total.toLocaleString()} travelers`);
  }
  const near = place.vicinity ? ` near ${place.vicinity}` : "";
  const lead = bits.length ? `${bits.join(" ")} — ` : "";
  return `${lead}a real, currently-listed ${category} spot${near}.`;
}

function toRecommendation(place: GooglePlace, category: string, currency: string): Recommendation {
  return {
    id: place.place_id,
    title: place.name,
    category,
    blurb: buildBlurb(place, category),
    estCost:
      place.price_level !== undefined ? PRICE_LEVEL_TO_EST_COST[place.price_level] : 30,
    currency,
    city: place.vicinity, // short formatted address Google returns, e.g. "Shibuya, Tokyo"
    lat: place.geometry.location.lat,
    lng: place.geometry.location.lng,
    // Routed through our own /places/photo proxy (see routes/places.ts) so
    // the Places API key never appears in a URL sent to the browser.
    photoUrl: place.photos?.[0]
      ? `/api/v1/places/photo/${encodeURIComponent(place.photos[0].photo_reference)}?maxwidth=1200`
      : undefined,
    googlePlaceId: place.place_id,
    googleMapsUrl: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
    rating: place.rating,
    reviewCount: place.user_ratings_total,
  };
}

/**
 * GET /trips/:tripId/recommendations?interests=food,culture&budgetStyle=comfort
 *
 * Replaces whatever placeholder/mock recommendation generator this endpoint
 * used to have with live Google Places results centered on the trip.
 */
recommendationsRouter.get("/trips/:tripId/recommendations", requireAuth, async (req, res) => {
  try {
    const { tripId } = req.params;
    const interests = String(req.query.interests ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const budgetStyle = String(req.query.budgetStyle ?? "comfort");

    // --- 1. Find a real lat/lng to center the search on -----------------
    // Adjust the `select`/field names below to match your actual Prisma
    // schema if they differ (this assumes a Trip with Stops that have
    // optional lat/lng, mirroring src/lib/api-client.ts's ApiStop/ApiTrip).
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { stops: true },
    });
    if (!trip) {
      return res.status(404).json({ error: { message: "Trip not found" } });
    }

    const anchor = trip.stops.find(
      (s: { lat: number | null; lng: number | null }) => s.lat != null && s.lng != null,
    );
    let lat = anchor?.lat as number | undefined;
    let lng = anchor?.lng as number | undefined;

    if (lat == null || lng == null) {
      // No stops plotted yet — geocode the destination as a fallback so
      // Discover still works from the very first day of planning a trip.
      const geocoded = await findPlaceLocation(
        `${trip.destinationCode ?? trip.destination ?? ""} airport`,
      );
      if (!geocoded) {
        // Being honest beats faking data: if we truly can't place this trip
        // anywhere real yet, return an empty queue rather than mock stops.
        return res.json([]);
      }
      lat = geocoded.lat;
      lng = geocoded.lng;
    }

    // --- 2. Exclude anything this user already swiped left on -----------
    const userId = req.user?.id;
    const dismissed = userId
      ? await prisma.dismissedRecommendation.findMany({
          where: { userId },
          select: { placeId: true },
        })
      : [];
    const dismissedIds = new Set(dismissed.map((d: { placeId: string }) => d.placeId));

    // --- 3. Real Places search, one call per selected interest ----------
    const priceRange = BUDGET_TO_PRICE_RANGE[budgetStyle] ?? {};
    const wantedInterests = interests.length ? interests : Object.keys(INTEREST_TO_PLACE_TYPE);
    const currency = trip.budgetCurrency ?? "USD";

    const perInterest = await Promise.all(
      wantedInterests.map(async (interest) => {
        const type = INTEREST_TO_PLACE_TYPE[interest];
        if (!type) return [] as Recommendation[];
        const places = await nearbySearch({
          lat: lat as number,
          lng: lng as number,
          radiusMeters: 8000,
          type,
          ...priceRange,
        });
        return places
          .filter((p) => !dismissedIds.has(p.place_id))
          .slice(0, 6)
          .map((p) => toRecommendation(p, interest, currency));
      }),
    );

    // Interleave categories (1 food, 1 culture, 1 outdoors, 2nd food, ...)
    // instead of grouping them, so the swipe queue doesn't run through six
    // restaurants in a row before switching topics.
    const nonEmpty = perInterest.filter((list) => list.length > 0);
    const interleaved: Recommendation[] = [];
    let i = 0;
    while (nonEmpty.some((list) => list.length > i)) {
      for (const list of nonEmpty) if (list[i]) interleaved.push(list[i]);
      i += 1;
    }

    res.json(interleaved);
  } catch (err) {
    console.error("[recommendations] failed", err);
    res.status(500).json({ error: { message: "Failed to load recommendations" } });
  }
});

/**
 * POST /recommendations/:placeId/dismiss
 * `:placeId` is the real Google Place ID (frontend now sends
 * rec.googlePlaceId, not the title — see src/routes/recommendations.tsx).
 */
recommendationsRouter.post("/recommendations/:placeId/dismiss", requireAuth, async (req, res) => {
  const { placeId } = req.params;
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: { message: "Not authenticated" } });

  await prisma.dismissedRecommendation.upsert({
    where: { userId_placeId: { userId, placeId } },
    update: {},
    create: { userId, placeId },
  });

  res.json({ ok: true, dismissed: placeId });
});
