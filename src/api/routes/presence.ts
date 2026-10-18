// src/api/presence.ts

import { request } from '../http';

export function sendPresenceHeartbeat(platform: string = 'web') {
  return request<void>('/presence/heartbeat', {
    method: 'POST',
    body: { platform },
  });
}

export function getOnlineUsers() {
  return request<{
    userIds: string[];
    gameUserIds?: string[];
    gameCount?: number;
  }>('/presence/online');
}