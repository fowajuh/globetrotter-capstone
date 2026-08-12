import { Moon, Sun } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useUI } from "@/lib/store";

/**
 * Theme toggle with a circular reveal originating from the button.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useUI();
  const btn = useRef<HTMLButtonElement | null>(null);
  const [reveal, setReveal] = useState<{ x: number; y: number; r: number; to: string } | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const onClick = () => {
    const el = btn.current;
    if (el && typeof window !== "undefined") {
      const r = el.getBoundingClientRect();
      const x = r.left + r.width / 2;
      const y = r.top + r.height / 2;
      const radius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y),
      );
      setReveal({ x, y, r: radius, to: theme === "light" ? "#0E1626" : "#FAF8F4" });
      setTimeout(() => setReveal(null), 620);
    }
    toggleTheme();
  };

  return (
    <>
      <button
        ref={btn}
        onClick={onClick}
        aria-label={theme === "light" ? "Switch to dark manifest" : "Switch to light manifest"}
        className={`relative h-9 w-9 rounded-sm border border-ink-90/10 flex items-center justify-center text-ink-60 hover:text-departure-navy transition-colors ${className ?? ""}`}
      >
        {theme === "light" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>

      {reveal && (
        <div
          className="fixed inset-0 z-[60] pointer-events-none"
          style={{
            background: reveal.to,
            clipPath: `circle(0px at ${reveal.x}px ${reveal.y}px)`,
            animation: `manifest-reveal 600ms cubic-bezier(0.22,1,0.36,1) forwards`,
            ["--reveal-x" as string]: `${reveal.x}px`,
            ["--reveal-y" as string]: `${reveal.y}px`,
            ["--reveal-r" as string]: `${reveal.r}px`,
          }}
        />
      )}
    </>
  );
}
