import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Compass, Map, MapPinned, PieChart, Sparkles, User } from "lucide-react";
import type { ReactNode } from "react";
import { PageTransition } from "./PageTransition";
import { ThemeToggle } from "./ThemeToggle";

const nav = [
  { to: "/", label: "Trips", icon: Map },
  { to: "/recommendations", label: "Discover", icon: Sparkles },
  { to: "/map", label: "Map", icon: MapPinned },
  { to: "/budget", label: "Budget", icon: PieChart },
  { to: "/profile", label: "You", icon: User },
] as const;


export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-cloud-white flex flex-col">
      <header className="sticky top-0 z-30 bg-cloud-white/85 backdrop-blur border-b border-ink-90/5">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-5 py-3">
          <Link to="/" className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-beacon-amber" strokeWidth={2.25} />
            <span className="font-display text-xl tracking-tight text-departure-navy">
              GlobeTrotter
            </span>
            <span className="num text-[10px] uppercase tracking-[0.22em] text-ink-60 ml-1 hidden sm:inline">
              MNFST · v1
            </span>
          </Link>
          <div className="flex items-center gap-2">
          <nav className="hidden md:flex items-center gap-1">
            {nav.map((n) => {
              const active = path === n.to || (n.to !== "/" && path.startsWith(n.to));
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className="relative px-3 py-2 text-sm font-medium text-ink-60 hover:text-ink-90 transition-colors"
                >
                  {active && (
                    <motion.span
                      layoutId="navpill"
                      className="absolute inset-0 bg-runway-sand rounded-sm -z-10"
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    />
                  )}
                  <span className={active ? "text-departure-navy" : ""}>{n.label}</span>
                </Link>
              );
            })}
          </nav>
          <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 pb-24 md:pb-8">
        <PageTransition>{children}</PageTransition>
      </main>

      {/* Mobile tab bar with perforated active-state notch */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-departure-navy text-cloud-white">
        <div className="perforation-divider" style={{ backgroundImage: "radial-gradient(circle, rgba(250,248,244,.35) 1px, transparent 1.5px)" }} />
        <div className="grid grid-cols-5 pb-safe">
          {nav.map((n) => {
            const active = path === n.to || (n.to !== "/" && path.startsWith(n.to));
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                className="relative flex flex-col items-center gap-1 py-3 text-[10px] uppercase tracking-[0.18em]"
              >
                {active && (
                  <motion.span
                    layoutId="mobilepill"
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-1 rounded-b bg-beacon-amber"
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  />
                )}
                <Icon className="w-5 h-5" strokeWidth={1.75} />
                <span className={active ? "text-beacon-amber num" : "text-cloud-white/60 num"}>
                  {n.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
