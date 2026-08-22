import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ChevronLeft, Search, MessageCircle, Mail, ShieldAlert, LifeBuoy,
  CreditCard, Map, MessagesSquare, UserCog,
} from "lucide-react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { toast } from "sonner";

export const Route = createFileRoute("/help")({
  component: HelpCenter,
});

type Faq = { q: string; a: string; category: string };

const CATEGORIES = [
  { id: "booking", label: "Booking & payments", icon: CreditCard },
  { id: "trips", label: "Trips & itineraries", icon: Map },
  { id: "messaging", label: "Messaging & calls", icon: MessagesSquare },
  { id: "account", label: "Account & safety", icon: UserCog },
];

const FAQS: Faq[] = [
  {
    category: "booking",
    q: "How do I pay for a stay?",
    a: "At checkout you can pay with a saved card, a new card, or your GlobeTrotter Wallet balance. Manage saved cards and your wallet anytime from Profile → Payments & payouts.",
  },
  {
    category: "booking",
    q: "Can I get a refund if I cancel?",
    a: "Refund terms are set by each host's cancellation policy, shown on the listing page and again before you confirm. Wallet refunds land back in your balance immediately; card refunds can take a few business days.",
  },
  {
    category: "booking",
    q: "What's GlobeTrotter Wallet?",
    a: "A prepaid balance you can top up and spend on any stay, faster than re-entering card details each time. Add funds, withdraw, or apply a promo code from the Wallet & Payments page.",
  },
  {
    category: "trips",
    q: "How do I build an itinerary?",
    a: "Open any trip and add stops day by day — search a place, drop it into a day, and drag to reorder. Costs you add roll up into that trip's budget automatically.",
  },
  {
    category: "trips",
    q: "Can I plan a trip with other people?",
    a: "Trip collaboration is on our roadmap. For now, a trip belongs to the account that created it — sharing view/edit access with co-travelers is coming in a future update.",
  },
  {
    category: "messaging",
    q: "How do voice calls to a host work?",
    a: "Tap the call icon in a conversation to ring the host directly from the app — no phone number needed. You'll see live ringing/connected states and a call summary lands in the thread afterward.",
  },
  {
    category: "messaging",
    q: "Are voice notes and photos private?",
    a: "Yes — messages, voice notes, and attachments in a conversation are only visible to you and that listing's host.",
  },
  {
    category: "account",
    q: "How do I change my name or home currency?",
    a: "Go to Profile → your profile tab → Edit, or Settings → Account, to update your display name, travel style, and home currency.",
  },
  {
    category: "account",
    q: "How do I delete my account?",
    a: "Settings → scroll to the bottom → Delete account. This permanently removes your profile, trips, wallet, and wishlists, and can't be undone.",
  },
  {
    category: "account",
    q: "I feel unsafe with a host or guest — what do I do?",
    a: "Leave the situation if you can, then use \"Report a safety issue\" below — these reports are reviewed with priority. In an emergency, contact local emergency services first.",
  },
];

function HelpCenter() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FAQS.filter((f) => {
      if (activeCategory && f.category !== activeCategory) return false;
      if (!q) return true;
      return f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q);
    });
  }, [query, activeCategory]);

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="py-4 border-b border-border">
        <div className="max-w-screen-md mx-auto px-4 sm:px-6 flex items-center gap-3">
          <Link to="/profile" className="w-9 h-9 -ml-1.5 rounded-full hover:bg-muted flex items-center justify-center transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-display text-2xl">Help Center</h1>
        </div>
      </div>

      <main className="max-w-screen-md mx-auto px-4 sm:px-6 mt-6 space-y-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search help articles…"
            className="w-full h-12 rounded-xl border border-border bg-card pl-11 pr-4 text-sm outline-none focus:border-departure-navy transition-colors"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveCategory(null)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              activeCategory === null ? "bg-departure-navy text-cloud-white border-departure-navy" : "border-border text-muted-foreground hover:border-departure-navy/40"
            }`}
          >
            All topics
          </button>
          {CATEGORIES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveCategory(activeCategory === id ? null : id)}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                activeCategory === id ? "bg-departure-navy text-cloud-white border-departure-navy" : "border-border text-muted-foreground hover:border-departure-navy/40"
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>

        <section>
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">No help articles match "{query}".</p>
          ) : (
            <Accordion type="single" collapsible className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
              {filtered.map((f) => (
                <AccordionItem key={f.q} value={f.q} className="border-0 px-4">
                  <AccordionTrigger className="text-sm font-medium text-left hover:no-underline">{f.q}</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed">{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </section>

        <section>
          <h2 className="font-display text-lg mb-3">Still need help?</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            <Link
              to="/inbox"
              className="flex flex-col items-start gap-2 p-4 rounded-2xl border border-border bg-card hover:border-departure-navy/40 hover:shadow-card transition-all"
            >
              <span className="w-9 h-9 rounded-full bg-departure-navy/10 flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-departure-navy" />
              </span>
              <span className="text-sm font-medium">Message a host</span>
              <span className="text-xs text-muted-foreground">Fastest for booking-specific questions</span>
            </Link>

            <button
              onClick={() => toast.success("Support request sent — we'll reply to your account email within 24 hours.")}
              className="flex flex-col items-start gap-2 p-4 rounded-2xl border border-border bg-card hover:border-departure-navy/40 hover:shadow-card transition-all text-left"
            >
              <span className="w-9 h-9 rounded-full bg-departure-navy/10 flex items-center justify-center">
                <Mail className="w-4 h-4 text-departure-navy" />
              </span>
              <span className="text-sm font-medium">Email support</span>
              <span className="text-xs text-muted-foreground">Reply within 24 hours</span>
            </button>

            <button
              onClick={() => toast.success("Report received — our Trust & Safety team will follow up shortly.")}
              className="flex flex-col items-start gap-2 p-4 rounded-2xl border border-border bg-card hover:border-runway-red/40 hover:shadow-card transition-all text-left"
            >
              <span className="w-9 h-9 rounded-full bg-runway-red/10 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4 text-runway-red" />
              </span>
              <span className="text-sm font-medium">Report a safety issue</span>
              <span className="text-xs text-muted-foreground">Reviewed with priority</span>
            </button>
          </div>
        </section>

        <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground pt-2">
          <LifeBuoy className="w-3.5 h-3.5" /> GlobeTrotter Support · Mon–Sun, 24 hours
        </p>
      </main>
    </div>
  );
}
