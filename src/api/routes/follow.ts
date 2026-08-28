// src/api/routes/follow.ts

import { request } from '../http';
import type { FollowCounts, FollowStatusResponse, PaginatedFollowList } from '../types';

export function followUser(userId: string) {
  return request<void>(`/follows/${userId}`, { method: 'POST' });
}

export function unfollowUser(userId: string) {
  return request<void>(`/follows/${userId}`, { method: 'DELETE' });
}

export function getFollowStatus(userId: string) {
  return request<FollowStatusResponse>(`/follows/status/${userId}`);
}

export function getFollowCounts(userId: string) {
  return request<FollowCounts>(`/follows/counts/${userId}`);
}

export function listFollowers(userId: string, cursor?: string | null) {
  const qs = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
  return request<PaginatedFollowList>(`/follows/${userId}/followers${qs}`);
}

export function listFollowing(userId: string, cursor?: string | null) {
  const qs = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
  return request<PaginatedFollowList>(`/follows/${userId}/following${qs}`);
}
