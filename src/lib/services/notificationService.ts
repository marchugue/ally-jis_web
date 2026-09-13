import { apiClient, NotificationRow } from '@/api/client';
import { Notification } from '@/types/ally';

const EXCLUDED_TYPES: Notification['type'][] = ['message'];

/** Strip the legacy <!--meta:{...}--> prefix written by older feed.service versions. */
function stripMetaPrefix(desc: string | undefined | null): string {
  if (!desc) return '';
  return desc.replace(/^<!--meta:\{[^}]*\}-->/i, '').trim();
}

export const mapNotification = (row: NotificationRow): Notification => {
  const userObj = Array.isArray(row.from_user) ? row.from_user[0] : row.from_user;
  return {
    id: row.id,
    type: row.type as Notification['type'],
    title: row.title,
    description: stripMetaPrefix(row.description),
    timestamp: row.created_at || new Date().toISOString(),
    isRead: row.is_read,
    fromUserId: row.from_user_id ?? userObj?.id ?? undefined,
    fromUserName: userObj?.username || userObj?.full_name || undefined,
    fromUserAvatar: userObj?.avatar_url || undefined,
    postId: row.post_id ?? undefined,
    commentId: row.comment_id ?? undefined,
    targetId: row.target_id ?? undefined,
    redirection: row.redirection ?? undefined,
  };
};

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