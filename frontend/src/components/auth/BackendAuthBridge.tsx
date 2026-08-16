/**
 * With native JWT auth, there's no external identity provider to bridge.
 * This hook simply exposes whether the user has an active backend session
 * (i.e. an accessToken in the store) so __root.tsx can gate protected routes.
 *
 * The actual token management (signup/login/refresh/logout) happens in:
 *   - login.tsx  → sets tokens via useBackendAuth.setTokens()
 *   - api-client.ts → silently refreshes on 401
 *   - settings.tsx / profile.tsx → clears tokens on logout
 */
import { useBackendAuth } from "@/lib/auth-store";

export function useBackendAuthBridge() {
  const { accessToken } = useBackendAuth();
  // "ready" means we have a token in the store. If the token is stale, the
  // first authenticated API call will trigger a refresh via api-client.ts.
  const ready = !!accessToken;
  return { ready, error: null as Error | null };
}

/** Drop-in component form, for places that just want to trigger the bridge. */
export function BackendAuthBridge() {
  useBackendAuthBridge();
  return null;
}
