// src/api/conversations.ts

import { request } from '../http';
import type { ConversationRow } from '../types';

export function listConversations() {
  return request<ConversationRow[]>('/conversations');
}

export function getConversation(conversationId: string) {
  return request<ConversationRow>(`/conversations/${conversationId}`);
}

export function getOrCreateConversation(targetUserId: string) {
  return request<{ conversationId: string }>('/conversations', {
    method: 'POST',
    body: { targetUserId },
  });
}

export function markConversationRead(conversationId: string) {
  return request<void>(`/conversations/${conversationId}/read`, {
    method: 'PATCH',
    body: { readAt: new Date().toISOString() },
  });
}

export function findConversationWithUser(otherUserId: string) {
  return request<{ conversationId: string | null }>(`/conversations/with-user/${otherUserId}`);
}

export function listMyConversationMemberships() {
  return request<{ conversation_id: string; last_read_at?: string | null }[]>('/conversations/memberships/me');
}