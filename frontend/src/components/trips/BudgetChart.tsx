import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plane, Bed, Utensils, Camera, Car, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

type ByDay = { dayIndex: number; total: number };
type ByCategory = { category: string; total: number };

const CATEGORY_META: Record<string, { label: string; icon: typeof Plane; color: string }> = {
  flight: { label: "Flights", icon: Plane, color: "var(--color-departure-navy)" },
  stay: { label: "Stays", icon: Bed, color: "var(--color-horizon-teal)" },
  eat: { label: "Food & drink", icon: Utensils, color: "var(--color-beacon-amber)" },
  see: { label: "Activities", icon: Camera, color: "var(--color-runway-red)" },
  move: { label: "Getting around", icon: Car, color: "var(--color-ink-60)" },
  other: { label: "Other", icon: MapPin, color: "var(--color-ink-30)" },
};

function money(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${currency} ${Math.round(amount).toLocaleString()}`;
  }
}

export function BudgetChart({ byDay, byCategory, currency }: { byDay: ByDay[]; byCategory: ByCategory[]; currency: string }) {
  const [mode, setMode] = useState<"category" | "day">("category");

  const hasData = byDay.some((d) => d.total > 0) || byCategory.some((c) => c.total > 0);
  if (!hasData) {
    return <p className="text-sm text-muted-foreground pt-2">Add stops with costs to see your spend breakdown.</p>;
  }

  const sortedCategories = [...byCategory].filter((c) => c.total > 0).sort((a, b) => b.total - a.total);
  const maxCategory = Math.max(...sortedCategories.map((c) => c.total), 1);
  const maxDay = Math.max(...byDay.map((d) => d.total), 1);

  return (
    <div className="pt-2">
      <div className="flex bg-muted p-1 rounded-lg mb-4 text-xs font-semibold">
        {(["category", "day"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              "flex-1 py-1.5 rounded-md transition-colors capitalize",
              mode === m ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            By {m}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {mode === "category" ? (
          <motion.div
            key="category"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            {sortedCategories.map((c) => {
              const meta = CATEGORY_META[c.category] ?? CATEGORY_META.other;
              const Icon = meta.icon;
              return (
                <div key={c.category}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Icon className="w-3.5 h-3.5" style={{ color: meta.color }} /> {meta.label}
                    </span>
                    <span className="num text-muted-foreground">{money(c.total, currency)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: meta.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${(c.total / maxCategory) * 100}%` }}
                      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                </div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            key="day"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="flex items-end gap-1.5 h-28"
          >
            {byDay
              .sort((a, b) => a.dayIndex - b.dayIndex)
              .map((d) => (
                <div key={d.dayIndex} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                  <span className="text-[10px] num text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                    {money(d.total, currency)}
                  </span>
                  <motion.div
                    className="w-full rounded-t-sm bg-departure-navy min-h-[3px]"
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(3, (d.total / maxDay) * 88)}px` }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  />
                  <span className="text-[10px] text-muted-foreground shrink-0">D{d.dayIndex + 1}</span>
                </div>
              ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
