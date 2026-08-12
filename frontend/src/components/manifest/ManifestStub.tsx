import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  className?: string;
  tone?: "sand" | "white" | "navy";
  onClick?: () => void;
  layoutId?: string;
  interactive?: boolean;
};

const toneMap = {
  sand: "text-ink-90 [--stub-bg:var(--runway-sand)]",
  white: "text-ink-90 [--stub-bg:var(--cloud-white)]",
  navy: "text-cloud-white [--stub-bg:var(--departure-navy)]",
};

export function ManifestStub({ children, className, tone = "white", onClick, layoutId, interactive }: Props) {
  return (
    <motion.div
      layoutId={layoutId}
      onClick={onClick}
      whileTap={interactive ? { scale: 0.985 } : undefined}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "ticket-stub relative",
        toneMap[tone],
        interactive && "cursor-pointer",
        className,
      )}
    >
      {children}
    </motion.div>
  );
}
