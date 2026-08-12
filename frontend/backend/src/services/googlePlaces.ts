/**
 * Thin, server-only wrapper around the Google Places Web Service.
 *
 * IMPORTANT: GOOGLE_PLACES_API_KEY is a *separate* key from the frontend's
 * VITE_GOOGLE_MAPS_API_KEY. It must never be sent to the browser — it's used
 * exclusively from this file, on the server. Restrict it in Google Cloud
 * Console by server IP (not HTTP referrer), and only enable the "Places API"
 * (legacy) product on it.
 *
 * Get a key: https://console.cloud.google.com/ -> APIs & Services ->
 * Credentials -> Create Credentials -> API key. Then APIs & Services ->
 * Library -> enable "Places API".
 */

const PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const PLACES_BASE = "https://maps.googleapis.com/maps/api/place";

if (!PLACES_API_KEY) {
  // Fail loudly in logs, but don't crash the server — callers treat a
  // missing key as "no results" so the rest of the app keeps working.
  console.warn(
    "[googlePlaces] GOOGLE_PLACES_API_KEY is not set. Real recommendations " +
      "will return an empty list until it's configured (see SETUP_CLERK_AND_MAPS.md).",
  );
}

export type GooglePlace = {
  place_id: string;
  name: string;
  types: string[];
  vicinity?: string;
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  geometry: { location: { lat: number; lng: number } };
  photos?: { photo_reference: string; width: number; height: number }[];
};

export type NearbySearchParams = {
  lat: number;
  lng: number;
  radiusMeters: number;
  /** Google Places "type", e.g. restaurant, museum, park, bar, art_gallery, shopping_mall */
  type: string;
  /** 0 (free) – 4 (very expensive) */
  minPrice?: number;
  maxPrice?: number;
};

/**
 * Real-time nearby search against Google Places. Returns [] (never throws)
 * on missing key, HTTP failure, or a non-OK API status, so a flaky/misconfigured
 * key degrades to "no recommendations" rather than crashing the request.
 */
export async function nearbySearch(params: NearbySearchParams): Promise<GooglePlace[]> {
  if (!PLACES_API_KEY) return [];

  const url = new URL(`${PLACES_BASE}/nearbysearch/json`);
  url.searchParams.set("location", `${params.lat},${params.lng}`);
  url.searchParams.set("radius", String(params.radiusMeters));
  url.searchParams.set("type", params.type);
  if (params.minPrice !== undefined) url.searchParams.set("minprice", String(params.minPrice));
  if (params.maxPrice !== undefined) url.searchParams.set("maxprice", String(params.maxPrice));
  url.searchParams.set("key", PLACES_API_KEY);

  let res: Response;
  try {
    res = await fetch(url.toString());
  } catch (err) {
    console.error("[googlePlaces] nearbysearch network error", err);
    return [];
  }
  if (!res.ok) {
    console.error("[googlePlaces] nearbysearch HTTP error", res.status);
    return [];
  }

  const json = (await res.json()) as {
    status: string;
    results?: GooglePlace[];
    error_message?: string;
  };
  if (json.status !== "OK" && json.status !== "ZERO_RESULTS") {
    console.error("[googlePlaces] nearbysearch API error", json.status, json.error_message);
    return [];
  }
  return json.results ?? [];
}

/**
 * Resolves free text (a city name, "<IATA code> airport", etc.) to a
 * lat/lng. Used as a fallback center point when a trip has no stops with
 * coordinates yet, so Discover still has somewhere real to search around.
 */
export async function findPlaceLocation(input: string): Promise<{ lat: number; lng: number } | null> {
  if (!PLACES_API_KEY || !input.trim()) return null;

  const url = new URL(`${PLACES_BASE}/findplacefromtext/json`);
  url.searchParams.set("input", input);
  url.searchParams.set("inputtype", "textquery");
  url.searchParams.set("fields", "geometry");
  url.searchParams.set("key", PLACES_API_KEY);

  try {
    const res = await fetch(url.toString());
    if (!res.ok) return null;
    const json = (await res.json()) as {
      status: string;
      candidates?: { geometry: { location: { lat: number; lng: number } } }[];
    };
    return json.candidates?.[0]?.geometry?.location ?? null;
  } catch (err) {
    console.error("[googlePlaces] findPlaceLocation network error", err);
    return null;
  }
}

/**
 * Fetches a place photo directly from Google, server-side, and hands back
 * the raw upstream Response so a route handler can stream it to the client.
 * This keeps GOOGLE_PLACES_API_KEY out of any URL the browser ever sees.
 */
export async function fetchPlacePhoto(
  photoReference: string,
  maxWidth = 1200,
): Promise<Response | null> {
  if (!PLACES_API_KEY) return null;

  const url = new URL(`${PLACES_BASE}/photo`);
  url.searchParams.set("photo_reference", photoReference);
  url.searchParams.set("maxwidth", String(Math.min(maxWidth, 1600)));
  url.searchParams.set("key", PLACES_API_KEY);

  try {
    const res = await fetch(url.toString(), { redirect: "follow" });
    return res.ok ? res : null;
  } catch (err) {
    console.error("[googlePlaces] fetchPlacePhoto network error", err);
    return null;
  }
}
