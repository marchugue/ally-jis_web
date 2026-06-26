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

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
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
 * Core fetch wrapper. Handles auth header injection, JSON vs FormData
 * bodies, 204 responses, and unwrapping a `{ data: T }` envelope if the
 * backend sends one. Every api/*.ts file calls this instead of fetch
 * directly.
 */
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
  } else if (body !== undefined) {
    headers.set('Content-Type', 'application/json');
    fetchBody = JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...rest,
      headers,
      body: fetchBody,
    });
  } catch {
    throw new ApiError('Network error: backend is unreachable.', 0);
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
    throw new ApiError(message, response.status);
  }

  if (typeof payload === 'object' && payload !== null && 'data' in payload) {
    return (payload as { data: T }).data;
  }

  return payload as T;
}