import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useState, type ReactNode } from "react";

/**
 * Pull-to-refresh with a departure-board flip instead of a spinner.
 */
export function PullToRefresh({
  children,
  onRefresh,
}: {
  children: ReactNode;
  onRefresh?: () => Promise<void> | void;
}) {
  const y = useMotionValue(0);
  const [busy, setBusy] = useState(false);
  const op = useTransform(y, [0, 40, 90], [0, 0.6, 1]);
  const rot = useTransform(y, [0, 110], [0, 360]);

  return (
    <div className="relative">
      <motion.div
        style={{ opacity: op }}
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-1 flex flex-col items-center"
      >
        <motion.div
          style={{ rotateX: busy ? undefined : rot }}
          animate={busy ? { rotateX: [0, 360] } : undefined}
          transition={busy ? { duration: 0.7, repeat: Infinity, ease: [0.55, 0, 0.1, 1] } : undefined}
          className="num text-[11px] tracking-[0.2em] uppercase bg-departure-navy text-beacon-amber px-3 py-1.5 rounded-sm"
        >
          {busy ? "Refreshing" : "Pull to refresh"}
        </motion.div>
      </motion.div>

      <motion.div
        drag="y"
        style={{ y }}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.35 }}
        onDragEnd={async (_, info) => {
          if (info.offset.y > 90 && !busy) {
            setBusy(true);
            animate(y, 64, { duration: 0.3, ease: [0.22, 1, 0.36, 1] });
            await onRefresh?.();
            await new Promise((r) => setTimeout(r, 900));
            setBusy(false);
            animate(y, 0, { duration: 0.4, ease: [0.22, 1, 0.36, 1] });
          }
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
