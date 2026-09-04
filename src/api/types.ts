// src/api/types.ts
//
// All row/payload types used across the api/*.ts domain files, in one
// place so auth.ts, profiles.ts, feed.ts etc. can import from a single
// source instead of redefining shapes.

export type BlockStatus = 'none' | 'blockedByMe' | 'blockedByOther' | 'mutual';

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
  zodiac_sign?: string | null;
  personality_type?: string | null;
  music_taste?: string[];
  movie_interests?: string[];
  age_range?: string | null;
  match_gender_preference?: string | null;
  // New email type system
  email_type?: 'chmsu' | 'external';
  student_id_url?: string | null;
}

/** Returned by POST /auth/register — no accessToken until OTP verified */
export interface RegisterResponse {
  userId: string;
  email: string;
  accessToken: string;
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
  zodiac_sign?: string | null;
  personality_type?: string | null;
  music_taste?: string[];
  movie_interests?: string[];
  age_range?: string | null;
  match_gender_preference?: string | null;
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
  zodiac_sign?: string | null;
  personality_type?: string | null;
  music_taste?: string[];
  movie_interests?: string[];
  age_range?: string | null;
  match_gender_preference?: string | null;
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

export interface MessageReplyRow {
  id: string;
  sender_id: string;
  content: string | null;
  image_url?: string | null;
}

export interface MessageReactionRow {
  message_id: string;
  user_id: string;
  emoji: string;
}

export interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  image_url?: string | null;
  created_at: string;
  reply_to_message_id?: string | null;
  replied_message?: MessageReplyRow | MessageReplyRow[] | null;
  reactions?: MessageReactionRow[];
  /** True when the sender deleted this message for everyone (global tombstone). */
  is_deleted?: boolean;
}

export interface ConversationMemberRow {
  conversation_id: string;
  user_id: string;
  last_read_at?: string | null;
  profiles?: ProfileRow | ProfileRow[];
}

export type ConversationVariant = 'regular' | 'anonymous' | 'anonymous_ended';

export interface ConversationMatchInfo {
  matchId: string;
  stage: number;
  dayStreak: number;
  myAlias: string | null;
  myAvatar: string | null;
  partnerAlias: string | null;
  partnerAvatar: string | null;
  ended: boolean;
}

