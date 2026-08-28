// src/api/conversations.ts

import { request } from '../http';
import type { ConversationRow } from '../types';

export function listConversations() {
  return request<ConversationRow[]>('/conversations');
}

export function getConversation(conversationId: string) {
  return request<ConversationRow>(`/conversations/${conversationId}`);
}

/** "Delete" from the chat list — hides it for the caller only, doesn't
 * touch the conversation or messages. Reappears if the other side sends
 * a new message. */
export function hideConversation(conversationId: string) {
  return request<void>(`/conversations/${conversationId}`, { method: 'DELETE' });
}

/** "Delete permanently" — clears message history for the caller up to now,
 *  and hides the conversation from the inbox. The other participant keeps
 *  their full history. */
export function clearConversation(conversationId: string) {
  return request<void>(`/conversations/${conversationId}/clear`, { method: 'POST' });
}

/** Undo for hideConversation — used by the chat list's "Undo" toast. */
export function unhideConversation(conversationId: string) {
  return request<void>(`/conversations/${conversationId}/unhide`, { method: 'POST' });
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

export function updateIcebreakers(conversationId: string, enabled: boolean) {
  return request<void>(`/conversations/${conversationId}/icebreakers`, {
    method: 'PATCH',
    body: { enabled },
  });
}

export function getIcebreakersEnabled(conversationId: string) {
  // Backend responds with `{ data: boolean | null }` and `request()` auto-unwraps
  // any `{ data: ... }` payload, so the resolved value here is `boolean | null`.
  return request<boolean | null>(`/conversations/${conversationId}/icebreakers`);
}