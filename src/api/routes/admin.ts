// src/api/routes/admin.ts

import { request } from '../http';
import type {
  AdminListItem,
  AdminMeResponse,
  AdminReportListItem,
  AdminUserDetail,
  DashboardCharts,
  DashboardKpis,
  GlobalSearchResult,
  PaginatedActivityLog,
  PaginatedReportList,
  PaginatedUserList,
  ReportStatus,
  ReportStatusCounts,
  RolePermissionRow,
  SystemSettings,
} from '../types';

export function getAdminMe() {
  return request<AdminMeResponse>('/admin/me');
}

export function getDashboardKpis() {
  return request<DashboardKpis>('/admin/dashboard/kpis');
}

export function getDashboardCharts() {
  return request<DashboardCharts>('/admin/dashboard/charts');
}

export function listAdmins() {
  return request<AdminListItem[]>('/admin/admins');
}

export function setUserRole(userId: string, role: string) {
  return request<void>(`/admin/admins/${userId}/role`, { method: 'POST', body: { role } });
}

export function listRolePermissions() {
  return request<RolePermissionRow[]>('/admin/permissions');
}

export function setRolePermission(role: string, permission: string, granted: boolean) {
  return request<void>('/admin/permissions', { method: 'PUT', body: { role, permission, granted } });
}

export function listActivityLog(cursor?: string | null) {
  const qs = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
  return request<PaginatedActivityLog>(`/admin/activity-log${qs}`);
}

// ─── User Management ────────────────────────────────────────────────────

export interface ListUsersQuery {
  search?: string;
  status?: 'all' | 'active' | 'banned' | 'suspended' | 'pending' | 'verified';
  department?: string;
  sortBy?: 'created_at' | 'full_name' | 'username' | 'last_seen_at';
  sortDir?: 'asc' | 'desc';
  cursor?: string | null;
  limit?: number;
}

function buildQuery(params: Record<string, string | number | null | undefined>): string {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&');
  return qs ? `?${qs}` : '';
}

export function listUsers(params: ListUsersQuery) {
  return request<PaginatedUserList>(`/admin/users${buildQuery({ ...params })}`);
}

export function getUserDetail(userId: string) {
  return request<AdminUserDetail>(`/admin/users/${userId}`);
}

export function updateUser(userId: string, fields: Record<string, unknown>) {
  return request<void>(`/admin/users/${userId}`, { method: 'PATCH', body: fields });
}

export function banUser(userId: string) {
  return request<void>(`/admin/users/${userId}/ban`, { method: 'POST' });
}

export function unbanUser(userId: string) {
  return request<void>(`/admin/users/${userId}/unban`, { method: 'POST' });
}

export function suspendUser(userId: string, until?: string | null) {
  return request<void>(`/admin/users/${userId}/suspend`, { method: 'POST', body: { until } });
}

export function unsuspendUser(userId: string) {
  return request<void>(`/admin/users/${userId}/unsuspend`, { method: 'POST' });
}

export function verifyUser(userId: string) {
  return request<void>(`/admin/users/${userId}/verify`, { method: 'POST' });
}

export function unverifyUser(userId: string) {
  return request<void>(`/admin/users/${userId}/unverify`, { method: 'POST' });
}

export function forceLogoutUser(userId: string) {
  return request<void>(`/admin/users/${userId}/force-logout`, { method: 'POST' });
}

export function resetUserPassword(userId: string) {
  return request<void>(`/admin/users/${userId}/reset-password`, { method: 'POST' });
}

export function deleteUser(userId: string) {
  return request<void>(`/admin/users/${userId}`, { method: 'DELETE' });
}

// ─── Student Verification ────────────────────────────────────────────────

import type { PendingVerificationItem } from '../types';

export function listPendingVerifications() {
  return request<PendingVerificationItem[]>('/admin/users/pending-verifications');
}

export function approveStudentVerification(userId: string) {
  return request<void>(`/admin/users/${userId}/approve-verification`, { method: 'POST' });
}

export function rejectStudentVerification(userId: string, reason?: string) {
  return request<void>(`/admin/users/${userId}/reject-verification`, { method: 'POST', body: { reason } });
}


// ─── Reports Management ─────────────────────────────────────────────────

export interface ListReportsQuery {
  status?: ReportStatus | 'all';
  categoryId?: string;
  cursor?: string | null;
  targetType?: 'all' | 'post' | 'user' | 'message';
  assignedTo?: string;
}

