import { useBackendAuth } from "./auth-store";

/**
 * Base URL for the NestJS API. Set VITE_API_URL in your frontend .env, e.g.
 *   VITE_API_URL=http://localhost:4000/api/v1
 * Falls back to localhost:4000 for local dev so this works out of the box.
 */
const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, body: unknown, message?: string) {
    super(message ?? `API error ${status}`);
    this.status = status;
    this.body = body;
  }
}

let refreshPromise: Promise<boolean> | null = null;

/** Exchanges the stored refresh token for a new access/refresh pair. */
async function tryRefresh(): Promise<boolean> {
  const { refreshToken, userId, setTokens, clear, email, name } = useBackendAuth.getState();
  if (!refreshToken || !userId) return false;

  const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    clear();
    return false;
  }

  const data = (await res.json()) as { accessToken: string; refreshToken: string };
  setTokens(data.accessToken, data.refreshToken, userId, email ?? "", name);
  return true;
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  /** Skip attaching a bearer token (e.g. signup/login calls themselves). */
  unauthenticated?: boolean;
};

/**
 * Core request fn. On a 401 from an authenticated call, refreshes the
 * backend session once and retries exactly one time before giving up —
 * avoids infinite refresh loops if the refresh token itself is dead.
 */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, unauthenticated = false } = options;

  const doFetch = async (): Promise<Response> => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (!unauthenticated) {
      const { accessToken } = useBackendAuth.getState();
      if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
    }
    return fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  };

  let res = await doFetch();

  if (res.status === 401 && !unauthenticated) {
    // Coalesce concurrent 401s into a single refresh call.
    refreshPromise ??= tryRefresh().finally(() => {
      refreshPromise = null;
    });
    const refreshed = await refreshPromise;
    if (refreshed) {
      res = await doFetch();
    }
  }

  if (!res.ok) {
    let payload: unknown = null;
    try {
      payload = await res.json();
    } catch {
      /* body wasn't JSON */
    }
    throw new ApiError(res.status, payload, `${method} ${path} failed (${res.status})`);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string) => apiFetch<T>(path),
  post: <T>(path: string, body?: unknown, options?: Partial<RequestOptions>) =>
    apiFetch<T>(path, { ...options, method: "POST", body }),
  patch: <T>(path: string, body?: unknown) => apiFetch<T>(path, { method: "PATCH", body }),
  delete: <T>(path: string) => apiFetch<T>(path, { method: "DELETE" }),
};
