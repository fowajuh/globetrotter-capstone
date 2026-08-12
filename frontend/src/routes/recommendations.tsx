import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import {
  Binoculars, Building2, Droplets, Landmark, Mountain, SlidersHorizontal,
  Trees, Utensils, Waves, Map as MapIcon, LayoutGrid, Search, Heart,
} from "lucide-react";
import { AppShell } from "@/components/manifest/AppShell";
import { PerforatedDivider } from "@/components/manifest/PerforatedDivider";
import { ListingCard } from "@/components/discover/ListingCard";
import { CameroonMap } from "@/components/map/CameroonMap";
import { Sheet } from "@/components/manifest/Sheet";
import { categories, listings, type Category } from "@/lib/cameroon-data";
import { useTravel } from "@/lib/travel-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/recommendations")({
  head: () => ({
    meta: [
      { title: "Discover stays in Cameroon · GlobeTrotter" },
      {
        name: "description",
        content:
          "Browse beachfront houses in Kribi, safari camps at Waza, rainforest treehouses in the Dja and city lofts in Douala — with verified reviews and a live map.",
      },
      { property: "og:title", content: "Discover stays in Cameroon · GlobeTrotter" },
      { property: "og:description", content: "Hand-picked Cameroonian stays and experiences, mapped and reviewed." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Discover,
});

const iconFor: Record<string, typeof Waves> = {
  waves: Waves, mountain: Mountain, trees: Trees, binoculars: Binoculars,
  building: Building2, landmark: Landmark, droplets: Droplets, utensils: Utensils,
};

const sorts = ["Recommended", "Top rated", "Price: low", "Price: high"] as const;

function Discover() {
  const [cat, setCat] = useState<Category | null>(null);
  const [q, setQ] = useState("");
  const [maxPrice, setMaxPrice] = useState(100000);
  const [superOnly, setSuperOnly] = useState(false);
  const [instant, setInstant] = useState(false);
  const [sort, setSort] = useState<(typeof sorts)[number]>("Recommended");
  const [view, setView] = useState<"grid" | "map">("grid");
  const [hover, setHover] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const wishlist = useTravel((s) => s.wishlist);

  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    let out = listings.filter(
      (l) =>
        (!cat || l.category === cat) &&
        l.price <= maxPrice &&
        (!superOnly || l.host.superhost) &&
        (!instant || l.instantBook) &&
        (!t ||
          [l.title, l.city, l.region, l.category, l.tagline].some((f) =>
            f.toLowerCase().includes(t),
          )),
    );
    if (sort === "Top rated") out = [...out].sort((a, b) => b.rating - a.rating);
    if (sort === "Price: low") out = [...out].sort((a, b) => a.price - b.price);
    if (sort === "Price: high") out = [...out].sort((a, b) => b.price - a.price);
    return out;
  }, [cat, q, maxPrice, superOnly, instant, sort]);

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-5 pt-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="num text-[11px] uppercase tracking-[0.24em] text-ink-60">
              Cameroon · 10 regions
            </p>
            <h1 className="font-display text-4xl md:text-5xl text-departure-navy leading-[0.95] mt-1">
              Stay somewhere with a story
            </h1>
            <p className="text-sm text-ink-60 mt-2 max-w-lg">
              Black-sand villas in Limbe, canvas suites over a Waza waterhole, a treehouse
              eleven metres up in the Dja. Every stay verified, every review from a real night.
            </p>
          </div>
          {wishlist.length > 0 && (
            <span className="inline-flex items-center gap-2 num text-[11px] uppercase tracking-[0.2em] text-runway-red">
              <Heart className="w-3.5 h-3.5 fill-runway-red" /> {wishlist.length} saved
            </span>
          )}
        </div>

        {/* search pill */}
        <div className="mt-6 flex items-center gap-2 rounded-full border border-ink-90/12 bg-cloud-white shadow-[0_8px_28px_-18px_rgba(14,22,38,0.55)] px-4 py-2.5">
          <Search className="w-4 h-4 text-ink-60 shrink-0" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Kribi, rainforest, chef's table…"
            className="flex-1 min-w-0 bg-transparent text-sm outline-none placeholder:text-ink-30"
          />
          <button
            onClick={() => setFiltersOpen(true)}
            className="inline-flex items-center gap-2 num text-[10px] uppercase tracking-[0.2em] border border-ink-90/15 rounded-full px-3 py-1.5 hover:bg-runway-sand transition-colors shrink-0"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" /> Filters
          </button>
        </div>

        {/* category rail */}
        <div className="mt-5 flex items-center gap-6 overflow-x-auto scrollbar-hide pb-2">
          <CatBtn active={cat === null} label="All stays" onClick={() => setCat(null)} Icon={LayoutGrid} />
          {categories.map((c) => (
            <CatBtn
              key={c.id}
              active={cat === c.id}
              label={c.label}
              Icon={iconFor[c.icon] ?? Waves}
              onClick={() => setCat(cat === c.id ? null : c.id)}
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 mt-2">
          <p className="num text-[11px] uppercase tracking-[0.2em] text-ink-60">
            {results.length} stays
          </p>
          <div className="flex items-center gap-2">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as (typeof sorts)[number])}
              className="num text-[10px] uppercase tracking-[0.18em] bg-transparent border border-ink-90/15 rounded-full px-3 py-1.5"
            >
              {sorts.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <div className="flex rounded-full border border-ink-90/15 overflow-hidden">
              {(["grid", "map"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={cn(
                    "num text-[10px] uppercase tracking-[0.18em] px-3 py-1.5 inline-flex items-center gap-1.5",
                    view === v ? "bg-departure-navy text-cloud-white" : "hover:bg-runway-sand",
                  )}
                >
                  {v === "grid" ? <LayoutGrid className="w-3.5 h-3.5" /> : <MapIcon className="w-3.5 h-3.5" />}
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>

        <PerforatedDivider />
      </div>

      {view === "grid" ? (
        <div className="max-w-7xl mx-auto px-5 pb-16">
          <div className="grid gap-x-6 gap-y-10 mt-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {results.map((l, i) => (
              <ListingCard key={l.id} listing={l} index={i} onHover={setHover} active={hover === l.id} />
            ))}
          </div>
          {results.length === 0 && (
            <div className="text-center py-24">
              <span className="customs-stamp text-ink-60">No matches</span>
              <p className="font-display text-2xl text-departure-navy mt-4">Nothing on this heading.</p>
              <button
                onClick={() => { setCat(null); setQ(""); setMaxPrice(100000); setSuperOnly(false); setInstant(false); }}
                className="mt-3 num text-[11px] uppercase tracking-[0.2em] text-beacon-amber"
              >
                Clear filters →
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-5 pb-16 mt-6 grid lg:grid-cols-[1fr_420px] gap-6">
          <CameroonMap
            listings={results}
            activeId={hover}
            onHover={setHover}
            onSelect={(id) => setHover(id)}
            className="h-[62vh] lg:h-[75vh] rounded-xl border border-ink-90/10"
          />
          <div className="max-h-[75vh] overflow-y-auto pr-1 space-y-6 scrollbar-hide">
            {results.map((l, i) => (
              <ListingCard key={l.id} listing={l} index={i} onHover={setHover} active={hover === l.id} />
            ))}
          </div>
        </div>
      )}

      <Sheet open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filters">
        <div className="space-y-6 pt-2">
          <div>
            <div className="flex items-center justify-between">
              <span className="num text-[11px] uppercase tracking-[0.2em] text-ink-60">Max nightly</span>
              <span className="num text-sm">{maxPrice.toLocaleString("fr-FR")} FCFA</span>
            </div>
            <input
              type="range"
              min={30000}
              max={100000}
              step={1000}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full mt-3 accent-[var(--beacon-amber)]"
            />
          </div>
          <PerforatedDivider />
          {[
            { label: "Superhosts only", v: superOnly, set: setSuperOnly },
            { label: "Instant book", v: instant, set: setInstant },
          ].map((row) => (
            <button
              key={row.label}
              onClick={() => row.set(!row.v)}
              className="w-full flex items-center justify-between py-2"
            >
              <span className="text-sm text-ink-90">{row.label}</span>
              <span
                className={cn(
                  "w-11 h-6 rounded-full p-0.5 transition-colors",
                  row.v ? "bg-horizon-teal" : "bg-ink-30/50",
                )}
              >
                <motion.span
                  layout
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className={cn("block w-5 h-5 rounded-full bg-cloud-white", row.v && "ml-5")}
                />
              </span>
            </button>
          ))}
          <button
            onClick={() => setFiltersOpen(false)}
            className="w-full bg-departure-navy text-cloud-white num text-[11px] uppercase tracking-[0.22em] py-3 rounded-sm"
          >
            Show {results.length} stays
          </button>
          <Link to="/map" className="block text-center num text-[11px] uppercase tracking-[0.2em] text-beacon-amber">
            Open full map →
          </Link>
        </div>
      </Sheet>
    </AppShell>
  );
}

function CatBtn({
  active, label, Icon, onClick,
}: { active: boolean; label: string; Icon: typeof Waves; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center gap-1.5 shrink-0 pb-2 transition-colors",
        active ? "text-departure-navy" : "text-ink-60 hover:text-ink-90",
      )}
    >
      <Icon className="w-5 h-5" strokeWidth={1.6} />
      <span className="num text-[10px] uppercase tracking-[0.16em] whitespace-nowrap">{label}</span>
      {active && (
        <motion.span layoutId="catline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-departure-navy" />
      )}
    </button>
  );
}
