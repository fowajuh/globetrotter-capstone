import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

function diff(target: Date) {
  const ms = Math.max(0, target.getTime() - Date.now());
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms / 3600000) % 24);
  const m = Math.floor((ms / 60000) % 60);
  const s = Math.floor((ms / 1000) % 60);
  return { d, h, m, s };
}

function Cell({ value, label }: { value: number; label: string }) {
  const padded = value.toString().padStart(2, "0");
  return (
    <div className="flex flex-col items-center">
      <div className="relative overflow-hidden bg-departure-navy text-cloud-white rounded-sm px-2 py-1 min-w-[2.6ch] text-center shadow-[inset_0_-1px_0_rgba(255,255,255,.08),inset_0_1px_0_rgba(0,0,0,.4)]">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={padded}
            initial={{ y: "-100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.55, 0, 0.1, 1] }}
            className="num text-lg font-medium block"
          >
            {padded}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="num text-[9px] uppercase tracking-[0.2em] text-ink-60 mt-1">{label}</span>
    </div>
  );
}

export function FlipCountdown({ target }: { target: string }) {
  const date = new Date(target);
  const [t, setT] = useState(() => diff(date));
  useEffect(() => {
    const id = setInterval(() => setT(diff(date)), 1000);
    return () => clearInterval(id);
  }, [target]);

  return (
    <div className="flex items-end gap-1.5">
      <Cell value={t.d} label="Days" />
      <Cell value={t.h} label="Hrs" />
      <Cell value={t.m} label="Min" />
      <Cell value={t.s} label="Sec" />
    </div>
  );
}
