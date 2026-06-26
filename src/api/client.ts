/**
 * Central API client — all backend requests go through this file.
 * Set VITE_API_BASE_URL in .env (e.g. http://localhost:3001/api)
 *
 * This file is now a thin barrel: the actual request logic and each
 * domain's functions live in api/http.ts and api/<domain>.ts. Splitting
 * it up this way keeps each domain's surface area easy to scan, while
 * `apiClient.xxx(...)` call sites elsewhere in the app don't change at
 * all — apiClient is just every domain module's functions merged into
 * one object, same shape as before.
 */

export { ApiError, isApiConfigured } from './http';

export type {
  AuthUser,
  AuthSession,
  RegisterPayload,
  ProfileRow,
  UpdateProfilePayload,
  LookupDepartment,
  LookupCourse,
  LookupOrganization,
  LookupInterest,
  LookupsResponse,
  InteractionRow,
  MessageRow,
  ConversationMemberRow,
  ConversationRow,
  NotificationRow,
  MediaUploadResponse,
  PostMediaUploadResponse,
  PostAudience,
  FeedAuthorRow,
  PostMediaRow,
  PostRow,
  CommentRow,
  CommentWithRepliesRow,
  LikeStatusResponse,
  CreatePostPayload,
  ListFeedParams,
} from './types';

import * as auth from './routes/auth';
import * as profiles from './routes/profiles';
import * as lookups from './routes/lookups';
import * as interactions from './routes/interactions';
import * as conversations from './routes/conversations';
import * as messages from './routes/messages';
import * as notifications from './routes/notifications';
import * as media from './routes/media';
import * as feed from './routes/feed';
import * as presence from './routes/presence';

export const apiClient = {
  // ─── Auth ───────────────────────────────────────────────────────────────
  login: auth.login,
  register: auth.register,
  logout: auth.logout,
  getSession: auth.getSession,
  setAccessToken: auth.setAccessToken,
  getAccessToken: auth.getAccessToken,

  // ─── Profiles ───────────────────────────────────────────────────────────
  getMyProfile: profiles.getMyProfile,
  getProfile: profiles.getProfile,
  listProfiles: profiles.listProfiles,
  getProfilesByIds: profiles.getProfilesByIds,
  updateProfile: profiles.updateProfile,
  deleteProfile: profiles.deleteProfile,
  checkUsername: profiles.checkUsername,

  // ─── Lookups ─────────────────────────────────────────────────────────────
  getLookups: lookups.getLookups,

  // ─── Interactions ────────────────────────────────────────────────────────
  listMyInteractions: interactions.listMyInteractions,
  listIncomingInteractions: interactions.listIncomingInteractions,
  sendConnectionRequest: interactions.sendConnectionRequest,
  acceptConnection: interactions.acceptConnection,
  rejectConnection: interactions.rejectConnection,
  getConnectionStatus: interactions.getConnectionStatus,

  // ─── Conversations ───────────────────────────────────────────────────────
  listConversations: conversations.listConversations,
  getConversation: conversations.getConversation,
  getOrCreateConversation: conversations.getOrCreateConversation,
  markConversationRead: conversations.markConversationRead,
  findConversationWithUser: conversations.findConversationWithUser,
  listMyConversationMemberships: conversations.listMyConversationMemberships,

  // ─── Messages ────────────────────────────────────────────────────────────
  listMessages: messages.listMessages,
  sendMessage: messages.sendMessage,

  // ─── Notifications ───────────────────────────────────────────────────────
  listNotifications: notifications.listNotifications,
  listFriendRequestNotifications: notifications.listFriendRequestNotifications,
  markNotificationRead: notifications.markNotificationRead,
  markAllNotificationsRead: notifications.markAllNotificationsRead,

  // ─── Media ───────────────────────────────────────────────────────────────
  uploadChatMedia: media.uploadChatMedia,
  uploadPostMedia: media.uploadPostMedia,

  // ─── Feed ────────────────────────────────────────────────────────────────
  listFeed: feed.listFeed,
  listPostsByAuthor: feed.listPostsByAuthor,
  getPost: feed.getPost,
  createPost: feed.createPost,
  updatePost: feed.updatePost,
  deletePost: feed.deletePost,
  likePost: feed.likePost,
  unlikePost: feed.unlikePost,
  listComments: feed.listComments,
  createComment: feed.createComment,
  updateComment: feed.updateComment,
  deleteComment: feed.deleteComment,
  likeComment: feed.likeComment,
  unlikeComment: feed.unlikeComment,

  // ─── Presence ────────────────────────────────────────────────────────────
  sendPresenceHeartbeat: presence.sendPresenceHeartbeat,
  getOnlineUsers: presence.getOnlineUsers,
};