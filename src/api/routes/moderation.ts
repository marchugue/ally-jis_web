import { request } from '../http';
import type {
  BlockUserPayload,
  ReportUserPayload,
  BlockUserResponse,
  ReportUserResponse,
  BlockedUserRow,
  UnblockUserResponse,
  RestrictUserPayload,
  RestrictUserResponse,
  UnrestrictUserResponse,
  RestrictedUserRow,
  MuteUserPayload,
  MuteUserResponse,
  UnmuteUserResponse,
  MutedUserRow,
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

// ─────────────────────────────────────────────────────────────────────────────
// Restrict API
// ─────────────────────────────────────────────────────────────────────────────

export async function restrictUser(payload: RestrictUserPayload): Promise<RestrictUserResponse> {
  return request<RestrictUserResponse>('/moderation/restrict', {
    method: 'POST',
    body: payload,
  });
}

export async function unrestrictUser(restrictedUserId: string): Promise<UnrestrictUserResponse> {
  return request<UnrestrictUserResponse>(`/moderation/restrict/${restrictedUserId}`, {
    method: 'DELETE',
  });
}

export async function checkIsRestricted(userId: string): Promise<{ restricted: boolean; restrictedByMe: boolean }> {
  return request<{ restricted: boolean; restrictedByMe: boolean }>(`/moderation/restricted/${userId}`);
}

export async function listRestrictedUsers(): Promise<RestrictedUserRow[]> {
  return request<RestrictedUserRow[]>('/moderation/restricted');
}

// ─────────────────────────────────────────────────────────────────────────────
// Mute API
// ─────────────────────────────────────────────────────────────────────────────

export async function muteUser(payload: MuteUserPayload): Promise<MuteUserResponse> {
  return request<MuteUserResponse>('/moderation/mute', {
    method: 'POST',
    body: payload,
  });
}

export async function unmuteUser(mutedUserId: string): Promise<UnmuteUserResponse> {
  return request<UnmuteUserResponse>(`/moderation/mute/${mutedUserId}`, {
    method: 'DELETE',
  });
}

export async function checkIsMuted(userId: string): Promise<{ muted: boolean }> {
  return request<{ muted: boolean }>(`/moderation/muted/${userId}`);
}

export async function listMutedUsers(): Promise<MutedUserRow[]> {
  return request<MutedUserRow[]>('/moderation/muted');
}