import { cn } from '@/lib/utils';
import { formatDistanceToNowStrict } from 'date-fns';
import { useAdminMe } from '@/hooks/useAdminMe';
import { useAuth } from '@/context/AuthContext';
import { getSocket } from '@/lib/socket';
// src/pages/admin/AdminReportsPage.tsx

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { createPortal } from 'react-dom';
import {
  Loader2,
  Search,
  UserCheck,
  UserX,
  Ban,
  Clock,
  ShieldAlert,
  Flag,
  User,
  CheckCircle2,
  FileText,
  Trash2,
  ExternalLink,
  MessageSquare,
  Heart,
  ListFilter,
  Eye,
  X,
  Copy,
  AlertTriangle,
  RotateCw,
  RefreshCw,
  CreditCard,
  ChevronDown,
  Check,
  ImageOff,
  MessageSquareX,
  Maximize2,
  Layers,
  GraduationCap,
  Building,
  Mail,
  Calendar,
  Shield,
  ArrowRight,
  ChevronRight,
  Globe2,
  Users,
  MessageCircle,
  Upload,
  Paperclip,
  FileUp
} from 'lucide-react';
import { apiClient } from '@/api/client';
import type { AdminReportListItem, ReportStatus, ReportStatusCounts, AdminUserDetail } from '@/api/client';
import { notify } from '@/components/ui/sonner';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AvatarDisplay } from '@/components/ally/AvatarDisplay';

const STATUS_TABS: { value: ReportStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Reports' },
  { value: 'pending', label: 'Pending' },
  { value: 'reviewing', label: 'In Review' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'rejected', label: 'Rejected' },
];

type TargetFilter = 'all' | 'post' | 'user' | 'message';

const TARGET_FILTERS: { value: TargetFilter; label: string; icon: any }[] = [
  { value: 'all', label: 'All Types', icon: ListFilter },
  { value: 'post', label: 'Post Reports', icon: FileText },
  { value: 'message', label: 'Message Reports', icon: MessageSquare },
  { value: 'user', label: 'User Reports', icon: User },
];

type ReportKind = 'post' | 'message' | 'user';

function getReportKind(r: AdminReportListItem): ReportKind {
  if (r.message_id || r.message) return 'message';
  if (r.post_id || r.post) return 'post';
  return 'user';
}

/** Strips the internal `[POST:..]` / `[MSG:..]` reference tag so only the human text remains. */
function stripReferenceTag(notes: string | null | undefined): string {
  return (notes ?? '').replace(/^\s*\[(?:POST|MSG):[a-f0-9-]+\]\s*/i, '');
}

const STATUS_COLORS: Record<ReportStatus, string> = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border-amber-300 dark:border-amber-500/30',
  reviewing: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300 border-blue-300 dark:border-blue-500/30',
  resolved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30',
  rejected: 'bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-white/60 border-gray-200 dark:border-white/10',
};

const WARNING_TEMPLATES = [
  'Your post violates our community standards regarding harassment and bullying.',
  'Your content was removed due to inappropriate or explicit material.',
  'Your post contains hate speech or derogatory remarks, which are strictly prohibited.',
  'Your post was flagged for spam or misleading information.',
];

function getReportedDisplayName(r: AdminReportListItem): string {
  if (r.reported_name && r.reported_name.toLowerCase() !== 'anonymous' && r.reported_name.toLowerCase() !== 'anonymous peer') {
    return r.reported_name;
  }
  if (r.reported_username && r.reported_username.toLowerCase() !== 'anonymous') {
    return `@${r.reported_username}`;
  }
  if (r.reported_email) {
    return r.reported_email.split('@')[0];
  }
  return 'Reported Account';
}

function getReporterDisplayName(r: AdminReportListItem): string {
  if (r.reporter_name && r.reporter_name.toLowerCase() !== 'anonymous' && r.reporter_name.toLowerCase() !== 'anonymous peer') {
    return r.reporter_name;
  }
  if (r.reporter_username && r.reporter_username.toLowerCase() !== 'anonymous') {
    return `@${r.reporter_username}`;
  }
  if (r.reporter_email) {
    return r.reporter_email.split('@')[0];
  }
  return 'Student Reporter';
}

function getStudentAcademicInfo(detail: AdminUserDetail | null, r: AdminReportListItem): string {
  const parts: string[] = [];
  if (detail?.department) parts.push(detail.department);
  if (detail?.course) parts.push(detail.course);
  if (detail?.year_level) parts.push(`Year ${detail.year_level}`);
  if (parts.length > 0) return parts.join(' · ');
  return detail?.email_type === 'chmsu' ? 'CHMSU Verified Student' : 'Student Account';
}

