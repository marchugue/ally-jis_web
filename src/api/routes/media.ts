// src/api/media.ts

import { request } from '../http';
import type { MediaUploadResponse, PostMediaUploadResponse } from '../types';

export function uploadChatMedia(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return request<MediaUploadResponse>('/media/chat', {
    method: 'POST',
    body: formData,
  });
} 

// POST /api/media/posts — multipart/form-data, field name "files" (max 4).
// request() detects the FormData instance and skips JSON.stringify + the
// Content-Type header, so fetch sets the multipart boundary itself —
// same pattern as uploadChatMedia above.
export function uploadPostMedia(files: File[]) {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  return request<PostMediaUploadResponse>('/media/posts', {
    method: 'POST',
    body: formData,
  });
}