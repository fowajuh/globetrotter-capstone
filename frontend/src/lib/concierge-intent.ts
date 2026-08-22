import type { Category, Listing } from "@/lib/cameroon-data";

const REGIONS = ["Centre", "East", "Far North", "Littoral", "North-West", "South", "South-West", "West", "Adamawa", "North"];

// Cities aren't unique to one region in general, but within this catalog
// each city currently maps to exactly one — good enough for "near <city>".
const CITY_TO_REGION: Record<string, string> = {
  douala: "Littoral", "édéa": "Littoral", edea: "Littoral",
  yaoundé: "Centre", yaounde: "Centre",
  kribi: "South",
  buea: "South-West", limbe: "South-West",
  bamenda: "North-West",
  foumban: "West",
  waza: "Far North", rhumsiki: "Far North", maroua: "Far North",
  somalomo: "East",
  ngaoundéré: "Adamawa", ngaoundere: "Adamawa",
  garoua: "North",
  bafut: "North-West", dschang: "West", bafoussam: "West",
};

const CATEGORY_SYNONYMS: Record<Category, string[]> = {
  Beachfront: ["beach", "beachfront", "ocean", "coast", "coastal", "seaside", "shore"],
  Mountain: ["mountain", "hike", "hiking", "trek", "highland", "peak"],
  Rainforest: ["rainforest", "jungle", "forest", "canopy", "nature reserve"],
  Safari: ["safari", "wildlife", "game drive", "national park", "savanna"],
  "City lofts": ["city", "loft", "urban", "downtown", "apartment"],
  Heritage: ["heritage", "palace", "culture", "cultural", "history", "historic"],
  Lakeside: ["lake", "lakeside", "waterfront"],
  "Chef's table": ["chef", "dining", "food", "culinary", "gastronomy", "gastronomic"],
};

export type ParsedFilter =
  | { kind: "region"; value: string; label: string }
  | { kind: "category"; value: Category; label: string }
  | { kind: "maxPrice"; value: number; label: string }
  | { kind: "minPrice"; value: number; label: string }
  | { kind: "minGuests"; value: number; label: string }
  | { kind: "maxGuests"; value: number; label: string }
  | { kind: "superhost"; label: string }
  | { kind: "instantBook"; label: string }
  | { kind: "topRated"; label: string };

export type ParsedQuery = {
  filters: ParsedFilter[];
  results: Listing[];
  relaxed: boolean;
  summary: string;
};

function extractPrice(q: string): { max?: number; min?: number } {
  const under = q.match(/(?:under|below|less than|cheaper than|max(?:imum)?)\s*\$?(\d+)/);
  if (under) return { max: Number(under[1]) };
  const over = q.match(/(?:over|above|more than|starting at|min(?:imum)?)\s*\$?(\d+)/);
  if (over) return { min: Number(over[1]) };
  const range = q.match(/\$?(\d+)\s*(?:-|to)\s*\$?(\d+)/);
  if (range) return { min: Number(range[1]), max: Number(range[2]) };
  if (/\b(budget|cheap|affordable|inexpensive)\b/.test(q)) return { max: 80 };
  if (/\b(luxury|splurge|upscale|high[-\s]?end|premium)\b/.test(q)) return { min: 200 };
  return {};
}

function extractGuests(q: string): { min?: number; max?: number } {
  const forN = q.match(/(?:for|fits?|sleeps?)\s*(\d+)\s*(?:people|guests|adults)?/);
  if (forN) return { min: Number(forN[1]) };
  if (/\b(family|families|kids|children)\b/.test(q)) return { min: 4 };
  if (/\b(solo|myself|alone)\b/.test(q)) return { max: 2 };
  if (/\bcouple\b/.test(q)) return { max: 2 };
  if (/\bgroup\b/.test(q)) return { min: 5 };
  return {};
}

function extractRegion(q: string): string | null {
  for (const region of REGIONS) {
    if (q.includes(region.toLowerCase())) return region;
  }
  for (const [city, region] of Object.entries(CITY_TO_REGION)) {
    if (q.includes(city)) return region;
  }
  return null;
}

function extractCategory(q: string): Category | null {
  for (const [category, words] of Object.entries(CATEGORY_SYNONYMS) as [Category, string[]][]) {
    if (words.some((w) => q.includes(w))) return category;
  }
  return null;
}

