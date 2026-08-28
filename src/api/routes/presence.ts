// src/api/presence.ts

import { request } from '../http';

export function sendPresenceHeartbeat() {
  return request<void>('/presence/heartbeat', { method: 'POST' });
}

export function getOnlineUsers() {
  return request<{ userIds: string[] }>('/presence/online');
}