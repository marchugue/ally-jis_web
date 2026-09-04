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
  ConversationVariant,
  ConversationMatchInfo,
  NotificationRow,
  MediaUploadResponse,
  PostMediaUploadResponse,
  PresetAvatarRow,
  PresetAvatarListResponse,
  PostAudience,
  FeedAuthorRow,
  PostMediaRow,
  PostRow,
  CommentRow,
  CommentWithRepliesRow,
  LikeStatusResponse,
  CreatePostPayload,
  ListFeedParams,
  BlockUserPayload,
  ReportUserPayload,
  BlockUserResponse,
  ReportUserResponse,
  BlockStatus,
  UnblockUserResponse,
  BlockedUserRow,
  QueueRow,
  MatchRow,
  MatchStatus,
  MatchIdentityView,
  MatchmakingStatusResponse,
  AcceptMatchResponse,
  RevealData,
  RevealPartnerView,
  ConversationInsights,
  TimelineData,
  TimelinePostView,
  FollowStatusResponse,
  FollowCounts,
  FollowListItem,
  PaginatedFollowList,
  RelationshipStatus,
  RelationshipStatusResponse,
  AllyListItem,
  PaginatedAllyList,
  ProfileRelationshipSummary,
  AdminRole,
  Permission,
  AdminMeResponse,
  DashboardKpis,
  TimeSeriesPoint,
  DashboardCharts,
  AdminListItem,
  RolePermissionRow,
  AdminActivityLogRow,
  PaginatedActivityLog,
  AdminUserListItem,
  AdminUserDetail,
  PaginatedUserList,
  ReportStatus,
  AdminReportListItem,
  PaginatedReportList,
  ReportStatusCounts,
  GlobalSearchResult,
  SystemSettings,
  OtpStatus,
  RegisterResponse,
  PendingVerificationItem,
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
import * as moderation from './routes/moderation';
import * as match from './routes/match';
import * as follow from './routes/follow';
import * as admin from './routes/admin';
import type { ListUsersQuery, ListReportsQuery } from './routes/admin';
export type { ListUsersQuery, ListReportsQuery };

