import { Link, useRouterState } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useBackendAuth } from "@/lib/auth-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notifications/NotificationBell";

export function SiteHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  
  // Show minimal header on detail pages if needed, but a unified one is better for standard navigation
  const isDetail = pathname.includes("/stays/");
  const { accessToken, name } = useBackendAuth();
  
  return (
    <header className={cn(
      "sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border transition-all",
      isDetail ? "py-2" : "py-4"
    )}>
      <div className="max-w-screen-2xl mx-auto px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Logo (Desktop Only) */}
        <div className="hidden md:flex flex-1 min-w-0">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
            <span className="font-display font-bold text-xl hidden lg:block text-primary">GlobeTrotter</span>
          </Link>
        </div>

        {/* Central Nav / Search — flex-1 with min-w-0 so it shrinks instead of
            shoving the always-visible controls on the right off-screen on
            narrow viewports. */}
        <div className="flex flex-1 min-w-0 justify-center md:max-w-sm lg:max-w-md">
          {!isDetail && (
            <div className="bg-background border border-border shadow-md transition-shadow rounded-full px-3 sm:px-4 py-2 flex items-center gap-2 sm:gap-3 w-full min-w-0 max-w-[220px] sm:max-w-[280px] md:max-w-full mx-auto relative group focus-within:shadow-lg focus-within:border-primary/50">
              <Search className="w-4 h-4 shrink-0 text-foreground/80 group-focus-within:text-primary transition-colors" strokeWidth={2.5} />
              <input 
                type="text" 
                placeholder="Start your search"
                onChange={(e) => window.dispatchEvent(new CustomEvent('update-search', { detail: e.target.value }))}
                className="flex-1 min-w-0 bg-transparent border-none outline-none text-[14px] sm:text-[15px] font-semibold text-foreground placeholder:text-foreground/80 placeholder:font-semibold w-full"
              />
            </div>
          )}
        </div>

        {/* Desktop Nav Links & User Menu — shrink-0 so these controls are
            never the thing that gets squeezed out on mobile. */}
        <div className="shrink-0 flex items-center gap-2 sm:gap-4">
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link to="/wishlists" className="hover:text-primary transition-colors">Wishlists</Link>
            <Link to="/trips" className="hover:text-primary transition-colors">Trips</Link>
            <Link to="/inbox" className="hover:text-primary transition-colors">Messages</Link>
            <Link to="/profile" className="hover:text-primary transition-colors">Profile</Link>
          </nav>

          {accessToken ? (
            <>
              <NotificationBell />
              <Link to="/profile" className="border border-border p-1 pl-1 sm:pl-3 pr-1 rounded-full flex items-center gap-3 hover:shadow-md transition-shadow cursor-pointer bg-background shrink-0">
                <div className="hidden sm:flex flex-col gap-[3px]">
                  <span className="w-4 h-[1.5px] bg-foreground" />
                  <span className="w-4 h-[1.5px] bg-foreground" />
                  <span className="w-4 h-[1.5px] bg-foreground" />
                </div>
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-semibold shrink-0">
                  {name ? name[0].toUpperCase() : 'U'}
                </div>
              </Link>
            </>
          ) : (
            <Link to="/login">
              <Button>Log in</Button>
            </Link>
          )}
        </div>

      </div>
    </header>
  );
}
