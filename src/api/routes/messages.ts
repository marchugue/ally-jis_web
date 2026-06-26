// src/api/messages.ts

import { request } from '../http';
import type { MessageRow } from '../types';

export function listMessages(conversationId: string) {
  return request<MessageRow[]>(`/conversations/${conversationId}/messages`);
}

export function sendMessage(conversationId: string, payload: { content: string | null; imageUrl?: string | null }) {
  return request<MessageRow>(`/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: payload,
  });
}