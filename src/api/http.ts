// src/api/http.ts
//
// Shared HTTP plumbing used by every api/*.ts domain file: the fetch
// wrapper, the error type, and token storage. Nothing domain-specific
// lives here — auth.ts, feed.ts, profiles.ts etc. all import `request`
// from this file instead of duplicating fetch logic.

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? '';
const AUTH_STORAGE_KEY = 'allyjis-auth-token';

export const isApiConfigured = Boolean(API_BASE_URL);

export class ApiError extends Error {
  status: number;
  body?: Record<string, unknown>;

  constructor(message: string, status: number, body?: Record<string, unknown>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(AUTH_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null) {
  try {
    if (token) {
      localStorage.setItem(AUTH_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

export type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  auth?: boolean;
};

/**
 * Dispatched on any authenticated request that returns 401 (invalid/expired token).
 * AuthContext listens for this event to automatically sign the user out.
 */
export const AUTH_UNAUTHORIZED_EVENT = 'auth:unauthorized';

/**
 * Core fetch wrapper. Handles auth header injection, JSON vs FormData
 * bodies, 204 responses, and unwrapping a `{ data: T }` envelope if the
 * backend sends one. Every api/*.ts file calls this instead of fetch
 * directly.
 */

// Mutex to prevent multiple parallel refresh calls when several requests 401 at once
let refreshPromise: Promise<string | null> | null = null;

export async function doSilentRefresh(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        return null;
      }

      const payload = await response.json();
      const newToken = payload?.accessToken || (payload?.data?.accessToken);
      if (newToken && typeof newToken === 'string') {
        setStoredToken(newToken);
        return newToken;
      }
      return null;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (!API_BASE_URL) {
    throw new ApiError('API is not configured. Set VITE_API_BASE_URL in your .env file.', 0);
  }

  const { body, auth = true, headers: customHeaders, ...rest } = options;
  const headers = new Headers(customHeaders);

  if (auth) {
    const token = getStoredToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  let fetchBody: BodyInit | undefined;
  if (body instanceof FormData) {
    fetchBody = body;
  } else if (typeof body === 'string') {
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    fetchBody = body;
  } else if (body !== undefined) {
    headers.set('Content-Type', 'application/json');
    fetchBody = JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...rest,
      credentials: 'include', // Automatically sends and receives HttpOnly cookies
      headers,
      body: fetchBody,
    });
  } catch {
    throw new ApiError('Network error: backend is unreachable.', 0);
  }

  // If unauthorized on an authenticated request, attempt silent refresh before giving up
  if (response.status === 401 && auth && !path.includes('/auth/refresh') && !path.includes('/auth/login')) {
    const newToken = await doSilentRefresh();
    if (newToken) {
      headers.set('Authorization', `Bearer ${newToken}`);
      try {
        const retryResponse = await fetch(`${API_BASE_URL}${path}`, {
          ...rest,
          credentials: 'include',
          headers,
          body: fetchBody,
        });

        if (retryResponse.status === 204) {
          return undefined as T;
        }

        const retryContentType = retryResponse.headers.get('content-type') ?? '';
        const isRetryJson = retryContentType.includes('application/json');
        const retryPayload = isRetryJson ? await retryResponse.json() : await retryResponse.text();

        if (retryResponse.ok) {
          if (typeof retryPayload === 'object' && retryPayload !== null && 'data' in retryPayload) {
            return (retryPayload as { data: T }).data;
          }
          return retryPayload as T;
        }
      } catch {
        // Fall through to standard 401 handling
      }
    }

    // Refresh failed or token was completely revoked: clear token and notify sign-out
    setStoredToken(null);
    window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      typeof payload === 'object' && payload && 'message' in payload
        ? String((payload as { message: string }).message)
        : typeof payload === 'string' && payload
          ? payload
          : `Request failed (${response.status})`;

    // If 401 occurred on an unauthenticated call or refresh already failed above
    if (response.status === 401 && auth) {
      setStoredToken(null);
      window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT));
    }

    const body = typeof payload === 'object' && payload !== null ? (payload as Record<string, unknown>) : undefined;
    throw new ApiError(message, response.status, body);
  }

  if (typeof payload === 'object' && payload !== null && 'data' in payload) {
    return (payload as { data: T }).data;
  }

  return payload as T;
}