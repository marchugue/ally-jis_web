// src/api/routes/interactions.ts

import { request } from '../http';
import type { AllyFilterOptions, InteractionRow, PaginatedAllyList, RelationshipStatusResponse } from '../types';

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

export function cancelConnectionRequest(targetUserId: string) {
  return request<void>(`/interactions/request/${targetUserId}`, { method: 'DELETE' });
}

export function removeAlly(targetUserId: string) {
  return request<void>(`/interactions/ally/${targetUserId}`, { method: 'DELETE' });
}

export function getRelationshipStatus(targetUserId: string) {
  return request<RelationshipStatusResponse>(`/interactions/relationship/${targetUserId}`);
}

function buildAllyQuery(options?: AllyFilterOptions | string | null): string {
  if (!options) return '';
  if (typeof options === 'string') {
    return `?cursor=${encodeURIComponent(options)}`;
  }
  const params = new URLSearchParams();
  if (options.cursor) params.set('cursor', options.cursor);
  if (options.search) params.set('search', options.search);
  if (options.department) params.set('department', options.department);
  if (options.course) params.set('course', options.course);
  if (options.year_level) params.set('year_level', options.year_level);
  if (options.sortBy) params.set('sortBy', options.sortBy);
  if (options.limit) params.set('limit', String(options.limit));
  const str = params.toString();
  return str ? `?${str}` : '';
}

export function listAllies(userId: string, options?: AllyFilterOptions | string | null) {
  const qs = buildAllyQuery(options);
  return request<PaginatedAllyList>(`/interactions/allies/${userId}${qs}`);
}

export function getAlliesCount(userId: string) {
  return request<{ count: number }>(`/interactions/allies/${userId}/count`);
}
