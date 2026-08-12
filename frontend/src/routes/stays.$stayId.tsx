import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Heart, Share, Star, Wifi, Coffee, Car, Shield, CheckCircle, Zap, MessageSquare, Sparkles, X, Users, Minus, Plus } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { getListing, listings, reviewsFor, type Listing } from "@/lib/cameroon-data";
import { useTravel } from "@/lib/travel-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { RatingBreakdown, ReviewList, ReviewComposer } from "@/components/reviews/ReviewSystem";
import { messagesApi } from "@/lib/api/messages";

const AMENITY_ICONS: Record<string, typeof Wifi> = {
  wifi: Wifi,
  kitchen: Coffee,
  parking: Car,
  generator: Zap,
};

function amenityIcon(label: string) {
  const key = Object.keys(AMENITY_ICONS).find((k) => label.toLowerCase().includes(k));
  return key ? AMENITY_ICONS[key] : CheckCircle;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysIso(iso: string, days: number) {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function nightsBetween(checkin: string, checkout: string) {
  const ms = new Date(checkout).getTime() - new Date(checkin).getTime();
  const n = Math.round(ms / 86400000);
  return n > 0 ? n : 1;
}

function formatDatePretty(iso: string) {
  if (!iso) return "Add date";
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export const Route = createFileRoute("/stays/$stayId")({
  loader: ({ params }): Listing => {
    const listing = getListing(params.stayId);
    if (!listing) throw notFound();
    return listing;
  },
  component: StayDetail,
});

function StayDetail() {
  const listing = Route.useLoaderData() as Listing;
  const navigate = useNavigate();
  const { wishlist, toggleWish, userReviews, addReview } = useTravel();
  const isWished = wishlist.includes(listing.id);
  const setPendingBooking = useTravel((s) => s.setPendingBooking);

  const defaultCheckin = addDaysIso(todayIso(), 21);
  const [checkin, setCheckin] = useState(defaultCheckin);
  const [checkout, setCheckout] = useState(addDaysIso(defaultCheckin, 5));
  const [guests, setGuests] = useState(1);
  const [isDatesOpen, setIsDatesOpen] = useState(false);
  const [isGuestsOpen, setIsGuestsOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [aboutExpanded, setAboutExpanded] = useState(false);
  const [amenitiesExpanded, setAmenitiesExpanded] = useState(false);

  const nights = nightsBetween(checkin, checkout);
  const reviews = reviewsFor(listing.id, userReviews);

  const handleReserve = () => {
    setPendingBooking({ listingId: listing.id, checkin, checkout, guests });
    navigate({ to: "/checkout/$stayId", params: { stayId: listing.id } });
  };

  // "Message Host" used to hardcode a link to a fake chat-1 thread
  // regardless of which listing you were on. This finds-or-creates the
  // real thread for this specific listing/host and opens it.
  const messageHostMutation = useMutation({
    mutationFn: () =>
      messagesApi.startConversation({
        listingId: listing.id,
        listingTitle: listing.title,
        listingImageUrl: listing.images[0] ?? null,
        hostName: listing.host.name,
      }),
    onSuccess: (conversation) => {
      navigate({ to: "/inbox/$chatId", params: { chatId: conversation.id } });
    },
    onError: (err) => {
      // Previously failed completely silently — the button just did
      // nothing, with the actual cause (401, network error, validation
      // error, etc.) only visible in the browser console/network tab.
      console.error("Failed to start conversation with host:", err);
    },
  });
  const handleMessageHost = () => messageHostMutation.mutate();

  const handleWish = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWish(listing.id);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Minimal Header */}
      <div className="py-4">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
            <ChevronLeft className="w-5 h-5" />
            <span className="font-semibold hidden sm:inline">Back to explore</span>
          </Link>
          <div className="flex gap-1">
            <button className="flex items-center gap-2 text-sm font-medium hover:bg-muted px-3 py-2 rounded-full transition-colors">
              <Share className="w-4 h-4" /> Share
            </button>
            <button onClick={handleWish} className={cn("flex items-center gap-2 text-sm font-medium hover:bg-muted px-3 py-2 rounded-full transition-colors", isWished && "text-primary")}>
              <Heart className={cn("w-4 h-4", isWished && "fill-primary")} /> Save
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 pt-6">
        <h1 className="text-h1 mb-2">{listing.title}</h1>
        <div className="flex flex-wrap items-center gap-4 text-sm font-medium mb-6">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-foreground" />
            <span>{listing.rating.toFixed(2)}</span>
            <a href="#reviews" className="text-muted-foreground underline cursor-pointer ml-1">({listing.reviewCount} reviews)</a>
          </div>
          <span className="text-muted-foreground">•</span>
          <span className="text-muted-foreground">{listing.city}, {listing.region}, Cameroon</span>
        </div>

        {/* Hero Gallery. `row-span-2` must NOT apply below `md:` — on mobile
            every other cell is `hidden`, so a lone 2-row-spanning item sits
            in a single-column grid with no second row to size against.
            The row track's height becomes indeterminate, the `h-full` image
            can't resolve a percentage against it, and the <img> falls back
            to its own huge intrinsic size — a full-bleed, blown-up photo
            instead of the intended 400px hero. Keeping the span at 1 until
            `md:` (where the sibling cells reappear and a real second row
            exists) is what the fixed-height container actually needs. */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 rounded-modal overflow-hidden h-[400px] md:h-[500px] relative">
          <div className="md:col-span-1 lg:col-span-2 row-span-1 md:row-span-2 h-full relative">
            <img src={listing.images[0]} alt="Main" className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
          </div>
          <div className="hidden md:block h-[246px]">
            <img src={listing.images[1]} alt="Preview 1" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
          </div>
          <div className="hidden lg:block h-[246px]">
            <img src={listing.images[2]} alt="Preview 2" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
          </div>
          <div className="hidden md:block h-[246px]">
            <img src={listing.images[3] || listing.images[1]} alt="Preview 3" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
          </div>
          <div className="hidden lg:block h-[246px]">
            <img src={listing.images[0]} alt="Preview 4" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
          </div>
          
          <Button
            variant="secondary"
            onClick={() => { setGalleryIndex(0); setIsGalleryOpen(true); }}
            className="absolute bottom-6 right-6 shadow-card hidden md:flex"
          >
            View all photos
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row gap-12 mt-12">
          {/* Left Column 60% */}
          <div className="lg:w-[60%]">
            <div className="flex justify-between items-start pb-6 border-b border-border">
              <div>
                <h2 className="text-h2 mb-1">Entire place hosted by {listing.host.name}</h2>
                <p className="text-muted-foreground">
                  {listing.guests} guests • {listing.bedrooms} bedrooms • {listing.beds} beds • {listing.baths} baths
                </p>
              </div>
              <div className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center text-xl font-semibold shadow-card shrink-0">
                {listing.host.initials}
              </div>
            </div>

            <div className="py-6 border-b border-border space-y-6">
              <div className="flex gap-4">
                <Star className="w-6 h-6 mt-1" />
                <div>
                  <h3 className="font-semibold">Superhost</h3>
                  <p className="text-muted-foreground text-sm">Superhosts are experienced, highly rated hosts who are committed to providing great stays.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <Shield className="w-6 h-6 mt-1" />
                <div>
                  <h3 className="font-semibold">Free cancellation</h3>
                  <p className="text-muted-foreground text-sm">Cancel before 48 hours for a full refund.</p>
                </div>
              </div>
            </div>

            <div className="py-6 border-b border-border">
              <h2 className="text-h2 mb-4">About this space</h2>
              <p className={cn("text-muted-foreground leading-relaxed", !aboutExpanded && "line-clamp-4")}>{listing.about}</p>
              {listing.highlights?.length > 0 && aboutExpanded && (
                <ul className="mt-4 space-y-2">
                  {listing.highlights.map((h) => (
                    <li key={h.label} className="text-sm">
                      <span className="font-semibold">{h.label}:</span>{" "}
                      <span className="text-muted-foreground">{h.detail}</span>
                    </li>
                  ))}
                </ul>
              )}
              <Button
                variant="link"
                onClick={() => setAboutExpanded((v) => !v)}
                className="px-0 mt-4 text-foreground font-semibold underline underline-offset-4"
              >
                {aboutExpanded ? "Show less" : "Show more"}
              </Button>
            </div>

            <div className="py-6 border-b border-border">
              <h2 className="text-h2 mb-6">What this place offers</h2>
              <div className="grid grid-cols-2 gap-4">
                {(amenitiesExpanded ? listing.amenities : listing.amenities.slice(0, 4)).map((amenity) => {
                  const Icon = amenityIcon(amenity);
                  return (
                    <div key={amenity} className="flex items-center gap-3">
                      <Icon className="w-6 h-6 shrink-0" /> {amenity}
                    </div>
                  );
                })}
              </div>
              {listing.amenities.length > 4 && (
                <Button
                  variant="outline"
                  onClick={() => setAmenitiesExpanded((v) => !v)}
                  className="mt-6 border-foreground"
                >
                  {amenitiesExpanded ? "Show less" : `Show all ${listing.amenities.length} amenities`}
                </Button>
              )}
            </div>

            {/* Reviews */}
            <div id="reviews" className="py-6 border-b border-border scroll-mt-24">
              <h2 className="text-h2 mb-6 flex items-center gap-2">
                <Star className="w-5 h-5 fill-foreground" /> {reviews.length} review{reviews.length !== 1 ? "s" : ""}
              </h2>
              <RatingBreakdown reviews={reviews} />
              <div className="h-px bg-border w-full my-8" />
              <ReviewList reviews={reviews} />
              <div className="mt-8 max-w-md">
                <ReviewComposer listingId={listing.id} onSubmit={addReview} />
              </div>
            </div>

            {/* More Stays Nearby */}
            <div className="py-8">
              <h2 className="text-h2 mb-6">More stays nearby</h2>
              <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
                {listings.filter(l => l.id !== listing.id).slice(0, 5).map(l => (
                  <Link key={l.id} to="/stays/$stayId" params={{ stayId: l.id }} className="min-w-[220px] flex-shrink-0 group block">
                    <div className="aspect-[4/3] rounded-xl overflow-hidden mb-3 bg-muted">
                      <img src={l.images[0]} alt={l.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-semibold text-sm leading-tight">{l.title}</h3>
                      <div className="flex items-center gap-1 text-xs shrink-0">
                        <Star className="w-3 h-3 fill-foreground" />
                        <span>{l.rating.toFixed(2)}</span>
                      </div>
                    </div>
                    <p className="text-sm mt-1"><span className="font-semibold">${l.usd}</span> <span className="text-muted-foreground">night</span></p>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column 40% — Desktop Sticky Booking Card */}
          <div className="hidden lg:block lg:w-[40%]">
            <div id="book" className="sticky top-28 bg-card border border-border shadow-modal rounded-modal p-6 scroll-mt-24">
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-2xl font-bold">${listing.usd}</span>
                <span className="text-muted-foreground">night</span>
              </div>

              <div className="border border-border rounded-xl mb-4 overflow-hidden relative">
                <button
                  type="button"
                  onClick={() => { setIsDatesOpen((v) => !v); setIsGuestsOpen(false); }}
                  className="flex w-full border-b border-border text-left"
                >
                  <div className="flex-1 p-3 border-r border-border hover:bg-muted transition-colors">
                    <div className="text-[10px] font-bold uppercase tracking-wide">Check-in</div>
                    <div className="text-sm mt-1 text-foreground">{formatDatePretty(checkin)}</div>
                  </div>
                  <div className="flex-1 p-3 hover:bg-muted transition-colors">
                    <div className="text-[10px] font-bold uppercase tracking-wide">Checkout</div>
                    <div className="text-sm mt-1 text-foreground">{formatDatePretty(checkout)}</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => { setIsGuestsOpen((v) => !v); setIsDatesOpen(false); }}
                  className="w-full text-left p-3 hover:bg-muted transition-colors"
                >
                  <div className="text-[10px] font-bold uppercase tracking-wide">Guests</div>
                  <div className="text-sm mt-1 text-foreground">{guests} guest{guests > 1 ? "s" : ""}</div>
                </button>

                {isDatesOpen && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-modal p-4 grid grid-cols-2 gap-3">
                    <label className="text-xs">
                      <span className="block font-semibold uppercase tracking-wide text-[10px] mb-1">Check-in</span>
                      <input
                        type="date"
                        value={checkin}
                        min={todayIso()}
                        onChange={(e) => {
                          const v = e.target.value;
                          setCheckin(v);
                          if (checkout <= v) setCheckout(addDaysIso(v, 1));
                        }}
                        className="w-full border border-border rounded-lg px-2 py-2 text-sm outline-none focus:border-foreground"
                      />
                    </label>
                    <label className="text-xs">
                      <span className="block font-semibold uppercase tracking-wide text-[10px] mb-1">Checkout</span>
                      <input
                        type="date"
                        value={checkout}
                        min={addDaysIso(checkin, 1)}
                        onChange={(e) => setCheckout(e.target.value)}
                        className="w-full border border-border rounded-lg px-2 py-2 text-sm outline-none focus:border-foreground"
                      />
                    </label>
                    <Button size="sm" className="col-span-2 mt-1" onClick={() => setIsDatesOpen(false)}>Done</Button>
                  </div>
                )}

                {isGuestsOpen && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-modal p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-medium"><Users className="w-4 h-4" /> Guests</div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setGuests((g) => Math.max(1, g - 1))}
                          disabled={guests <= 1}
                          className="w-8 h-8 rounded-full border border-border flex items-center justify-center disabled:opacity-30"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-6 text-center font-medium">{guests}</span>
                        <button
                          type="button"
                          onClick={() => setGuests((g) => Math.min(listing.guests, g + 1))}
                          disabled={guests >= listing.guests}
                          className="w-8 h-8 rounded-full border border-border flex items-center justify-center disabled:opacity-30"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">This place has a maximum of {listing.guests} guests.</p>
                    <Button size="sm" className="w-full mt-3" onClick={() => setIsGuestsOpen(false)}>Done</Button>
                  </div>
                )}
              </div>

              <Button
                onClick={handleReserve}
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-rose-500 shadow-lg shadow-primary/20 hover:shadow-primary/40 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full -translate-x-full transition-transform duration-700 ease-out skew-x-12" />
                Reserve
              </Button>
              <p className="text-center text-sm text-muted-foreground mt-3">You won't be charged yet</p>
              
              <button
                onClick={handleMessageHost}
                disabled={messageHostMutation.isPending}
                className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-colors disabled:opacity-60"
              >
                <MessageSquare className="w-4 h-4" /> {messageHostMutation.isPending ? "Opening…" : "Message Host"}
              </button>
              {messageHostMutation.isError && (
                <p className="text-center text-xs text-destructive mt-2">
                  Couldn't open the conversation. {messageHostMutation.error instanceof Error ? messageHostMutation.error.message : "Please try again."}
                </p>
              )}
              <Link to="/concierge" className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-colors text-primary">
                <Sparkles className="w-4 h-4" /> Ask AI Concierge
              </Link>

              <div className="mt-6 pt-6 border-t border-border space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">${listing.usd} × {nights} night{nights > 1 ? "s" : ""}</span>
                  <span>${listing.usd * nights}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cleaning fee</span>
                  <span>$45</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service fee</span>
                  <span>${Math.round(listing.usd * nights * 0.14)}</span>
                </div>
                <div className="flex justify-between font-bold text-base pt-3 border-t border-border">
                  <span>Total before taxes</span>
                  <span>${listing.usd * nights + 45 + Math.round(listing.usd * nights * 0.14)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>


      {/* Mobile Sticky Booking Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-40">
        <div className="flex justify-between items-center p-4 pb-2">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="font-bold text-lg underline">${listing.usd}</span>
              <span className="text-sm text-muted-foreground">night</span>
            </div>
            <p className="text-xs text-muted-foreground">{formatDatePretty(checkin)} – {formatDatePretty(checkout)} · Free cancellation</p>
          </div>
          <Button onClick={handleReserve} className="px-7 py-6 rounded-2xl font-bold bg-gradient-to-r from-primary to-rose-500 text-white text-base">
            Reserve
          </Button>
        </div>
        <div className="flex gap-2 px-4 pb-4">
          <button
            onClick={handleMessageHost}
            disabled={messageHostMutation.isPending}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-colors disabled:opacity-60"
          >
            <MessageSquare className="w-4 h-4" /> {messageHostMutation.isPending ? "Opening…" : "Message Host"}
          </button>
          <Link to="/concierge" className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted text-primary transition-colors">
            <Sparkles className="w-4 h-4" /> AI Concierge
          </Link>
        </div>
      </div>

      {/* Photo Lightbox */}
      <AnimatePresence>
        {isGalleryOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/95 flex flex-col"
          >
            <div className="flex items-center justify-between p-4 text-white">
              <span className="text-sm font-medium">{galleryIndex + 1} / {listing.images.length}</span>
              <button
                onClick={() => setIsGalleryOpen(false)}
                className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 flex items-center justify-center relative px-4">
              <button
                onClick={() => setGalleryIndex((i) => (i - 1 + listing.images.length) % listing.images.length)}
                className="absolute left-2 sm:left-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <img
                src={listing.images[galleryIndex]}
                alt={`${listing.title} - ${galleryIndex + 1}`}
                className="max-h-[80vh] max-w-full object-contain rounded-lg"
              />
              <button
                onClick={() => setGalleryIndex((i) => (i + 1) % listing.images.length)}
                className="absolute right-2 sm:right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
