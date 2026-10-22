// src/pages/admin/AdminReportsPage.tsx

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Loader2,
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
} from 'lucide-react';
import { apiClient } from '@/api/client';
import type { AdminReportListItem, ReportStatus, ReportStatusCounts } from '@/api/client';
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

export default function AdminReportsPage() {
  const [status, setStatus] = useState<ReportStatus | 'all'>('pending');
  const [targetType, setTargetType] = useState<TargetFilter>('all');
  const [reports, setReports] = useState<AdminReportListItem[] | null>(null);
  const [counts, setCounts] = useState<ReportStatusCounts | null>(null);
  const [selected, setSelected] = useState<AdminReportListItem | null>(null);

  const load = () => {
    setReports(null);
    apiClient
      .adminListReports({ status, targetType, cursor: null })
      .then((res) => {
        setReports(res.items);
        // If an item is currently selected, update its reference in selected
        if (selected) {
          const updated = res.items.find((i) => i.id === selected.id);
          if (updated) setSelected(updated);
        }
      })
      .catch((err: any) => notify.error('Failed to load reports', err.message));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, targetType]);

  useEffect(() => {
    apiClient.adminGetReportStatusCounts().then(setCounts).catch(() => setCounts(null));
  }, []);

  return (
    <div className="space-y-6 w-full pb-8">
      <div>
        <h1 className="font-fraunces text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          Moderation & Flagged Content
        </h1>
        <p className="text-xs text-gray-400 dark:text-white/40 mt-1">
          {counts ? `${counts.pending} pending moderation · ${counts.reviewing} currently under review` : 'Loading moderation status…'}
        </p>
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
                onClick={() => setTargetType(f.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  active
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
              onClick={() => setStatus(t.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                status === t.value
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
        {!reports ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-[#1A6B3C] dark:text-emerald-400" size={24} />
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-16 px-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2 opacity-80" />
            <p className="text-sm font-bold text-gray-800 dark:text-white">All Flagged Content Handled</p>
            <p className="text-xs text-gray-400 dark:text-white/40 mt-1">There are no reported items matching this filter.</p>
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
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <ReportDetailModal report={selected} onClose={() => setSelected(null)} onChanged={load} />
    </div>
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
  const [notes, setNotes] = useState(stripReferenceTag(report?.internal_notes));
  const [warnMessage, setWarnMessage] = useState('');
  const [suspendDays, setSuspendDays] = useState('7');
  const [busy, setBusy] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    setNotes(report?.internal_notes ?? '');
    setWarnMessage('');
    setPreviewImage(null);
  }, [report]);

  if (!report) return null;

  const kind = getReportKind(report);
  const isPostReport = kind === 'post';
  const isMessageReport = kind === 'message';
  const post = report.post;
  const message = report.message;
  const reporterDetails = stripReferenceTag(report.internal_notes);

  const ensurePointerEvents = () => {
    setTimeout(() => {
      document.body.style.pointerEvents = '';
    }, 50);
  };

  const setStatus = async (status: ReportStatus) => {
    setBusy(true);
    try {
      await apiClient.adminSetReportStatus(report.id, status, notes);
      notify.success(`Marked as ${status}`);
      onChanged();
      onClose();
    } catch (err: any) {
      notify.error('Could not update report', err.message);
    } finally {
      setBusy(false);
      ensurePointerEvents();
    }
  };

  const doAction = async (label: string, action: () => Promise<void>) => {
    setBusy(true);
    try {
      await action();
      notify.success(label);
      onChanged();
    } catch (err: any) {
      notify.error(`Could not ${label.toLowerCase()}`, err.message);
    } finally {
      setBusy(false);
      ensurePointerEvents();
    }
  };

  const handleDeletePost = async () => {
    if (!report.post_id && !post?.id) return;
    const targetPostId = report.post_id || post?.id;

    if (!window.confirm('Are you sure you want to delete this reported post? This action cannot be undone.')) {
      return;
    }

    setBusy(true);
    try {
      await apiClient.adminDeleteReportedPost(report.id, targetPostId);
      notify.success('Post deleted', 'The reported post has been removed.');
      onChanged();
    } catch (err: any) {
      notify.error('Failed to delete post', err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleSuspend = async () => {
    let untilDate: string | null = null;
    if (suspendDays !== 'permanent') {
      const d = new Date();
      d.setDate(d.getDate() + Number(suspendDays));
      untilDate = d.toISOString();
    }

    const label = suspendDays === 'permanent' ? 'Account suspended indefinitely' : `Account suspended for ${suspendDays} days`;
    await doAction(label, () => apiClient.adminSuspendReportedUser(report.id, untilDate));
  };

  const handleWarn = async () => {
    if (!warnMessage.trim()) return;
    await doAction('Warning issued', () => apiClient.adminWarnReportedUser(report.id, warnMessage.trim()));
    setWarnMessage('');
  };

  return (
    <Dialog open={!!report} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#161D19] p-4 sm:p-6 rounded-2xl border border-gray-200 dark:border-white/10 shadow-2xl">
        <DialogHeader className="pb-3 border-b border-gray-100 dark:border-white/5">
          <div className="flex items-center justify-between">
            <DialogTitle className="font-fraunces text-xl font-bold text-gray-900 dark:text-white">
              Report Investigation
            </DialogTitle>
            {isPostReport ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40">
                <FileText size={12} /> Post Report
              </span>
            ) : isMessageReport ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
                <MessageSquare size={12} /> Message Report
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40">
                <User size={12} /> User Report
              </span>
            )}
          </div>
          <DialogDescription className="text-xs text-gray-400 dark:text-white/40 text-left">
            Review report details, examine flagged content, and take moderation action.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-5 text-sm">
          {/* Header Summary Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-2xl border border-gray-100 dark:border-white/5">
              <p className="text-[11px] font-medium text-gray-400 dark:text-white/40 mb-1.5">Reported Account</p>
              <div className="flex items-center gap-2">
                <AvatarDisplay
                  src={report.reported_avatar}
                  name={getReportedDisplayName(report)}
                  className="w-9 h-9 rounded-full border border-gray-200 dark:border-white/10 shrink-0"
                />
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 dark:text-white text-xs truncate">
                    {getReportedDisplayName(report)}
                  </p>
                  {report.reported_username && report.reported_username.toLowerCase() !== 'anonymous' && (
                    <p className="text-[10px] text-gray-400 truncate">@{report.reported_username}</p>
                  )}
                  {report.reported_email && (
                    <p className="text-[10px] text-gray-400 truncate">{report.reported_email}</p>
                  )}
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-2xl border border-gray-100 dark:border-white/5">
              <p className="text-[11px] font-medium text-gray-400 dark:text-white/40 mb-1.5">Submitted By</p>
              <div className="flex items-center gap-2">
                <AvatarDisplay
                  src={report.reporter_avatar}
                  name={getReporterDisplayName(report)}
                  className="w-9 h-9 rounded-full border border-gray-200 dark:border-white/10 shrink-0"
                />
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 dark:text-white text-xs truncate">
                    {getReporterDisplayName(report)}
                  </p>
                  {report.reporter_username && report.reporter_username.toLowerCase() !== 'anonymous' && (
                    <p className="text-[10px] text-gray-400 truncate">@{report.reporter_username}</p>
                  )}
                  {report.reporter_email && (
                    <p className="text-[10px] text-gray-400 truncate">{report.reporter_email}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Violation Claim */}
          <div className="bg-gray-50 dark:bg-white/5 p-3.5 rounded-2xl border border-gray-100 dark:border-white/5 space-y-1">
            <p className="text-xs font-medium text-gray-400 dark:text-white/40">Violation Claim</p>
            <p className="font-bold text-gray-900 dark:text-white">{report.violation_label}</p>
            <p className="text-xs text-gray-500 dark:text-white/60">
              {report.category_label} · Submitted {new Date(report.created_at).toLocaleString()}
            </p>
            {reporterDetails && (
              <div className="mt-2 pt-2 border-t border-gray-200/50 dark:border-white/5">
                <p className="text-[11px] font-semibold text-gray-400 dark:text-white/40 uppercase tracking-wide">
                  Reporter Description / Details
                </p>
                <p className="text-xs text-gray-700 dark:text-white/80 mt-0.5 whitespace-pre-wrap">
                  "{reporterDetails}"
                </p>
              </div>
            )}
          </div>

          {/* REPORTED MESSAGE REVIEW CARD (Displayed if message report) */}
          {isMessageReport && (
            <div className="rounded-2xl border-2 border-amber-200 dark:border-amber-800/40 bg-amber-50/30 dark:bg-amber-950/10 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-700 dark:text-amber-300">
                    <MessageSquare size={15} />
                  </div>
                  <div>
                    <h4 className="font-jakarta font-bold text-xs text-gray-900 dark:text-white">
                      Reported Chat Message
                    </h4>
                    <p className="text-[11px] text-gray-400 dark:text-white/40">
                      {message?.created_at ? new Date(message.created_at).toLocaleString() : 'Message details'}
                    </p>
                  </div>
                </div>

                {/* Message Status Badge */}
                {message?.is_deleted ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/40">
                    <AlertTriangle size={11} /> Message Deleted
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
                    Flagged Message
                  </span>
                )}
              </div>

              {/* Message Sender Info Snapshot */}
              {message && (
                <div className="flex items-center gap-2.5 pt-1">
                  <AvatarDisplay
                    src={message.sender_avatar}
                    name={message.sender_name || message.sender_username || 'Sender'}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                      {message.sender_name || message.sender_username || 'Sender'}
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-white/40">
                      @{message.sender_username || report.reported_username}
                    </p>
                  </div>
                </div>
              )}

              {/* Message Content Bubble */}
              <div className="bg-white dark:bg-[#1A2234] rounded-xl p-3.5 border border-amber-200/50 dark:border-white/5 text-xs text-gray-800 dark:text-gray-100 leading-relaxed whitespace-pre-wrap shadow-xs">
                {message?.content ? (
                  message.content
                ) : message?.is_deleted ? (
                  <span className="italic text-gray-400 dark:text-white/40">[This message has been deleted or removed]</span>
                ) : message?.image_url ? (
                  <span className="italic text-gray-400 dark:text-white/40">[Message contains image only]</span>
                ) : (
                  <span className="italic text-gray-400 dark:text-white/40">[No message content]</span>
                )}
              </div>

              {/* Message Image Attachment */}
              {message?.image_url && (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold text-gray-500 dark:text-white/50">
                    Attached Image:
                  </p>
                  <div
                    onClick={() => setPreviewImage(message.image_url!)}
                    className="relative max-w-xs rounded-xl overflow-hidden aspect-video bg-black/5 cursor-pointer group border border-gray-200/60 dark:border-white/10"
                  >
                    <img src={message.image_url} alt="Attached" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1">
                      <Eye size={14} /> View Full
                    </div>
                  </div>
                </div>
              )}

              {/* Surrounding Context Dialogue */}
              {message?.context && message.context.length > 1 && (
                <div className="pt-2 border-t border-amber-200/50 dark:border-white/5 space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                    Conversation Context ({message.context.length} messages)
                  </p>
                  <div className="space-y-1.5 max-h-56 overflow-y-auto p-2 rounded-xl bg-white/60 dark:bg-black/20 border border-gray-100 dark:border-white/5">
                    {message.context.map((ctxMsg) => {
                      const isFlagged = ctxMsg.id === message.id;
                      return (
                        <div
                          key={ctxMsg.id}
                          className={`p-2 rounded-lg text-xs transition-colors ${
                            isFlagged
                              ? 'bg-amber-100/80 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700/50 font-medium'
                              : 'bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] text-gray-400 dark:text-white/40 mb-1">
                            <span className="font-semibold text-gray-700 dark:text-white/80">
                              {ctxMsg.sender_name || `@${ctxMsg.sender_username}` || 'User'}
                              {isFlagged && ' (Reported)'}
                            </span>
                            <span>{new Date(ctxMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-gray-800 dark:text-white/90 whitespace-pre-wrap">
                            {ctxMsg.content || (ctxMsg.image_url ? '[Image]' : '[Deleted]')}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Message ID Footer */}
              <div className="flex items-center justify-between text-[11px] text-gray-400 dark:text-white/40 pt-1 border-t border-amber-200/50 dark:border-white/5">
                <span className="text-[10px] font-mono opacity-70">
                  MSG ID: {(report.message_id || message?.id || '').slice(0, 8)}…
                </span>
                {report.conversation_id && (
                  <span className="text-[10px] font-mono opacity-70">
                    CONV: {report.conversation_id.slice(0, 8)}…
                  </span>
                )}
              </div>
            </div>
          )}

          {/* REPORTED POST REVIEW CARD (Displayed if post report) */}
          {isPostReport && (
            <div className="rounded-2xl border-2 border-purple-200 dark:border-purple-800/40 bg-purple-50/30 dark:bg-purple-950/10 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-700 dark:text-purple-300">
                    <FileText size={15} />
                  </div>
                  <div>
                    <h4 className="font-jakarta font-bold text-xs text-gray-900 dark:text-white">
                      Reported Post Content
                    </h4>
                    <p className="text-[11px] text-gray-400 dark:text-white/40">
                      {post?.created_at ? new Date(post.created_at).toLocaleString() : 'Post details'}
                    </p>
                  </div>
                </div>

                {/* Post Status Badge */}
                {post?.is_deleted ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/40">
                    <AlertTriangle size={11} /> Post Deleted
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                    Active on Feed
                  </span>
                )}
              </div>

              {/* Author Info Snapshot */}
              {post && (
                <div className="flex items-center gap-2.5 pt-1">
                  <AvatarDisplay
                    src={post.author_avatar}
                    name={post.author_name || post.author_username || 'Author'}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                      {post.author_name || post.author_username || 'Author'}
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-white/40">
                      @{post.author_username || report.reported_username}
                    </p>
                  </div>
                </div>
              )}

              {/* Post Text Content */}
              <div className="bg-white dark:bg-[#1A2234] rounded-xl p-3.5 border border-gray-100 dark:border-white/5 text-xs text-gray-800 dark:text-gray-100 leading-relaxed whitespace-pre-wrap">
                {post?.content ? (
                  post.content
                ) : post?.is_deleted ? (
                  <span className="italic text-gray-400 dark:text-white/40">[This post has been deleted or removed]</span>
                ) : (
                  <span className="italic text-gray-400 dark:text-white/40">[Post contains media only]</span>
                )}
              </div>

              {/* Post Media Attachments */}
              {post?.media && post.media.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold text-gray-500 dark:text-white/50">
                    Attached Media ({post.media.length}):
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {post.media.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => setPreviewImage(m.url)}
                        className="relative rounded-xl overflow-hidden aspect-video bg-black/5 cursor-pointer group border border-gray-200/60 dark:border-white/10"
                      >
                        <img src={m.url} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1">
                          <Eye size={14} /> View Full
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Post Stats & ID */}
              <div className="flex items-center justify-between text-[11px] text-gray-400 dark:text-white/40 pt-1 border-t border-purple-100 dark:border-white/5">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Heart size={12} /> {post?.likes_count ?? 0} likes
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare size={12} /> {post?.comments_count ?? 0} comments
                  </span>
                </div>
                <span className="text-[10px] font-mono opacity-70">
                  ID: {(report.post_id || post?.id || '').slice(0, 8)}…
                </span>
              </div>

              {/* Post Action: DELETE POST BUTTON */}
              {!post?.is_deleted && (
                <div className="pt-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={handleDeletePost}
                    className="w-full py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-jakarta font-semibold text-xs shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                    Delete Reported Post
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Internal Notes */}
          <div>
            <label className="text-xs font-semibold text-gray-400 dark:text-white/40 uppercase tracking-wide block mb-1">
              Internal Admin Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white text-xs outline-none focus:border-[#1A6B3C] dark:focus:border-emerald-500 transition-colors"
              placeholder="Private notes visible only to administrative team…"
            />
          </div>

          {/* Investigation Status Actions */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-gray-400 dark:text-white/40 uppercase tracking-wide">
              Update Report Status
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                disabled={busy}
                onClick={() => setStatus('reviewing')}
                className="px-3 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 text-xs font-semibold disabled:opacity-50 hover:bg-blue-100 transition-colors"
              >
                In Review
              </button>
              <button
                disabled={busy}
                onClick={() => setStatus('resolved')}
                className="px-3 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold disabled:opacity-50 hover:bg-emerald-100 transition-colors"
              >
                Resolve
              </button>
              <button
                disabled={busy}
                onClick={() => setStatus('rejected')}
                className="px-3 py-2.5 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/70 text-xs font-semibold disabled:opacity-50 hover:bg-gray-200 transition-colors"
              >
                Reject
              </button>
            </div>
          </div>

          {/* Punitive & Account Moderation Actions */}
          <div className="border-t border-gray-100 dark:border-white/5 pt-4 space-y-4">
            <p className="text-xs font-semibold text-gray-400 dark:text-white/40 uppercase tracking-wide">
              Account Moderation Actions
            </p>

            {/* Action 1: Warn Account */}
            <div className="bg-gray-50 dark:bg-white/5 p-3.5 rounded-2xl border border-gray-100 dark:border-white/5 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 dark:text-white">
                <ShieldAlert size={14} className="text-amber-500" />
                <span>Warn Account</span>
              </div>

              {/* Presets */}
              <div className="flex flex-wrap gap-1">
                {WARNING_TEMPLATES.map((tmpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setWarnMessage(tmpl)}
                    className="text-[10px] px-2 py-1 rounded-lg bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/70 hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:text-amber-700 transition-colors truncate max-w-xs"
                  >
                    Template {idx + 1}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <textarea
                  value={warnMessage}
                  onChange={(e) => setWarnMessage(e.target.value)}
                  placeholder="Type official warning message to user…"
                  rows={2}
                  className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white text-xs outline-none focus:border-[#1A6B3C]"
                />
                <button
                  disabled={busy || !warnMessage.trim()}
                  onClick={handleWarn}
                  className="px-3 rounded-xl bg-amber-500 text-white text-xs font-semibold disabled:opacity-50 shrink-0 hover:bg-amber-600 transition-colors flex items-center justify-center gap-1"
                >
                  <ShieldAlert size={14} /> Send Warn
                </button>
              </div>
            </div>

            {/* Action 2: Suspend Account */}
            <div className="bg-gray-50 dark:bg-white/5 p-3.5 rounded-2xl border border-gray-100 dark:border-white/5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 dark:text-white">
                  <Clock size={14} className="text-amber-500" />
                  <span>Suspend Account</span>
                </div>
                <select
                  value={suspendDays}
                  onChange={(e) => setSuspendDays(e.target.value)}
                  className="text-[11px] font-semibold px-2 py-1 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/10 text-gray-800 dark:text-white outline-none"
                >
                  <option value="3">3 Days</option>
                  <option value="7">7 Days</option>
                  <option value="14">14 Days</option>
                  <option value="30">30 Days</option>
                  <option value="permanent">Indefinite</option>
                </select>
              </div>

              <button
                type="button"
                disabled={busy}
                onClick={handleSuspend}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold disabled:opacity-50 transition-colors shadow-xs"
              >
                <Clock size={14} /> Suspend User Account ({suspendDays === 'permanent' ? 'Indefinite' : `${suspendDays}d`})
              </button>
            </div>

            {/* Action 3: Ban Account */}
            <div className="pt-1">
              <button
                disabled={busy}
                onClick={() => doAction('User banned', () => apiClient.adminBanReportedUser(report.id))}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-red-600 text-white text-xs font-semibold disabled:opacity-50 hover:bg-red-700 transition-colors shadow-sm"
              >
                <Ban size={14} /> Permanent Ban Account
              </button>
            </div>
          </div>
        </div>
      </DialogContent>

      {/* Image Preview Lightbox rendered via Portal */}
      {previewImage &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
            onClick={() => setPreviewImage(null)}
          >
            <div className="relative max-w-3xl max-h-[90vh]">
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute -top-10 right-0 text-white hover:text-gray-300 p-1"
              >
                <X size={24} />
              </button>
              <img
                src={previewImage}
                alt="Reported media preview"
                className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl"
              />
            </div>
          </div>,
          document.body,
        )}
    </Dialog>
  );
}
