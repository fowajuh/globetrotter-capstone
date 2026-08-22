import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  Plus, ArrowDownLeft, Home, CheckCircle2, ChevronLeft, X, CreditCard as CardIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useTravel } from "@/lib/travel-store";
import { usePayments, type CardBrand } from "@/lib/payments-store";
import { AddCardDialog } from "@/components/wallet/AddCardDialog";
import { AmountDialog } from "@/components/wallet/AmountDialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/budget")({
  component: WalletScreen,
});

const brandStyle: Record<CardBrand, { bg: string; label: string }> = {
  visa: { bg: "bg-[#1A1F71]", label: "VISA" },
  mastercard: { bg: "bg-gradient-to-br from-[#EB001B] to-[#F79E1B]", label: "" },
  amex: { bg: "bg-horizon-teal", label: "AMEX" },
  other: { bg: "bg-ink-90", label: "CARD" },
};

function CardChip({ brand }: { brand: CardBrand }) {
  const style = brandStyle[brand];
  return (
    <div className={cn("w-12 h-8 rounded text-white flex items-center justify-center font-bold text-[10px] italic shrink-0", style.bg)}>
      {style.label}
    </div>
  );
}

function WalletScreen() {
  const { walletBalance, transactions, addFunds, withdraw, redeemPromo } = useTravel();
  const { cards, defaultCardId, addCard, removeCard, setDefaultCard } = usePayments();
  const [filter, setFilter] = useState("All");
  const [promo, setPromo] = useState("");
  const [promoSuccess, setPromoSuccess] = useState<number | null>(null);
  const [addCardOpen, setAddCardOpen] = useState(false);
  const [addFundsOpen, setAddFundsOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const applyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promo.trim()) return;
    const result = redeemPromo(promo);
    if (result.success) {
      setPromoSuccess(result.amount ?? 0);
      setTimeout(() => setPromoSuccess(null), 3000);
      setPromo("");
    } else {
      toast.error("That code isn't valid, or you've already used it.");
    }
  };

  const filtered = transactions.filter((t) => {
    if (filter === "All") return true;
    if (filter === "Credits") return t.type === "credit";
    if (filter === "Charges") return t.type === "debit";
    return false;
  });

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="py-4 border-b border-border">
        <div className="max-w-screen-md mx-auto px-4 sm:px-6 flex items-center gap-3">
          <Link to="/profile" className="w-9 h-9 -ml-1.5 rounded-full hover:bg-muted flex items-center justify-center transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-display text-2xl">Wallet &amp; Payments</h1>
        </div>
      </div>

      <main className="max-w-screen-md mx-auto px-4 sm:px-6 mt-8 space-y-10">
        {/* Balance Card */}
        <section>
          <div className="relative rounded-[24px] overflow-hidden p-8 sm:p-10 shadow-modal bg-departure-navy text-cloud-white">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-beacon-amber/15 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-horizon-teal/15 rounded-full blur-3xl" />

            <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
              <div>
                <p className="text-cloud-white/60 font-medium tracking-[0.14em] uppercase text-xs mb-1">Travel Credits Balance</p>
                <h2 className="num text-5xl tracking-tight">
                  ${walletBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h2>
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <Button onClick={() => setAddFundsOpen(true)} className="flex-1 sm:flex-none bg-beacon-amber text-departure-navy hover:bg-beacon-amber/90">
                  Add funds
                </Button>
                <Button onClick={() => setWithdrawOpen(true)} variant="outline" className="flex-1 sm:flex-none bg-white/10 text-cloud-white hover:bg-white/20 border-0">
                  Withdraw
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Payment Methods */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl">Payment Methods</h2>
            <Button variant="ghost" onClick={() => setAddCardOpen(true)} className="text-departure-navy hover:bg-departure-navy/10 gap-1 px-3">
              <Plus className="w-4 h-4" /> Add new
            </Button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {cards.map((card) => (
              <div key={card.id} className="border border-border rounded-xl p-4 flex items-center gap-4 bg-card shadow-sm group hover:border-departure-navy/40 transition-colors">
                <CardChip brand={card.brand} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm num">•••• {card.last4}</p>
                  <p className="text-xs text-muted-foreground num">
                    Expires {String(card.expMonth).padStart(2, "0")}/{card.expYear}
                  </p>
                </div>
                {card.id === defaultCardId ? (
                  <div className="px-2 py-0.5 bg-departure-navy/10 text-departure-navy text-[10px] font-bold uppercase tracking-wider rounded shrink-0">
                    Default
                  </div>
                ) : (
                  <button
                    onClick={() => setDefaultCard(card.id)}
                    className="text-[11px] text-muted-foreground hover:text-departure-navy underline underline-offset-2 shrink-0"
                  >
                    Set default
                  </button>
                )}
                <button
                  onClick={() => removeCard(card.id)}
                  aria-label="Remove card"
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-muted shrink-0"
                >
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
            ))}

            {cards.length === 0 && (
              <button
                onClick={() => setAddCardOpen(true)}
                className="border border-dashed border-border rounded-xl p-4 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:border-departure-navy/40 hover:text-departure-navy transition-colors sm:col-span-2"
              >
                <CardIcon className="w-4 h-4" /> No cards saved — add one
              </button>
            )}
          </div>
        </section>

        {/* Promo Codes */}
        <section>
          <h2 className="font-display text-xl mb-4">Gift cards &amp; Promos</h2>
          <form onSubmit={applyPromo} className="flex gap-2 relative">
            <input
              type="text"
              placeholder="Enter code"
              value={promo}
              onChange={(e) => setPromo(e.target.value)}
              className="flex-1 h-12 rounded-xl border border-border bg-background px-4 outline-none focus:border-departure-navy transition-colors"
            />
            <Button type="submit" className="h-12 px-6 bg-departure-navy hover:bg-departure-navy/90 text-cloud-white">Apply</Button>

            <AnimatePresence>
              {promoSuccess != null && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute -top-12 left-0 flex items-center gap-2 text-horizon-teal bg-horizon-teal/10 px-4 py-2 rounded-lg border border-horizon-teal/30"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm font-medium num">+${promoSuccess.toFixed(2)} added to your balance</span>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </section>

        {/* Transactions */}
        <section>
          <h2 className="font-display text-xl mb-4">Transaction History</h2>

          <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-6">
            {["All", "Charges", "Credits"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium transition-micro border",
                  filter === f
                    ? "bg-departure-navy text-cloud-white border-departure-navy"
                    : "bg-transparent text-muted-foreground border-border hover:border-departure-navy/50",
                )}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filtered.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No transactions in this filter yet.</p>
            )}
            {filtered.map((t) => {
              const Icon = t.type === "debit" ? Home : ArrowDownLeft;
              return (
                <div key={t.id} className="flex items-center justify-between p-4 bg-card rounded-xl border border-border shadow-card">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                      t.type === "debit" ? "bg-muted text-foreground" : "bg-horizon-teal/10 text-horizon-teal",
                    )}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{t.description}</p>
                      <p className="text-xs text-muted-foreground">{new Date(t.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className={cn("num font-bold shrink-0", t.type === "debit" ? "text-foreground" : "text-horizon-teal")}>
                    {t.type === "debit" ? "-" : "+"}${t.amount.toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <AddCardDialog open={addCardOpen} onOpenChange={setAddCardOpen} onAdd={addCard} />
      <AmountDialog
        open={addFundsOpen}
        onOpenChange={setAddFundsOpen}
        title="Add funds"
        actionLabel="Add to balance"
        onConfirm={(amount) => {
          addFunds(amount);
          toast.success(`$${amount.toFixed(2)} added to your balance.`);
        }}
      />
      <AmountDialog
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        title="Withdraw"
        actionLabel="Withdraw"
        maxAmount={walletBalance}
        onConfirm={(amount) => {
          const ok = withdraw(amount);
          if (ok) toast.success(`$${amount.toFixed(2)} sent to your bank.`);
          else toast.error("That's more than your available balance.");
        }}
      />
    </div>
  );
}
