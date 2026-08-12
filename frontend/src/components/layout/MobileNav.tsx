import { Link, useRouterState } from "@tanstack/react-router";
import { Compass, Search, Map, Wallet, User, Heart, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  
  const navItems = [
    { label: "Explore", to: "/", icon: Search },
    { label: "Wishlists", to: "/wishlists", icon: Heart },
    { label: "Trips", to: "/trips", icon: Map },
    { label: "Messages", to: "/inbox", icon: MessageSquare },
    { label: "Profile", to: "/profile", icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-background/95 backdrop-blur-md border-t border-border pb-safe">
      <div className="flex justify-between px-2 pt-2 pb-1">
        {navItems.map((item) => {
          const isActive = pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to));
          const Icon = item.icon;
          
          return (
            <Link
              key={item.label}
              to={item.to}
              className={cn(
                "flex flex-col items-center justify-center flex-1 py-1 gap-1 transition-micro",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
              <span className={cn("text-[10px] font-semibold", isActive ? "opacity-100" : "opacity-70")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
