// src/api/routes/notifications.ts

import { request } from '../http';
import type { NotificationRow } from '../types';

export function listNotifications() {
  return request<NotificationRow[]>('/notifications');
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