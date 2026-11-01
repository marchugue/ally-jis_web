// src/api/http.ts
//
// Shared HTTP plumbing used by every api/*.ts domain file: the fetch
// wrapper, the error type, token storage, and automatic fallback from
// local backend to production backend when local is unreachable.

const isBrowserLocalhost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '0.0.0.0' ||
    window.location.hostname.endsWith('.local'));

export const DEFAULT_PROD_API_URL = 'https://api.ally-jis.com/api';

const CONFIGURED_API_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ||
  (isBrowserLocalhost ? 'http://localhost:5174/api' : DEFAULT_PROD_API_URL);

export const PRODUCTION_API_URL =
  ((import.meta.env.VITE_PROD_API_BASE_URL as string | undefined) || DEFAULT_PROD_API_URL).replace(/\/$/, '');

export function isLocalUrl(url: string): boolean {
  if (!url) return false;
  return /^(https?:\/\/)?(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?(\/.*)?$/i.test(url);
}

const AUTH_STORAGE_KEY = 'allyjis-auth-token';
const FALLBACK_STORAGE_KEY = 'ally_backend_fallback_active';
const DISCOVERED_LOCAL_URL_KEY = 'ally_local_backend_url';

const LOCAL_CANDIDATE_URLS: string[] = (() => {
  const candidates: string[] = [];
  // Prefer port 5174 first (default PORT in backend/.env), even if an older dev script passed 3001
  if (isLocalUrl(CONFIGURED_API_URL) && CONFIGURED_API_URL !== 'http://localhost:3001/api') {
    candidates.push(CONFIGURED_API_URL);
  }
  for (const url of ['http://localhost:5174/api', 'http://localhost:3001/api']) {
    if (!candidates.includes(url)) {
      candidates.push(url);
    }
  }
  return candidates;
})();

let activeApiBaseUrl: string = (() => {
  if (isBrowserLocalhost) {
    try {
      const discoveredLocal = sessionStorage.getItem(DISCOVERED_LOCAL_URL_KEY);
      if (discoveredLocal && isLocalUrl(discoveredLocal)) {
        return discoveredLocal;
      }
    } catch {}
    return LOCAL_CANDIDATE_URLS[0] || 'http://localhost:5174/api';
  }
  if (!isLocalUrl(CONFIGURED_API_URL)) {
    return CONFIGURED_API_URL;
  }
  try {
    const discoveredLocal = sessionStorage.getItem(DISCOVERED_LOCAL_URL_KEY);
    if (discoveredLocal && isLocalUrl(discoveredLocal)) {
      return discoveredLocal;
    }
  } catch {
    // Ignore storage errors
  }
  return LOCAL_CANDIDATE_URLS[0] || CONFIGURED_API_URL;
})();

let isFallingBack = activeApiBaseUrl === PRODUCTION_API_URL && (isLocalUrl(CONFIGURED_API_URL) || isBrowserLocalhost);

export const isApiConfigured = Boolean(activeApiBaseUrl || PRODUCTION_API_URL);

export function getApiBaseUrl(): string {
  return activeApiBaseUrl;
}

export function isUsingFallback(): boolean {
  return isFallingBack;
}

export const BACKEND_SWITCHED_EVENT = 'api:backend-switched';

function setLocalBackendUrl(url: string): void {
  const changed = activeApiBaseUrl !== url || isFallingBack;
  activeApiBaseUrl = url;
  isFallingBack = false;
  try {
    sessionStorage.removeItem(FALLBACK_STORAGE_KEY);
    sessionStorage.setItem(DISCOVERED_LOCAL_URL_KEY, url);
  } catch {}
  if (changed) {
    console.info(`[API] Connected to local backend: ${url}`);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(BACKEND_SWITCHED_EVENT, {
          detail: { url, isFallback: false },
        })
      );
    }
  }
}

