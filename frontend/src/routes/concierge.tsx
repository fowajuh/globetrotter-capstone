import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Heart, ChevronLeft, RotateCcw, Star, Plus, ShieldCheck, MapPin as PinIcon, Zap,
  Waves, Mountain, Trees, Binoculars, Building2, Landmark, Droplets, Utensils,
  Users, Wallet, MapPinned,
} from "lucide-react";
import { listings, type Listing } from "@/lib/cameroon-data";
import { interpretQuery, type ParsedFilter } from "@/lib/concierge-intent";
import { useTravel } from "@/lib/travel-store";
import { formatMoney } from "@/lib/currency";
import { useHomeCurrency } from "@/lib/use-home-currency";
import { ConciergeMark } from "@/components/concierge/ConciergeMark";
import { ConciergeVoiceInput } from "@/components/concierge/ConciergeVoiceInput";
import { useStreamedText } from "@/components/concierge/useStreamedText";
import { Sheet } from "@/components/manifest/Sheet";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/concierge")({
  component: ConciergeScreen,
});

type ChatMessage = {
  id: string;
  sender: "ai" | "user";
  text: string;
  results?: Listing[];
  filters?: ParsedFilter[];
};

const EASE = [0.22, 1, 0.36, 1] as const;

const categoryIcon: Record<string, typeof Waves> = {
  Beachfront: Waves, Mountain, Rainforest: Trees, Safari: Binoculars,
  "City lofts": Building2, Heritage: Landmark, Lakeside: Droplets, "Chef's table": Utensils,
};

function filterIcon(f: ParsedFilter) {
  switch (f.kind) {
    case "region": return PinIcon;
    case "category": return categoryIcon[f.value] ?? Waves;
    case "maxPrice":
    case "minPrice": return Wallet;
    case "minGuests":
    case "maxGuests": return Users;
    case "superhost": return ShieldCheck;
    case "instantBook": return Zap;
    case "topRated": return Star;
    default: return Waves;
  }
}

const CAPABILITIES = [
  { icon: Waves, label: "Beachfront escapes", query: "beachfront stays near Kribi", sub: "Kribi & the coast" },
  { icon: Users, label: "Family-friendly", query: "family-friendly stays for 4 or more", sub: "Space for everyone" },
  { icon: Wallet, label: "Under $80/night", query: "budget stays under $80", sub: "Great value picks" },
  { icon: MapPinned, label: "Near Douala", query: "stays near Douala", sub: "City energy" },
];

const GREETING =
  "Hi, I'm your GlobeTrotter concierge. Tell me a place, a budget, or a vibe — beachfront, family-friendly, under $80 — and I'll line up the best matches from across Cameroon.";

function greetingMessage(): ChatMessage {
  return { id: "greeting", sender: "ai", text: GREETING };
}

/** Same card language as the Explore page's own listing card (see
 *  routes/index.tsx) — image, wishlist heart, city/region + rating,
 *  price — instead of a separately-branded "AI result card" look. */
function ListingResultCard({ listing, index }: { listing: Listing; index: number }) {
  const { wishlist, toggleWish } = useTravel();
  const isWished = wishlist.includes(listing.id);
  const homeCurrency = useHomeCurrency();

  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: EASE }}
      className="w-40 sm:w-44 shrink-0"
    >
      <Link to="/stays/$stayId" params={{ stayId: listing.id }} className="group block">
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted">
          <img
            src={listing.images[0]}
            alt={listing.title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWish(listing.id); }}
            aria-label={isWished ? "Remove from wishlist" : "Save to wishlist"}
            className="absolute top-2 right-2 hover:scale-110 transition-transform drop-shadow-md"
          >
            <Heart className={cn("w-5 h-5", isWished ? "fill-primary text-primary" : "text-white")} />
          </button>
        </div>
        <div className="mt-2">
          <div className="flex justify-between items-start gap-1">
            <h3 className="font-semibold text-[13px] text-foreground leading-tight truncate">
              {listing.city}, {listing.region}
            </h3>
            <div className="flex items-center gap-0.5 text-[11px] shrink-0 num">
              <Star className="w-3 h-3 fill-foreground" />
              {listing.rating.toFixed(2)}
            </div>
          </div>
          <p className="text-[13px] text-foreground mt-0.5">
            <span className="font-semibold">{formatMoney(listing.usd, homeCurrency)}</span>{" "}
            <span className="text-muted-foreground">night</span>
          </p>
        </div>
      </Link>
    </motion.div>
  );
}

