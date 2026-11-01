// src/lib/socket.ts
//
// Single shared socket.io connection for all real-time features:
// matchmaking queue/events, conversation messages, typing indicators,
// streak updates. Initialized eagerly after login via initSocket().
// See backend src/sockets/index.ts for the full event list.

import { io, Socket } from 'socket.io-client';
import {
  getStoredToken,
  getApiBaseUrl,
  isLocalUrl,
  switchToProductionFallback,
  BACKEND_SWITCHED_EVENT,
  AUTH_UNAUTHORIZED_EVENT,
  AUTH_BANNED_EVENT,
} from '@/api/http';

let socket: Socket | null = null;

function getSocketUrl(): string {
  const apiUrl = getApiBaseUrl();
  return apiUrl.replace(/\/api$/, '');
}

/**
 * Returns the shared socket, creating and connecting it on first call.
 * Safe to call repeatedly — subsequent calls just return the existing
 * instance. Reconnects automatically (socket.io default) if the token
 * hasn't changed; call disconnectSocket() + getSocket() again after a
 * login/logout to pick up a new token.
 */
export function getSocket(): Socket | null {
  const socketUrl = getSocketUrl();
  if (!socketUrl) return null;
  if (socket) return socket;

  const token = getStoredToken();
  if (!token) return null;

  socket = io(socketUrl, {
    auth: { token, platform: 'web' },
    query: { platform: 'web' },
    autoConnect: true,
    reconnection: true,
    timeout: 6000,
  });

  socket.on('auth:revoked', (payload: any) => {
    console.warn('[Socket] Session revoked by server:', payload);
    if (typeof window !== 'undefined') {
      if (payload?.reason === 'banned' || payload?.is_banned || payload?.reason === 'suspended' || payload?.is_suspended) {
        window.dispatchEvent(new CustomEvent(AUTH_BANNED_EVENT, { detail: payload }));
      } else {
        window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT));
      }
    }
  });

  socket.on('user:banned', (payload: any) => {
    console.warn('[Socket] user:banned received:', payload);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(AUTH_BANNED_EVENT, { detail: payload }));
    }
  });

  socket.on('user:suspended', (payload: any) => {
    console.warn('[Socket] user:suspended received:', payload);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(AUTH_BANNED_EVENT, { detail: payload }));
    }
  });

  socket.on('connect_error', (err) => {
    const currentApiUrl = getApiBaseUrl();
    if (isLocalUrl(currentApiUrl)) {
      console.warn('[Socket] Local backend socket connection failed, switching to production:', err.message);
      switchToProductionFallback('Socket.io connection failed to local backend');
    }
  });

  return socket;
}

/**
 * Eagerly initialise the socket right after login so it's connected before
 * any chat hook tries to subscribe. Safe to call multiple times — a no-op
 * if the socket is already alive.
 */
export function initSocket(): Socket | null {
  return getSocket();
}

/** Call on sign-out so a stale token isn't reused on the next getSocket(). */
export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}

// Automatically reconnect socket if the backend switches (e.g. fallback to production)
if (typeof window !== 'undefined') {
  window.addEventListener(BACKEND_SWITCHED_EVENT, () => {
    if (socket) {
      disconnectSocket();
      getSocket();
    }
  });
}
