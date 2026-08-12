import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Holds GlobeTrotter's OWN JWTs (from POST /auth/oauth/clerk), separate
 * from Clerk's session. Clerk answers "who is this person" on the client;
 * these tokens are what the NestJS API actually trusts on every request.
 */
type BackendAuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  /** Clerk user id these backend tokens were minted for. Lets the bridge
   *  detect "different person signed in" vs "same person, just re-rendered". */
  exchangedForClerkId: string | null;

  setTokens: (accessToken: string, refreshToken: string, clerkId: string) => void;
  clear: () => void;
};

export const useBackendAuth = create<BackendAuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      exchangedForClerkId: null,
      setTokens: (accessToken, refreshToken, clerkId) =>
        set({ accessToken, refreshToken, exchangedForClerkId: clerkId }),
      clear: () => set({ accessToken: null, refreshToken: null, exchangedForClerkId: null }),
    }),
    { name: "globetrotter-backend-auth" },
  ),
);
