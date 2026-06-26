import { apiClient, ConversationRow } from '@/api/client';
import { Message, Conversation } from '../../types/ally';
import { CURRENT_USER } from '../../data/mockData';

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

  return {
    id: row.id,
    participantId: otherProfile?.id ?? 'Unknown',
    participantName: otherProfile?.username ?? otherProfile?.full_name ?? 'Student',
    participantAvatar: otherProfile?.avatar_url ?? CURRENT_USER.avatar,
    lastMessage: lastMsg?.content ?? (lastMsg?.image_url ? 'Photo' : 'New match!'),
    lastMessageTime: lastMsg?.created_at ?? row.updated_at,
    lastMessageSenderId: lastMsg?.sender_id ?? '',
    unreadCount: unread,
    sharedInterests,
    messages: [],
  };
};

export const chatService = {
  async getConversations(userId: string, currentUserInterests: string[] = []) {
    const data = await apiClient.listConversations();
    return (data ?? []).map((row) => mapConversationRow(row, userId, currentUserInterests));
  },

  async getMessages(conversationId: string) {
    const data = await apiClient.listMessages(conversationId);
    return (data || []).map(
      (msg) =>
        ({
          id: msg.id,
          senderId: msg.sender_id,
          content: msg.content,
          imageUrl: msg.image_url,
          timestamp: msg.created_at,
          isRead: false,
        }) as Message
    );
  },

  async getOrCreateConversation(targetUserId: string) {
    const result = await apiClient.getOrCreateConversation(targetUserId);
    return result.conversationId;
  },

  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string | null,
    imageUrl?: string | null
  ) {
    const data = await apiClient.sendMessage(conversationId, { content, imageUrl });
    return {
      id: data.id,
      senderId: data.sender_id,
      content: data.content,
      imageUrl: data.image_url,
      timestamp: data.created_at,
      isRead: false,
    } as Message;
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
};