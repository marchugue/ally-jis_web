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
  status?: 'all' | 'active' | 'banned' | 'suspended';
  department?: string;
  sortBy?: 'created_at' | 'full_name' | 'username' | 'last_seen_at';
  sortDir?: 'asc' | 'desc';
  cursor?: string | null;
}

function buildQuery(params: Record<string, string | null | undefined>): string {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(v as string)}`)
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

// ─── Reports Management ─────────────────────────────────────────────────

export interface ListReportsQuery {
  status?: ReportStatus | 'all';
  categoryId?: string;
  cursor?: string | null;
}

export function listReports(params: ListReportsQuery) {
  return request<PaginatedReportList>(`/admin/reports${buildQuery({ ...params })}`);
}

export function getReportStatusCounts() {
  return request<ReportStatusCounts>('/admin/reports/status-counts');
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
