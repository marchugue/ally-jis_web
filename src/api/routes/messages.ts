// src/api/messages.ts

import { request } from '../http';
import type { MessageReactionRow, MessageRow } from '../types';

export function listMessages(conversationId: string) {
  return request<MessageRow[]>(`/conversations/${conversationId}/messages`);
}

export function sendMessage(
  conversationId: string,
  payload: { content: string | null; imageUrl?: string | null; replyToMessageId?: string | null }
) {
  return request<MessageRow>(`/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: payload,
  });
}

export function setMessageReaction(
  conversationId: string,
  messageId: string,
  emoji: string | null,
) {
  return request<MessageReactionRow[]>(
    `/conversations/${conversationId}/messages/${messageId}/reactions`,
    {
      method: 'PUT',
      body: { emoji },
    },
  );
}

/** Delete a single message — either just for the caller (delete_for_me)
 *  or globally tombstone it (delete_for_everyone, sender only). */
export function deleteMessage(
  conversationId: string,
  messageId: string,
  mode: 'delete_for_me' | 'delete_for_everyone',
) {
  return request<void>(
    `/conversations/${conversationId}/messages/${messageId}`,
    {
      method: 'DELETE',
      body: { mode },
    },
  );
}