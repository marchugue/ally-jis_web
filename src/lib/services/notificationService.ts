import { apiClient, NotificationRow } from '@/api/client';
import { Notification } from '@/types/ally';

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
    return (data ?? []).map(mapNotification);
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
};
