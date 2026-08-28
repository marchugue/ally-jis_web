import { request } from '../http';
import type {
  BlockUserPayload,
  ReportUserPayload,
  BlockUserResponse,
  ReportUserResponse,
  BlockedUserRow,
  UnblockUserResponse,
} from '../types';

/**
 * Block a user by their profile ID.
 * Backend should: insert a block row, remove any existing connection/interaction
 * rows, and prevent future messages between the two users.
 */
export async function blockUser(payload: BlockUserPayload): Promise<BlockUserResponse> {
  return request<BlockUserResponse>('/moderation/block', {
    method: 'POST',
    body: payload,
  });
}

/**
 * Report a user for a specific community-standards violation.
 * Backend should: insert a report row and queue it for moderator review.
 */
export async function reportUser(payload: ReportUserPayload): Promise<ReportUserResponse> {
  return request<ReportUserResponse>('/moderation/report', {
    method: 'POST',
    body: payload,
  });
}

export async function unblockUser(blockedUserId: string): Promise<UnblockUserResponse> {
  return request<UnblockUserResponse>(`/moderation/block/${blockedUserId}`, {
    method: 'DELETE',
  });
}

export async function listBlockedUsers(): Promise<BlockedUserRow[]> {
  return request<BlockedUserRow[]>('/moderation/blocked');
}