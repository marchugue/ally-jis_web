// src/api/types.ts
//
// All row/payload types used across the api/*.ts domain files, in one
// place so auth.ts, profiles.ts, feed.ts etc. can import from a single
// source instead of redefining shapes.

// ─── Auth ───────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
  aud?: string;
  created_at?: string;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

export interface RegisterPayload {
  email: string;
  password: string;
  username: string;
  bio?: string | null;
  department?: string | null;
  course?: string | null;
  year_level?: string | null;
  interests: string[];
  organizations: string[];
  avatar_url?: string | null;
}

// ─── Profiles ───────────────────────────────────────────────────────────────

export interface ProfileRow {
  id: string;
  email?: string;
  full_name?: string | null;
  username?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  department?: string | null;
  course?: string | null;
  year_level?: string | null;
  interests?: string[];
  organizations?: string[];
  created_at?: string;
}

export interface UpdateProfilePayload {
  full_name?: string;
  username?: string;
  bio?: string | null;
  avatar_url?: string | null;
  department?: string | null;
  course?: string | null;
  year_level?: string | null;
  interests?: string[];
  organizations?: string[];
}

// ─── Lookups ────────────────────────────────────────────────────────────────

export interface LookupDepartment {
  id: string;
  name: string;
  sort_order: number | null;
}

export interface LookupCourse {
  name: string;
  department_id: string | null;
  sort_order: number | null;
}

export interface LookupOrganization {
  name: string;
  sort_order: number | null;
}

export interface LookupInterest {
  name: string;
  category: string;
  color: string;
  sort_order: number | null;
}

export interface LookupsResponse {
  organizations: LookupOrganization[];
  departments: LookupDepartment[];
  courses: LookupCourse[];
  interests: LookupInterest[];
}

// ─── Interactions ───────────────────────────────────────────────────────────

export interface InteractionRow {
  user_id: string;
  target_user_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  accepted_at?: string | null;
}

// ─── Conversations & messages ───────────────────────────────────────────────

export interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  image_url?: string | null;
  created_at: string;
}

export interface ConversationMemberRow {
  conversation_id: string;
  user_id: string;
  last_read_at?: string | null;
  profiles?: ProfileRow | ProfileRow[];
}

export interface ConversationRow {
  id: string;
  updated_at: string;
  messages?: MessageRow[];
  conversation_members?: ConversationMemberRow[];
}

// ─── Notifications ──────────────────────────────────────────────────────────

export interface NotificationRow {
  id: string;
  user_id: string;
  type: string;
  title: string;
  description?: string | null;
  is_read: boolean;
  from_user_id?: string | null;
  created_at: string;
}

// ─── Media ──────────────────────────────────────────────────────────────────

export interface MediaUploadResponse {
  url: string;
}

export interface PostMediaUploadResponse {
  urls: string[];
}

// ─── Feed (newsfeed) ────────────────────────────────────────────────────────

// ─── Feed ────────────────────────────────────────────────────────────────────

export type PostAudience = 'public' | 'connections';

export interface FeedAuthorRow {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
}

export interface PostMediaRow {
  id: string;
  post_id: string;
  url: string;
  position: number;
  created_at: string;
}

export interface PostRow {
  id: string;
  author_id: string;
  content: string;
  audience: PostAudience;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  author: FeedAuthorRow | null;
  liked_by_me: boolean;
  media: PostMediaRow[];
}

export interface CommentRow {
  id: string;
  post_id: string;
  author_id: string;
  parent_comment_id: string | null;
  content: string;
  likes_count: number;
  created_at: string;
  updated_at: string;
  author: FeedAuthorRow | null;
  liked_by_me: boolean;
}

export interface CommentWithRepliesRow extends CommentRow {
  replies: CommentRow[];
}

export interface LikeStatusResponse {
  liked: boolean;
  likesCount: number;
}

export interface CreatePostPayload {
  content: string;
  audience?: PostAudience;
  mediaUrls?: string[];
}

// Fixed: camelCase to match backend req.body
export interface CreateCommentPayload {
  content: string;
  parentCommentId?: string | null;
}

export interface ListFeedParams {
  limit?: number;
  before?: string;
}

export interface PostMediaUploadResponse {
  urls: string[];
}