/** Refined typing indicator: three dots with staggered spring bounce
 *  instead of a flat height-tween — the small physicality is most of what
 *  separates "premium" motion from a generic loading widget. */
function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6, transition: { duration: 0.15 } }}
      transition={{ duration: 0.25, ease: EASE }}
      className="flex gap-3 items-end"
    >
      <ConciergeMark size="sm" thinking />
      <div className="bg-muted px-4 py-3.5 rounded-2xl rounded-bl-sm flex items-center gap-1.5 h-[38px]">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-2 h-2 rounded-full bg-foreground/40"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.16, ease: "easeInOut" }}
          />
        ))}
      </div>
    </motion.div>
  );
}

function MessageBubble({ msg, isStreaming }: { msg: ChatMessage; isStreaming: boolean }) {
  const isUser = msg.sender === "user";
  const { shown, done } = useStreamedText(msg.text, !isUser && isStreaming);
  const showResults = isUser || done;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.32, ease: EASE }}
      className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}
    >
      {!isUser && <ConciergeMark size="sm" />}
      <div className={cn("flex flex-col gap-2.5 max-w-[82%]", isUser && "items-end")}>
        <div
          className={cn(
            "rounded-2xl text-[15px] leading-relaxed overflow-hidden",
            isUser
              ? "bg-primary text-primary-foreground rounded-br-sm"
              : "bg-muted text-foreground rounded-bl-sm px-4 py-2.5",
          )}
        >
          {isUser && msg.filters && msg.filters.length > 0 && (
            <div className="flex flex-wrap gap-1.5 px-4 pt-3 pb-2 border-b border-white/15 bg-black/[0.06]">
              {msg.filters.map((f, i) => {
                const Icon = filterIcon(f);
                return (
                  <span key={i} className="inline-flex items-center gap-1 text-[10.5px] font-medium bg-white/15 rounded-full px-2 py-1 capitalize">
                    <Icon className="w-3 h-3 shrink-0" /> {f.label}
                  </span>
                );
              })}
            </div>
          )}
          <p className={cn(isUser && "px-4 py-3")}>
            {isUser ? msg.text : shown}
            {!isUser && !done && (
              <motion.span
                className="inline-block w-[2px] h-[14px] bg-foreground/50 ml-0.5 align-middle"
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, repeatType: "reverse" }}
              />
            )}
          </p>
        </div>
        <AnimatePresence>
          {msg.results && msg.results.length > 0 && showResults && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.3, ease: EASE }}
              className="flex gap-3 overflow-x-auto pb-1 max-w-[85vw] scrollbar-hide -mx-1 px-1"
            >
              {msg.results.map((l, i) => (
                <ListingResultCard key={l.id} listing={l} index={i} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function ConciergeScreen() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([greetingMessage()]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [capabilitiesOpen, setCapabilitiesOpen] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = (query: string = input) => {
    if (!query.trim() || isTyping) return;
    // Parsed synchronously (cheap, deterministic) so the person sees what
    // the concierge understood on their own message right away.
    const parsed = interpretQuery(query, listings);
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, sender: "user", text: query, filters: parsed.filters };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setCapabilitiesOpen(false);
    setIsTyping(true);

    const thinkMs = 550 + Math.random() * 550;
    setTimeout(() => {
      setIsTyping(false);
      const replyId = `a-${Date.now()}`;
      setStreamingId(replyId);
      setMessages((prev) => [...prev, { id: replyId, sender: "ai", text: parsed.summary, results: parsed.results }]);
    }, thinkMs);
  };

  const resetChat = () => {
    setMessages([greetingMessage()]);
    setInput("");
    setStreamingId(null);
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border px-4 py-3 shrink-0">
        <div className="flex items-center gap-3 max-w-screen-md mx-auto">
          <button
            onClick={() => navigate({ to: "/" })}
            aria-label="Back"
            className="p-1.5 -ml-1.5 rounded-full hover:bg-muted transition-colors md:hidden"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <ConciergeMark />
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-[15px] leading-tight text-foreground">Concierge</h1>
            <p className="text-xs text-muted-foreground truncate">Matches stays to what you tell it</p>
          </div>
          {messages.length > 1 && (
            <button
              onClick={resetChat}
              aria-label="Start a new conversation"
              className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-5 max-w-screen-md mx-auto w-full">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} isStreaming={msg.id === streamingId} />
          ))}
          {isTyping && <TypingIndicator key="typing" />}
        </AnimatePresence>
        <div ref={endRef} />
      </main>

      {/* Capability cards — shown before the first real question */}
      {messages.length === 1 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease: EASE }}
          className="px-4 pb-3 max-w-screen-md mx-auto w-full"
        >
          <div className="grid grid-cols-2 gap-2.5">
            {CAPABILITIES.map(({ icon: Icon, label, query, sub }) => (
              <button
                key={label}
                onClick={() => handleSend(query)}
                className="flex items-center gap-2.5 text-left px-3 py-2.5 rounded-xl border border-border bg-card hover:border-foreground/30 hover:shadow-sm transition-all"
              >
                <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-medium leading-tight truncate text-foreground">{label}</span>
                  <span className="block text-[11px] text-muted-foreground truncate">{sub}</span>
                </span>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Input */}
      <footer className="px-3 pb-4 pt-2 bg-background border-t border-border shrink-0">
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex items-center gap-2 max-w-screen-md mx-auto"
        >
          <button
            type="button"
            onClick={() => setCapabilitiesOpen(true)}
            aria-label="Browse suggestions"
            className="w-11 h-11 shrink-0 rounded-full flex items-center justify-center bg-muted text-foreground hover:bg-muted/70 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-1 flex-1 min-w-0 bg-muted pl-4 pr-1 h-11 rounded-full border border-border focus-within:border-foreground/30 focus-within:ring-1 focus-within:ring-foreground/10 transition-all">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask for a place, budget, or vibe…"
              className="flex-1 bg-transparent border-none outline-none text-[15px] min-w-0 h-full"
            />
            <ConciergeVoiceInput
              onTranscript={(text) => setInput(text)}
              onError={(msg) => toast.error(msg)}
              disabled={isTyping}
            />
          </div>

          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            aria-label="Send"
            className="w-11 h-11 shrink-0 rounded-full flex items-center justify-center bg-primary text-primary-foreground shadow-sm disabled:opacity-40 disabled:bg-muted disabled:text-muted-foreground transition-all hover:scale-105 active:scale-95"
          >
            <Send className="w-[18px] h-[18px]" />
          </button>
        </form>
      </footer>

      <Sheet open={capabilitiesOpen} onClose={() => setCapabilitiesOpen(false)} title="Try asking about…">
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          {CAPABILITIES.map(({ icon: Icon, label, query, sub }) => (
            <button
              key={label}
              onClick={() => handleSend(query)}
              className="flex items-center gap-2.5 text-left px-3 py-2.5 rounded-xl border border-border bg-card hover:border-foreground/30 transition-all"
            >
              <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-primary" />
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-medium leading-tight truncate text-foreground">{label}</span>
                <span className="block text-[11px] text-muted-foreground truncate">{sub}</span>
              </span>
            </button>
          ))}
        </div>
      </Sheet>
    </div>
  );
}