export function switchToProductionFallback(reason?: string): void {
  if (activeApiBaseUrl === PRODUCTION_API_URL) return;
  activeApiBaseUrl = PRODUCTION_API_URL;
  isFallingBack = true;
  try {
    sessionStorage.setItem(FALLBACK_STORAGE_KEY, 'true');
    sessionStorage.removeItem(DISCOVERED_LOCAL_URL_KEY);
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
  setLocalBackendUrl(CONFIGURED_API_URL);
}

let probePromise: Promise<boolean> | null = null;

export function probeLocalBackend(): Promise<boolean> {
  if (!isLocalUrl(CONFIGURED_API_URL) && !isBrowserLocalhost) {
    return Promise.resolve(true);
  }
  if (probePromise) {
    return probePromise;
  }

  probePromise = (async () => {
    try {
      for (const candidateUrl of LOCAL_CANDIDATE_URLS) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);
        try {
          const res = await fetch(`${candidateUrl}/health`, {
            method: 'GET',
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          if (res.ok) {
            setLocalBackendUrl(candidateUrl);
            return true;
          }
        } catch {
          clearTimeout(timeoutId);
        }
      }
      switchToProductionFallback('Local backend is not running or unreachable');
      return false;
    } finally {
      probePromise = null;
    }
  })();

  return probePromise;
}

// Automatically trigger probe on client startup if configured URL is local or browser is on localhost
if (typeof window !== 'undefined' && (isLocalUrl(CONFIGURED_API_URL) || isBrowserLocalhost)) {
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

/**
 * Dispatched on any request that indicates the user account has been banned.
 * AuthContext listens for this event to set isBanned=true and lock navigation to /banned.
 */
export const AUTH_BANNED_EVENT = 'auth:banned';

/**
 * Dispatched on any request that returns 503 with maintenance active.
 * MaintenanceContext listens for this event to display the maintenance UI.
 */
export const MAINTENANCE_MODE_EVENT = 'api:maintenance-mode';

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
          await probeLocalBackend();
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
    // If request to local backend failed (e.g. wrong local port before probe finished,
    // or local backend stopped), probe local candidate ports first and fall back to production only if none respond.
    if (isLocalUrl(currentBaseUrl) && currentBaseUrl !== PRODUCTION_API_URL) {
      await probeLocalBackend();
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
    let message =
      typeof payload === 'object' && payload && 'message' in payload
        ? String((payload as { message: string }).message)
        : typeof payload === 'string' && payload
          ? payload
          : `Request failed (${response.status})`;

    // If message is an HTML document or snippet (e.g. Express 404 Cannot GET /...), sanitize it
    if (typeof message === 'string' && (message.includes('<html') || message.includes('<!DOCTYPE') || message.includes('<pre>'))) {
      const preMatch = message.match(/<pre>([\s\S]*?)<\/pre>/i);
      if (preMatch?.[1]) {
        message = preMatch[1].trim();
      } else {
        const titleMatch = message.match(/<title>([\s\S]*?)<\/title>/i);
        message = titleMatch?.[1]?.trim() || `Request failed (${response.status})`;
      }
    }

    // If we received 404 from the production fallback and client is local,
    // check if local backend is running (or has newly registered routes) and re-try locally!
    if (response.status === 404 && (isFallingBack || isBrowserLocalhost || isLocalUrl(CONFIGURED_API_URL))) {
      if (currentBaseUrl === PRODUCTION_API_URL) {
        const recovered = await probeLocalBackend();
        if (recovered) {
          return request<T>(path, options);
        }
      }
    }

    // If 401 occurred on an unauthenticated call or refresh already failed above
    if (response.status === 401 && auth) {
      setStoredToken(null);
      window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT));
    }

    // If 403 occurred and indicates account is banned or suspended, notify listeners
    if (response.status === 403 && typeof payload === 'object' && payload !== null && ((payload as any).is_banned || (payload as any).status === 'banned' || (payload as any).is_suspended || (payload as any).status === 'suspended')) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent(AUTH_BANNED_EVENT, {
            detail: payload,
          })
        );
      }
    }

    // If 503 occurred and indicates maintenance mode, notify listeners
    if (response.status === 503 && typeof payload === 'object' && payload !== null && (payload as any).maintenance) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent(MAINTENANCE_MODE_EVENT, {
            detail: {
              active: true,
              message: String((payload as any).message || message),
            },
          })
        );
      }
    }

    const resBody = typeof payload === 'object' && payload !== null ? (payload as Record<string, unknown>) : undefined;
    throw new ApiError(message, response.status, resBody);
  }

  if (typeof payload === 'object' && payload !== null && 'data' in payload) {
    return (payload as { data: T }).data;
  }

  return payload as T;
}

export async function getMaintenanceStatus(): Promise<{ ok: boolean; maintenance: boolean; message: string }> {
  const currentBaseUrl = getApiBaseUrl();
  try {
    const res = await fetch(`${currentBaseUrl}/health/status`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      return { ok: false, maintenance: false, message: 'Status check failed' };
    }
    return await res.json();
  } catch {
    return { ok: false, maintenance: false, message: 'Status check failed' };
  }
}