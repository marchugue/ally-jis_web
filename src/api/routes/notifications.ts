// src/api/routes/notifications.ts

import { request } from '../http';
import type { NotificationRow } from '../types';

export function listNotifications(limit?: number, category?: string) {
  const params = new URLSearchParams();
  if (typeof limit === 'number') params.set('limit', String(limit));
  if (category) params.set('category', category);
  const qs = params.toString();
  return request<NotificationRow[]>(`/notifications${qs ? `?${qs}` : ''}`);
}

export function markTargetNotificationsRead(targetId: string) {
  return request<void>('/notifications/read-target', {
    method: 'PATCH',
    body: JSON.stringify({ targetId }),
  });
}

export function listFriendRequestNotifications() {
  return request<NotificationRow[]>('/notifications/friend-requests');
}


export function markNotificationRead(id: string) {
  return request<void>(`/notifications/${id}/read`, { method: 'PATCH' });
}

export function markAllNotificationsRead() {
  return request<void>('/notifications/read-all', { method: 'PATCH' });
}

export function getNotificationRedirection(id: string) {
  return request<import('../types').NotificationRedirectionResponse>(`/notifications/${id}/redirection`);
}

export function deleteAllNotifications(): Promise<void> {  // ← fixed typo + completed
  return request<void>('/notifications', { method: 'DELETE' });
}