// src/api/profiles.ts

import { request } from '../http';
import type { ProfileRow, UpdateProfilePayload } from '../types';

export function getMyProfile() {
  return request<ProfileRow>('/profiles/me');
}

export function getProfile(userId: string) {
  return request<ProfileRow>(`/profiles/${userId}`);
}

export function listProfiles(excludeId?: string) {
  const query = excludeId ? `?exclude=${encodeURIComponent(excludeId)}` : '';
  return request<ProfileRow[]>(`/profiles${query}`);
}

export function getProfilesByIds(ids: string[]) {
  if (ids.length === 0) return Promise.resolve([] as ProfileRow[]);
  return request<ProfileRow[]>('/profiles/batch', {
    method: 'POST',
    body: { ids },
  });
}

export function updateProfile(updates: UpdateProfilePayload) {
  return request<ProfileRow>('/profiles/me', {
    method: 'PATCH',
    body: updates,
  });
}

export function deleteProfile() {
  return request<void>('/profiles/me', { method: 'DELETE' });
}

export function checkUsername(username: string, excludeId?: string) {
  const params = new URLSearchParams({ username });
  if (excludeId) params.set('excludeId', excludeId);
  return request<{ available: boolean }>(`/profiles/check-username?${params}`);
}