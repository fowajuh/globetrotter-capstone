import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Map as MapIcon, List, Star, Heart, ChevronLeft, ChevronRight, Globe, Home as HomeIcon, SlidersHorizontal, X, Waves, Palmtree, Mountain, Sunrise, Building2, PawPrint, Tag, SearchX } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { ExploreMap } from "@/components/map/ExploreMap";
import { listings, categories } from "@/lib/cameroon-data";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useTravel } from "@/lib/travel-store";

export const Route = createFileRoute("/")({
  component: ExploreScreen,
});

function Categories({ activeId, onSelect, onOpenFilters }: { activeId: string | null, onSelect: (id: string | null) => void, onOpenFilters: () => void }) {
  const getIcon = (id: string) => {
    if (id.includes('nature') || id.includes('beach')) return <Globe className="w-5 h-5 text-current" />;
    if (id.includes('culture') || id.includes('city')) return <MapIcon className="w-5 h-5 text-current" />;
    return <HomeIcon className="w-5 h-5 text-current" />;
  };

  return (
    <div className="sticky top-[68px] md:top-20 z-40 bg-background pb-3 pt-2">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 flex items-center gap-3">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide flex-1 items-center pb-2">
          <button
            onClick={() => onSelect(null)}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-full border transition-micro shrink-0 shadow-sm",
              activeId === null ? "border-foreground bg-foreground text-background" : "border-border bg-background hover:border-foreground text-foreground"
            )}
          >
            <Globe className="w-5 h-5 text-current" />
            <span className="text-sm font-semibold">All</span>
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelect(activeId === cat.id ? null : cat.id)}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-full border transition-micro shrink-0 shadow-sm",
                activeId === cat.id ? "border-foreground bg-foreground text-background" : "border-border bg-background hover:border-foreground text-foreground"
              )}
            >
              {getIcon(cat.id)}
              <span className="text-sm font-semibold">{cat.label}</span>
            </button>
          ))}
        </div>
        <button 
          onClick={onOpenFilters}
          className="flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-full border border-border bg-background hover:border-foreground shadow-sm mb-2 shrink-0"
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline text-sm font-medium">Filters</span>
        </button>
      </div>
    </div>
  );
}

function ListingCard({ listing, onHover }: { listing: typeof listings[0], onHover: (id: string | null) => void }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const { wishlist, toggleWish } = useTravel();
  const isWished = wishlist.includes(listing.id);

  const scrollPrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (emblaApi) emblaApi.scrollPrev();
  };

  const scrollNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (emblaApi) emblaApi.scrollNext();
  };

  const handleWish = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWish(listing.id);
  };

  return (
    <Link to={`/stays/$stayId`} params={{ stayId: listing.id }}>
      <motion.div 
        className="group flex flex-col gap-3 cursor-pointer relative"
        onHoverStart={() => onHover(listing.id)}
        onHoverEnd={() => onHover(null)}
      >
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted">
          {/* Embla's viewport used `h-full` at three nested levels (viewport
              -> track -> slide -> img). Percentage heights like that only
              resolve correctly once every ancestor up the chain already has
              a settled pixel height; if Embla measures this DOM node before
              the framer-motion entrance animation / image load has finished
              settling layout (timing that varies per listing depending on
              image load speed), the chain can resolve against an
              indeterminate height and the <img> falls back to its own huge
              intrinsic size — exactly the "some listings, not others" bug.
              `absolute inset-0` sidesteps percentage-height resolution
              entirely: it's positioned against this div's actual box
              (fixed by `aspect-[4/3]`) regardless of when Embla measures. */}
          <div className="absolute inset-0" ref={emblaRef}>
            <div className="flex h-full">
              {listing.images.map((img, idx) => (
                <div className="relative flex-[0_0_100%] h-full" key={idx}>
                  <img src={img} alt={`${listing.title} - ${idx}`} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                </div>
              ))}
            </div>
          </div>
          
          <button 
            onClick={handleWish}
            className="absolute top-3 right-3 hover:scale-110 transition-transform z-10 drop-shadow-md"
          >
            <Heart className={cn("w-6 h-6", isWished ? "fill-primary text-primary" : "text-white")} />
          </button>
          
          {/* Carousel Controls - Only visible on hover */}
          <button onClick={scrollPrev} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 hover:bg-background flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:scale-105 shadow-sm">
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <button onClick={scrollNext} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 hover:bg-background flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:scale-105 shadow-sm">
            <ChevronRight className="w-5 h-5 text-foreground" />
          </button>
        </div>
        <div>
          <div className="flex justify-between items-start gap-2">
            <h3 className="font-semibold text-foreground leading-tight truncate">{listing.city}, {listing.region}</h3>
            <div className="flex items-center gap-1 text-sm shrink-0">
              <Star className="w-4 h-4 fill-foreground" />
              <span>{listing.rating.toFixed(2)}</span>
            </div>
          </div>
          <p className="text-muted-foreground text-sm truncate mt-1">{listing.tagline}</p>
          <p className="mt-2 text-foreground">
            <span className="font-semibold">${listing.usd}</span> night
          </p>
        </div>
      </motion.div>
    </Link>
  );
}

