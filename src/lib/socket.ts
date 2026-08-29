// src/lib/socket.ts
//
// Single shared socket.io connection for all real-time features:
// matchmaking queue/events, conversation messages, typing indicators,
// streak updates. Initialized eagerly after login via initSocket().
// See backend src/sockets/index.ts for the full event list.

import { io, Socket } from 'socket.io-client';
import { getStoredToken } from '@/api/http';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? '';
// The API is mounted at .../api on the same origin/port socket.io attaches
// to (see backend src/server.ts) — strip that suffix to get the socket URL.
const SOCKET_URL = API_BASE_URL.replace(/\/api$/, '');

let socket: Socket | null = null;

/**
 * Returns the shared socket, creating and connecting it on first call.
 * Safe to call repeatedly — subsequent calls just return the existing
 * instance. Reconnects automatically (socket.io default) if the token
 * hasn't changed; call disconnectSocket() + getSocket() again after a
 * login/logout to pick up a new token.
 */
export function getSocket(): Socket | null {
  if (!SOCKET_URL) return null;
  if (socket) return socket;

  const token = getStoredToken();
  if (!token) return null;

  socket = io(SOCKET_URL, {
    auth: { token },
    autoConnect: true,
    reconnection: true,
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
