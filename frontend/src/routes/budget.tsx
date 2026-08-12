import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { CreditCard, Plus, ArrowUpRight, ArrowDownLeft, Home, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTravel } from "@/lib/travel-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/budget")({
  component: WalletScreen,
});

function WalletScreen() {
  const { walletBalance, transactions } = useTravel();
  const [filter, setFilter] = useState("All");
  const [promo, setPromo] = useState("");
  const [promoSuccess, setPromoSuccess] = useState(false);

  const applyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if(promo.trim()) {
      setPromoSuccess(true);
      setTimeout(() => setPromoSuccess(false), 3000);
      setPromo("");
    }
  };

  const filtered = transactions.filter(t => {
    if (filter === "All") return true;
    if (filter === "Credits" && (t.type === "credit")) return true;
    if (filter === "Charges" && t.type === "debit") return true;
    return false;
  });

  const getIcon = (type: string) => {
    if (type === "debit") return Home;
    return ArrowDownLeft;
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="py-4">
        <div className="max-w-screen-md mx-auto px-4 sm:px-6">
          <h1 className="text-2xl font-bold">Wallet & Payments</h1>
        </div>
      </div>

      <main className="max-w-screen-md mx-auto px-4 sm:px-6 mt-8 space-y-10">
        
        {/* Balance Card */}
        <section>
          <div className="relative rounded-[24px] overflow-hidden p-8 sm:p-10 shadow-modal bg-gradient-to-br from-gray-900 to-black text-white">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl" />
            
            <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
              <div>
                <p className="text-white/70 font-medium tracking-wide uppercase text-xs mb-1">Travel Credits Balance</p>
                <h2 className="text-5xl font-bold tracking-tight">${walletBalance.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h2>
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <Button className="flex-1 sm:flex-none bg-white text-black hover:bg-white/90">Add funds</Button>
                <Button className="flex-1 sm:flex-none bg-white/10 text-white hover:bg-white/20 border-0" variant="outline">Withdraw</Button>
              </div>
            </div>
          </div>
        </section>

        {/* Payment Methods */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Payment Methods</h2>
            <Button variant="ghost" className="text-primary hover:bg-primary/10 hover:text-primary gap-1 px-3">
              <Plus className="w-4 h-4" /> Add new
            </Button>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Card 1 */}
            <div className="border border-border rounded-xl p-4 flex items-center gap-4 bg-card shadow-sm group hover:border-primary/50 transition-colors cursor-pointer">
              <div className="w-12 h-8 rounded bg-[#1A1F71] text-white flex items-center justify-center font-bold text-xs italic shrink-0">
                VISA
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">•••• 4242</p>
                <p className="text-xs text-muted-foreground">Expires 12/28</p>
              </div>
              <div className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider rounded">Default</div>
            </div>

            {/* Card 2 */}
            <div className="border border-border rounded-xl p-4 flex items-center gap-4 bg-card shadow-sm group hover:border-primary/50 transition-colors cursor-pointer">
              <div className="w-12 h-8 rounded bg-[#EB001B] text-white flex items-center justify-center font-bold text-[10px] shrink-0 relative overflow-hidden">
                <div className="absolute w-5 h-5 rounded-full bg-[#F79E1B] left-1 opacity-80 mix-blend-screen" />
                <div className="absolute w-5 h-5 rounded-full bg-[#EB001B] right-1 opacity-80 mix-blend-screen" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">•••• 5555</p>
                <p className="text-xs text-muted-foreground">Expires 09/26</p>
              </div>
            </div>
          </div>
        </section>

        {/* Promo Codes */}
        <section>
          <h2 className="text-xl font-bold mb-4">Gift cards & Promos</h2>
          <form onSubmit={applyPromo} className="flex gap-2 relative">
            <input 
              type="text" 
              placeholder="Enter code" 
              value={promo}
              onChange={(e) => setPromo(e.target.value)}
              className="flex-1 h-12 rounded-xl border border-border bg-background px-4 outline-none focus:border-primary transition-colors"
            />
            <Button type="submit" className="h-12 px-6">Apply</Button>
            
            <AnimatePresence>
              {promoSuccess && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute -top-12 left-0 flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg border border-green-200"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Code applied successfully!</span>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </section>

        {/* Transactions */}
        <section>
          <h2 className="text-xl font-bold mb-4">Transaction History</h2>
          
          <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-6">
            {["All", "Charges", "Credits"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium transition-micro border",
                  filter === f 
                    ? "bg-foreground text-background border-foreground" 
                    : "bg-transparent text-muted-foreground border-border hover:border-foreground"
                )}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filtered.map((t) => {
              const Icon = getIcon(t.type);
              return (
                <div key={t.id} className="flex items-center justify-between p-4 bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                      t.type === "debit" ? "bg-muted text-foreground" : "bg-green-100 text-green-700"
                    )}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{t.description}</p>
                      <p className="text-xs text-muted-foreground">{new Date(t.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className={cn(
                    "font-bold font-mono",
                    t.type === "debit" ? "text-foreground" : "text-green-600"
                  )}>
                    {t.type === "debit" ? "-" : "+"}${t.amount.toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </main>
    </div>
  );
}
