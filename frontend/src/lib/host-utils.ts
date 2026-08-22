import { listings, type Listing } from "@/lib/cameroon-data";

/** Hosts aren't modeled as their own entities yet (see backend comment on
 *  Message.senderRole) — each listing just embeds a host object. This
 *  treats hosts with the same name as the same person so a "host profile"
 *  can aggregate their listings, which is the closest honest approximation
 *  without a real Host table. */
export function hostSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export type HostProfile = {
  name: string;
  slug: string;
  initials: string;
  since: string;
  superhost: boolean;
  listings: Listing[];
  avgRating: number;
  totalReviews: number;
  regions: string[];
};

export function getHostProfile(slug: string): HostProfile | null {
  const hostListings = listings.filter((l) => hostSlug(l.host.name) === slug);
  if (hostListings.length === 0) return null;

  const { name, initials, since, superhost } = hostListings[0].host;
  const totalReviews = hostListings.reduce((sum, l) => sum + l.reviewCount, 0);
  const avgRating =
    hostListings.reduce((sum, l) => sum + l.rating * l.reviewCount, 0) / Math.max(1, totalReviews);

  return {
    name,
    slug,
    initials,
    since,
    superhost,
    listings: hostListings,
    avgRating: totalReviews > 0 ? avgRating : hostListings[0].rating,
    totalReviews,
    regions: [...new Set(hostListings.map((l) => l.region))],
  };
}
