// src/api/routes/auth.ts

import { request, getStoredToken, setStoredToken, ApiError } from '../http';
import type { AuthSession, RegisterPayload } from '../types';

export async function login(email: string, password: string): Promise<AuthSession> {
  const session = await request<AuthSession>('/auth/login', {
    method: 'POST',
    auth: false,
    body: { email, password },
  });
  setStoredToken(session.accessToken);
  return session;
}

export async function register(payload: RegisterPayload): Promise<AuthSession> {
  const session = await request<AuthSession>('/auth/register', {
    method: 'POST',
    auth: false,
    body: payload,
  });
  if (session.accessToken) {
    setStoredToken(session.accessToken);
  }
  return session;
}

export async function logout(): Promise<void> {
  try {
    await request<void>('/auth/logout', { method: 'POST' });
  } finally {
    setStoredToken(null);
  }
}

export async function forgotPassword(email: string): Promise<void> {
  await request<void>('/auth/forgot-password', {
    method: 'POST',
    auth: false,
    body: { email },
  });
}
 
export async function resetPassword(token: string, password: string): Promise<void> {
  await request<void>('/auth/reset-password', {
    method: 'POST',
    auth: false,
    body: { token, password },
  });
}

export async function getSession(): Promise<AuthSession | null> {
  const token = getStoredToken();
  if (!token) return null;

  try {
    return await request<AuthSession>('/auth/session');
  } catch (err) {
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
      setStoredToken(null);
      return null;
    }
    throw err;
  }
}

export function setAccessToken(token: string | null) {
  setStoredToken(token);
}

export function getAccessToken() {
  return getStoredToken();
}