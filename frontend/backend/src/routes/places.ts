import { Router } from "express";
import { fetchPlacePhoto } from "../services/googlePlaces";

export const placesRouter = Router();

/**
 * GET /places/photo/:photoReference?maxwidth=1200
 *
 * Proxies a Google Place photo through our own server so GOOGLE_PLACES_API_KEY
 * never appears in a URL sent to the browser. This is what ApiRecommendation
 * .photoUrl values point at (see routes/recommendations.ts).
 *
 * No auth required — the photo_reference itself isn't guessable/sensitive,
 * and these images are the same ones the Discover cards need to render for
 * unauthenticated pre-login previews too, if you add those later.
 */
placesRouter.get("/places/photo/:photoReference", async (req, res) => {
  const { photoReference } = req.params;
  const maxWidth = Number(req.query.maxwidth) || 1200;

  const upstream = await fetchPlacePhoto(photoReference, maxWidth);
  if (!upstream || !upstream.body) {
    return res.status(502).json({ error: { message: "Photo unavailable" } });
  }

  res.setHeader("Content-Type", upstream.headers.get("content-type") ?? "image/jpeg");
  // Place photos are effectively immutable for a given reference — cache hard.
  res.setHeader("Cache-Control", "public, max-age=86400, immutable");

  const buf = Buffer.from(await upstream.arrayBuffer());
  res.send(buf);
});
