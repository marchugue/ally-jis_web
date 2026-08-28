import { request } from '../http';
import type {
  PostRow,
  CommentRow,
  CommentWithRepliesRow,
  LikeStatusResponse,
  CreatePostPayload,
  ListFeedParams,
} from '../types';

// ─── Posts ───────────────────────────────────────────────────────────────────

export function listFeed(params: ListFeedParams = {}) {
  const query = new URLSearchParams();
  if (params.limit !== undefined) query.set('limit', String(params.limit));
  if (params.before !== undefined) query.set('before', params.before);
  const qs = query.toString();
  return request<PostRow[]>(`/feed${qs ? `?${qs}` : ''}`);
}

export function listPostsByAuthor(authorId: string, params: ListFeedParams = {}) {
  const query = new URLSearchParams();
  if (params.limit !== undefined) query.set('limit', String(params.limit));
  if (params.before !== undefined) query.set('before', params.before);
  const qs = query.toString();
  return request<PostRow[]>(`/feed/users/${authorId}${qs ? `?${qs}` : ''}`);
}

export function getPost(postId: string) {
  return request<PostRow>(`/feed/posts/${postId}`);
}

export function createPost(payload: CreatePostPayload) {
  return request<PostRow>('/feed/posts', { method: 'POST', body: payload });
}

export function updatePost(postId: string, payload: Partial<CreatePostPayload>) {
  return request<PostRow>(`/feed/posts/${postId}`, { method: 'PATCH', body: payload });
}

export function deletePost(postId: string) {
  return request<void>(`/feed/posts/${postId}`, { method: 'DELETE' });
}

// ─── Post likes ──────────────────────────────────────────────────────────────

export function likePost(postId: string) {
  return request<LikeStatusResponse>(`/feed/posts/${postId}/like`, { method: 'POST' });
}

export function unlikePost(postId: string) {
  return request<LikeStatusResponse>(`/feed/posts/${postId}/like`, { method: 'DELETE' });
}

// ─── Comments ────────────────────────────────────────────────────────────────

export function listComments(postId: string) {
  return request<CommentWithRepliesRow[]>(`/feed/posts/${postId}/comments`);
}

export function createComment(postId: string, payload: { content: string; parentCommentId?: string | null }) {
  return request<CommentRow>(`/feed/posts/${postId}/comments`, { method: 'POST', body: payload });
}

export function updateComment(commentId: string, payload: { content: string }) {
  return request<CommentRow>(`/feed/comments/${commentId}`, { method: 'PATCH', body: payload });
}

export function deleteComment(commentId: string) {
  return request<void>(`/feed/comments/${commentId}`, { method: 'DELETE' });
}

// ─── Comment likes ───────────────────────────────────────────────────────────

export function likeComment(commentId: string) {
  return request<LikeStatusResponse>(`/feed/comments/${commentId}/like`, { method: 'POST' });
}

export function unlikeComment(commentId: string) {
  return request<LikeStatusResponse>(`/feed/comments/${commentId}/like`, { method: 'DELETE' });
}