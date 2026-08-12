import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, X } from "lucide-react";
import { AppShell } from "@/components/manifest/AppShell";
import { CameroonMap } from "@/components/map/CameroonMap";
import { PerforatedDivider } from "@/components/manifest/PerforatedDivider";
import { formatXaf, getListing, listings } from "@/lib/cameroon-data";

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "Map of Cameroon · GlobeTrotter" },
      {
        name: "description",
        content:
          "Explore every GlobeTrotter stay across Cameroon — from Waza in the Far North to the Kribi coast — on an interactive, zoomable map.",
      },
      { property: "og:title", content: "Map of Cameroon · GlobeTrotter" },
      { property: "og:description", content: "Every stay in Cameroon, mapped from Maroua to Kribi." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MapPage,
});

const regions = [...new Set(listings.map((l) => l.region))].sort();

function MapPage() {
  const [region, setRegion] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const shown = region ? listings.filter((l) => l.region === region) : listings;
  const active = selected ? getListing(selected) : null;

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-5 pt-6 pb-16">
        <p className="num text-[11px] uppercase tracking-[0.24em] text-ink-60">Chart · Republic of Cameroon</p>
        <h1 className="font-display text-4xl md:text-5xl text-departure-navy leading-[0.95] mt-1">
          Africa in miniature
        </h1>
        <p className="text-sm text-ink-60 mt-2 max-w-xl">
          Desert in the north, rainforest in the south, volcano on the coast. Scroll to zoom,
          drag to pan, tap a price to open the stay.
        </p>

        <div className="mt-5 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          <Chip active={region === null} onClick={() => setRegion(null)}>All regions</Chip>
          {regions.map((r) => (
            <Chip key={r} active={region === r} onClick={() => setRegion(region === r ? null : r)}>
              {r}
            </Chip>
          ))}
        </div>

        <PerforatedDivider />

        <div className="relative mt-5">
          <CameroonMap
            listings={shown}
            activeId={selected}
            onSelect={setSelected}
            className="h-[70vh] rounded-xl border border-ink-90/10"
          />

          <AnimatePresence>
            {active && (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 24 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="absolute left-3 right-3 bottom-14 sm:left-4 sm:right-auto sm:w-[340px] bg-cloud-white rounded-xl overflow-hidden border border-ink-90/10 shadow-[0_24px_60px_-24px_rgba(14,22,38,0.6)]"
              >
                <button
                  onClick={() => setSelected(null)}
                  aria-label="Close"
                  className="absolute top-2 right-2 z-10 grid place-items-center w-8 h-8 rounded-full bg-cloud-white/90"
                >
                  <X className="w-4 h-4" />
                </button>
                <Link to="/stays/$stayId" params={{ stayId: active.id }}>
                  <img src={active.images[0]} alt={`${active.title}, ${active.city}`} className="w-full h-40 object-cover" />
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="font-display text-xl text-departure-navy leading-tight">{active.title}</h2>
                      <span className="num text-sm inline-flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-beacon-amber text-beacon-amber" />
                        {active.rating.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-sm text-ink-60 mt-1">{active.city} · {active.region}</p>
                    <p className="num text-sm mt-2">{formatXaf(active.price)} <span className="text-ink-60">night</span></p>
                  </div>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AppShell>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`num text-[10px] uppercase tracking-[0.18em] px-3 py-2 rounded-full border whitespace-nowrap transition-colors ${
        active
          ? "bg-departure-navy text-cloud-white border-departure-navy"
          : "border-ink-90/15 text-ink-60 hover:bg-runway-sand"
      }`}
    >
      {children}
    </button>
  );
}