export default function AdminReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = (searchParams.get('status') as ReportStatus | 'all') || 'all';
  const initialTarget = (searchParams.get('target') as TargetFilter) || 'all';

  const [status, setStatus] = useState<ReportStatus | 'all'>(initialStatus);
  const [targetType, setTargetType] = useState<TargetFilter>(initialTarget);
  const [reports, setReports] = useState<AdminReportListItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [counts, setCounts] = useState<ReportStatusCounts | null>(null);
  const [selected, setSelected] = useState<AdminReportListItem | null>(null);
  const [assignTargetReport, setAssignTargetReport] = useState<AdminReportListItem | null>(null);
  const { role } = useAdminMe();
  const { user } = useAuth();
  const isModerator = role === 'moderator';
  const isAdmin = role === 'admin' || role === 'super_admin';
  const isSuperAdmin = role === 'super_admin';
  const canAssign = isAdmin;

  const load = useCallback((statusToUse = status, targetToUse = targetType) => {
    setLoading(true);
    setLoadError(null);
    const assignedParam = isModerator && user?.id ? user.id : undefined;
    apiClient
      .adminListReports({ status: statusToUse, targetType: targetToUse, cursor: null, assignedTo: assignedParam })
      .then((res) => {
        // Double-check client-side filter if moderator
        const items = isModerator && user?.id
          ? res.items.filter((r) => r.reviewed_by === user.id)
          : res.items;
        setReports(items);
        setSelected((curr) => {
          if (curr) {
            const updated = res.items.find((i) => i.id === curr.id);
            return updated || curr;
          }
          const targetId = searchParams.get('id') || searchParams.get('reportId');
          if (targetId) {
            return res.items.find((i) => i.id === targetId) || null;
          }
          return null;
        });
      })
      .catch((err: any) => {
        console.error('Failed to load reports:', err);
        setLoadError(err.message || 'Failed to load reports');
        setReports((prev) => prev ?? []);
        notify.error('Failed to load reports', err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [status, targetType, searchParams, isModerator, user?.id]);

  useEffect(() => {
    load(status, targetType);
  }, [load, status, targetType]);

  const loadCounts = useCallback(() => {
    const assignedParam = isModerator && user?.id ? user.id : undefined;
    apiClient.adminGetReportStatusCounts(assignedParam).then(setCounts).catch(() => setCounts(null));
  }, [isModerator, user?.id]);

  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  // Realtime updates via socket
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.emit('reports:subscribe');

    const handleUpdate = () => {
      load(status, targetType);
      loadCounts();
    };

    socket.on('connect', handleUpdate);
    socket.on('reconnect', handleUpdate);
    socket.on('report:created', handleUpdate);
    socket.on('report:assigned', handleUpdate);
    socket.on('report:verified', handleUpdate);
    socket.on('report:action_taken', handleUpdate);
    socket.on('report:updated', handleUpdate);
    socket.on('report:appeal_submitted', handleUpdate);

    return () => {
      socket.off('connect', handleUpdate);
      socket.off('reconnect', handleUpdate);
      socket.off('report:created', handleUpdate);
      socket.off('report:assigned', handleUpdate);
      socket.off('report:verified', handleUpdate);
      socket.off('report:action_taken', handleUpdate);
      socket.off('report:updated', handleUpdate);
      socket.off('report:appeal_submitted', handleUpdate);
    };
  }, [load, loadCounts, status, targetType]);

  // Window focus & soft interval fallback (guarantees real-time admin sync without manual refresh)
  useEffect(() => {
    const onFocus = () => {
      load(status, targetType);
      loadCounts();
    };
    window.addEventListener('focus', onFocus);
    const interval = setInterval(() => {
      load(status, targetType);
      loadCounts();
    }, 5000);

    return () => {
      window.removeEventListener('focus', onFocus);
      clearInterval(interval);
    };
  }, [load, loadCounts, status, targetType]);

  const handleTargetChange = (newTarget: TargetFilter) => {
    setTargetType(newTarget);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (newTarget === 'all') next.delete('target');
      else next.set('target', newTarget);
      return next;
    });
  };

  const handleStatusChange = (newStatus: ReportStatus | 'all') => {
    setStatus(newStatus);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (newStatus === 'all') next.delete('status');
      else next.set('status', newStatus);
      return next;
    });
  };

  return (
    <div className="space-y-6 w-full pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-fraunces text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            Moderation & Flagged Content
          </h1>
          <p className="text-xs text-gray-400 dark:text-white/40 mt-1">
            {counts ? `${counts.pending} pending moderation · ${counts.reviewing} currently under review` : 'Loading moderation status…'}
          </p>
        </div>
        {isModerator && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 text-blue-700 dark:text-blue-300 text-xs font-semibold self-start sm:self-auto">
            <UserCheck size={13} />
            <span>Moderator View: Showing tickets assigned to you</span>
          </div>
        )}
      </div>

      {/* Filter Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Target Type Filter (All / Post Reports / User Reports) */}
        <div className="flex items-center gap-1.5 p-1 bg-gray-100/80 dark:bg-white/5 rounded-2xl border border-gray-200/60 dark:border-white/5 w-fit">
          {TARGET_FILTERS.map((f) => {
            const Icon = f.icon;
            const active = targetType === f.value;
            return (
              <button
                key={f.value}
                onClick={() => handleTargetChange(f.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${active
                    ? 'bg-white dark:bg-white/15 text-gray-900 dark:text-white shadow-xs'
                    : 'text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white'
                  }`}
              >
                <Icon size={13} className={active ? 'text-[#1A6B3C] dark:text-emerald-400' : ''} />
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {STATUS_TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => handleStatusChange(t.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${status === t.value
                  ? 'bg-[#1A6B3C] dark:bg-emerald-600 text-white shadow-sm'
                  : 'bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/10'
                }`}
            >
              {t.label} {t.value !== 'all' && counts ? `(${counts[t.value as ReportStatus]})` : ''}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-[#161D19] rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden">
        {loading && !reports ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-[#1A6B3C] dark:text-emerald-400" size={24} />
          </div>
        ) : loadError && (!reports || reports.length === 0) ? (
          <div className="text-center py-16 px-4">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-2 opacity-80" />
            <p className="text-sm font-bold text-gray-800 dark:text-white">Could not load reports</p>
            <p className="text-xs text-gray-400 dark:text-white/40 mt-1 mb-4">{loadError}</p>
            <button
              onClick={() => load(status, targetType)}
              className="px-4 py-2 rounded-xl bg-[#1A6B3C] dark:bg-emerald-600 text-white text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer inline-flex items-center gap-1.5"
            >
              <RefreshCw size={12} /> Retry
            </button>
          </div>
        ) : !reports || reports.length === 0 ? (
          <div className="text-center py-16 px-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2 opacity-80" />
            <p className="text-sm font-bold text-gray-800 dark:text-white">
              {isModerator ? 'No Reports Assigned to You' : 'All Flagged Content Handled'}
            </p>
            <p className="text-xs text-gray-400 dark:text-white/40 mt-1">
              {isModerator
                ? 'You currently have no tickets assigned to your queue.'
                : 'There are no reported items matching this filter.'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02] text-xs text-gray-400 dark:text-white/40 uppercase tracking-wider">
                    <th className="px-5 py-3 font-semibold">Type</th>
                    <th className="px-5 py-3 font-semibold">Reported Target</th>
                    <th className="px-5 py-3 font-semibold">Reporter</th>
                    <th className="px-5 py-3 font-semibold">Violation Reason</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Submitted</th>
                    {canAssign && <th className="px-5 py-3 font-semibold text-right">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {reports.map((r) => {
                    const kind = getReportKind(r);
                    const isPostReport = kind === 'post';
                    const isMessageReport = kind === 'message';
                    return (
                      <tr
                        key={r.id}
                        onClick={() => setSelected(r)}
                        className="cursor-pointer hover:bg-gray-50/80 dark:hover:bg-white/[0.02] transition-colors"
                      >
                        {/* Type Badge */}
                        <td className="px-5 py-3.5">
                          {isPostReport ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40">
                              <FileText size={11} /> Post
                            </span>
                          ) : isMessageReport ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
                              <MessageSquare size={11} /> Message
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40">
                              <User size={11} /> Account
                            </span>
                          )}
                        </td>

                        {/* Target Info */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <AvatarDisplay
                              src={r.reported_avatar}
                              name={getReportedDisplayName(r)}
                              className="w-8 h-8 rounded-full border border-gray-200 dark:border-white/10 shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 dark:text-white truncate">
                                {getReportedDisplayName(r)}
                                {r.reported_username && r.reported_username.toLowerCase() !== 'anonymous' && (
                                  <span className="text-xs text-gray-400 font-normal ml-1">@{r.reported_username}</span>
                                )}
                              </p>
                              {r.reported_email && (
                                <p className="text-[11px] text-gray-400 dark:text-white/40 truncate">{r.reported_email}</p>
                              )}
                              {isPostReport && (
                                <p className="text-[11px] text-gray-400 dark:text-white/40 truncate max-w-xs mt-0.5">
                                  {r.post?.is_deleted ? (
                                    <span className="text-red-500 dark:text-red-400 font-medium">[Post Deleted]</span>
                                  ) : r.post?.content ? (
                                    `"${r.post.content}"`
                                  ) : r.post?.media && r.post.media.length > 0 ? (
                                    `[Post with ${r.post.media.length} image(s)]`
                                  ) : (
                                    'Reported Post Content'
                                  )}
                                </p>
                              )}
                              {isMessageReport && (
                                <p className="text-[11px] text-gray-400 dark:text-white/40 truncate max-w-xs mt-0.5">
                                  {r.message?.is_deleted ? (
                                    <span className="text-red-500 dark:text-red-400 font-medium">[Message Deleted]</span>
                                  ) : r.message?.content ? (
                                    `"${r.message.content}"`
                                  ) : r.message?.image_url ? (
                                    '[Image message]'
                                  ) : (
                                    'Reported Message'
                                  )}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Reporter */}
                        <td className="px-5 py-3.5 text-gray-700 dark:text-white/80">
                          <div className="flex items-center gap-2">
                            <AvatarDisplay
                              src={r.reporter_avatar}
                              name={getReporterDisplayName(r)}
                              className="w-7 h-7 rounded-full border border-gray-200 dark:border-white/10 shrink-0 text-xs"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-semibold truncate text-gray-900 dark:text-white">
                                {getReporterDisplayName(r)}
                              </p>
                              {r.reporter_email ? (
                                <p className="text-[10px] text-gray-400 dark:text-white/40 truncate">{r.reporter_email}</p>
                              ) : r.reporter_username && r.reporter_username.toLowerCase() !== 'anonymous' ? (
                                <p className="text-[10px] text-gray-400 dark:text-white/40">@{r.reporter_username}</p>
                              ) : null}
                            </div>
                          </div>
                        </td>

                        {/* Violation */}
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-gray-800 dark:text-white/90 text-xs">{r.violation_label}</p>
                          <p className="text-[11px] text-gray-400 dark:text-white/40">{r.category_label}</p>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-3.5">
                          <Badge className={`border text-[11px] capitalize ${STATUS_COLORS[r.status]}`}>
                            {r.status}
                          </Badge>
                        </td>

                        {/* Submitted */}
                        <td className="px-5 py-3.5 text-xs text-gray-400 dark:text-white/40">
                          {new Date(r.created_at).toLocaleDateString()}
                        </td>

                        {/* Action Column: Assign (Admin Side) */}
                        {canAssign && (
                          <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => setAssignTargetReport(r)}
                              className={cn(
                                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-2xs',
                                r.reviewed_by
                                  ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800/40'
                                  : 'bg-[#1A6B3C] hover:bg-[#14532D] text-white shadow-xs'
                              )}
                              title={r.reviewed_by ? `Assigned to ${r.reviewed_by_name || 'Staff'}. Click to reassign.` : 'Assign moderator'}
                            >
                              <UserCheck size={12} />
                              <span>{r.reviewed_by ? (r.reviewed_by_name ? `Assigned: ${r.reviewed_by_name.split(' ')[0]}` : 'Assigned') : 'Assign'}</span>
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="block sm:hidden divide-y divide-gray-100 dark:divide-white/5">
              {reports.map((r) => {
                const kind = getReportKind(r);
                const isPostReport = kind === 'post';
                const isMessageReport = kind === 'message';
                return (
                  <div
                    key={r.id}
                    onClick={() => setSelected(r)}
                    className="p-4 space-y-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        {isPostReport ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40 shrink-0">
                            <FileText size={10} /> Post
                          </span>
                        ) : isMessageReport ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40 shrink-0">
                            <MessageSquare size={10} /> Message
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40 shrink-0">
                            <User size={10} /> User
                          </span>
                        )}
                        <AvatarDisplay
                          src={r.reported_avatar}
                          name={getReportedDisplayName(r)}
                          className="w-6 h-6 rounded-full shrink-0"
                        />
                        <span className="font-bold text-sm text-gray-900 dark:text-white truncate">
                          {getReportedDisplayName(r)}
                        </span>
                      </div>
                      <Badge className={`border text-[10px] capitalize shrink-0 ${STATUS_COLORS[r.status]}`}>
                        {r.status}
                      </Badge>
                    </div>

                    {isPostReport && r.post?.content && (
                      <p className="text-xs text-gray-600 dark:text-white/70 italic line-clamp-2 bg-gray-50 dark:bg-white/5 p-2 rounded-xl">
                        "{r.post.content}"
                      </p>
                    )}

                    {isMessageReport && r.message && (
                      <p className="text-xs text-gray-600 dark:text-white/70 italic line-clamp-2 bg-gray-50 dark:bg-white/5 p-2 rounded-xl">
                        {r.message.is_deleted ? '[Message deleted]' : r.message.content ? `"${r.message.content}"` : '[Image message]'}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-gray-400 dark:text-white/40">
                      <span>Reason: {r.violation_label}</span>
                      <span>{new Date(r.created_at).toLocaleDateString()}</span>
                    </div>

                    {canAssign && (
                      <div className="pt-2 border-t border-gray-100 dark:border-white/5 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                        <span className="text-[11px] text-gray-500 dark:text-white/50">
                          {r.reviewed_by ? `Assigned: ${r.reviewed_by_name || 'Staff'}` : 'Not assigned'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setAssignTargetReport(r)}
                          className={cn(
                            'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer',
                            r.reviewed_by
                              ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300'
                              : 'bg-[#1A6B3C] text-white hover:bg-[#14532D]'
                          )}
                        >
                          <UserCheck size={12} />
                          <span>{r.reviewed_by ? 'Reassign' : 'Assign'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <ReportDetailModal report={selected} onClose={() => setSelected(null)} onChanged={load} />
      <AssignModeratorModal
        report={assignTargetReport}
        isOpen={Boolean(assignTargetReport)}
        onClose={() => setAssignTargetReport(null)}
        onAssigned={() => {
          load();
          loadCounts();
        }}
      />
    </div>
  );
}


function MediaGrid({
  media,
  onMediaClick,
}: {
  media?: { id: string; url: string; position: number }[];
  onMediaClick?: (url: string) => void;
}) {
  if (!media || media.length === 0) return null;

  const sorted = [...media].sort((a, b) => a.position - b.position);

  if (sorted.some((m) => m.url === '[removed]')) {
    return (
      <div className="mt-3 p-4 rounded-xl bg-gray-100 dark:bg-[#1E293B] border border-gray-200 dark:border-white/10 text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400 font-jakarta italic">
          This photo was removed for violating community standards.
        </p>
      </div>
    );
  }

  if (sorted.length === 1) {
    return (
      <div
        onClick={() => onMediaClick?.(sorted[0].url)}
        className="mt-3 rounded-xl overflow-hidden border border-gray-100/80 dark:border-white/10 w-full bg-black/5 flex items-center justify-center cursor-pointer hover:opacity-95 transition-opacity"
      >
        <img src={sorted[0].url} alt="" className="w-full h-auto max-h-[550px] object-cover" />
      </div>
    );
  }

  if (sorted.length === 2) {
    return (
      <div className="mt-3 grid grid-cols-2 gap-1 rounded-xl overflow-hidden w-full border border-gray-100/80 dark:border-white/10">
        {sorted.map((m) => (
          <img
            key={m.id}
            src={m.url}
            alt=""
            onClick={() => onMediaClick?.(m.url)}
            className="w-full object-cover aspect-square cursor-pointer hover:opacity-95 transition-opacity"
          />
        ))}
      </div>
    );
  }

  if (sorted.length === 3) {
    return (
      <div className="mt-3 grid grid-cols-2 gap-1 rounded-xl overflow-hidden w-full border border-gray-100/80 dark:border-white/10">
        <img
          src={sorted[0].url}
          alt=""
          onClick={() => onMediaClick?.(sorted[0].url)}
          className="w-full object-cover row-span-2 h-full aspect-square cursor-pointer hover:opacity-95 transition-opacity"
        />
        <img
          src={sorted[1].url}
          alt=""
          onClick={() => onMediaClick?.(sorted[1].url)}
          className="w-full object-cover aspect-square cursor-pointer hover:opacity-95 transition-opacity"
        />
        <img
          src={sorted[2].url}
          alt=""
          onClick={() => onMediaClick?.(sorted[2].url)}
          className="w-full object-cover aspect-square cursor-pointer hover:opacity-95 transition-opacity"
        />
      </div>
    );
  }

  return (
    <div className="mt-3 grid grid-cols-2 gap-1 rounded-xl overflow-hidden w-full border border-gray-100/80 dark:border-white/10">
      {sorted.slice(0, 4).map((m) => (
        <img
          key={m.id}
          src={m.url}
          alt=""
          onClick={() => onMediaClick?.(m.url)}
          className="w-full object-cover aspect-square cursor-pointer hover:opacity-95 transition-opacity"
        />
      ))}
    </div>
  );
}


function AssignModeratorModal({
  report,
  isOpen,
  onClose,
  onAssigned,
}: {
  report: AdminReportListItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAssigned: () => void;
}) {
  const [moderators, setModerators] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!isOpen || !report) return;
    setLoading(true);
    setSearch('');
    apiClient
      .adminListModerators()
      .then((mods: any) => setModerators(mods || []))
      .catch((err: any) => {
        console.error('Failed to load moderators:', err);
        notify.error('Could not load moderators', err.message);
      })
      .finally(() => setLoading(false));
  }, [isOpen, report]);

  if (!isOpen || !report) return null;

  const filtered = moderators.filter((m) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (m.full_name && m.full_name.toLowerCase().includes(q)) ||
      (m.username && m.username.toLowerCase().includes(q)) ||
      (m.email && m.email.toLowerCase().includes(q))
    );
  });

  const handleAssign = async (moderatorId: string | null) => {
    setAssigningId(moderatorId || 'unassign');
    try {
      await apiClient.adminAssignReportModerator(report.id, moderatorId || 'unassign');
      if (moderatorId) {
        const mod = moderators.find((m) => m.id === moderatorId);
        notify.success('Moderator Assigned', `Case assigned to ${mod?.full_name || 'moderator'}. Status moved to Under Review.`);
      } else {
        notify.success('Assignment Removed', 'Report returned to unassigned pending queue.');
      }
      onAssigned();
      onClose();
    } catch (err: any) {
      notify.error('Failed to update assignment', err?.message);
    } finally {
      setAssigningId(null);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[10005] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-gray-900 dark:text-white font-jakarta"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-white/10 flex items-center justify-between gap-3">
          <div>
            <h3 className="font-fraunces text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <UserCheck size={18} className="text-[#1A6B3C] dark:text-emerald-400" />
              Assign Moderator
            </h3>
            <p className="text-xs text-gray-500 dark:text-white/50 mt-0.5">
              Docket #{report.id.slice(0, 8).toUpperCase()} • {report.violation_label}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-3.5 border-b border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02]">
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40" />
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search moderator by name or email..."
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/40 focus:outline-none focus:border-[#1A6B3C] dark:focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>

        {/* Moderator List */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-2">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <Loader2 size={22} className="animate-spin text-[#1A6B3C] dark:text-emerald-400 mb-2" />
              <p className="text-xs text-gray-400 dark:text-white/40">Loading staff moderators…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-xs text-gray-400 dark:text-white/40">
              {search.trim() ? `No moderators found matching "${search}"` : 'No moderators registered in system.'}
            </div>
          ) : (
            filtered.map((m) => {
              const isCurrent = report.reviewed_by === m.id;
              const isBusy = assigningId === m.id;
              return (
                <div
                  key={m.id}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                    isCurrent
                      ? 'bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/50'
                      : 'bg-white dark:bg-white/5 border-gray-200/80 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/[0.08]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <AvatarDisplay
                      src={m.avatar_url}
                      name={m.full_name || m.username}
                      className="w-9 h-9 rounded-full border border-gray-200 dark:border-white/15 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-xs text-gray-900 dark:text-white truncate">
                        {m.full_name}
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-white/50 truncate">
                        {m.username ? `@${m.username} · ` : ''}{m.email}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isCurrent ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 text-white shadow-2xs">
                        <Check size={12} /> Assigned
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={Boolean(assigningId)}
                        onClick={() => handleAssign(m.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#1A6B3C] hover:bg-[#15592F] text-white transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-2xs"
                      >
                        {isBusy ? <Loader2 size={12} className="animate-spin" /> : null}
                        <span>Assign</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer: Unassign Option */}
        {report.reviewed_by && (
          <div className="p-3 bg-gray-50 dark:bg-white/[0.02] border-t border-gray-100 dark:border-white/10 flex items-center justify-between">
            <span className="text-[11px] text-gray-500 dark:text-white/50">
              Current: {report.reviewed_by_name || 'Assigned Moderator'}
            </span>
            <button
              type="button"
              disabled={Boolean(assigningId)}
              onClick={() => handleAssign(null)}
              className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline cursor-pointer disabled:opacity-50"
            >
              {assigningId === 'unassign' ? 'Unassigning…' : 'Unassign Moderator'}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

function ReportDetailModal({
  report,
  onClose,
  onChanged,
}: {
  report: AdminReportListItem | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [studentDetail, setStudentDetail] = useState<AdminUserDetail | null>(null);
  const { role } = useAdminMe();
  const isAdmin = role === 'admin' || role === 'super_admin';
  const isModerator = role === 'moderator';
  const canReveal = Boolean(role && (isAdmin || isModerator));
  const [deletingPost, setDeletingPost] = useState(false);
  const [isContentExpanded, setIsContentExpanded] = useState(false);

  const handleDeleteReportedPost = async () => {
    if (!isAdmin) {
      notify.error('Access Denied', 'Only administrators have permission to delete posts.');
      return;
    }
    const targetPostId = report?.post_id || report?.post?.id;
    if (!targetPostId || !report) return;
    if (!window.confirm('Delete this reported post from feed? This action permanently removes it from the live student feed.')) return;
    setDeletingPost(true);
    try {
      await apiClient.adminDeleteReportedPost(report.id, targetPostId);
      notify.success('Post Deleted', 'The reported post has been removed from the feed.');
      onChanged();
      onClose();
    } catch (err: any) {
      notify.error('Failed to delete post', err.message);
    } finally {
      setDeletingPost(false);
    }
  };

  const handleFileSelected = (file: File) => {
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isImage && !isPdf) {
      notify.error('Invalid file type', 'Please upload an image (PNG, JPG, WEBP) or PDF file.');
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      notify.error('File too large', 'Attachment size must be under 25 MB.');
      return;
    }
    setFindingFile(file);
    if (isImage) {
      const reader = new FileReader();
      reader.onload = () => setFindingPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setFindingPreview(null);
    }
  };

  const [loadingStudent, setLoadingStudent] = useState(false);
  const [side, setSide] = useState<'front' | 'back'>('front');
  const [isFlipping, setIsFlipping] = useState(false);
  const [activeTab, setActiveTab] = useState<'id_card' | 'evidence'>('evidence');
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [moderators, setModerators] = useState<any[]>([]);
  const [selectedModeratorId, setSelectedModeratorId] = useState<string>('');
  const [assigningModerator, setAssigningModerator] = useState(false);
  const [findingsInput, setFindingsInput] = useState('');
  const [recommendedActionInput, setRecommendedActionInput] = useState('warn');
  const [verifyingModerator, setVerifyingModerator] = useState(false);

  // Moderator Findings Modal state
  const [findingsModalOpen, setFindingsModalOpen] = useState(false);
  const [findingText, setFindingText] = useState('');
  const [findingRecAction, setFindingRecAction] = useState('warn');
  const [findingFile, setFindingFile] = useState<File | null>(null);
  const [findingPreview, setFindingPreview] = useState<string | null>(null);
  const [findingExistingUrl, setFindingExistingUrl] = useState<string | null>(null);
  const [submittingFindings, setSubmittingFindings] = useState(false);

  // Admin View Details Modal state
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  // Action form state inside the single CTA action modal
  const [selectedAction, setSelectedAction] = useState<
    'resolve' | 'reviewing' | 'reject' | 'warn' | 'suspend' | 'ban' | 'delete_post' | 'remove_message' | 'remove_media'
  >('resolve');
  const [notes, setNotes] = useState('');
  const [warnMessage, setWarnMessage] = useState('');
  const [suspendDays, setSuspendDays] = useState('7');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!report) {
      setStudentDetail(null);
      return;
    }
    setNotes(report.internal_notes ?? '');
    setWarnMessage('');
    setSide('front');
    setCurrentPhotoIndex(0);
    setActionModalOpen(false);
    setFindingsModalOpen(false);
    setDetailsModalOpen(false);
    setPreviewImage(null);
    setSelectedAction('resolve');
    setSelectedModeratorId(report.reviewed_by || '');
    setFindingsInput(report.moderator_findings || '');
    setRecommendedActionInput(report.moderator_recommended_action || 'warn');
    setFindingText(report.moderator_findings || '');
    setFindingRecAction(report.moderator_recommended_action || 'warn');
    setFindingExistingUrl(report.moderator_attachment_url || null);
    setFindingFile(null);
    setFindingPreview(null);

    apiClient.adminListModerators?.()
      .then((mods: any) => setModerators(mods || []))
      .catch(() => { });

    const kind = getReportKind(report);
    const hasFlaggedContent = kind === 'post' || kind === 'message';
    // Default to evidence tab if the report has flagged content so it displays immediately on the first try!
    setActiveTab(hasFlaggedContent ? 'evidence' : 'id_card');

    if (report.reported_user_id) {
      setLoadingStudent(true);
      apiClient
        .adminGetUserDetail(report.reported_user_id)
        .then((detail) => {
          setStudentDetail(detail);
        })
        .catch((err) => {
          console.warn('Failed to load student detail', err);
          setStudentDetail(null);
        })
        .finally(() => setLoadingStudent(false));
    } else {
      setStudentDetail(null);
    }
  }, [report]);

  // Clean up pointer events & body scrolling
  const ensurePointerEvents = () => {
    setTimeout(() => {
      document.body.style.pointerEvents = '';
      document.body.style.overflow = '';
    }, 50);
  };

  useEffect(() => {
    if (report) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.pointerEvents = '';
    };
  }, [report]);

  // Flipping is ONLY for Student ID card, not for post evidence!
  const toggleFlip = (e?: React.MouseEvent) => {
    if (activeTab !== 'id_card') return;
    e?.preventDefault();
    e?.stopPropagation();
    setIsFlipping(true);
    setSide((s) => (s === 'front' ? 'back' : 'front'));
    setTimeout(() => setIsFlipping(false), 500);
  };

  // Keyboard navigation: Escape closes, Space or F toggles flip (only in id_card tab)
  useEffect(() => {
    if (!report) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable) {
        return;
      }

      if (e.key === 'Escape') {
        if (previewImage) {
          setPreviewImage(null);
        } else if (actionModalOpen) {
          setActionModalOpen(false);
        } else {
          onClose();
        }
      } else if ((e.key === 'f' || e.key === 'F' || e.key === ' ') && activeTab === 'id_card') {
        e.preventDefault();
        toggleFlip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [report, actionModalOpen, previewImage, side, activeTab, onClose]);

  if (!report) return null;

  const kind = getReportKind(report);
  const isPostReport = kind === 'post';
  const isMessageReport = kind === 'message';
  const post = report.post;
  const message = report.message;
  const reporterDetails = report.reporter_notes || stripReferenceTag(report.internal_notes);

  const frontIdUrl = studentDetail?.student_id_url;
  const backIdUrl = studentDetail?.student_id_back_url;
  const hasIdImages = Boolean(frontIdUrl || backIdUrl);
  const hasEvidence = isPostReport || isMessageReport;

  // Determine active image URL for "Open Original"
  let activeImageUrl: string | null = null;
  if (activeTab === 'id_card') {
    activeImageUrl = side === 'front' ? frontIdUrl || null : backIdUrl || null;
  } else if (activeTab === 'evidence') {
    if (isPostReport && post?.media && post.media.length > 0) {
      activeImageUrl = post.media[currentPhotoIndex]?.url || post.media[0].url;
    } else if (isMessageReport && message?.image_url) {
      activeImageUrl = message.image_url;
    }
  }

  // Handle single action execution
  const handleApplyAction = async () => {
    setBusy(true);
    try {
      // 1. If internal notes changed, update them
      if (notes !== (report.internal_notes ?? '')) {
        await apiClient.adminSetReportNotes(report.id, notes);
      }

      // 2. Perform selected moderation action
      if (selectedAction === 'resolve') {
        await apiClient.adminSetReportStatus(report.id, 'resolved', notes);
        notify.success('Report resolved', 'Investigation marked as resolved.');
      } else if (selectedAction === 'reviewing') {
        await apiClient.adminSetReportStatus(report.id, 'reviewing', notes);
        notify.success('Marked In Review', 'Report is now under active investigation.');
      } else if (selectedAction === 'reject') {
        await apiClient.adminSetReportStatus(report.id, 'rejected', notes);
        notify.success('Report rejected', 'Report dismissed as unwarranted or false.');
      } else if (selectedAction === 'warn') {
        if (!warnMessage.trim()) {
          notify.error('Warning message required', 'Please select a template or enter warning text.');
          setBusy(false);
          return;
        }
        await apiClient.adminWarnReportedUser(report.id, warnMessage.trim());
        await apiClient.adminSetReportStatus(report.id, 'resolved', notes);
        notify.success('Warning issued', 'Official warning sent to student and report resolved.');
      } else if (selectedAction === 'suspend') {
        let untilDate: string | null = null;
        if (suspendDays !== 'permanent') {
          const d = new Date();
          d.setDate(d.getDate() + Number(suspendDays));
          untilDate = d.toISOString();
        }
        await apiClient.adminSuspendReportedUser(report.id, untilDate);
        await apiClient.adminSetReportStatus(report.id, 'resolved', notes);
        notify.success(
          suspendDays === 'permanent' ? 'Account permanently suspended' : `Account suspended for ${suspendDays} days`,
          'Report resolved.'
        );
      } else if (selectedAction === 'ban') {
        await apiClient.adminBanReportedUser(report.id);
        await apiClient.adminSetReportStatus(report.id, 'resolved', notes);
        notify.success('Account permanently banned', 'User has been banned and report marked resolved.');
      } else if (selectedAction === 'delete_post') {
        const targetPostId = report.post_id || post?.id;
        if (targetPostId) {
          await apiClient.adminDeleteReportedPost(report.id, targetPostId);
          await apiClient.adminSetReportStatus(report.id, 'resolved', notes);
          notify.success('Post deleted from feed', 'Reported post removed and report resolved.');
        }
      } else if (selectedAction === 'remove_message') {
        await apiClient.adminRemoveReportedMessage(report.id);
        await apiClient.adminSetReportStatus(report.id, 'resolved', notes);
        notify.success('Message removed', 'The reported message has been replaced with the removed state.');
      } else if (selectedAction === 'remove_media') {
        await apiClient.adminRemoveReportedMedia(report.id);
        await apiClient.adminSetReportStatus(report.id, 'resolved', notes);
        notify.success('Media removed', 'The reported photo has been removed and replaced with guidelines notice.');
      }

      onChanged();
      setActionModalOpen(false);
      onClose();
    } catch (err: any) {
      notify.error('Action failed', err.message);
    } finally {
      setBusy(false);
      ensurePointerEvents();
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-gray-50 dark:bg-[#070A0F] text-gray-900 dark:text-white flex flex-col select-none overflow-hidden font-jakarta animate-in fade-in duration-200">
      {/* ── TOP HEADER BAR ── */}
      <header className="shrink-0 border-b border-gray-200 dark:border-white/10 bg-white/95 dark:bg-[#0C1118]/95 backdrop-blur-xl px-4 sm:px-6 py-3 z-30 shadow-xs dark:shadow-md">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Left Cluster: Report ID + Target Pill + Violation Badge + Category */}
          <div className="flex items-center gap-3 flex-wrap min-w-0">
            <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/15 text-gray-800 dark:text-white font-bold tracking-wider">
              #{report.id.slice(0, 8).toUpperCase()}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-50 dark:bg-red-500/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-500/30">
              <AlertTriangle size={12} /> {report.violation_label}
            </span>
            <span className="text-xs text-gray-500 dark:text-white/60 font-medium hidden sm:inline">
              {report.category_label}
            </span>
            <span className="text-xs text-gray-300 dark:text-white/40 hidden sm:inline">·</span>
            <span className="text-xs text-gray-400 dark:text-white/50 hidden sm:inline">
              Reported on {new Date(report.created_at).toLocaleDateString()} {new Date(report.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Right Cluster: Stage / Status Badge + ONE ONLY CTA Action Button + Close */}
          <div className="flex items-center gap-2.5 shrink-0 ml-auto">
            {/* Status Badge */}
            <Badge className={`border text-xs capitalize ${STATUS_COLORS[report.status]}`}>
              {report.status}
            </Badge>

            {/* ONE ONLY CTA ACTION BUTTON (ADMIN ONLY) */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => setActionModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1A6B3C] hover:bg-[#14532D] text-white font-bold text-xs shadow-lg shadow-emerald-950/40 border border-emerald-500/30 transition-all active:scale-95 cursor-pointer"
              >
                <ShieldAlert size={14} />
                <span>Take Action</span>
                <ChevronDown size={13} className="opacity-70" />
              </button>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-gray-700 dark:text-white transition-colors cursor-pointer"
              title="Close Full Screen (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* ── 2-COLUMN MAIN BODY: LEFT CONTENT | RIGHT INFORMATION ── */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden bg-gray-50 dark:bg-[#070A0F]">

        {/* ── LEFT COLUMN: THE CONTENT (~60%) ── */}
        <section className="flex-1 lg:w-7/12 xl:w-3/5 flex flex-col border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-white/10 min-h-0 bg-gray-100/60 dark:bg-[#080C14] overflow-hidden">
          {/* Content Viewport Stage */}
          <div className="flex-1 min-h-0 p-4 sm:p-6 flex flex-col items-center justify-center overflow-y-auto relative bg-gradient-to-b from-gray-100/60 to-gray-200/60 dark:from-[#080C14] dark:to-[#0A101C]">

            {/* ── THE TWO OPTIONS ONLY (Centered directly above post card / ID card) ── */}
            <div className="shrink-0 flex items-center justify-center w-full max-w-xl mb-4">
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-2xs backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => setActiveTab('id_card')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeTab === 'id_card'
                      ? 'bg-[#1A6B3C] text-white shadow-xs'
                      : 'text-gray-600 hover:text-gray-900 dark:text-white/60 dark:hover:text-white'
                    }`}
                >
                  <CreditCard size={13} />
                  <span>Student ID Card</span>
                  {hasIdImages && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 font-mono">
                      {backIdUrl ? 'Front & Back' : 'Front'}
                    </span>
                  )}
                </button>

                {hasEvidence && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('evidence')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeTab === 'evidence'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-gray-600 hover:text-gray-900 dark:text-white/60 dark:hover:text-white'
                      }`}
                  >
                    {isPostReport ? <FileText size={13} /> : <MessageSquare size={13} />}
                    <span>Flagged {isPostReport ? 'Post Evidence' : 'Chat Message'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Content View: Either Student ID Card, or authentic FeedPostCard, or Message */}
            {activeTab === 'id_card' ? (
              /* 3D Flippable Student ID Card */
              <div
                className="w-full max-w-3xl h-[64vh] sm:h-[72vh] relative select-none flex items-center justify-center"
                style={{ perspective: '1400px' }}
              >
                <div
                  className="w-full h-full relative transition-transform duration-500 ease-out"
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: side === 'back' ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  }}
                >
                  {/* Front Face */}
                  <div
                    onClick={toggleFlip}
                    className="absolute inset-0 w-full h-full flex items-center justify-center cursor-pointer group"
                    style={{
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                    }}
                  >
                    {frontIdUrl ? (
                      <div className="relative max-h-full max-w-full rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center bg-black/5 dark:bg-black/30 border border-gray-200/80 dark:border-white/10">
                        <img
                          src={frontIdUrl}
                          alt="Student ID Front"
                          className="max-h-[60vh] sm:max-h-[68vh] max-w-full w-auto h-auto object-contain select-none transition-transform duration-200 group-hover:scale-[1.01]"
                        />
                        {/* Student ID badge inside the image (top-left) */}
                        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md text-white text-[10px] sm:text-[11px] font-bold tracking-wider border border-white/15 flex items-center gap-1.5 shadow-lg select-none">
                          <CreditCard size={12} className="text-emerald-400" />
                          <span>STUDENT ID · FRONT</span>
                        </div>
                        {/* Flip to back button inside the image (top-right) */}
                        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-[10px] sm:text-[11px] font-semibold flex items-center gap-1.5 border border-white/20 shadow-lg transition-colors select-none">
                          <RotateCw size={11} /> Flip to Back
                        </div>
                        {/* Click to flip hint inside the image (bottom) */}
                        <div className="absolute bottom-3 inset-x-0 mx-auto w-fit px-3 py-0.5 rounded-full bg-black/65 backdrop-blur-md text-white/80 text-[10px] pointer-events-none shadow-lg select-none">
                          Click image to flip
                        </div>
                        {/* Fullscreen preview button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewImage(frontIdUrl);
                          }}
                          className="absolute bottom-3 right-3 p-1.5 rounded-lg bg-black/70 hover:bg-black/90 text-white text-xs backdrop-blur-md border border-white/15 shadow-lg transition-colors cursor-pointer"
                          title="View Full Resolution"
                        >
                          <Maximize2 size={13} />
                        </button>
                      </div>
                    ) : (
                      <div className="w-full h-full rounded-2xl border border-white/10 bg-[#101722]/90 shadow-2xl flex flex-col items-center justify-center p-8 text-center backdrop-blur-xs">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400 mb-4 shadow-inner">
                          <CreditCard size={32} />
                        </div>
                        <h3 className="text-base font-bold text-white mb-1">
                          {studentDetail?.full_name || getReportedDisplayName(report)}
                        </h3>
                        <p className="text-xs text-white/50 max-w-sm mb-4">
                          {studentDetail?.email_type === 'chmsu'
                            ? 'Institutional CHMSU student account verified automatically via university email. No physical ID card was required for onboarding.'
                            : 'No front ID photo was submitted for this student account.'}
                        </p>
                        <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white/80 max-w-xs space-y-1 text-left">
                          <p><span className="text-white/40">Department:</span> {studentDetail?.department || 'N/A'}</p>
                          <p><span className="text-white/40">Course:</span> {studentDetail?.course || 'N/A'}</p>
                          <p><span className="text-white/40">Email:</span> {studentDetail?.email || report.reported_email || 'N/A'}</p>
                        </div>
                        <button
                          type="button"
                          onClick={toggleFlip}
                          className="mt-4 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <RotateCw size={12} /> Flip to Back Side
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Back Face */}
                  <div
                    onClick={toggleFlip}
                    className="absolute inset-0 w-full h-full flex items-center justify-center cursor-pointer group"
                    style={{
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                    }}
                  >
                    {backIdUrl ? (
                      <div className="relative max-h-full max-w-full rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center bg-black/5 dark:bg-black/30 border border-gray-200/80 dark:border-white/10">
                        <img
                          src={backIdUrl}
                          alt="Student ID Back"
                          className="max-h-[60vh] sm:max-h-[68vh] max-w-full w-auto h-auto object-contain select-none transition-transform duration-200 group-hover:scale-[1.01]"
                        />
                        {/* Student ID badge inside the image (top-left) */}
                        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md text-white text-[10px] sm:text-[11px] font-bold tracking-wider border border-white/15 flex items-center gap-1.5 shadow-lg select-none">
                          <CreditCard size={12} className="text-blue-400" />
                          <span>STUDENT ID · BACK</span>
                        </div>
                        {/* Flip to front button inside the image (top-right) */}
                        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-[10px] sm:text-[11px] font-semibold flex items-center gap-1.5 border border-white/20 shadow-lg transition-colors select-none">
                          <RotateCw size={11} /> Flip to Front
                        </div>
                        {/* Click to flip hint inside the image (bottom) */}
                        <div className="absolute bottom-3 inset-x-0 mx-auto w-fit px-3 py-0.5 rounded-full bg-black/65 backdrop-blur-md text-white/80 text-[10px] pointer-events-none shadow-lg select-none">
                          Click image to flip
                        </div>
                        {/* Fullscreen preview button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewImage(backIdUrl);
                          }}
                          className="absolute bottom-3 right-3 p-1.5 rounded-lg bg-black/70 hover:bg-black/90 text-white text-xs backdrop-blur-md border border-white/15 shadow-lg transition-colors cursor-pointer"
                          title="View Full Resolution"
                        >
                          <Maximize2 size={13} />
                        </button>
                      </div>
                    ) : (
                      <div className="w-full h-full rounded-2xl border border-white/10 bg-[#101722]/90 shadow-2xl flex flex-col items-center justify-center p-8 text-center backdrop-blur-xs">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 mb-4 shadow-inner">
                          <CreditCard size={32} />
                        </div>
                        <h3 className="text-base font-bold text-white mb-1">No Back Side Uploaded</h3>
                        <p className="text-xs text-white/50 max-w-sm mb-4">
                          The student only submitted the front side of their ID or Certificate of Registration.
                        </p>
                        <button
                          type="button"
                          onClick={toggleFlip}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <RotateCw size={12} /> Flip to Front Side
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : isPostReport && post ? (
              /* ── AUTHENTIC FeedPostCard UI & DATA (Staff Moderation Preview) ── */
              <article className="w-full max-w-xl bg-white dark:bg-[#181818] p-4 sm:p-6 rounded-2xl border border-gray-200/80 dark:border-white/10 shadow-sm text-left transition-colors">
                {/* Flagged / Restricted Visibility Banner */}
                {(post.is_deleted || post.is_deleted_from_feed) && (
                  <div className="mb-3.5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5">
                    <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-red-600 dark:text-red-400">Post Deleted from Live Feed</p>
                      <p className="text-[11px] text-red-700/80 dark:text-red-300/80 mt-0.5">This post was removed from the live student feed and is preserved here for moderation review.</p>
                    </div>
                  </div>
                )}

                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <AvatarDisplay
                      src={studentDetail?.avatar_url || report.reported_avatar || post.author_avatar}
                      name={studentDetail?.full_name || report.reported_name || post.author_name || 'Student'}
                      className="w-10 h-10 rounded-full border border-gray-200 dark:border-white/10 shrink-0 shadow-xs"
                    />
                    <div className="min-w-0">
                      <p className="font-jakarta font-semibold text-sm text-gray-900 dark:text-white truncate">
                        {studentDetail?.full_name || report.reported_name || post.author_name || 'Student'}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        {(studentDetail?.username || report.reported_username || post.author_username) && (
                          <span className="font-jakarta text-[11px] text-gray-500 dark:text-gray-400">
                            @{studentDetail?.username || report.reported_username || post.author_username}
                          </span>
                        )}
                        {(studentDetail?.username || report.reported_username || post.author_username) && (
                          <span className="text-gray-300 dark:text-gray-600">·</span>
                        )}
                        <span className="font-jakarta text-[11px] text-gray-400 dark:text-gray-500">
                          {post.created_at ? formatDistanceToNowStrict(new Date(post.created_at), { addSuffix: true }) : ''}
                        </span>
                        <span className="text-gray-300 dark:text-gray-600">·</span>
                        {post.audience === 'public' ? (
                          <Globe2 size={11} className="text-gray-400 dark:text-gray-500" />
                        ) : (
                          <Users size={11} className="text-gray-400 dark:text-gray-500" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Header Right: Follow & 3-dots removed! Admin only delete button */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {post.is_deleted || post.is_deleted_from_feed ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-300 border border-red-500/30">
                        <AlertTriangle size={11} /> Deleted
                      </span>
                    ) : isAdmin ? (
                      <button
                        type="button"
                        disabled={busy || deletingPost}
                        onClick={handleDeleteReportedPost}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-jakarta text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                        title="Permanently remove this post from the student feed"
                      >
                        {deletingPost ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                        <span>Delete Post</span>
                      </button>
                    ) : null}
                  </div>
                </div>

                {/* Content */}
                {post.content && (
                  <div className="mt-3">
                    {post.content === 'This message was removed' ? (
                      <p className="font-jakarta text-[14px] italic text-gray-400 dark:text-gray-500 py-1">
                        This message was removed
                      </p>
                    ) : (
                      <>
                        <p
                          className={cn(
                            "font-jakarta text-[14.5px] sm:text-[15px] text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre-wrap break-words",
                            post.content.length > 120 && !isContentExpanded && "line-clamp-3"
                          )}
                        >
                          {post.content}
                        </p>
                        {post.content.length > 120 && (
                          <button
                            type="button"
                            onClick={() => setIsContentExpanded(!isContentExpanded)}
                            className="font-jakarta text-xs font-bold text-[#1A6B3C] dark:text-emerald-400 mt-1 hover:underline cursor-pointer focus:outline-none"
                          >
                            {isContentExpanded ? 'Show less' : '...more'}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Media Grid */}
                <MediaGrid
                  media={post.media}
                  onMediaClick={(url) => setPreviewImage(url)}
                />

                {/* Actions (Left-aligned, icon-only with count matching mobile/feed) */}
                <div className="mt-3.5 pt-2.5 border-t border-gray-100/80 dark:border-white/10 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-5 sm:gap-6">
                    {/* Like */}
                    <div className="flex items-center gap-1.5 py-1 text-gray-400 dark:text-gray-500 font-jakarta font-medium select-none">
                      <Heart size={18} className="text-gray-400 dark:text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-[13px] font-medium">
                        {post.likes_count ?? 0}
                      </span>
                    </div>

                    {/* Comment (count only) */}
                    <div className="flex items-center gap-1.5 py-1 text-gray-400 dark:text-gray-500 font-jakarta font-medium select-none">
                      <MessageCircle size={18} className="text-gray-400 dark:text-gray-500" strokeWidth={2} />
                      <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-[13px] font-medium">
                        {post.comments_count ?? 0}
                      </span>
                    </div>
                  </div>

                  <span className="font-mono text-[11px] text-gray-400 dark:text-white/40">
                    POST ID: {(report.post_id || post.id || '').slice(0, 8)}…
                  </span>
                </div>
              </article>
            ) : isMessageReport && message ? (
              /* Flagged Chat Message Evidence */
              <div className="w-full max-w-xl rounded-2xl overflow-hidden border border-white/10 bg-[#0C121B] shadow-2xl flex flex-col relative select-none">
                <div className="shrink-0 px-4 py-3 bg-[#111924] border-b border-white/10 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      <MessageSquare size={12} /> Flagged Chat Message
                    </span>
                    <span className="text-xs text-white/70">
                      From: {studentDetail?.full_name || message.sender_name || getReportedDisplayName(report)}
                    </span>
                  </div>
                  <span className="text-[10px] text-white/40 font-mono">
                    MSG: {(report.message_id || message.id || '').slice(0, 8)}…
                  </span>
                </div>

                <div className="p-6 flex flex-col justify-center items-center">
                  <div className="max-w-xl w-full p-4 rounded-2xl bg-[#1E293B] border border-amber-400/50 shadow-xl space-y-3">
                    {message.image_url && (
                      message.image_url === '[removed]' ? (
                        <div className="w-full p-4 rounded-xl bg-black/40 border border-dashed border-white/20 text-center space-y-1">
                          <ImageOff size={24} className="mx-auto text-white/40 mb-1" />
                          <p className="text-xs text-white/60 italic">This photo was removed for violating community standards.</p>
                        </div>
                      ) : (
                        <div
                          className="rounded-xl overflow-hidden aspect-video bg-black/40 border border-white/10 relative cursor-pointer group"
                          onClick={() => setPreviewImage(message.image_url!)}
                          title="Click to view full picture"
                        >
                          <img src={message.image_url} alt="Attached" className="w-full h-full object-contain" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1">
                            <Maximize2 size={14} /> View Entire Picture Fullscreen
                          </div>
                        </div>
                      )
                    )}
                    <p className="text-sm text-white leading-relaxed">{message.content || '[Image Only]'}</p>
                    <p className="text-[10px] text-white/40 text-right">
                      {message.created_at ? new Date(message.created_at).toLocaleString() : ''}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-white/40 text-xs">
                No content evidence available for this report.
              </div>
            )}
          </div>

          {/* ── UNDER THE CONTENT: ONE FULLY ROUNDED CTA (FOR MODERATOR) ── */}
          {isModerator && (
            <div className="shrink-0 p-3 sm:px-6 bg-white dark:bg-[#0B1019] border-t border-gray-200 dark:border-white/10 flex items-center justify-center shadow-md">
              <button
                type="button"
                onClick={() => {
                  setFindingText(report.moderator_findings || '');
                  setFindingRecAction(report.moderator_recommended_action || 'warn');
                  setFindingExistingUrl(report.moderator_attachment_url || null);
                  setFindingFile(null);
                  setFindingPreview(null);
                  setFindingsModalOpen(true);
                }}
                className="w-full bg-[#1A6B3C] dark:bg-emerald-600 hover:bg-[#14532D] dark:hover:bg-emerald-500 text-white font-mono text-xs uppercase tracking-wider font-bold py-3.5 rounded-full transition-all shadow-md flex items-center justify-center cursor-pointer active:scale-95"
              >
                <span>submit review</span>
              </button>
            </div>
          )}
        </section>

        {/* ── RIGHT COLUMN: THE INFORMATION (~40%) ── */}
        <aside className="w-full lg:w-5/12 xl:w-2/5 flex flex-col bg-white dark:bg-[#0B1019] overflow-y-auto divide-y divide-gray-100 dark:divide-white/10 text-gray-900 dark:text-white">

          {/* Section 1: Reported Student Profile & Academic Dossier */}
          <div className="p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <User size={13} /> Reported Student Dossier
              </span>
              {studentDetail?.is_banned ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 uppercase">
                  Banned Account
                </span>
              ) : studentDetail?.is_suspended ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                  Suspended
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                  Active
                </span>
              )}
            </div>

            <div className="flex items-start gap-3.5 bg-gray-50 dark:bg-white/5 p-3.5 rounded-xl border border-gray-200/80 dark:border-white/10">
              <div className="relative shrink-0">
                <AvatarDisplay
                  src={studentDetail?.avatar_url || report.reported_avatar}
                  name={getReportedDisplayName(report)}
                  className="w-12 h-12 rounded-full border-2 border-white/20 shadow-sm"
                />
                {(studentDetail?.student_verification_status === 'approved' || studentDetail?.chmsu_auto_verified) && (
                  <span
                    className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#0B1019] flex items-center justify-center text-[9px] text-white font-bold"
                    title="Verified Student"
                  >
                    ✓
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate flex items-center gap-1.5">
                  {studentDetail?.full_name || getReportedDisplayName(report)}
                  {report.reported_username && report.reported_username.toLowerCase() !== 'anonymous' && (
                    <span className="text-xs text-gray-500 dark:text-white/50 font-normal">@{report.reported_username}</span>
                  )}
                </h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium truncate mt-0.5">
                  {getStudentAcademicInfo(studentDetail, report)}
                </p>
                <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-white/60">
                  <Mail size={12} className="text-gray-400 dark:text-white/40 shrink-0" />
                  <span className="truncate">{studentDetail?.email || report.reported_email || 'Institutional email verified'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Submitted By (Reporter) */}
          <div className="p-4 sm:p-5 space-y-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50 flex items-center gap-1.5">
              <Shield size={13} /> Submitted By (Reporter)
            </span>
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <AvatarDisplay
                  src={report.reporter_avatar}
                  name={getReporterDisplayName(report)}
                  className="w-9 h-9 rounded-full border border-gray-200 dark:border-white/15 shrink-0 text-xs"
                />
                <div className="min-w-0">
                  <p className="font-semibold text-xs text-gray-900 dark:text-white truncate">
                    {getReporterDisplayName(report)}
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-white/50 truncate">
                    {report.reporter_email || (report.reporter_username ? `@${report.reporter_username}` : 'CHMSU Student Reporter')}
                  </p>
                </div>
              </div>
              <span className="text-[11px] text-gray-400 dark:text-white/40 shrink-0">
                {new Date(report.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>



          {/* Section 4: Moderation Workflow Lifecycle (4-Tier Stepper) */}
          <div className="p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                <Layers size={13} /> Moderation Lifecycle Workflow
              </span>
              <span className="text-[10px] font-mono text-gray-400 dark:text-white/40">4-Stage Pipeline</span>
            </div>

            <div className="space-y-3 bg-gray-50 dark:bg-white/5 p-3.5 rounded-xl border border-gray-200/80 dark:border-white/10">
              {/* Step 1: Report Submitted */}
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  ✓
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-gray-900 dark:text-white flex items-center justify-between">
                    <span>1. Report Submitted</span>
                    <span className="text-[10px] font-normal text-white/40">{new Date(report.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-white/60 mt-0.5">Report registered in moderation desk.</p>
                </div>
              </div>

              {/* Step 2: Under Review */}
              <div className="flex items-start gap-3 pt-2 border-t border-white/5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${report.status === 'reviewing' || report.status === 'resolved'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                    : 'bg-gray-200 text-gray-500 border border-gray-300 dark:bg-white/10 dark:text-white/40 dark:border-white/15'
                  }`}>
                  {report.status === 'reviewing' || report.status === 'resolved' ? '✓' : '2'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-gray-900 dark:text-white flex items-center justify-between">
                    <span>2. Under Review</span>
                    {report.reviewed_at && (
                      <span className="text-[10px] font-normal text-gray-400 dark:text-white/40">{new Date(report.reviewed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    )}
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-white/60 mt-1 flex items-center gap-1.5">
                    <span className="text-gray-400 dark:text-white/40">assign to:</span>
                    {report.reviewed_by_name ? (
                      <span className="font-semibold text-blue-600 dark:text-blue-400 inline-flex items-center gap-1">
                        moderator : {report.reviewed_by_name}
                      </span>
                    ) : (
                      <span className="italic text-gray-400 dark:text-white/40">
                        moderator : not yet assigned
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Step 3: Pending Action */}
              <div className="flex items-start gap-3 pt-2 border-t border-white/5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${report.status === 'resolved' || (report.internal_notes && report.internal_notes.includes('[STAGE:pending_action]'))
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-white/10 text-white/40 border border-white/15'
                  }`}>
                  {report.status === 'resolved' ? '✓' : '3'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-gray-900 dark:text-white">3. Pending Action</p>
                  <p className="text-[11px] text-gray-500 dark:text-white/60 mt-0.5">
                    {report.status === 'resolved'
                      ? 'Moderation verified and recommendations evaluated'
                      : 'Assigned staff reviews evidence and submits recommendation'}
                  </p>

                  {/* View Details link placed right where the green card used to be */}
                  {(report.moderator_findings || report.status === 'resolved') && (
                    <div className="mt-1.5">
                      <button
                        type="button"
                        onClick={() => setDetailsModalOpen(true)}
                        className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:underline inline-flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <span>View Details</span>
                        <ExternalLink size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 4: Action Taken */}
              <div className="flex items-start gap-3 pt-2 border-t border-white/5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${report.status === 'resolved'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : report.status === 'rejected'
                      ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                      : 'bg-white/10 text-white/40 border border-white/15'
                  }`}>
                  {report.status === 'resolved' ? '✓' : report.status === 'rejected' ? '✕' : '4'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-gray-900 dark:text-white">4. Action Taken</p>
                  <p className="text-[11px] text-gray-500 dark:text-white/60 mt-0.5">
                    {report.status === 'resolved'
                      ? 'Admin executed sanctions and case is concluded.'
                      : report.status === 'rejected'
                        ? 'Report dismissed as unwarranted.'
                        : 'Admin confirms decision and enforces disciplinary sanctions.'}
                  </p>
                </div>
              </div>
            </div>
          </div>



        </aside>
      </div>

      {/* ── FINDINGS MODAL (MODERATOR INVESTIGATION REVIEW) ── */}
      {findingsModalOpen && (
        <div
          className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setFindingsModalOpen(false)}
        >
          <div
            className="relative max-w-xl w-full max-h-[90vh] overflow-y-auto bg-white dark:bg-[#141B24] border border-gray-200 dark:border-white/15 text-gray-900 dark:text-white p-6 rounded-2xl shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <h3 className="font-fraunces text-lg font-bold text-gray-900 dark:text-white">
                    Complete Review & Findings
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFindingsModalOpen(false)}
                className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-gray-500 hover:text-gray-800 dark:text-white/70 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Target Strip */}
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-gray-500 dark:text-white/50">Reported Student: </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {report.reported_name || report.reported_username || 'Student'}
                </span>
              </div>
              <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px]">
                {report.violation_label}
              </Badge>
            </div>

            {/* Findings Text Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <span>Investigation Findings & Evaluation</span>
                <span className="text-red-500">*</span>
              </label>
              <textarea
                value={findingText}
                onChange={(e) => setFindingText(e.target.value)}
                placeholder="Detail your investigation findings, evidence evaluation, student history, and applicable university handbook clauses..."
                rows={4}
                className="w-full text-xs bg-gray-50 dark:bg-black/40 border border-gray-300 dark:border-white/15 rounded-xl p-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>

            {/* Recommended Action Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <span>Recommended Action for Administration</span>
                <span className="text-red-500">*</span>
              </label>
              <select
                value={findingRecAction}
                onChange={(e) => setFindingRecAction(e.target.value)}
                className="w-full text-xs bg-gray-50 dark:bg-black/40 border border-gray-300 dark:border-white/15 rounded-xl p-2.5 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              >
                <option value="warn">Recommend: Issue Official Warning</option>
                <option value="delete_post">Recommend: Remove Flagged Content / Post</option>
                <option value="suspend">Recommend: Temporary Account Suspension</option>
                <option value="ban">Recommend: Permanent Disciplinary Ban</option>
                <option value="resolve">Recommend: Dismiss / Resolve (No Violation)</option>
              </select>
            </div>

            {/* Supporting Attachment Upload */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <Paperclip size={13} className="text-emerald-500" />
                <span>Attach Evidence</span>
              </label>

              {findingFile || findingExistingUrl ? (
                <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {findingPreview ? (
                      <img src={findingPreview} alt="Preview" className="w-12 h-12 object-cover rounded-lg border border-white/20 shrink-0" />
                    ) : (findingFile?.type === 'application/pdf' || findingExistingUrl?.toLowerCase().includes('.pdf')) ? (
                      <div className="w-12 h-12 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center shrink-0 border border-red-500/30">
                        <FileText size={22} />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                        <Paperclip size={20} />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                        {findingFile?.name || (findingExistingUrl ? 'Attached Evidence Document' : 'Evidence File')}
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-white/50">
                        {findingFile ? `${(findingFile.size / 1024 / 1024).toFixed(2)} MB • Ready to upload` : 'Evidence file attached'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFindingFile(null);
                      setFindingPreview(null);
                      setFindingExistingUrl(null);
                    }}
                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer shrink-0"
                    title="Remove attachment"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ) : (
                <label
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleFileSelected(file);
                  }}
                  className="border-2 border-dashed border-gray-300 dark:border-white/15 hover:border-emerald-500 rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-gray-50 dark:bg-white/[0.02] transition-colors group"
                >
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelected(file);
                    }}
                  />
                  <Upload size={22} className="text-gray-400 dark:text-white/40 group-hover:text-emerald-500 transition-colors" />
                  <span className="text-xs font-semibold text-gray-700 dark:text-white/80 group-hover:text-emerald-500">
                    Click to browse or drag & drop evidence file
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-white/40">
                    Supports PNG, JPG, WEBP, GIF, or PDF documents (up to 25MB)
                  </span>
                </label>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-white/10">
              <button
                type="button"
                onClick={() => setFindingsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-gray-700 dark:text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!findingText.trim() || submittingFindings}
                onClick={async () => {
                  if (!findingText.trim()) return;
                  setSubmittingFindings(true);
                  try {
                    let attachmentUrl = findingExistingUrl;
                    if (findingFile) {
                      const uploadRes = await apiClient.adminUploadFindingAttachment(findingFile, report.id);
                      attachmentUrl = uploadRes.url;
                    }
                    await apiClient.adminVerifyReport(report.id, {
                      findings: findingText.trim(),
                      recommendedAction: findingRecAction,
                      attachmentUrl,
                    });
                    notify.success('Review Completed', 'Investigation findings and evidence uploaded successfully.');
                    setFindingsModalOpen(false);
                    onChanged();
                  } catch (err: any) {
                    notify.error('Failed to submit review', err.message);
                  } finally {
                    setSubmittingFindings(false);
                  }
                }}
                className="px-5 py-2 rounded-xl bg-[#1A6B3C] hover:bg-[#14532D] text-white text-xs font-bold shadow-md transition-all flex items-center justify-center cursor-pointer disabled:opacity-40"
              >
                {submittingFindings ? (
                  <>
                    <Loader2 size={13} className="animate-spin mr-1.5" />
                    <span>Uploading & Submitting...</span>
                  </>
                ) : (
                  <span>Submit Findings</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DETAILS MODAL (VIEW FINDINGS & ATTACHMENTS) ── */}
      {detailsModalOpen && (
        <div
          className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setDetailsModalOpen(false)}
        >
          <div
            className="relative max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-white dark:bg-[#141B24] border border-gray-200 dark:border-white/15 text-gray-900 dark:text-white p-6 rounded-2xl shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="font-fraunces text-lg font-bold text-gray-900 dark:text-white">
                    Investigation Findings & Evidence Details
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-white/50">
                    Report #{report.id.slice(0, 8)} • Stage: Pending Action
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailsModalOpen(false)}
                className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-gray-500 hover:text-gray-800 dark:text-white/70 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Moderator Info Header */}
            <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {report.reviewed_by_name?.charAt(0) || 'M'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                    Reviewed by: {report.reviewed_by_name || 'Assigned Moderator'}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-white/50">
                    {report.reviewed_at ? new Date(report.reviewed_at).toLocaleString() : 'Recently reviewed'}
                  </p>
                </div>
              </div>
              {report.moderator_recommended_action && (
                <div className="text-right shrink-0">
                  <span className="text-[10px] text-gray-500 dark:text-white/50 block">Recommendation</span>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 uppercase">
                    {report.moderator_recommended_action}
                  </span>
                </div>
              )}
            </div>

            {/* Findings Text */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-white/60">
                Moderator Investigation Findings
              </h4>
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 text-xs text-gray-800 dark:text-white/90 leading-relaxed whitespace-pre-wrap">
                {report.moderator_findings || 'No written findings submitted yet.'}
              </div>
            </div>

            {/* Attachment Section */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-white/60">
                <span>Attached Evidence File</span>
              </h4>

              {report.moderator_attachment_url ? (
                report.moderator_attachment_url.toLowerCase().match(/\.(png|jpe?g|webp|gif)($|\?)/) ||
                report.moderator_attachment_url.startsWith('data:image/') ? (
                  <div className="space-y-2">
                    <div
                      className="rounded-xl overflow-hidden max-h-[300px] bg-black/40 border border-gray-200 dark:border-white/10 relative group cursor-pointer"
                      onClick={() => setPreviewImage(report.moderator_attachment_url!)}
                    >
                      <img
                        src={report.moderator_attachment_url}
                        alt="Moderator Finding Evidence"
                        className="w-full max-h-[300px] object-contain mx-auto"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1.5">
                        <Maximize2 size={16} /> Click to View Full Size
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <a
                        href={report.moderator_attachment_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
                      >
                        <span>Open original image</span>
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-500 flex items-center justify-center shrink-0">
                        <FileText size={22} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                          Supporting PDF / Document Evidence
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-white/50 truncate">
                          Supporting document evidence
                        </p>
                      </div>
                    </div>
                    <a
                      href={report.moderator_attachment_url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shrink-0"
                    >
                      <span>Open Document</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                )
              ) : (
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-dashed border-gray-200 dark:border-white/10 text-center text-xs text-gray-400 dark:text-white/40 italic">
                  No document or media file attached with this review.
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-white/10">
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setDetailsModalOpen(false);
                    setActionModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#1A6B3C] hover:bg-[#14532D] text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <ShieldAlert size={14} />
                  <span>Proceed to Take Action</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setDetailsModalOpen(false)}
                className="ml-auto px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-gray-700 dark:text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {actionModalOpen && (
        <div
          className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setActionModalOpen(false)}
        >
          <div
            className="relative max-w-xl w-full max-h-[90vh] overflow-y-auto bg-white dark:bg-[#141B24] border border-gray-200 dark:border-white/15 text-gray-900 dark:text-white p-6 rounded-2xl shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/10">
              <div>
                <h3 className="font-fraunces text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <ShieldAlert size={18} className="text-emerald-400" />
                  Take Action on Report
                </h3>
                <p className="text-xs text-gray-500 dark:text-white/50 mt-0.5">
                  Select a single moderation resolution for report #{report.id.slice(0, 8)}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActionModalOpen(false)}
                className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-gray-500 hover:text-gray-800 dark:text-white/70 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Target Summary Strip */}
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <AvatarDisplay
                  src={studentDetail?.avatar_url || report.reported_avatar}
                  name={getReportedDisplayName(report)}
                  className="w-8 h-8 rounded-full border border-white/15"
                />
                <div className="min-w-0">
                  <p className="font-bold text-xs text-gray-900 dark:text-white truncate">
                    {studentDetail?.full_name || getReportedDisplayName(report)}
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-white/50 truncate">
                    {report.reported_email || (report.reported_username ? `@${report.reported_username}` : '')}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-red-50 dark:bg-red-500/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-500/30 uppercase shrink-0">
                {report.violation_label}
              </span>
            </div>

            {/* Action Radio Options */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 dark:text-white/50 uppercase tracking-wider">
                Select Moderation Resolution
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* 1. Resolve */}
                <label
                  className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${selectedAction === 'resolve'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 ring-1 ring-emerald-500'
                      : 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 hover:bg-gray-100/80 dark:hover:bg-white/[0.08]'
                    }`}
                >
                  <input
                    type="radio"
                    name="action"
                    checked={selectedAction === 'resolve'}
                    onChange={() => setSelectedAction('resolve')}
                    className="mt-0.5 accent-emerald-500"
                  />
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                      <CheckCircle2 size={13} className="text-emerald-400" /> Resolve Report
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-white/50 mt-0.5">Mark resolved without account penalty</p>
                  </div>
                </label>

                {/* 2. Reviewing */}
                <label
                  className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${selectedAction === 'reviewing'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 ring-1 ring-blue-500'
                      : 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 hover:bg-gray-100/80 dark:hover:bg-white/[0.08]'
                    }`}
                >
                  <input
                    type="radio"
                    name="action"
                    checked={selectedAction === 'reviewing'}
                    onChange={() => setSelectedAction('reviewing')}
                    className="mt-0.5 accent-blue-500"
                  />
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                      <Clock size={13} className="text-blue-400" /> Mark In Review
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-white/50 mt-0.5">Keep under ongoing investigation</p>
                  </div>
                </label>

                {/* 3. Reject */}
                <label
                  className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${selectedAction === 'reject'
                      ? 'border-gray-400 bg-gray-100 dark:bg-white/10 ring-1 ring-gray-400'
                      : 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 hover:bg-gray-100/80 dark:hover:bg-white/[0.08]'
                    }`}
                >
                  <input
                    type="radio"
                    name="action"
                    checked={selectedAction === 'reject'}
                    onChange={() => setSelectedAction('reject')}
                    className="mt-0.5 accent-gray-400"
                  />
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                      <X size={13} className="text-gray-400" /> Dismiss / Reject
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-white/50 mt-0.5">Dismiss as unwarranted or false</p>
                  </div>
                </label>

                {/* 4. Warn */}
                <label
                  className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${selectedAction === 'warn'
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30 ring-1 ring-amber-500'
                      : 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 hover:bg-gray-100/80 dark:hover:bg-white/[0.08]'
                    }`}
                >
                  <input
                    type="radio"
                    name="action"
                    checked={selectedAction === 'warn'}
                    onChange={() => setSelectedAction('warn')}
                    className="mt-0.5 accent-amber-500"
                  />
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                      <ShieldAlert size={13} className="text-amber-400" /> Issue Warning
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-white/50 mt-0.5">Send official warning notification</p>
                  </div>
                </label>

                {/* 5. Suspend */}
                <label
                  className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${selectedAction === 'suspend'
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30 ring-1 ring-amber-500'
                      : 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 hover:bg-gray-100/80 dark:hover:bg-white/[0.08]'
                    }`}
                >
                  <input
                    type="radio"
                    name="action"
                    checked={selectedAction === 'suspend'}
                    onChange={() => setSelectedAction('suspend')}
                    className="mt-0.5 accent-amber-500"
                  />
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                      <Clock size={13} className="text-amber-400" /> Suspend Student
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-white/50 mt-0.5">Restrict student account access</p>
                  </div>
                </label>

                {/* 6. Ban */}
                <label
                  className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${selectedAction === 'ban'
                      ? 'border-red-500 bg-red-50 dark:bg-red-950/30 ring-1 ring-red-500'
                      : 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 hover:bg-gray-100/80 dark:hover:bg-white/[0.08]'
                    }`}
                >
                  <input
                    type="radio"
                    name="action"
                    checked={selectedAction === 'ban'}
                    onChange={() => setSelectedAction('ban')}
                    className="mt-0.5 accent-red-500"
                  />
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                      <Ban size={13} className="text-red-400" /> Permanent Ban
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-white/50 mt-0.5">Permanently ban student account</p>
                  </div>
                </label>

                {/* 7. Delete Post - Admin Only */}
                {isPostReport && !post?.is_deleted && !post?.is_deleted_from_feed && isAdmin && (
                  <label
                    className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${selectedAction === 'delete_post'
                        ? 'border-red-500 bg-red-50 dark:bg-red-950/30 ring-1 ring-red-500'
                        : 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 hover:bg-gray-100/80 dark:hover:bg-white/[0.08]'
                      }`}
                  >
                    <input
                      type="radio"
                      name="action"
                      checked={selectedAction === 'delete_post'}
                      onChange={() => setSelectedAction('delete_post')}
                      className="mt-0.5 accent-red-500"
                    />
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                        <Trash2 size={13} className="text-red-400" /> Delete Reported Post
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-white/50 mt-0.5">Remove flagged post from student feed</p>
                    </div>
                  </label>
                )}

                {/* 8. Remove Message */}
                {(Boolean(isMessageReport && message?.content) || Boolean(isPostReport && post?.content)) && (
                  <label
                    className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${selectedAction === 'remove_message'
                        ? 'border-red-500 bg-red-50 dark:bg-red-950/30 ring-1 ring-red-500'
                        : 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 hover:bg-gray-100/80 dark:hover:bg-white/[0.08]'
                      }`}
                  >
                    <input
                      type="radio"
                      name="action"
                      checked={selectedAction === 'remove_message'}
                      onChange={() => setSelectedAction('remove_message')}
                      className="mt-0.5 accent-red-500"
                    />
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                        <MessageSquareX size={13} className="text-red-400" /> Remove Message
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-white/50 mt-0.5">Replace with "This message was removed"</p>
                    </div>
                  </label>
                )}

                {/* 9. Remove Media */}
                {(Boolean(isMessageReport && message?.image_url) || Boolean(isPostReport && post?.media && post.media.length > 0)) && (
                  <label
                    className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${selectedAction === 'remove_media'
                        ? 'border-red-500 bg-red-50 dark:bg-red-950/30 ring-1 ring-red-500'
                        : 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 hover:bg-gray-100/80 dark:hover:bg-white/[0.08]'
                      }`}
                  >
                    <input
                      type="radio"
                      name="action"
                      checked={selectedAction === 'remove_media'}
                      onChange={() => setSelectedAction('remove_media')}
                      className="mt-0.5 accent-red-500"
                    />
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                        <ImageOff size={13} className="text-red-400" /> Remove Media
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-white/50 mt-0.5">Replace photo with guidelines notice</p>
                    </div>
                  </label>
                )}
              </div>
            </div>

            {/* Warning Message Inputs */}
            {selectedAction === 'warn' && (
              <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-2">
                <p className="text-xs font-bold text-amber-300">Warning Message to Student:</p>
                <div className="flex flex-wrap gap-1">
                  {WARNING_TEMPLATES.map((tmpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setWarnMessage(tmpl)}
                      className="text-[10px] px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-gray-700 dark:text-white/80 transition-colors cursor-pointer"
                    >
                      Template {idx + 1}
                    </button>
                  ))}
                </div>
                <textarea
                  value={warnMessage}
                  onChange={(e) => setWarnMessage(e.target.value)}
                  placeholder="Type official warning message..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 text-xs outline-none focus:border-amber-400"
                />
              </div>
            )}

            {/* Suspend Duration Inputs */}
            {selectedAction === 'suspend' && (
              <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300">Suspension Duration:</span>
                <select
                  value={suspendDays}
                  onChange={(e) => setSuspendDays(e.target.value)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white outline-none cursor-pointer"
                >
                  <option value="3">3 Days</option>
                  <option value="7">7 Days</option>
                  <option value="14">14 Days</option>
                  <option value="30">30 Days</option>
                  <option value="permanent">Indefinite</option>
                </select>
              </div>
            )}

            {/* Internal Notes */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 dark:text-white/50 uppercase tracking-wider">
                Internal Admin Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Private notes visible only to the moderation team..."
                rows={2}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/40 text-xs outline-none focus:border-emerald-500"
              />
            </div>

            {/* Actions Submit */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setActionModalOpen(false)}
                disabled={busy}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-gray-700 dark:text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyAction}
                disabled={busy}
                className="px-5 py-2 rounded-xl bg-[#1A6B3C] hover:bg-[#14532D] text-white text-xs font-bold shadow-lg shadow-emerald-950/50 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {busy ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                <span>Apply Moderation Action</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ENTIRE PICTURE FULLSCREEN LIGHTBOX (Z-[10001]) ── */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[10001] bg-black/95 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-full max-h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 sm:top-3 right-0 sm:right-3 p-2 rounded-full bg-black/70 hover:bg-black/90 text-white border border-white/20 transition-colors cursor-pointer z-10"
              title="Close Fullscreen View (Esc)"
            >
              <X size={20} />
            </button>
            <img
              src={previewImage}
              alt="Entire picture"
              className="max-w-[96vw] max-h-[92vh] object-contain rounded-xl shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
