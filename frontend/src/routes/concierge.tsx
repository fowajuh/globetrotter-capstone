import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, MapPin, Star, Heart, ChevronRight, Mic } from "lucide-react";
import { listings } from "@/lib/cameroon-data";
import { useTravel } from "@/lib/travel-store";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/concierge")({
  component: ConciergeScreen,
});

type Message = {
  id: number;
  sender: "ai" | "user";
  text?: string;
  listings?: typeof listings;
};

const suggestions = [
  "Find me a beachfront villa under $200",
  "Best places to stay near Douala",
  "Family-friendly stays in Cameroon",
  "Budget hostels for solo travel",
];

const aiReplies: Record<string, { text: string; filter: (l: typeof listings[0]) => boolean }> = {
  beach: { text: "Here are the best beachfront options I found for you 🏖️", filter: (l) => l.category.includes("beach") || l.city.toLowerCase().includes("kribi") },
  budget: { text: "Great picks for budget travelers 💰", filter: (l) => l.usd < 80 },
  family: { text: "Perfect family-friendly stays with space for everyone 👨‍👩‍👧‍👦", filter: (l) => l.guests >= 4 },
  douala: { text: "Top-rated stays in and around Douala 🌆", filter: (l) => l.region.toLowerCase().includes("littoral") },
  solo: { text: "Cozy solo traveler spots with great host reviews ✈️", filter: (l) => l.guests <= 2 },
};

function getAIResponse(query: string): Message {
  const q = query.toLowerCase();
  let matched = Object.entries(aiReplies).find(([key]) => q.includes(key));
  if (!matched) matched = ["default", { text: "Here are some great stays I found for you ✨", filter: () => true }];
  const [, { text, filter }] = matched;
  return {
    id: Date.now(),
    sender: "ai",
    text,
    listings: listings.filter(filter).slice(0, 4),
  };
}

function ListingChip({ listing }: { listing: typeof listings[0] }) {
  const { wishlist, toggleWish } = useTravel();
  const isWished = wishlist.includes(listing.id);
  return (
    <Link to="/stays/$stayId" params={{ stayId: listing.id }}
      className="flex-shrink-0 w-56 bg-card border border-border rounded-2xl overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="relative h-36">
        <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWish(listing.id); }}
          className="absolute top-2 right-2 w-8 h-8 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center"
        >
          <Heart className={cn("w-4 h-4", isWished ? "fill-primary text-primary" : "text-white")} />
        </button>
      </div>
      <div className="p-3">
        <div className="flex justify-between items-start gap-1 mb-1">
          <h3 className="font-semibold text-sm leading-tight line-clamp-1">{listing.city}, {listing.region}</h3>
          <div className="flex items-center gap-0.5 text-xs shrink-0">
            <Star className="w-3 h-3 fill-foreground" />
            {listing.rating.toFixed(2)}
          </div>
        </div>
        <p className="text-sm"><span className="font-bold">${listing.usd}</span> <span className="text-muted-foreground">night</span></p>
      </div>
    </Link>
  );
}

function ConciergeScreen() {
  const [messages, setMessages] = useState<Message[]>([{
    id: 0,
    sender: "ai",
    text: "Hi! I'm your AI travel concierge 🌍 Tell me what you're looking for — budget, destination, vibe — and I'll find the perfect stay for you.",
  }]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = (query: string = input) => {
    if (!query.trim()) return;
    const userMsg: Message = { id: Date.now(), sender: "user", text: query };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, getAIResponse(query)]);
    }, 1200);
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border px-4 py-3 shrink-0">
        <div className="flex items-center gap-3 max-w-screen-md mx-auto">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary via-pink-500 to-orange-400 flex items-center justify-center shadow-md">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-[15px]">AI Concierge</h1>
            <p className="text-xs text-muted-foreground">Your personal travel assistant</p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4 max-w-screen-md mx-auto w-full">
        {messages.map((msg) => {
          const isUser = msg.sender === "user";
          return (
            <div key={msg.id} className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
              {!isUser && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary via-pink-500 to-orange-400 flex items-center justify-center shrink-0 mt-auto">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              )}
              <div className={cn("flex flex-col gap-2 max-w-[80%]", isUser && "items-end")}>
                {msg.text && (
                  <div className={cn(
                    "px-4 py-3 rounded-2xl text-[15px] leading-relaxed",
                    isUser ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm"
                  )}>
                    {msg.text}
                  </div>
                )}
                {msg.listings && msg.listings.length > 0 && (
                  <div className="flex gap-3 overflow-x-auto pb-2 max-w-[85vw] scrollbar-hide">
                    {msg.listings.map((l) => <ListingChip key={l.id} listing={l} />)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        
        {isTyping && (
          <div className="flex gap-3 items-end">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary via-pink-500 to-orange-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="bg-muted px-4 py-3 rounded-2xl rounded-bl-sm">
              <div className="flex gap-1 items-center h-4">
                <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </main>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2 max-w-screen-md mx-auto w-full">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => handleSend(s)}
                className="shrink-0 px-4 py-2 rounded-full border border-border bg-card text-sm font-medium hover:border-primary hover:bg-primary/5 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <footer className="px-4 pb-4 pt-2 bg-background border-t border-border shrink-0">
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex items-center gap-2 bg-muted px-4 py-2 rounded-3xl border border-border focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/30 transition-all max-w-screen-md mx-auto"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything about travel..."
            className="flex-1 bg-transparent border-none outline-none py-2.5 text-[15px]"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="p-2.5 bg-primary text-primary-foreground rounded-full disabled:opacity-40 disabled:bg-muted disabled:text-muted-foreground transition-all hover:scale-105 active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </footer>
    </div>
  );
}
