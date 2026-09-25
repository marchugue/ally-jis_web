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

  let description = row.description ?? '';
  let postId = row.post_id ?? row.redirection?.postId ?? undefined;
  let commentId = row.comment_id ?? row.redirection?.childId ?? undefined;
  let parentId = row.parent_id ?? row.redirection?.parentId ?? undefined;
  let childId = row.child_id ?? row.redirection?.childId ?? undefined;
  let targetId = row.target_id ?? undefined;

  const metaMatch = description.match(/<!--meta:(\{.*?\})-->/);
  if (metaMatch && metaMatch[1]) {
    try {
      const meta = JSON.parse(metaMatch[1]);
      if (meta.postId && !postId) postId = meta.postId;
      if (meta.commentId && !commentId) commentId = meta.commentId;
      if (meta.parentId && !parentId) parentId = meta.parentId;
      if (meta.childId && !childId) childId = meta.childId;
      if (meta.targetId && !targetId) targetId = meta.targetId;
      description = description.replace(/<!--meta:\{.*?\}-->/, '').trim();
    } catch {
      // Fallback gracefully
    }
  }

  let redirection = (row.redirection as any) ?? undefined;
  if (!redirection && postId) {
    const query = new URLSearchParams();
    if (childId || commentId) query.set('commentId', childId || commentId!);
    if (parentId) query.set('parentId', parentId);
    query.set('type', row.type);
    redirection = {
      webUrl: `/post/${postId}?${query.toString()}`,
      postId,
      parentId,
      childId: childId || commentId,
    };
  }

  return {
    id: row.id,
    type: row.type as Notification['type'],
    title: row.title,
    description: stripMetaPrefix(description),
    timestamp: row.created_at || new Date().toISOString(),
    isRead: row.is_read,
    fromUserId: row.from_user_id ?? userObj?.id ?? undefined,
    fromUserName: userObj?.username || userObj?.full_name || undefined,
    fromUserAvatar: userObj?.avatar_url || undefined,
    postId,
    commentId,
    parentId,
    childId,
    targetId,
    redirection,
    tree: row.tree ?? redirection?.tree ?? undefined,
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