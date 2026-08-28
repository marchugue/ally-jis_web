import { apiClient, NotificationRow } from '@/api/client';
import { Notification } from '@/types/ally';

const EXCLUDED_TYPES: Notification['type'][] = ['message'];

export const mapNotification = (row: NotificationRow): Notification => ({
  id: row.id,
  type: row.type as Notification['type'],
  title: row.title,
  description: row.description ?? '',
  timestamp: new Date(row.created_at).toLocaleString(),
  isRead: row.is_read,
  fromUserId: row.from_user_id ?? undefined,
});

export const notificationService = {
  async list(limit = 20) {
    const data = await apiClient.listNotifications(limit);
    return (data ?? [])
      .map(mapNotification)
      .filter((n) => !EXCLUDED_TYPES.includes(n.type));
  },

  async listFriendRequests() {
    const data = await apiClient.listFriendRequestNotifications();
    return data ?? [];
  },

  async markAsRead(notificationId: string) {
    await apiClient.markNotificationRead(notificationId);
  },

  async markAllAsRead() {
    await apiClient.markAllNotificationsRead();
  },
  async clearAll() {
    await apiClient.deleteAllNotifications(); // use whatever your apiClient method is called
  },
};