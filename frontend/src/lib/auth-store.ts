import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Holds GlobeTrotter's own JWTs issued by the NestJS backend.
 * These are the tokens the API trusts on every authenticated request.
 */
type BackendAuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  /** DB user id returned by signup/login. */
  userId: string | null;
  /** Display name from signup/login. */
  name: string | null;
  /** Email from signup/login. */
  email: string | null;

  setTokens: (
    accessToken: string,
    refreshToken: string,
    userId: string,
    email: string,
    name?: string | null,
  ) => void;
  clear: () => void;
};

export const useBackendAuth = create<BackendAuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      userId: null,
      name: null,
      email: null,
      setTokens: (accessToken, refreshToken, userId, email, name = null) =>
        set({ accessToken, refreshToken, userId, email, name }),
      clear: () =>
        set({ accessToken: null, refreshToken: null, userId: null, name: null, email: null }),
    }),
    { name: "globetrotter-backend-auth" },
  ),
);
