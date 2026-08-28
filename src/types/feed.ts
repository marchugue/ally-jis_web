// src/types/feed.ts
//
// Mirrors the backend's src/types/feed.types.ts response shapes exactly
// (snake_case, since these are raw API responses — map to camelCase
// view-models inside components/hooks if you prefer, same as
// profileMapper does for Student elsewhere in the app).

export type PostAudience = 'public' | 'connections';

export interface FeedAuthor {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
}

export interface PostMedia {
  id: string;
  post_id: string;
  url: string;
  position: number;
  created_at: string;
}

export interface FeedPost {
  id: string;
  author_id: string;
  content: string;
  audience: PostAudience;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  author: FeedAuthor | null;
  liked_by_me: boolean;
  media: PostMedia[];
}

export interface FeedComment {
  id: string;
  post_id: string;
  author_id: string;
  parent_comment_id: string | null;
  content: string;
  likes_count: number;
  created_at: string;
  updated_at: string;
  author: FeedAuthor | null;
  liked_by_me: boolean;
}

export interface FeedCommentWithReplies extends FeedComment {
  replies: FeedComment[];
}

export interface LikeStatusResponse {
  liked: boolean;
  likesCount: number;
}

export interface CreatePostInput {
  content: string;
  audience?: PostAudience;
  mediaUrls?: string[];
}

export interface PostMediaUploadResponse {
  urls: string[];
}