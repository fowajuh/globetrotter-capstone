import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Heart, Star, Zap } from "lucide-react";
import { useState } from "react";
import { formatXaf, type Listing } from "@/lib/cameroon-data";
import { useTravel } from "@/lib/travel-store";
import { cn } from "@/lib/utils";

export function ListingCard({
  listing,
  onHover,
  active,
  index = 0,
}: {
  listing: Listing;
  onHover?: (id: string | null) => void;
  active?: boolean;
  index?: number;
}) {
  const { wishlist, toggleWish } = useTravel();
  const wished = wishlist.includes(listing.id);
  const [frame, setFrame] = useState(0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.04, 0.3), ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={() => onHover?.(listing.id)}
      onMouseLeave={() => onHover?.(null)}
      className="group"
    >
      <Link to="/stays/$stayId" params={{ stayId: listing.id }} className="block">
        <div
          className={cn(
            "relative aspect-[20/19] overflow-hidden rounded-xl bg-runway-sand",
            active && "ring-2 ring-departure-navy ring-offset-2 ring-offset-cloud-white",
          )}
        >
          {listing.images.map((src, i) => (
            <motion.img
              key={src}
              src={src}
              alt={`${listing.title} — ${listing.city}, Cameroon`}
              loading="lazy"
              animate={{ opacity: i === frame ? 1 : 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-departure-navy/35 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          <button
            onClick={(e) => {
              e.preventDefault();
              toggleWish(listing.id);
            }}
            aria-label={wished ? "Remove from wishlist" : "Save to wishlist"}
            className="absolute top-3 right-3 grid place-items-center w-9 h-9 rounded-full bg-cloud-white/85 backdrop-blur hover:scale-110 transition-transform"
          >
            <Heart
              className={cn("w-4.5 h-4.5", wished ? "fill-runway-red text-runway-red" : "text-ink-90")}
            />
          </button>

          {listing.host.superhost && (
            <span className="absolute top-3 left-3 num text-[9px] uppercase tracking-[0.2em] bg-cloud-white/90 text-departure-navy px-2 py-1 rounded-full">
              Superhost
            </span>
          )}
          {listing.instantBook && (
            <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 num text-[9px] uppercase tracking-[0.2em] bg-beacon-amber text-departure-navy px-2 py-1 rounded-full">
              <Zap className="w-3 h-3" /> Instant
            </span>
          )}

          {/* image dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {listing.images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.preventDefault();
                  setFrame(i);
                }}
                aria-label={`Photo ${i + 1}`}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-all",
                  i === frame ? "bg-cloud-white w-4" : "bg-cloud-white/55",
                )}
              />
            ))}
          </div>
        </div>

        <div className="pt-3">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-display text-lg leading-tight text-departure-navy truncate">
              {listing.title}
            </h3>
            <span className="num text-sm text-ink-90 inline-flex items-center gap-1 shrink-0">
              <Star className="w-3.5 h-3.5 fill-beacon-amber text-beacon-amber" />
              {listing.rating.toFixed(2)}
            </span>
          </div>
          <p className="text-sm text-ink-60 truncate">
            {listing.city} · {listing.region}
          </p>
          <p className="text-sm text-ink-60 truncate">{listing.tagline}</p>
          <p className="mt-1.5 text-sm text-ink-90">
            <span className="num font-medium">{formatXaf(listing.price)}</span>
            <span className="text-ink-60"> night · ≈ ${listing.usd}</span>
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