function ExploreScreen() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [hoveredListing, setHoveredListing] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"map" | "list">("list");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  // Quick-filter chips shown in Map Mode ("Wifi", "Pool", etc.) — matched
  // against each listing's free-text amenities, since there's no fixed
  // amenity taxonomy in the data yet. "Instant Book" checks the listing's
  // own instantBook flag instead.
  const [activeQuickFilters, setActiveQuickFilters] = useState<string[]>([]);
  const toggleQuickFilter = (label: string) =>
    setActiveQuickFilters((prev) => (prev.includes(label) ? prev.filter((f) => f !== label) : [...prev, label]));

  // Applied filters (only take effect once "Show places" is pressed, like Airbnb)
  const [appliedFilters, setAppliedFilters] = useState({
    minPrice: 0,
    maxPrice: Infinity,
    minBedrooms: 0,
    minBeds: 0,
    minBaths: 0,
  });
  // Draft filters, edited live inside the open modal
  const [draftFilters, setDraftFilters] = useState(appliedFilters);

  // "Show all" toggles each home-feed row from a horizontal scroller into a full grid
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const toggleSection = (key: string) =>
    setExpandedSections((s) => ({ ...s, [key]: !s[key] }));

  const openFilters = () => {
    setDraftFilters(appliedFilters);
    setIsFiltersOpen(true);
  };

  const applyFilters = () => {
    setAppliedFilters(draftFilters);
    setIsFiltersOpen(false);
  };

  const clearFilters = () => {
    const cleared = { minPrice: 0, maxPrice: Infinity, minBedrooms: 0, minBeds: 0, minBaths: 0 };
    setDraftFilters(cleared);
    setAppliedFilters(cleared);
  };

  useEffect(() => {
    const handleUpdateSearch = (e: Event) => {
      if (e instanceof CustomEvent) {
        setSearchQuery(e.detail);
      }
    };
    window.addEventListener("update-search", handleUpdateSearch);
    return () => window.removeEventListener("update-search", handleUpdateSearch);
  }, []);

  const matchesQuickFilter = (l: typeof listings[0], label: string) => {
    if (label === "Instant Book") return l.instantBook;
    const needle = label.toLowerCase().replace("free ", "").replace("self ", "");
    return l.amenities.some((a) => a.toLowerCase().includes(needle));
  };

  const filteredListings = listings.filter(l => {
    const matchCat = activeCategory ? l.category === activeCategory : true;
    const q = searchQuery.trim().toLowerCase();
    const matchSearch = q 
      ? l.city.toLowerCase().includes(q) || l.region.toLowerCase().includes(q) || l.title.toLowerCase().includes(q)
      : true;
    const matchPrice = l.usd >= appliedFilters.minPrice && l.usd <= appliedFilters.maxPrice;
    const matchRooms =
      l.bedrooms >= appliedFilters.minBedrooms &&
      l.beds >= appliedFilters.minBeds &&
      l.baths >= appliedFilters.minBaths;
    const matchQuick = activeQuickFilters.every((f) => matchesQuickFilter(l, f));
    return matchCat && matchSearch && matchPrice && matchRooms && matchQuick;
  });

  // Count what the *draft* filters (price + rooms only, ignoring category/search)
  // would return, so the "Show N places" button reflects what's being edited live.
  const draftMatchCount = listings.filter(l => {
    const matchPrice = l.usd >= draftFilters.minPrice && l.usd <= draftFilters.maxPrice;
    const matchRooms =
      l.bedrooms >= draftFilters.minBedrooms &&
      l.beds >= draftFilters.minBeds &&
      l.baths >= draftFilters.minBaths;
    return matchPrice && matchRooms;
  }).length;

  return (
    <div className="min-h-screen flex flex-col bg-background relative">
      <Categories activeId={activeCategory} onSelect={setActiveCategory} onOpenFilters={openFilters} />

      {viewMode === "list" ? (
        <main className="flex-1 max-w-screen-2xl mx-auto w-full">
          {/* Horizontal Group: Category filtered or All */}
          {searchQuery.trim() ? (
            /* Search Results */
            <section className="px-4 sm:px-6 py-6">
              <h2 className="text-xl font-bold mb-1">
                {filteredListings.length} result{filteredListings.length !== 1 ? "s" : ""} for "{searchQuery}"
              </h2>
              <p className="text-sm text-muted-foreground mb-6">Stays in Cameroon matching your search</p>
              <div className="grid gap-5 gap-y-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {filteredListings.map(listing => (
                  <ListingCard key={listing.id} listing={listing} onHover={setHoveredListing} />
                ))}
                {filteredListings.length === 0 && (
                  <div className="col-span-full text-center py-20">
                    <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                      <SearchX className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="font-semibold text-lg">No results found</p>
                    <p className="text-muted-foreground text-sm mt-1">Try a different search term or category</p>
                  </div>
                )}
              </div>
            </section>
          ) : activeCategory ? (
            /* Category filtered grid */
            <section className="px-4 sm:px-6 py-6">
              <h2 className="text-xl font-bold mb-6">{categories.find(c => c.id === activeCategory)?.label} · Cameroon</h2>
              <div className="grid gap-5 gap-y-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {filteredListings.map(listing => (
                  <ListingCard key={listing.id} listing={listing} onHover={setHoveredListing} />
                ))}
              </div>
            </section>
          ) : (
            /* Airbnb-style grouped horizontal sections */
            <div className="space-y-2">
              {/* Section 1: Popular homes */}
              <section className="px-4 sm:px-6 pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Popular homes in Cameroon</h2>
                  <button
                    onClick={() => toggleSection("popular")}
                    className="text-sm font-semibold underline flex items-center gap-1 hover:text-primary transition-colors"
                  >
                    {expandedSections.popular ? "Show less" : "Show all"} <ChevronRight className={cn("w-4 h-4 transition-transform", expandedSections.popular && "rotate-90")} />
                  </button>
                </div>
                <div className={expandedSections.popular
                  ? "grid gap-5 gap-y-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                  : "flex gap-5 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 snap-x"}>
                  {(expandedSections.popular ? listings : listings.slice(0, 8)).map(listing => (
                    <div key={listing.id} className={expandedSections.popular ? "" : "min-w-[280px] sm:min-w-[300px] flex-shrink-0 snap-start"}>
                      <ListingCard listing={listing} onHover={setHoveredListing} />
                    </div>
                  ))}
                </div>
              </section>

              <div className="h-2 bg-muted/50" />

              {/* Section 2: Great hotels */}
              <section className="px-4 sm:px-6 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h2 className="text-xl font-bold">Great hotels for your next trip</h2>
                    <p className="text-sm text-muted-foreground">Plus, get GlobeTrotter credit when you stay at a featured hotel.</p>
                  </div>
                  <button
                    onClick={() => toggleSection("hotels")}
                    className="text-sm font-semibold underline flex items-center gap-1 hover:text-primary transition-colors shrink-0 ml-4"
                  >
                    {expandedSections.hotels ? "Show less" : "Show all"} <ChevronRight className={cn("w-4 h-4 transition-transform", expandedSections.hotels && "rotate-90")} />
                  </button>
                </div>
                <div className={expandedSections.hotels
                  ? "grid gap-5 gap-y-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 mt-4"
                  : "flex gap-5 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 snap-x mt-4"}>
                  {(expandedSections.hotels ? listings.slice(3) : listings.slice(3, 10)).map(listing => (
                    <div key={listing.id} className={expandedSections.hotels ? "" : "min-w-[280px] sm:min-w-[300px] flex-shrink-0 snap-start"}>
                      <ListingCard listing={listing} onHover={setHoveredListing} />
                    </div>
                  ))}
                </div>
              </section>

              <div className="h-2 bg-muted/50" />

              {/* Section 3: Explore by region */}
              <section className="px-4 sm:px-6 pt-4 pb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Explore by region</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  {([
                    { name: "Littoral", Icon: Waves },
                    { name: "South", Icon: Palmtree },
                    { name: "North West", Icon: Mountain },
                    { name: "West", Icon: Sunrise },
                    { name: "Centre", Icon: Building2 },
                    { name: "Adamawa", Icon: PawPrint },
                  ]).map(({ name, Icon }) => (
                    <button
                      key={name}
                      onClick={() => window.dispatchEvent(new CustomEvent('update-search', { detail: name }))}
                      className="flex flex-col items-center gap-2 p-3 rounded-2xl border border-border hover:border-primary hover:bg-muted transition-all group"
                    >
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center group-hover:from-primary/30 group-hover:to-primary/10 transition-colors">
                        <Icon className="w-5 h-5 text-primary" strokeWidth={2} />
                      </div>
                      <span className="text-xs font-semibold text-center group-hover:text-primary transition-colors">{name}</span>
                    </button>
                  ))}
                </div>
              </section>

              <div className="h-2 bg-muted/50" />

              {/* Section 4: Unique stays */}
              <section className="px-4 sm:px-6 pt-4 pb-8">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Unique stays</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {listings.slice(5).map(listing => (
                    <ListingCard key={listing.id} listing={listing} onHover={setHoveredListing} />
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* "Prices include all fees" floating pill */}
          <div className="fixed bottom-[76px] left-1/2 -translate-x-1/2 md:bottom-6 z-30 pointer-events-none">
            <div className="bg-foreground text-background px-5 py-3 rounded-full flex items-center gap-3 shadow-modal text-sm font-semibold">
              <Tag className="w-4 h-4" /> Prices include all fees
            </div>
          </div>

          {/* Show Map button integrated into bottom area above nav */}
          <div className="fixed bottom-[72px] right-4 md:bottom-8 md:right-8 z-40">
            <button
              onClick={() => setViewMode("map")}
              className="bg-foreground text-background px-5 py-3 rounded-full flex items-center gap-2 font-semibold shadow-modal hover:scale-105 transition-transform text-sm"
            >
              Show map <MapIcon className="w-4 h-4" />
            </button>
          </div>
        </main>
      ) : (
        /* Map Mode */
        <div className="flex-1 relative">
          {/* Map Filters Row */}
          <div className="sticky top-[60px] z-30 bg-background/95 backdrop-blur-md border-b border-border px-4 py-2">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide items-center">
              <button
                onClick={() => setViewMode("list")}
                className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-full bg-foreground text-background text-sm font-semibold hover:scale-105 transition-transform"
              >
                <List className="w-4 h-4" /> Show list
              </button>
              {["Self check-in", "Instant Book", "Free parking", "Pool", "Wifi", "Kitchen"].map(f => (
                <button
                  key={f}
                  onClick={() => toggleQuickFilter(f)}
                  className={cn(
                    "shrink-0 rounded-full px-4 py-2 text-sm font-semibold shadow-sm whitespace-nowrap border transition-colors",
                    activeQuickFilters.includes(f)
                      ? "bg-foreground text-background border-foreground"
                      : "bg-background border-border hover:border-foreground"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Map */}
          <div className="h-[calc(100vh-130px)] w-full">
            <ExploreMap listings={filteredListings} activeId={hoveredListing} />
          </div>

          {/* Bottom Sheet for Map */}
          <div className="fixed bottom-0 left-0 right-0 z-20">
            {/* "Prices include all fees" pill above cards */}
            <div className="flex justify-center mb-3">
              <div className="bg-background/90 backdrop-blur-sm text-foreground px-4 py-2 rounded-full flex items-center gap-2 shadow-md text-sm font-semibold border border-border">
                <Tag className="w-3.5 h-3.5" /> Prices include all fees
              </div>
            </div>
            {/* Horizontal scrolling cards */}
            <div className="overflow-x-auto scrollbar-hide flex gap-4 px-4 pb-[80px] snap-x">
              {filteredListings.map(listing => (
                <Link
                  key={listing.id}
                  to="/stays/$stayId"
                  params={{ stayId: listing.id }}
                  className="min-w-[320px] snap-center bg-background rounded-2xl shadow-modal border border-border flex gap-3 p-3 items-center hover:shadow-lg transition-shadow"
                >
                  <img src={listing.images[0]} className="w-20 h-20 rounded-xl object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-semibold text-sm truncate">{listing.city}, {listing.region}</h3>
                      <div className="flex items-center gap-0.5 text-xs shrink-0 ml-2">
                        <Star className="w-3 h-3 fill-foreground" />
                        {listing.rating.toFixed(2)}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mb-1">{listing.title}</p>
                    <p className="text-sm font-bold">${listing.usd} <span className="font-normal text-muted-foreground">night</span></p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      
      {/* Filters Modal */}
      <AnimatePresence>
        {isFiltersOpen && (
          <div className="fixed inset-0 z-[100] bg-background md:bg-background/50 md:backdrop-blur-sm flex items-end md:items-center justify-center">
            <motion.div 
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-background w-full md:w-[780px] h-full md:h-[85vh] md:rounded-2xl shadow-modal overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <button 
                  onClick={() => setIsFiltersOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <h2 className="font-bold text-lg">Filters</h2>
                <div className="w-8" /> {/* Spacer for centering */}
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-8">
                {/* Price range */}
                <div>
                  <h3 className="text-xl font-bold mb-1">Price range</h3>
                  <p className="text-muted-foreground text-sm mb-6">Nightly price, in USD</p>

                  <div className="flex items-center gap-4">
                    <div className="flex-1 border border-border rounded-xl p-3">
                      <div className="text-xs text-muted-foreground">Minimum</div>
                      <div className="flex items-center gap-1">
                        <span>$</span>
                        <input
                          type="number"
                          min={0}
                          value={draftFilters.minPrice}
                          onChange={(e) =>
                            setDraftFilters((f) => ({ ...f, minPrice: Math.max(0, Number(e.target.value) || 0) }))
                          }
                          className="w-full bg-transparent outline-none font-medium"
                        />
                      </div>
                    </div>
                    <div className="w-4 h-px bg-border shrink-0" />
                    <div className="flex-1 border border-border rounded-xl p-3">
                      <div className="text-xs text-muted-foreground">Maximum</div>
                      <div className="flex items-center gap-1">
                        <span>$</span>
                        <input
                          type="number"
                          min={0}
                          placeholder="Any"
                          value={draftFilters.maxPrice === Infinity ? "" : draftFilters.maxPrice}
                          onChange={(e) =>
                            setDraftFilters((f) => ({
                              ...f,
                              maxPrice: e.target.value === "" ? Infinity : Math.max(0, Number(e.target.value) || 0),
                            }))
                          }
                          className="w-full bg-transparent outline-none font-medium"
                        />
                        <span>+</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-border w-full" />

                {/* Rooms and beds */}
                <div>
                  <h3 className="text-xl font-bold mb-6">Rooms and beds</h3>
                  <div className="space-y-4">
                    {([
                      { key: "minBedrooms", label: "Bedrooms" },
                      { key: "minBeds", label: "Beds" },
                      { key: "minBaths", label: "Bathrooms" },
                    ] as const).map(({ key, label }) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="font-medium">{label}</span>
                        <div className="flex items-center gap-4">
                          <button
                            type="button"
                            onClick={() => setDraftFilters((f) => ({ ...f, [key]: Math.max(0, f[key] - 1) }))}
                            disabled={draftFilters[key] === 0}
                            className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:border-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:hover:border-border disabled:hover:text-muted-foreground"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-medium">{draftFilters[key] === 0 ? "Any" : `${draftFilters[key]}+`}</span>
                          <button
                            type="button"
                            onClick={() => setDraftFilters((f) => ({ ...f, [key]: Math.min(8, f[key] + 1) }))}
                            className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-border flex items-center justify-between bg-background">
                <button onClick={clearFilters} className="font-semibold underline">Clear all</button>
                <Button onClick={applyFilters} className="px-8 py-6 rounded-xl font-semibold">
                  Show {draftMatchCount} place{draftMatchCount !== 1 ? "s" : ""}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
