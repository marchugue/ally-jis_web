import { apiClient, NotificationRow } from '@/api/client';
import { Notification, NotificationCategory } from '@/types/ally';

/** Strip the legacy <!--meta:{...}--> prefix written by older feed.service versions. */
function stripMetaPrefix(desc: string | undefined | null): string {
  if (!desc) return '';
  return desc.replace(/^<!--meta:\{[^}]*\}-->/i, '').trim();
}

function deriveCategory(type: string): NotificationCategory {
  if (type === 'message' || type === 'anon_match') return 'messages';
  if (
    type === 'friend_request' ||
    type === 'connection_request' ||
    type === 'accepted' ||
    type === 'connection_accepted' ||
    type === 'new_follower'
  ) {
    return 'connections';
  }
  if (
    type === 'match' ||
    type.includes('ally') ||
    type.includes('stage') ||
    type.includes('revealed') ||
    type.includes('unlocked')
  ) {
    return 'ally';
  }
  if (
    type === 'safety' ||
    type === 'emergency' ||
    type === 'admin_warning' ||
    type.includes('report')
  ) {
    return 'safety';
  }
  return 'activity';
}

export const mapNotification = (row: NotificationRow): Notification => {
  const userObj = Array.isArray(row.from_user) ? row.from_user[0] : row.from_user;

  let description = row.description ?? '';
  let postId = row.post_id ?? row.redirection?.postId ?? undefined;
  let commentId = row.comment_id ?? row.redirection?.childId ?? undefined;
  let parentId = row.parent_id ?? row.redirection?.parentId ?? undefined;
  let childId = row.child_id ?? row.redirection?.childId ?? undefined;
  let targetId = row.target_id ?? undefined;
  let groupKey = (row as any).group_key ?? undefined;
  let category = (row as any).category as NotificationCategory | undefined;
  let unreadCount = typeof (row as any).unread_count === 'number' ? (row as any).unread_count : 1;

  const metaMatch = description.match(/<!--meta:(\{.*?\})-->/);
  if (metaMatch && metaMatch[1]) {
    try {
      const meta = JSON.parse(metaMatch[1]);
      if (meta.postId && !postId) postId = meta.postId;
      if (meta.commentId && !commentId) commentId = meta.commentId;
      if (meta.parentId && !parentId) parentId = meta.parentId;
      if (meta.childId && !childId) childId = meta.childId;
      if (meta.targetId && !targetId) targetId = meta.targetId;
      if (meta.groupKey) groupKey = meta.groupKey;
      if (meta.category) category = meta.category;
      if (typeof meta.unreadCount === 'number') unreadCount = meta.unreadCount;
      description = description.replace(/<!--meta:\{.*?\}-->/, '').trim();
    } catch {
      // Fallback gracefully
    }
  }

  if (!category) {
    category = deriveCategory(row.type);
  }

  if (!groupKey) {
    if (row.type === 'message' || row.type === 'anon_match') {
      groupKey = `conversation:${targetId || postId || row.id}`;
    } else if (
      row.type === 'friend_request' ||
      row.type === 'connection_request' ||
      row.type === 'accepted' ||
      row.type === 'connection_accepted'
    ) {
      groupKey = `connection:${row.from_user_id || targetId || row.id}`;
    } else if (row.type === 'streak_reminder') {
      groupKey = `reminder:streak:${targetId || row.id}`;
    } else if (row.type === 'match') {
      groupKey = `ally:${targetId || row.id}`;
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
    groupKey,
    category,
    unreadCount,
    redirection,
    tree: row.tree ?? redirection?.tree ?? undefined,
  };
};

export const notificationService = {
  async list(limit = 20, category?: string): Promise<Notification[]> {
    const data = await apiClient.listNotifications(limit, category);
    return (data ?? []).map(mapNotification);
  },

  async listFriendRequests() {
    const data = await apiClient.listFriendRequestNotifications();
    return data ?? [];
  },

  async markAsRead(notificationId: string) {
    await apiClient.markNotificationRead(notificationId);
  },

  async markTargetAsRead(targetId: string) {
    await apiClient.markTargetNotificationsRead(targetId);
  },

  async markAllAsRead() {
    await apiClient.markAllNotificationsRead();
  },

  async clearAll() {
    await apiClient.deleteAllNotifications();
  },
};