export interface ConversationRow {
  id: string;
  updated_at: string;
  messages?: MessageRow[];
  conversation_members?: ConversationMemberRow[];
  icebreakersEnabled?: boolean;
  blockStatus?: BlockStatus;
  variant?: ConversationVariant;
  matchInfo?: ConversationMatchInfo | null;
  /** PHT-based consecutive-day streak — populated by the backend for all conversation types. */
  dayStreak?: number;
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

/** A single admin-curated preset avatar image stored in Cloudflare R2. */
export interface PresetAvatarRow {
  id: string;
  label: string | null;
  url: string;
  r2_path: string;
  sort_order: number;
  created_at: string;
}

export interface PresetAvatarListResponse {
  avatars: PresetAvatarRow[];
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

// block system and report

export interface BlockUserPayload {
  blockedUserId: string;
}

export interface ReportUserPayload {
  reportedUserId: string;
  violationId: string;
  conversationId?: string;
}

export interface BlockUserResponse {
  success: boolean;
  blockedAt: string;
}

export interface ReportUserResponse {
  success: boolean;
  reportId: string;
  createdAt: string;
}

export interface BlockedUserRow {
  id: string;
  fullName: string | null;
  username: string | null;
  avatarUrl: string | null;
  blockedAt: string;
}

export interface UnblockUserResponse {
  success: true;
}

export interface UpdateIcebreakersPayload { // NEW
  enabled: boolean;
}

export interface EmailStatus {
  email: string;
  isEmailVerified: boolean;
  emailConfirmedAt: string | undefined;
}

export interface OtpStatus {
  exists: boolean;
  verified: boolean;
  resendCount: number;
  resendLimit: number;
  expiresAt: string | null;
}

// ─── Follow ─────────────────────────────────────────────────────────────

export interface FollowStatusResponse {
  isFollowing: boolean;
  isFollowedBy: boolean;
}

export interface FollowCounts {
  followersCount: number;
  followingCount: number;
}

export interface FollowListItem {
  id: string;
  username: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  course: string | null;
  followedAt: string;
}

export interface PaginatedFollowList {
  items: FollowListItem[];
  nextCursor: string | null;
}

// ─── Ally (extends the existing connection/interaction system) ────────────

export type RelationshipStatus = 'none' | 'pending_outgoing' | 'pending_incoming' | 'allies';

export interface RelationshipStatusResponse {
  status: RelationshipStatus;
}

export interface AllyListItem {
  id: string;
  username: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  course: string | null;
  alliedAt: string;
}

export interface PaginatedAllyList {
  items: AllyListItem[];
  nextCursor: string | null;
}

export interface ProfileRelationshipSummary {
  allyStatus: RelationshipStatus;
  isFollowing: boolean;
  isFollowedBy: boolean;
  followersCount: number;
  followingCount: number;
  alliesCount: number;
  mutualAlliesCount: number;
  mutualFollowersCount: number;
  mutualFollowingCount: number;
}

// ─── Admin ──────────────────────────────────────────────────────────────

export type AdminRole = 'moderator' | 'admin' | 'super_admin';

export type Permission =
  | 'manage_users'
  | 'manage_bots'
  | 'view_reports'
  | 'resolve_reports'
  | 'delete_users'
  | 'ban_users'
  | 'view_analytics'
  | 'manage_settings'
  | 'manage_admins';

export interface AdminMeResponse {
  role: AdminRole;
  permissions: Permission[];
}

export interface DashboardKpis {
  totalUsers: number;
  activeUsers: number;
  bannedUsers: number;
  reportedUsers: number;
  newUsersToday: number;
  onlineUsers: number;
  pendingReports: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
}

export interface TimeSeriesPoint {
  date: string;
  count: number;
}

export interface DashboardCharts {
  registrations: TimeSeriesPoint[];
  activeUsers: TimeSeriesPoint[];
  reportsTrend: TimeSeriesPoint[];
}

export interface AdminListItem {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  email: string;
  role: AdminRole;
  created_at: string;
}

export interface RolePermissionRow {
  role: AdminRole;
  permission: Permission;
}

export interface AdminActivityLogRow {
  id: string;
  admin_id: string;
  action: string;
  target_user_id: string | null;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

export interface PaginatedActivityLog {
  items: AdminActivityLogRow[];
  nextCursor: string | null;
}

// ─── Admin: User Management ────────────────────────────────────────────────

export interface AdminUserListItem {
  id: string;
  username: string | null;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  department: string | null;
  course: string | null;
  year_level: string | null;
  role: string;
  is_banned: boolean;
  is_suspended: boolean;
  suspended_until: string | null;
  admin_verified: boolean;
  created_at: string;
  last_seen_at: string | null;
  // Enhanced verification & identity status fields
  email_type?: 'chmsu' | 'external' | null;
  chmsu_auto_verified?: boolean;
  pending_student_verification?: boolean;
  student_verification_status?: 'pending' | 'approved' | 'rejected' | null;
  student_id_url?: string | null;
}

export interface AdminUserDetail extends AdminUserListItem {
  bio: string | null;
  interests: string[];
  organizations: string[];
  postsCount: number;
  reportsAgainstCount: number;
  banned_at: string | null;
  // Student verification fields shown in the admin detail sheet
  email_type: 'chmsu' | 'external' | null;
  chmsu_auto_verified: boolean;
  pending_student_verification: boolean;
  student_verification_status: 'pending' | 'approved' | 'rejected' | null;
  student_id_url: string | null;
}

export interface PaginatedUserList {
  items: AdminUserListItem[];
  nextCursor: string | null;
  total: number;
}

export interface PendingVerificationItem {
  id: string;
  username: string | null;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  department: string | null;
  course: string | null;
  student_id_url: string | null;
  student_verification_status: string;
  created_at: string;
}

// ─── Admin: Reports Management ─────────────────────────────────────────────

export type ReportStatus = 'pending' | 'reviewing' | 'resolved' | 'rejected';

export interface AdminReportListItem {
  id: string;
  reporter_id: string | null;
  reporter_username: string | null;
  reported_user_id: string | null;
  reported_username: string | null;
  violation_id: string;
  violation_label: string;
  category_id: string;
  category_label: string;
  conversation_id: string | null;
  status: ReportStatus;
  internal_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
}

export interface PaginatedReportList {
  items: AdminReportListItem[];
  nextCursor: string | null;
  total: number;
}

export type ReportStatusCounts = Record<ReportStatus, number>;

// ─── Admin: Global Search ───────────────────────────────────────────────

export interface GlobalSearchResult {
  users: { id: string; username: string | null; full_name: string | null; email: string }[];
  reports: { id: string; reported_username: string | null; violation_label: string; status: string }[];
  admins: { id: string; username: string | null; full_name: string | null; role: string }[];
}

// ─── Admin: Settings ─────────────────────────────────────────────────────

export interface SystemSettings {
  maintenance_mode?: boolean;
  maintenance_message?: string;
  registrations_enabled?: boolean;
  platform_name?: string;
  support_email?: string | null;
  require_email_verification?: boolean;
  [key: string]: unknown;
}



// ─── Matchmaking ──────────────────────────────────────────────────────────

export type QueueStatus = 'searching' | 'reserved';

export interface QueueRow {
  id: string;
  user_id: string;
  status: QueueStatus;
  joined_at: string;
  updated_at: string;
}

export type MatchStatus =
  | 'pending'
  | 'declined'
  | 'timed_out'
  | 'chatting'
  | 'expired'
  | 'confirmed'
  | 'ended';

export interface MatchRow {
  id: string;
  user_a_id: string;
  user_b_id: string;
  status: MatchStatus;
  compatibility_score: number;
  accepted_a: boolean;
  accepted_b: boolean;
  conversation_id: string | null;
  streak_count: number;
  last_sender_id: string | null;
  accept_expires_at: string | null;
  chat_expires_at: string | null;
  confirmed_at: string | null;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
  current_stage: number;
  day_streak: number;
}

export interface MatchIdentityView {
  myAlias: string;
  myAvatar: string;
  partnerAlias: string;
  partnerAvatar: string;
}

export interface MatchmakingStatusResponse {
  queueEntry: QueueRow | null;
  /** Single active match — legacy field kept for backward compat */
  activeMatch: MatchRow | null;
  /** All active matches for this user (chatting + pending) — preferred field */
  activeMatches?: MatchRow[];
  /** How many matches started today (UTC). Backend enforces max 5. */
  dailyMatchCount?: number;
  identity: MatchIdentityView | null;
}

export interface AcceptMatchResponse extends MatchRow {
  identity: MatchIdentityView | null;
}

// ─── Match reveal / timeline (Phase 2) ─────────────────────────────────────

export interface ConversationInsights {
  totalMessages: number;
  daysActive: number;
}

export interface RevealPartnerView {
  ageRange?: string | null;
  zodiacSign?: string | null;
  personalityType?: string | null;
  musicTaste?: string[];
  movieInterests?: string[];
  studyCategory?: string | null;
  blurredAvatarUrl?: string | null;
  firstNameLetter?: string | null;
  favoriteHobby?: string | null;
  fullName?: string | null;
  username?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  userId?: string | null;
}

export interface RevealData {
  stage: number;
  stageName: string;
  dayStreak: number;
  compatibilityScore: number | null;
  sharedInterests: string[];
  sharedCategories: string[];
  conversationInsights: ConversationInsights | null;
  icebreakers: string[];
  partner: RevealPartnerView;
}

export interface TimelinePostView {
  id: string;
  content: string;
  mediaUrls: string[];
  likesCount: number;
  commentsCount: number;
  createdAt: string;
}

export interface TimelineData {
  locked: boolean;
  blurred: boolean;
  posts: TimelinePostView[];
}



