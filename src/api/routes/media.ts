// src/api/routes/media.ts

import { request } from '../http';
import type { MediaUploadResponse, PostMediaUploadResponse, PresetAvatarListResponse } from '../types';

/** GET /api/media/avatars/presets — public, no auth */
export function getPresetAvatars() {
  return request<PresetAvatarListResponse>('/media/avatars/presets');
}

/** POST /api/media/avatar — upload a personal profile photo, returns R2 URL */
export function uploadAvatarMedia(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return request<MediaUploadResponse>('/media/avatar', {
    method: 'POST',
    body: formData,
  });
}

/** POST /api/media/chat — single image or video (up to 50 MB) */
export function uploadChatMedia(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return request<MediaUploadResponse>('/media/chat', {
    method: 'POST',
    body: formData,
  });
}

/** POST /api/media/posts — up to 4 post images */
export function uploadPostMedia(files: File[]) {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  return request<PostMediaUploadResponse>('/media/posts', {
    method: 'POST',
    body: formData,
  });
}