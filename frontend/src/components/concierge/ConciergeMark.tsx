import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * The concierge's identity mark. Deliberately the same glyph as the site
 * header's logo mark (see SiteHeader.tsx) rather than a separate "AI
 * assistant" avatar — the concierge is GlobeTrotter talking to you, not a
 * bolted-on chatbot persona with its own branding.
 */
export function ConciergeMark({ size = "md", thinking = false }: { size?: "sm" | "md"; thinking?: boolean }) {
  const dims = size === "sm" ? "w-8 h-8" : "w-10 h-10";
  const iconDims = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";

  return (
    <div className={cn("relative shrink-0", dims)}>
      {thinking && (
        <motion.span
          className="absolute -inset-1.5 rounded-full bg-primary/25 blur-[6px]"
          animate={{ opacity: [0.35, 0.75, 0.35], scale: [0.9, 1.08, 0.9] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      <motion.div
        className={cn("relative rounded-full bg-primary flex items-center justify-center shadow-sm", dims)}
        animate={thinking ? { scale: [1, 1.05, 1] } : { scale: 1 }}
        transition={thinking ? { duration: 1.8, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={cn(iconDims, "text-primary-foreground")}>
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      </motion.div>
    </div>
  );
}
