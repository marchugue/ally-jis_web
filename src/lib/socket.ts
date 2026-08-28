// src/lib/socket.ts
//
// Single shared socket.io connection for the matchmaking feature (queue
// updates, match found, room ready, streak/typing/message relay — see
// backend src/sockets/index.ts for the full event list). Not used by
// regular chat, which stays on REST + polling (useRealtimeMessages.ts) —
// this is scoped to matchmaking on purpose, see the Phase 1 notes in
// hooks/useMatchmaking.ts.

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

/** Call on sign-out so a stale token isn't reused on the next getSocket(). */
export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}
