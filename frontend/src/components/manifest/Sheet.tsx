import { AnimatePresence, motion, useMotionValue, useTransform } from "framer-motion";
import { type ReactNode, useEffect } from "react";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  peek?: boolean;
};

export function Sheet({ open, onClose, children, title, peek }: Props) {
  const y = useMotionValue(0);
  const overlay = useTransform(y, [0, 400], [0.5, 0]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-departure-navy z-40"
            style={{ opacity: overlay }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.02, bottom: 0.6 }}
            style={{ y }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 500) onClose();
            }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "fixed left-0 right-0 bottom-0 z-50 bg-cloud-white",
              "rounded-t-2xl shadow-[0_-8px_40px_-8px_rgba(14,22,38,0.25)]",
              "max-h-[85vh] flex flex-col",
              peek && "pb-safe",
            )}
          >
            {/* perforation drag handle */}
            <div className="pt-3 pb-2 flex flex-col items-center">
              <div className="w-14 h-1.5 rounded-full bg-ink-30/60"
                style={{
                  backgroundImage: "radial-gradient(circle, var(--ink-60) 1px, transparent 1.5px)",
                  backgroundSize: "6px 100%",
                  backgroundColor: "transparent",
                }}
              />
              {title && (
                <h3 className="mt-2 text-sm font-mono uppercase tracking-[0.18em] text-ink-60">{title}</h3>
              )}
            </div>
            <div className="overflow-y-auto px-5 pb-8">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