export const apiClient = {
  // ─── Auth ───────────────────────────────────────────────────────────────
  login: auth.login,
  register: auth.register,
  logout: auth.logout,
  forgotPassword: auth.forgotPassword,
  resetPassword: auth.resetPassword,
  changePassword: auth.changePassword,
  deleteAccount: auth.deleteAccount,
  getSession: auth.getSession,
  setAccessToken: auth.setAccessToken,
  getAccessToken: auth.getAccessToken,
  getEmailStatus: auth.getEmailStatus,
  confirmEmail: auth.confirmEmail,
  // OTP
  sendOtp: auth.sendOtp,
  verifyOtp: auth.verifyOtp,
  resendOtp: auth.resendOtp,
  getOtpStatus: auth.getOtpStatus,
  uploadStudentId: auth.uploadStudentId,
  cancelRegistration: auth.cancelRegistration,

  // ─── Profiles ───────────────────────────────────────────────────────────
  getMyProfile: profiles.getMyProfile,
  getProfile: profiles.getProfile,
  getProfileRelationship: profiles.getProfileRelationship,
  listProfiles: profiles.listProfiles,
  getProfilesByIds: profiles.getProfilesByIds,
  updateProfile: profiles.updateProfile,
  deleteProfile: profiles.deleteProfile,
  checkUsername: profiles.checkUsername,

  // ─── Lookups ─────────────────────────────────────────────────────────────
  getLookups: lookups.getLookups,

  // ─── Interactions (Allies) ─────────────────────────────────────────────────
  listMyInteractions: interactions.listMyInteractions,
  listIncomingInteractions: interactions.listIncomingInteractions,
  sendConnectionRequest: interactions.sendConnectionRequest,
  acceptConnection: interactions.acceptConnection,
  rejectConnection: interactions.rejectConnection,
  getConnectionStatus: interactions.getConnectionStatus,
  cancelConnectionRequest: interactions.cancelConnectionRequest,
  removeAlly: interactions.removeAlly,
  getRelationshipStatus: interactions.getRelationshipStatus,
  listAllies: interactions.listAllies,
  getAlliesCount: interactions.getAlliesCount,

  // ─── Follow ──────────────────────────────────────────────────────────────
  followUser: follow.followUser,
  unfollowUser: follow.unfollowUser,
  getFollowStatus: follow.getFollowStatus,
  getFollowCounts: follow.getFollowCounts,
  listFollowers: follow.listFollowers,
  listFollowing: follow.listFollowing,

  // ─── Admin ───────────────────────────────────────────────────────────────
  getAdminMe: admin.getAdminMe,
  getDashboardKpis: admin.getDashboardKpis,
  getDashboardCharts: admin.getDashboardCharts,
  listAdmins: admin.listAdmins,
  setUserRole: admin.setUserRole,
  listRolePermissions: admin.listRolePermissions,
  setRolePermission: admin.setRolePermission,
  listActivityLog: admin.listActivityLog,

  // ─── Admin: User Management ─────────────────────────────────────────────
  adminListUsers: admin.listUsers,
  adminGetUserDetail: admin.getUserDetail,
  adminUpdateUser: admin.updateUser,
  adminBanUser: admin.banUser,
  adminUnbanUser: admin.unbanUser,
  adminSuspendUser: admin.suspendUser,
  adminUnsuspendUser: admin.unsuspendUser,
  adminVerifyUser: admin.verifyUser,
  adminUnverifyUser: admin.unverifyUser,
  adminForceLogoutUser: admin.forceLogoutUser,
  adminResetUserPassword: admin.resetUserPassword,
  adminDeleteUser: admin.deleteUser,
  // Student verification
  adminListPendingVerifications: admin.listPendingVerifications,
  adminApproveStudentVerification: admin.approveStudentVerification,
  adminRejectStudentVerification: admin.rejectStudentVerification,

  // ─── Admin: Reports Management ──────────────────────────────────────────
  adminListReports: admin.listReports,
  adminGetReportStatusCounts: admin.getReportStatusCounts,
  adminGetReport: admin.getReport,
  adminSetReportStatus: admin.setReportStatus,
  adminSetReportNotes: admin.setReportNotes,
  adminWarnReportedUser: admin.warnReportedUser,
  adminBanReportedUser: admin.banReportedUser,
  adminSuspendReportedUser: admin.suspendReportedUser,

  // ─── Admin: Global Search ────────────────────────────────────────────────
  adminSearch: admin.search,

  // ─── Admin: Settings ─────────────────────────────────────────────────────
  adminGetSettings: admin.getSettings,
  adminUpdateSettings: admin.updateSettings,

  // ─── Admin: Preset Avatars ───────────────────────────────────────────────
  adminListPresetAvatars: admin.adminListPresetAvatars,
  adminUploadPresetAvatar: admin.adminUploadPresetAvatar,
  adminDeletePresetAvatar: admin.adminDeletePresetAvatar,

  // ─── Conversations ───────────────────────────────────────────────────────
  listConversations: conversations.listConversations,
  getConversation: conversations.getConversation,
  hideConversation: conversations.hideConversation,
  clearConversation: conversations.clearConversation,
  unhideConversation: conversations.unhideConversation,
  getOrCreateConversation: conversations.getOrCreateConversation,
  markConversationRead: conversations.markConversationRead,
  findConversationWithUser: conversations.findConversationWithUser,
  listMyConversationMemberships: conversations.listMyConversationMemberships,
  updateIcebreakers: conversations.updateIcebreakers,
  getIcebreakersEnabled: conversations.getIcebreakersEnabled,

  // ─── Messages ────────────────────────────────────────────────────────────
  listMessages: messages.listMessages,
  sendMessage: messages.sendMessage,
  setMessageReaction: messages.setMessageReaction,
  deleteMessage: messages.deleteMessage,

  // ─── Notifications ───────────────────────────────────────────────────────
  listNotifications: notifications.listNotifications,
  listFriendRequestNotifications: notifications.listFriendRequestNotifications,
  markNotificationRead: notifications.markNotificationRead,
  markAllNotificationsRead: notifications.markAllNotificationsRead,
  deleteAllNotifications: notifications.deleteAllNotifications,

  // ─── Media ───────────────────────────────────────────────────────────────────
  getPresetAvatars: media.getPresetAvatars,
  uploadAvatarMedia: media.uploadAvatarMedia,
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

  // ─── Moderation ──────────────────────────────────────────────────────────
  blockUser: moderation.blockUser,
  reportUser: moderation.reportUser,
  unblockUser: moderation.unblockUser,
  listBlockedUsers: moderation.listBlockedUsers,

  // ─── Matchmaking ─────────────────────────────────────────────────────────
  joinMatchQueue: match.joinQueue,
  leaveMatchQueue: match.leaveQueue,
  getMatchmakingStatus: match.getMatchmakingStatus,
  acceptMatch: match.acceptMatch,
  declineMatch: match.declineMatch,
  endMatch: match.endMatch,
  getMatchReveal: match.getMatchReveal,
  getMatchTimeline: match.getMatchTimeline,
};