export function listReports(params: ListReportsQuery) {
  return request<PaginatedReportList>(`/admin/reports${buildQuery({ ...params })}`);
}

export function getReportStatusCounts(assignedTo?: string) {
  return request<ReportStatusCounts>(`/admin/reports/status-counts${assignedTo ? `?assignedTo=${encodeURIComponent(assignedTo)}` : ''}`);
}

export function getReport(reportId: string) {
  return request<AdminReportListItem>(`/admin/reports/${reportId}`);
}

export function setReportStatus(reportId: string, status: ReportStatus, notes?: string) {
  return request<void>(`/admin/reports/${reportId}/status`, { method: 'POST', body: { status, notes } });
}

export function setReportNotes(reportId: string, notes: string) {
  return request<void>(`/admin/reports/${reportId}/notes`, { method: 'PUT', body: { notes } });
}

export function warnReportedUser(reportId: string, message: string) {
  return request<void>(`/admin/reports/${reportId}/warn`, { method: 'POST', body: { message } });
}

export function banReportedUser(reportId: string) {
  return request<void>(`/admin/reports/${reportId}/ban`, { method: 'POST' });
}

export function suspendReportedUser(reportId: string, until?: string | null) {
  return request<void>(`/admin/reports/${reportId}/suspend`, { method: 'POST', body: { until } });
}

export function deleteReportedPost(reportId: string, postId?: string) {
  return request<{ success: boolean }>(`/admin/reports/${reportId}/post`, { method: 'DELETE', body: { postId } });
}

export function removeReportedMessage(reportId: string) {
  return request<{ success: boolean }>(`/admin/reports/${reportId}/remove-message`, { method: 'POST' });
}


export interface StaffModerator {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  role: string;
  email: string;
}

export function listModerators() {
  return request<StaffModerator[]>('/admin/reports/moderators');
}

export function assignModerator(reportId: string, moderatorId: string) {
  return request<AdminReportListItem>(`/admin/reports/${reportId}/assign`, {
    method: 'POST',
    body: { moderatorId },
  });
}

export function verifyReport(reportId: string, payload: { findings: string; recommendedAction: string; attachmentUrl?: string | null }) {
  return request<AdminReportListItem>(`/admin/reports/${reportId}/verify`, {
    method: 'POST',
    body: payload,
  });
}

export function uploadFindingAttachment(file: File, reportId?: string) {
  const formData = new FormData();
  formData.append('file', file);
  const path = reportId ? `/admin/reports/${reportId}/attachment` : '/admin/reports/upload-finding';
  return request<{ url: string; originalName: string; mimetype: string }>(path, {
    method: 'POST',
    body: formData,
  });
}

export function executeReportAction(
  reportId: string,
  payload: {
    actionType: string;
    message?: string;
    suspendDays?: string | number;
    notes?: string;
  }
) {
  return request<AdminReportListItem>(`/admin/reports/${reportId}/action`, {
    method: 'POST',
    body: payload,
  });
}

export function removeReportedMedia(reportId: string) {
  return request<{ success: boolean }>(`/admin/reports/${reportId}/remove-media`, { method: 'POST' });
}

// ─── Global Search ───────────────────────────────────────────────────────

export function search(q: string) {
  return request<GlobalSearchResult>(`/admin/search?q=${encodeURIComponent(q)}`);
}

// ─── Settings ────────────────────────────────────────────────────────────

export function getSettings() {
  return request<SystemSettings>('/admin/settings');
}

export function updateSettings(updates: Partial<SystemSettings>) {
  return request<void>('/admin/settings', { method: 'PUT', body: updates });
}

// ─── Preset Avatar Management ─────────────────────────────────────────────

import type { PresetAvatarListResponse, PresetAvatarRow } from '../types';

export function adminListPresetAvatars() {
  return request<PresetAvatarListResponse>('/admin/avatars/presets');
}

export function adminUploadPresetAvatar(file: File, label?: string) {
  const formData = new FormData();
  formData.append('file', file);
  if (label) formData.append('label', label);
  return request<{ avatar: PresetAvatarRow }>('/admin/avatars/presets', {
    method: 'POST',
    body: formData,
  });
}

export function adminDeletePresetAvatar(id: string) {
  return request<void>(`/admin/avatars/presets/${id}`, { method: 'DELETE' });
}
