// src/api/routes/follow.ts

import { request } from '../http';
import type { FollowCounts, FollowFilterOptions, FollowStatusResponse, PaginatedFollowList } from '../types';

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

function buildFollowQuery(options?: FollowFilterOptions | string | null): string {
  if (!options) return '';
  if (typeof options === 'string') {
    return `?cursor=${encodeURIComponent(options)}`;
  }
  const params = new URLSearchParams();
  if (options.cursor) params.set('cursor', options.cursor);
  if (options.search) params.set('search', options.search);
  if (options.department) params.set('department', options.department);
  if (options.course) params.set('course', options.course);
  if (options.year_level) params.set('year_level', options.year_level);
  if (options.sortBy) params.set('sortBy', options.sortBy);
  if (options.limit) params.set('limit', String(options.limit));
  const str = params.toString();
  return str ? `?${str}` : '';
}

export function listFollowers(userId: string, options?: FollowFilterOptions | string | null) {
  const qs = buildFollowQuery(options);
  return request<PaginatedFollowList>(`/follows/${userId}/followers${qs}`);
}

export function listFollowing(userId: string, options?: FollowFilterOptions | string | null) {
  const qs = buildFollowQuery(options);
  return request<PaginatedFollowList>(`/follows/${userId}/following${qs}`);
}
