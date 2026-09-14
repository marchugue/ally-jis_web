// src/api/http.ts
//
// Shared HTTP plumbing used by every api/*.ts domain file: the fetch
// wrapper, the error type, token storage, and automatic fallback from
// local backend to production backend when local is unreachable.

export const DEFAULT_PROD_API_URL = 'https://ally-jisbackend-production.up.railway.app/api';

const CONFIGURED_API_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') || DEFAULT_PROD_API_URL;

export const PRODUCTION_API_URL =
  ((import.meta.env.VITE_PROD_API_BASE_URL as string | undefined) || DEFAULT_PROD_API_URL).replace(/\/$/, '');

export function isLocalUrl(url: string): boolean {
  if (!url) return false;
  return /^(https?:\/\/)?(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?(\/.*)?$/i.test(url);
}

const AUTH_STORAGE_KEY = 'allyjis-auth-token';
const FALLBACK_STORAGE_KEY = 'ally_backend_fallback_active';

let activeApiBaseUrl: string = (() => {
  if (!isLocalUrl(CONFIGURED_API_URL)) {
    return CONFIGURED_API_URL;
  }
  try {
    if (sessionStorage.getItem(FALLBACK_STORAGE_KEY) === 'true') {
      return PRODUCTION_API_URL;
    }
  } catch {
    // Ignore storage errors
  }
  return CONFIGURED_API_URL;
})();

let isFallingBack = activeApiBaseUrl === PRODUCTION_API_URL && isLocalUrl(CONFIGURED_API_URL);

export const isApiConfigured = Boolean(activeApiBaseUrl || PRODUCTION_API_URL);

export function getApiBaseUrl(): string {
  return activeApiBaseUrl;
}

export function isUsingFallback(): boolean {
  return isFallingBack;
}

export const BACKEND_SWITCHED_EVENT = 'api:backend-switched';

export function switchToProductionFallback(reason?: string): void {
  if (activeApiBaseUrl === PRODUCTION_API_URL) return;
  activeApiBaseUrl = PRODUCTION_API_URL;
  isFallingBack = true;
  try {
    sessionStorage.setItem(FALLBACK_STORAGE_KEY, 'true');
  } catch {}
  console.warn(
    `[API Fallback] Local backend is not reachable. Automatically switched to Production backend: ${PRODUCTION_API_URL}${
      reason ? ` (${reason})` : ''
    }`
  );
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(BACKEND_SWITCHED_EVENT, {
        detail: { url: PRODUCTION_API_URL, isFallback: true, reason },
      })
    );
  }
}

export function resetToConfiguredBackend(): void {
  activeApiBaseUrl = CONFIGURED_API_URL;
  isFallingBack = false;
  try {
    sessionStorage.removeItem(FALLBACK_STORAGE_KEY);
  } catch {}
  console.info(`[API] Restored backend to configured URL: ${CONFIGURED_API_URL}`);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(BACKEND_SWITCHED_EVENT, {
        detail: { url: CONFIGURED_API_URL, isFallback: false },
      })
    );
  }
}

let probePromise: Promise<boolean> | null = null;

export function probeLocalBackend(): Promise<boolean> {
  if (!isLocalUrl(CONFIGURED_API_URL)) {
    return Promise.resolve(true);
  }
  if (probePromise) {
    return probePromise;
  }

  probePromise = (async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);

    try {
      const res = await fetch(`${CONFIGURED_API_URL}/health`, {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        if (isFallingBack) {
          resetToConfiguredBackend();
        }
        return true;
      }
      switchToProductionFallback('Health check responded with non-200');
      return false;
    } catch {
      clearTimeout(timeoutId);
      switchToProductionFallback('Local backend is not running or unreachable');
      return false;
    } finally {
      probePromise = null;
    }
  })();

  return probePromise;
}

// Automatically trigger probe on client startup if configured URL is local
if (typeof window !== 'undefined' && isLocalUrl(CONFIGURED_API_URL)) {
  probeLocalBackend().catch(() => {});
}

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

let refreshPromise: Promise<string | null> | null = null;

export async function doSilentRefresh(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      let currentUrl = getApiBaseUrl();
      let response: Response;
      try {
        response = await fetch(`${currentUrl}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
      } catch {
        if (isLocalUrl(currentUrl) && currentUrl !== PRODUCTION_API_URL) {
          switchToProductionFallback('Local backend unreachable during silent refresh');
          currentUrl = getApiBaseUrl();
          response = await fetch(`${currentUrl}/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          });
        } else {
          return null;
        }
      }

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
  let currentBaseUrl = getApiBaseUrl();
  if (!currentBaseUrl) {
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
    response = await fetch(`${currentBaseUrl}${path}`, {
      ...rest,
      credentials: 'include',
      headers,
      body: fetchBody,
    });
  } catch (err: unknown) {
    // If request to local backend failed (connection refused, network error, timeout),
    // immediately fall back to production backend and retry the request!
    if (isLocalUrl(currentBaseUrl) && currentBaseUrl !== PRODUCTION_API_URL) {
      switchToProductionFallback('Network connection to local backend failed');
      currentBaseUrl = getApiBaseUrl();
      try {
        response = await fetch(`${currentBaseUrl}${path}`, {
          ...rest,
          credentials: 'include',
          headers,
          body: fetchBody,
        });
      } catch {
        throw new ApiError('Network error: backend is unreachable.', 0);
      }
    } else {
      throw new ApiError('Network error: backend is unreachable.', 0);
    }
  }

  // If unauthorized on an authenticated request, attempt silent refresh before giving up
  if (response.status === 401 && auth && !path.includes('/auth/refresh') && !path.includes('/auth/login')) {
    const newToken = await doSilentRefresh();
    if (newToken) {
      headers.set('Authorization', `Bearer ${newToken}`);
      try {
        currentBaseUrl = getApiBaseUrl();
        const retryResponse = await fetch(`${currentBaseUrl}${path}`, {
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

    const resBody = typeof payload === 'object' && payload !== null ? (payload as Record<string, unknown>) : undefined;
    throw new ApiError(message, response.status, resBody);
  }

  if (typeof payload === 'object' && payload !== null && 'data' in payload) {
    return (payload as { data: T }).data;
  }

  return payload as T;
}