const OPENERS = [
  "Here's what I found",
  "Turned up a few great options",
  "These caught my eye",
  "Good news — plenty to choose from",
  "Take a look at these",
];

const RELAX_OPENERS = [
  "Nothing matched every detail, but these come close",
  "I widened the search a bit — here's the closest fit",
  "Couldn't find an exact match, so here's the nearest thing",
];

function describeFilters(filters: ParsedFilter[]): string {
  if (filters.length === 0) return "";
  const parts = filters.map((f) => f.label);
  if (parts.length === 1) return parts[0];
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function applyFilters(listings: Listing[], filters: ParsedFilter[]): Listing[] {
  return listings.filter((l) =>
    filters.every((f) => {
      switch (f.kind) {
        case "region":
          return l.region === f.value;
        case "category":
          return l.category === f.value;
        case "maxPrice":
          return l.usd <= f.value;
        case "minPrice":
          return l.usd >= f.value;
        case "minGuests":
          return l.guests >= f.value;
        case "maxGuests":
          return l.guests <= f.value;
        case "superhost":
          return l.host.superhost;
        case "instantBook":
          return l.instantBook;
        case "topRated":
          return l.rating >= 4.85;
        default:
          return true;
      }
    }),
  );
}

/**
 * Combines every filter it can find in the sentence (region + price + party
 * size + vibe + host quality) instead of matching the query to one
 * hardcoded bucket, so "beachfront near Kribi under $150 for a family"
 * genuinely narrows on all four things at once. Falls back to progressively
 * dropping the least specific filter — never a flat "no results."
 */
export function interpretQuery(query: string, listings: Listing[]): ParsedQuery {
  const q = query.toLowerCase();
  const filters: ParsedFilter[] = [];

  const region = extractRegion(q);
  if (region) filters.push({ kind: "region", value: region, label: `in ${region}` });

  const category = extractCategory(q);
  if (category) filters.push({ kind: "category", value: category, label: category.toLowerCase() });

  const { max, min } = extractPrice(q);
  if (max != null) filters.push({ kind: "maxPrice", value: max, label: `under $${max}` });
  if (min != null) filters.push({ kind: "minPrice", value: min, label: `from $${min}` });

  const guests = extractGuests(q);
  if (guests.min != null) filters.push({ kind: "minGuests", value: guests.min, label: `sleeping ${guests.min}+` });
  if (guests.max != null) filters.push({ kind: "maxGuests", value: guests.max, label: `for up to ${guests.max}` });

  if (/\bsuperhost\b/.test(q)) filters.push({ kind: "superhost", label: "hosted by a Superhost" });
  if (/\binstant\s?book\b/.test(q)) filters.push({ kind: "instantBook", label: "bookable instantly" });
  if (/\b(top[-\s]?rated|best reviewed|highest rated)\b/.test(q)) filters.push({ kind: "topRated", label: "top-rated" });

  let active = filters;
  let results = applyFilters(listings, active);
  let relaxed = false;

  // Progressively drop the least specific filter (price, then party size,
  // then vibe) until something matches, rather than showing a dead end.
  const dropOrder: ParsedFilter["kind"][] = ["minPrice", "maxPrice", "minGuests", "maxGuests", "category", "region"];
  for (const kind of dropOrder) {
    if (results.length > 0) break;
    if (!active.some((f) => f.kind === kind)) continue;
    active = active.filter((f) => f.kind !== kind);
    results = applyFilters(listings, active);
    relaxed = true;
  }

  if (results.length === 0) {
    results = [...listings].sort((a, b) => b.rating - a.rating);
    relaxed = filters.length > 0;
  } else {
    results = [...results].sort((a, b) => b.rating - a.rating);
  }

  const description = describeFilters(filters.length ? filters : active);
  const opener = relaxed ? pick(RELAX_OPENERS) : pick(OPENERS);
  const summary = description
    ? `${opener} — ${results.length} stay${results.length === 1 ? "" : "s"} ${description}.`
    : `${opener} — ${results.length} highly-rated stay${results.length === 1 ? "" : "s"} across Cameroon.`;

  return { filters, results: results.slice(0, 6), relaxed, summary };
}
