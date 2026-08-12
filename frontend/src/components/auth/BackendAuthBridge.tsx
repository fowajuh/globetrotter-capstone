import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { api, ApiError } from "@/lib/api-client";
import { useBackendAuth } from "@/lib/auth-store";

type TokenPair = { accessToken: string; refreshToken: string };

/**
 * Mount inside <SignedIn>. Clerk proves who the user is on the client;
 * this is what actually gets the backend to know they exist. On mount
 * (and whenever the signed-in Clerk user changes), it:
 *   1. grabs a Clerk session JWT via getToken()
 *   2. POSTs it to /auth/oauth/clerk
 *   3. stores the GlobeTrotter accessToken/refreshToken that comes back
 *
 * Everything under <SignedIn> should wait on `ready` before assuming
 * api-client calls will succeed — otherwise requests fire without a
 * backend token yet and 401 until the exchange finishes.
 */
export function useBackendAuthBridge() {
  const { userId, getToken, isSignedIn } = useAuth();
  const { exchangedForClerkId, setTokens, clear } = useBackendAuth();
  const [error, setError] = useState<Error | null>(null);
  const exchanging = useRef(false);

  const ready = isSignedIn && exchangedForClerkId === userId;

  useEffect(() => {
    if (!isSignedIn || !userId) {
      clear();
      return;
    }
    // Already exchanged for this exact Clerk user — nothing to do.
    if (exchangedForClerkId === userId) return;
    if (exchanging.current) return;

    exchanging.current = true;
    setError(null);

    (async () => {
      try {
        const clerkToken = await getToken();
        if (!clerkToken) throw new Error("Clerk returned no session token");

        const tokens = await api.post<TokenPair>(
          "/auth/oauth/clerk",
          { token: clerkToken },
          { unauthenticated: true },
        );
        setTokens(tokens.accessToken, tokens.refreshToken, userId);
      } catch (e) {
        const err = e instanceof ApiError
          ? new Error(`Backend rejected Clerk session (${e.status}): ${JSON.stringify(e.body)}`)
          : (e as Error);
        console.error("Clerk -> backend token exchange failed:", err);
        setError(err);
      } finally {
        exchanging.current = false;
      }
    })();
  }, [isSignedIn, userId, exchangedForClerkId, getToken, setTokens, clear]);

  return { ready, error };
}

/** Drop-in component form, for places that just want to trigger the bridge. */
export function BackendAuthBridge() {
  useBackendAuthBridge();
  return null;
}
