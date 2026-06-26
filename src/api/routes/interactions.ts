// src/api/routes/interactions.ts

import { request } from '../http';
import type { InteractionRow } from '../types';

export function listMyInteractions() {
  return request<InteractionRow[]>('/interactions');
}

export function listIncomingInteractions(requesterIds: string[]) {
  if (requesterIds.length === 0) return Promise.resolve([] as InteractionRow[]);
  return request<InteractionRow[]>('/interactions/incoming', {
    method: 'POST',
    body: { requesterIds },
  });
}

export function sendConnectionRequest(targetUserId: string) {
  return request<void>('/interactions/request', {
    method: 'POST',
    body: { targetUserId },
  });
}

export function acceptConnection(requesterId: string) {
  return request<{ conversationId: string }>('/interactions/accept', {
    method: 'POST',
    body: { requesterId },
  });
}

export function rejectConnection(targetUserId: string) {
  return request<void>('/interactions/reject', {
    method: 'POST',
    body: { targetUserId },
  });
}

export function getConnectionStatus(targetUserId: string) {
  return request<{ status: InteractionRow['status'] | null }>(`/interactions/status/${targetUserId}`);
}