// src/lib/services/chatService.ts
import { apiClient, ConversationRow, MessageRow } from '@/api/client';
import { Message, Conversation, MessageReplyPreview } from '../../types/ally';
import { CURRENT_USER } from '../../data/mockData';

function mapReplyRow(row: MessageRow['replied_message']): MessageReplyPreview | null {
  const reply = Array.isArray(row) ? row[0] : row;
  if (!reply) return null;
  return {
    id: reply.id,
    senderId: reply.sender_id,
    content: reply.content,
    imageUrl: reply.image_url ?? null,
  };
}

export function mapMessageRow(msg: MessageRow): Message {
  return {
    id: msg.id,
    senderId: msg.sender_id,
    content: msg.content,
    imageUrl: msg.image_url,
    timestamp: msg.created_at,
    createdAt: msg.created_at,
    isRead: false,
    replyTo: mapReplyRow(msg.replied_message),
    reactions: (msg.reactions ?? []).map((reaction) => ({
      userId: reaction.user_id,
      emoji: reaction.emoji,
    })),
    // Global tombstone — set when the sender deleted for everyone.
    isDeleted: msg.is_deleted ?? false,
  };
}

export function formatForwardedMessage(senderName: string, message: Message): string {
  const quoted = message.content?.trim() || (message.imageUrl ? 'Photo' : 'Message');
  return `Forwarded from ${senderName}:\n${quoted}`;
}

export const mapConversationRow = (
  row: ConversationRow,
  currentUserId: string,
  currentUserInterests: string[] = []
): Conversation => {
  const members = row.conversation_members ?? [];
  const currentId = String(currentUserId).toLowerCase();

  const otherMember = members.find((m) => {
    const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
    return profile && String(profile.id).toLowerCase() !== currentId;
  })?.profiles;
  const otherProfile = Array.isArray(otherMember) ? otherMember[0] : otherMember;

  const myMembership = members.find((m) => {
    const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
    return profile && String(profile.id).toLowerCase() === currentId;
  });

  const sortedMessages = [...(row.messages ?? [])].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  const lastMsg = sortedMessages[sortedMessages.length - 1];

  const unread =
    row.messages?.filter(
      (m) =>
        m.sender_id !== currentUserId &&
        (!myMembership?.last_read_at ||
          new Date(m.created_at) > new Date(myMembership.last_read_at))
    ).length ?? 0;

  const sharedInterests =
    otherProfile?.interests?.filter((i) => currentUserInterests.includes(i)) ??
    otherProfile?.interests ??
    [];

  const variant = row.variant ?? 'regular';
  const isAnonymous = variant !== 'regular';

  return {
    id: row.id,
    // For anonymous/anonymous_ended conversations the backend never sends
    // real profile data for the other member (see conversation.service.ts
    // #attachVariant) — participant identity comes from matchInfo instead.
    participantId: isAnonymous ? row.matchInfo?.matchId ?? 'anonymous' : otherProfile?.id ?? 'Unknown',
    participantName: isAnonymous
      ? row.matchInfo?.partnerAlias ?? 'Anonymous'
      : otherProfile?.username ?? otherProfile?.full_name ?? 'Student',
    participantAvatar: isAnonymous ? '' : otherProfile?.avatar_url ?? CURRENT_USER.avatar,
    lastMessage: lastMsg?.content ?? (lastMsg?.image_url ? 'Photo' : 'New match!'),
    lastMessageTime: lastMsg?.created_at ?? row.updated_at,
    lastMessageSenderId: lastMsg?.sender_id ?? '',
    unreadCount: unread,
    sharedInterests: isAnonymous ? [] : sharedInterests,
    // Per-conversation block relationship computed on the backend
    // (none | blockedByMe | blockedByOther | mutual). Defaults to 'none'
    // for any row that predates this field.
    icebreakersEnabled: row.icebreakersEnabled ?? true,
    blockStatus: row.blockStatus ?? 'none',
    messages: [],
    variant,
    // General PHT streak — backend always returns this now (0 if not started).
    dayStreak: row.dayStreak ?? 0,
    matchInfo: row.matchInfo
      ? {
          matchId: row.matchInfo.matchId,
          stage: row.matchInfo.stage,
          dayStreak: row.matchInfo.dayStreak,
          partnerAlias: row.matchInfo.partnerAlias,
          partnerAvatar: row.matchInfo.partnerAvatar,
          ended: row.matchInfo.ended,
        }
      : null,
  };
};

export const chatService = {
  async getConversations(userId: string, currentUserInterests: string[] = []) {
    const data = await apiClient.listConversations();
    return (data ?? []).map((row) => mapConversationRow(row, userId, currentUserInterests));
  },

  async getMessages(conversationId: string) {
    const data = await apiClient.listMessages(conversationId);
    return (data || []).map((msg) => mapMessageRow(msg));
  },

  async getOrCreateConversation(targetUserId: string) {
    const result = await apiClient.getOrCreateConversation(targetUserId);
    return result.conversationId;
  },

  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string | null,
    imageUrl?: string | null,
    replyToMessageId?: string | null
  ) {
    const data = await apiClient.sendMessage(conversationId, { content, imageUrl, replyToMessageId });
    return mapMessageRow(data);
  },

  async markConversationRead(conversationId: string) {
    await apiClient.markConversationRead(conversationId);
  },

  async getConversation(conversationId: string, currentUserId: string) {
    const data = await apiClient.getConversation(conversationId);
    return mapConversationRow(data, currentUserId);
  },

  async uploadChatMedia(file: File) {
    const result = await apiClient.uploadChatMedia(file);
    return result.url;
  },

  async setIcebreakersEnabled(conversationId: string, enabled: boolean) {
    await apiClient.updateIcebreakers(conversationId, enabled);
  },

  async getIcebreakersEnabled(conversationId: string) {
    const result = await apiClient.getIcebreakersEnabled(conversationId);
    return result ?? null;
  },

  async setMessageReaction(conversationId: string, messageId: string, emoji: string | null) {
    const data = await apiClient.setMessageReaction(conversationId, messageId, emoji);
    return (data ?? []).map((reaction) => ({
      userId: reaction.user_id,
      emoji: reaction.emoji,
    }));
  },
};