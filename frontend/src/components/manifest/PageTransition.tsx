import { useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useRef, type ReactNode } from "react";

const ORDER = ["/", "/recommendations", "/budget", "/profile"];

function rank(path: string) {
  const i = ORDER.findIndex((p) => (p === "/" ? path === "/" : path.startsWith(p)));
  return i === -1 ? ORDER.length : i;
}

/**
 * Directional page transitions: forward slides in from the right,
 * back reverses. House easing, paper-like — no spring overshoot.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const prev = useRef(path);
  const dir = rank(path) >= rank(prev.current) ? 1 : -1;
  prev.current = path;

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.div
        key={path}
        initial={{ opacity: 0, x: 24 * dir }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -18 * dir }}
        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
