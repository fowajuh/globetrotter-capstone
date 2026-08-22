import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Heart, ChevronLeft, RotateCcw, Star, Zap,
  Waves, Mountain, Trees, Binoculars, Building2, Landmark, Droplets, Utensils,
  Users, Wallet, MapPinned,
} from "lucide-react";
import { listings, type Listing } from "@/lib/cameroon-data";
import { interpretQuery } from "@/lib/concierge-intent";
import { useTravel } from "@/lib/travel-store";
import { formatMoney } from "@/lib/currency";
import { useHomeCurrency } from "@/lib/use-home-currency";
import { ConciergeMark } from "@/components/concierge/ConciergeMark";
import { ConciergeVoiceInput } from "@/components/concierge/ConciergeVoiceInput";
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
};

const categoryIcon: Record<string, typeof Waves> = {
  Beachfront: Waves, Mountain, Rainforest: Trees, Safari: Binoculars,
  "City lofts": Building2, Heritage: Landmark, Lakeside: Droplets, "Chef's table": Utensils,
};

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

function ListingResultCard({ listing, index }: { listing: Listing; index: number }) {
  const { wishlist, toggleWish } = useTravel();
  const isWished = wishlist.includes(listing.id);
  const Icon = categoryIcon[listing.category] ?? Waves;
  const homeCurrency = useHomeCurrency();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.25), ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        to="/stays/$stayId"
        params={{ stayId: listing.id }}
        className="group flex-shrink-0 w-52 bg-cloud-white border border-ink-90/10 rounded-2xl overflow-hidden hover:shadow-modal transition-shadow"
      >
        <div className="relative h-32">
          <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWish(listing.id); }}
            aria-label={isWished ? "Remove from wishlist" : "Save to wishlist"}
            className="absolute top-2 right-2 w-7 h-7 bg-departure-navy/40 backdrop-blur-sm rounded-full flex items-center justify-center"
          >
            <Heart className={cn("w-3.5 h-3.5", isWished ? "fill-runway-red text-runway-red" : "text-cloud-white")} />
          </button>
          <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 num text-[9px] uppercase tracking-[0.16em] bg-cloud-white/90 text-departure-navy px-1.5 py-1 rounded-full">
            <Icon className="w-3 h-3" /> {listing.category}
          </span>
          {listing.instantBook && (
            <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 num text-[9px] uppercase tracking-[0.16em] bg-beacon-amber text-departure-navy px-1.5 py-1 rounded-full">
              <Zap className="w-2.5 h-2.5" />
            </span>
          )}
        </div>
        <div className="p-3">
          <div className="flex justify-between items-start gap-1 mb-0.5">
            <h3 className="font-display text-[13px] leading-tight text-departure-navy line-clamp-1">
              {listing.city}, {listing.region}
            </h3>
            <div className="flex items-center gap-0.5 text-[11px] shrink-0 num">
              <Star className="w-3 h-3 fill-beacon-amber text-beacon-amber" />
              {listing.rating.toFixed(2)}
            </div>
          </div>
          <p className="text-[13px] text-ink-90">
            <span className="num font-medium">{formatMoney(listing.usd, homeCurrency)}</span> <span className="text-ink-60">night</span>
          </p>
        </div>
      </Link>
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3 items-end">
      <ConciergeMark size="sm" thinking />
      <div className="bg-runway-sand px-4 py-3.5 rounded-2xl rounded-bl-sm flex items-center gap-[3px] h-[38px]">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-[3px] rounded-full bg-departure-navy/50"
            animate={{ height: [6, 14, 6] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
          />
        ))}
      </div>
    </div>
  );
}

function ConciergeScreen() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([greetingMessage()]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = (query: string = input) => {
    if (!query.trim() || isTyping) return;
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, sender: "user", text: query };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    const thinkMs = 650 + Math.random() * 700;
    setTimeout(() => {
      const { summary, results } = interpretQuery(query, listings);
      setIsTyping(false);
      setMessages((prev) => [...prev, { id: `a-${Date.now()}`, sender: "ai", text: summary, results }]);
    }, thinkMs);
  };

  const resetChat = () => {
    setMessages([greetingMessage()]);
    setInput("");
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
            <h1 className="font-display text-[15px] leading-tight">Concierge</h1>
            <p className="text-xs text-ink-60 truncate">Matches stays to what you tell it</p>
          </div>
          {messages.length > 1 && (
            <button
              onClick={resetChat}
              aria-label="Start a new conversation"
              className="p-2 rounded-full hover:bg-muted transition-colors text-ink-60 hover:text-foreground"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-5 max-w-screen-md mx-auto w-full">
        {messages.map((msg) => {
          const isUser = msg.sender === "user";
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}
            >
              {!isUser && <ConciergeMark size="sm" />}
              <div className={cn("flex flex-col gap-2.5 max-w-[82%]", isUser && "items-end")}>
                <div
                  className={cn(
                    "px-4 py-2.5 rounded-2xl text-[15px] leading-relaxed",
                    isUser
                      ? "bg-departure-navy text-cloud-white rounded-br-sm"
                      : "bg-runway-sand text-ink-90 rounded-bl-sm",
                  )}
                >
                  {msg.text}
                </div>
                {msg.results && msg.results.length > 0 && (
                  <div className="flex gap-3 overflow-x-auto pb-1 max-w-[85vw] scrollbar-hide -mx-1 px-1">
                    {msg.results.map((l, i) => (
                      <ListingResultCard key={l.id} listing={l} index={i} />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}

        <AnimatePresence>{isTyping && <TypingIndicator />}</AnimatePresence>
        <div ref={endRef} />
      </main>

      {/* Capability cards — shown before the first real question */}
      {messages.length === 1 && (
        <div className="px-4 pb-3 max-w-screen-md mx-auto w-full">
          <div className="perforation-divider mb-3" />
          <div className="grid grid-cols-2 gap-2.5">
            {CAPABILITIES.map(({ icon: Icon, label, query, sub }) => (
              <button
                key={label}
                onClick={() => handleSend(query)}
                className="flex items-center gap-2.5 text-left px-3 py-2.5 rounded-xl border border-border bg-cloud-white hover:border-departure-navy/30 hover:shadow-card transition-all"
              >
                <span className="w-8 h-8 rounded-full bg-departure-navy/5 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-departure-navy" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-medium leading-tight truncate">{label}</span>
                  <span className="block text-[11px] text-ink-60 truncate">{sub}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <footer className="px-4 pb-4 pt-2 bg-background border-t border-border shrink-0">
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex items-center gap-1 bg-muted pl-4 pr-1.5 py-1.5 rounded-3xl border border-border focus-within:border-departure-navy/40 focus-within:ring-1 focus-within:ring-departure-navy/20 transition-all max-w-screen-md mx-auto"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask for a place, budget, or vibe…"
            className="flex-1 bg-transparent border-none outline-none py-2 text-[15px] min-w-0"
          />
          <ConciergeVoiceInput
            onTranscript={(text) => setInput(text)}
            onError={(msg) => toast.error(msg)}
            disabled={isTyping}
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            aria-label="Send"
            className="p-2.5 bg-departure-navy text-cloud-white rounded-full disabled:opacity-40 disabled:bg-muted disabled:text-muted-foreground transition-all hover:scale-105 active:scale-95 shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </footer>
    </div>
  );
}
