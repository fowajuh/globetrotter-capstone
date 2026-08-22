import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  Navigate,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { themeInitScript, useTheme, applyTheme } from "../lib/theme-store";
import { useBackendAuth } from "../lib/auth-store";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { MobileNav } from "@/components/layout/MobileNav";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-departure-navy px-5 text-cloud-white">
      <div className="w-full max-w-md">
        <div className="ticket-stub rounded-sm" style={{ ["--stub-bg" as string]: "var(--cloud-white)" }}>
          <p className="num text-[10px] uppercase tracking-[0.24em] text-ink-60">
            Boarding pass · GT404
          </p>
          <h1 className="font-display text-5xl text-departure-navy leading-[0.95] mt-2">
            Route not found
          </h1>
          <p className="text-sm text-ink-60 mt-2">
            This leg isn't on the manifest. The gate may have changed or the trip was archived.
          </p>
          <div className="perforation-divider my-5" />
          <div className="flex items-center justify-between">
            <span className="customs-stamp text-runway-red">Denied</span>
            <Link
              to="/"
              className="num text-[11px] uppercase tracking-[0.2em] bg-beacon-amber text-departure-navy px-4 py-2.5 rounded-sm"
            >
              Back to trips
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#16223F" },
      { title: "GlobeTrotter · Flight Manifest" },
      { name: "description", content: "Plan multi-city trips like a boarding pass. Manifest itineraries, live budgets, and AI-picked stops." },
      { property: "og:title", content: "GlobeTrotter" },
      { property: "og:description", content: "The trip planner that reads like a boarding pass." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        {/* Applies the saved/system theme before first paint so there's no
            light-flash for users who prefer dark mode. */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function AuthGate({ children }: { children: ReactNode }) {
  const { accessToken } = useBackendAuth();

  if (!accessToken) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const theme = useTheme((s) => s.theme);

  // Keep the applied theme correct if the user's OS preference changes
  // while "system" is selected, and re-apply on route/theme changes.
  useEffect(() => {
    applyTheme(theme);
    if (theme !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [theme]);

  const isPublicRoute = pathname === "/login" || pathname === "/onboarding";
  const isDetail = pathname.includes("/stays/");
  const isFullScreen = isDetail || pathname.startsWith("/inbox/") || pathname === "/concierge";

  return (
    <QueryClientProvider client={queryClient}>
      {isPublicRoute ? (
        <Outlet />
      ) : (
        <AuthGate>
          <div className="flex flex-col min-h-screen">
            {!isFullScreen && <SiteHeader />}
            <div className={isFullScreen ? "flex-1" : "flex-1 pb-16 md:pb-0"}>
              <Outlet />
            </div>
            {!isFullScreen && <MobileNav />}
          </div>
        </AuthGate>
      )}
      <Toaster position="top-center" />
    </QueryClientProvider>
  );
}
