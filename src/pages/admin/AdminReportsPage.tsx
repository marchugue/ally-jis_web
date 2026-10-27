// src/pages/admin/AdminReportsPage.tsx

import { useEffect, useState, useCallback } from 'react';
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
  RotateCw,
  CreditCard,
  ChevronDown,
  Check,
  ImageOff,
  MessageSquareX,
  Maximize2,
  Layers,
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
  const [studentDetail, setStudentDetail] = useState<AdminUserDetail | null>(null);
  const [loadingStudent, setLoadingStudent] = useState(false);
  const [side, setSide] = useState<'front' | 'back'>('front');
  const [isFlipping, setIsFlipping] = useState(false);
  const [activeTab, setActiveTab] = useState<'id_card' | 'evidence'>('id_card');
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

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
    setPreviewImage(null);
    setSelectedAction('resolve');

    const kind = getReportKind(report);
    const hasFlaggedContent = kind === 'post' || kind === 'message';

    if (report.reported_user_id) {
      setLoadingStudent(true);
      apiClient
        .adminGetUserDetail(report.reported_user_id)
        .then((detail) => {
          setStudentDetail(detail);
          // If student has no ID photo uploaded but report has flagged post/message evidence, default to evidence tab
          if (!detail.student_id_url && !detail.student_id_back_url && hasFlaggedContent) {
            setActiveTab('evidence');
          } else {
            setActiveTab('id_card');
          }
        })
        .catch((err) => {
          console.warn('Failed to load student detail', err);
          setStudentDetail(null);
          if (hasFlaggedContent) setActiveTab('evidence');
        })
        .finally(() => setLoadingStudent(false));
    } else {
      setStudentDetail(null);
      if (hasFlaggedContent) setActiveTab('evidence');
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
    <div className="fixed inset-0 z-[9999] bg-[#070A0F] text-white flex flex-col select-none overflow-hidden font-jakarta animate-in fade-in duration-200">
      {/* ── TOP HEADER BAR ── */}
      <header className="shrink-0 border-b border-white/10 bg-[#0C1118]/95 backdrop-blur-xl px-4 sm:px-6 py-3 z-30 shadow-md">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Left Cluster: Reported Student + Reporter + Violations */}
          <div className="flex items-center gap-4 sm:gap-6 flex-wrap min-w-0 flex-1">
            {/* 1. Who is that Student */}
            <div className="flex items-center gap-3 pr-4 sm:pr-6 border-r border-white/10 min-w-0">
              <div className="relative shrink-0">
                <AvatarDisplay
                  src={studentDetail?.avatar_url || report.reported_avatar}
                  name={getReportedDisplayName(report)}
                  className="w-10 h-10 rounded-full border-2 border-white/20 shadow-sm"
                />
                {(studentDetail?.student_verification_status === 'approved' || studentDetail?.chmsu_auto_verified) && (
                  <span
                    className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#0C1118] flex items-center justify-center text-[9px] text-white font-bold"
                    title="Verified Student"
                  >
                    ✓
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                    Reported Student
                  </span>
                  {studentDetail?.is_banned ? (
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-red-500/20 text-red-300 border border-red-500/30 uppercase">
                      Banned
                    </span>
                  ) : studentDetail?.is_suspended ? (
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                      Suspended
                    </span>
                  ) : null}
                </div>
                <p className="font-bold text-sm text-white truncate flex items-center gap-1.5">
                  {studentDetail?.full_name || getReportedDisplayName(report)}
                  {report.reported_username && report.reported_username.toLowerCase() !== 'anonymous' && (
                    <span className="text-xs text-white/50 font-normal">@{report.reported_username}</span>
                  )}
                </p>
                <p className="text-[11px] text-white/60 truncate max-w-xs">
                  {getStudentAcademicInfo(studentDetail, report)}
                  {studentDetail?.email ? ` · ${studentDetail.email}` : report.reported_email ? ` · ${report.reported_email}` : ''}
                </p>
              </div>
            </div>

            {/* 2. Submitted By */}
            <div className="flex items-center gap-2.5 pr-4 sm:pr-6 border-r border-white/10 min-w-0">
              <AvatarDisplay
                src={report.reporter_avatar}
                name={getReporterDisplayName(report)}
                className="w-8 h-8 rounded-full border border-white/15 shrink-0 text-xs"
              />
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">
                  Submitted By
                </span>
                <p className="font-semibold text-xs text-white truncate">
                  {getReporterDisplayName(report)}
                </p>
                <p className="text-[11px] text-white/50 truncate max-w-[180px]">
                  {report.reporter_email || (report.reporter_username ? `@${report.reporter_username}` : 'Student Reporter')}
                </p>
              </div>
            </div>

            {/* 3. Violations & Info */}
            <div className="flex items-center gap-3 flex-wrap min-w-0">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-red-500/20 text-red-300 border border-red-500/30">
                    <AlertTriangle size={12} /> {report.violation_label}
                  </span>
                  <span className="text-xs text-white/60 font-medium">
                    {report.category_label}
                  </span>
                  <span className="text-xs text-white/40">·</span>
                  <span className="text-xs text-white/50">
                    {new Date(report.created_at).toLocaleDateString()}
                  </span>
                </div>
                {reporterDetails && (
                  <p className="text-[11px] text-white/70 italic truncate max-w-md" title={reporterDetails}>
                    "{reporterDetails}"
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right Cluster: Status + ONE ONLY CTA Action Button + Close */}
          <div className="flex items-center gap-2.5 shrink-0 ml-auto">
            {/* Status Badge */}
            <Badge className={`border text-xs capitalize ${STATUS_COLORS[report.status]}`}>
              {report.status}
            </Badge>

            {/* ONE ONLY CTA ACTION BUTTON */}
            <button
              type="button"
              onClick={() => setActionModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1A6B3C] hover:bg-[#14532D] text-white font-bold text-xs shadow-lg shadow-emerald-950/40 border border-emerald-500/30 transition-all active:scale-95 cursor-pointer"
            >
              <ShieldAlert size={14} />
              <span>Take Action</span>
              <ChevronDown size={13} className="opacity-70" />
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Close Full Screen (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* ── CENTER FULL-VIEW STAGE ── */}
      <main className="flex-1 flex flex-col items-center justify-center p-3 sm:p-6 relative overflow-hidden bg-gradient-to-b from-[#070A0F] to-[#0A0F17]">
        {/* Stage Toolbar */}
        <div className="w-full max-w-4xl flex items-center justify-between gap-3 mb-3 flex-wrap px-1">
          {/* View Tab Switcher */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
            <button
              type="button"
              onClick={() => setActiveTab('id_card')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'id_card'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-white/60 hover:text-white'
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'evidence'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {isPostReport ? <FileText size={13} /> : <MessageSquare size={13} />}
                <span>Flagged {isPostReport ? 'Post Evidence' : 'Chat Message'}</span>
              </button>
            )}
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2">
            {/* Flip Card Action Button (ONLY in id_card tab!) */}
            {activeTab === 'id_card' && (
              <button
                type="button"
                onClick={toggleFlip}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/50 backdrop-blur-md transition-all active:scale-95 cursor-pointer border border-emerald-400/30"
                title="Click to flip (Space / F)"
              >
                <RotateCw size={13} className={isFlipping ? 'animate-spin' : ''} />
                <span>Flip ({side === 'front' ? 'Front Side' : 'Back Side'})</span>
              </button>
            )}

            {activeImageUrl && (
              <a
                href={activeImageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/90 text-xs font-semibold backdrop-blur-md transition-colors"
                title="Open high resolution original image in new tab"
              >
                <ExternalLink size={13} />
                <span className="hidden sm:inline">Open Original</span>
              </a>
            )}

            {activeTab === 'id_card' && (
              <span className="text-[11px] text-white/40 hidden md:inline ml-1">
                Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/70 font-mono text-[10px]">Space</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/70 font-mono text-[10px]">F</kbd> to Flip
              </span>
            )}
          </div>
        </div>

        {/* ── CARD DISPLAY STAGE ── */}
        {activeTab === 'id_card' ? (
          /* 3D Flippable Student ID Card */
          <div
            className="w-full max-w-4xl h-[62vh] sm:h-[68vh] relative select-none"
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
                className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden border border-white/10 bg-[#101722]/90 shadow-2xl flex flex-col items-center justify-center cursor-pointer group backdrop-blur-xs"
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                }}
              >
                {frontIdUrl ? (
                  <div className="relative w-full h-full flex items-center justify-center p-3">
                    <img
                      src={frontIdUrl}
                      alt="Student ID Front"
                      className="max-w-full max-h-full object-contain rounded-xl shadow-lg group-hover:scale-[1.01] transition-transform duration-200"
                    />
                    <div className="absolute top-4 left-4 px-3 py-1 rounded-lg bg-black/75 backdrop-blur-md text-white text-[11px] font-bold tracking-wider border border-white/15 flex items-center gap-1.5">
                      <CreditCard size={12} className="text-emerald-400" />
                      <span>STUDENT ID · FRONT</span>
                    </div>
                    <div className="absolute top-4 right-4 px-3 py-1 rounded-lg bg-white/15 hover:bg-white/25 backdrop-blur-md text-white text-[11px] font-semibold flex items-center gap-1.5 border border-white/20 shadow-sm transition-colors">
                      <RotateCw size={11} /> Flip to Back
                    </div>
                    <div className="absolute bottom-4 inset-x-0 mx-auto w-fit px-3.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white/70 text-[11px] pointer-events-none">
                      Click image or Flip button to flip
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-white/[0.02]">
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
                className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden border border-white/10 bg-[#101722]/90 shadow-2xl flex flex-col items-center justify-center cursor-pointer group backdrop-blur-xs"
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                }}
              >
                {backIdUrl ? (
                  <div className="relative w-full h-full flex items-center justify-center p-3">
                    <img
                      src={backIdUrl}
                      alt="Student ID Back"
                      className="max-w-full max-h-full object-contain rounded-xl shadow-lg group-hover:scale-[1.01] transition-transform duration-200"
                    />
                    <div className="absolute top-4 left-4 px-3 py-1 rounded-lg bg-black/75 backdrop-blur-md text-white text-[11px] font-bold tracking-wider border border-white/15 flex items-center gap-1.5">
                      <CreditCard size={12} className="text-blue-400" />
                      <span>STUDENT ID · BACK</span>
                    </div>
                    <div className="absolute top-4 right-4 px-3 py-1 rounded-lg bg-white/15 hover:bg-white/25 backdrop-blur-md text-white text-[11px] font-semibold flex items-center gap-1.5 border border-white/20 shadow-sm transition-colors">
                      <RotateCw size={11} /> Flip to Front
                    </div>
                    <div className="absolute bottom-4 inset-x-0 mx-auto w-fit px-3.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white/70 text-[11px] pointer-events-none">
                      Click image or Flip button to flip
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-white/[0.02]">
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
        ) : (
          /* ── FLAGGED CONTENT EVIDENCE (NO FLIP, FULL BLEED / ENTIRE PICTURE & LABELED POSTCARD) ── */
          <div className="w-full max-w-4xl h-[62vh] sm:h-[68vh] rounded-2xl overflow-hidden border border-white/10 bg-[#0C121B] shadow-2xl flex flex-col relative select-none">
            {isPostReport && (
              <>
                {/* 1. Labeled Postcard Header */}
                <div className="shrink-0 px-4 py-3 bg-[#111924] border-b border-white/10 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2.5">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      <FileText size={12} /> Flagged Post Evidence
                    </span>
                    {post && (
                      <div className="flex items-center gap-2 pl-2 border-l border-white/10">
                        <AvatarDisplay
                          src={post.author_avatar || report.reported_avatar}
                          name={post.author_name || getReportedDisplayName(report)}
                          className="w-6 h-6 rounded-full"
                        />
                        <span className="text-xs font-bold text-white">
                          {post.author_name || getReportedDisplayName(report)}
                        </span>
                        <span className="text-[11px] text-white/50">
                          @{post.author_username || report.reported_username}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {post?.is_deleted || post?.is_deleted_from_feed ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-500/20 text-red-300 border border-red-500/30">
                        <AlertTriangle size={11} /> Deleted from Feed by Author
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <CheckCircle2 size={11} /> Active on Live Feed
                      </span>
                    )}
                    {post?.created_at && (
                      <span className="text-[11px] text-white/40">
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* 2. Photo Media Full Bleed / Entire Picture Display */}
                <div className="flex-1 min-h-0 relative bg-black flex items-center justify-center overflow-hidden group">
                  {post?.media && post.media.length > 0 ? (
                    <div
                      className="relative w-full h-full flex items-center justify-center cursor-pointer"
                      onClick={() => setPreviewImage(post.media![currentPhotoIndex]?.url || post.media![0].url)}
                      title="Click to view entire picture in fullscreen"
                    >
                      {(post.media[currentPhotoIndex]?.url || post.media[0].url) === '[removed]' ? (
                        <div className="w-full max-w-md p-6 rounded-2xl bg-white/5 border border-dashed border-white/20 text-center space-y-2">
                          <ImageOff size={28} className="mx-auto text-white/40 mb-1" />
                          <p className="text-xs text-white/60 font-medium">This photo was removed for violating community standards.</p>
                        </div>
                      ) : (
                        <img
                          src={post.media[currentPhotoIndex]?.url || post.media[0].url}
                          alt="Flagged Post Media"
                          className="w-full h-full object-contain group-hover:scale-[1.01] transition-transform duration-200"
                        />
                      )}

                      {/* Click Fullscreen Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewImage(post.media![currentPhotoIndex]?.url || post.media![0].url);
                        }}
                        className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-black/75 hover:bg-black/90 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1.5 border border-white/20 shadow-xl transition-all cursor-pointer"
                      >
                        <Maximize2 size={13} />
                        <span>Click Fullscreen (Entire Picture)</span>
                      </button>

                      {/* Multi-photo Selector Pills */}
                      {post.media.length > 1 && (
                        <div
                          className="absolute top-3 left-3 flex items-center gap-1.5 p-1 rounded-xl bg-black/70 backdrop-blur-md border border-white/15"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {post.media.map((_, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setCurrentPhotoIndex(idx)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                currentPhotoIndex === idx
                                  ? 'bg-purple-600 text-white'
                                  : 'text-white/60 hover:text-white'
                              }`}
                            >
                              Photo {idx + 1}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Bottom Floating Caption Banner on Photo */}
                      {post.content && (
                        <div
                          className="absolute bottom-3 inset-x-3 p-3 rounded-xl bg-black/80 backdrop-blur-md border border-white/10 max-h-24 overflow-y-auto"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <p className="text-[10px] font-bold uppercase tracking-wider text-purple-300 mb-0.5">
                            Post Caption & Content
                          </p>
                          <p className="text-xs text-white leading-relaxed whitespace-pre-wrap font-jakarta">
                            {post.content}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Text-Only Post */
                    <div className="w-full h-full p-6 flex flex-col justify-center items-center text-center max-w-xl mx-auto overflow-y-auto">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-purple-400 mb-2">
                        Post Content & Text
                      </p>
                      <blockquote className="text-base sm:text-lg text-white font-medium leading-relaxed italic bg-white/5 p-6 rounded-2xl border border-white/10 w-full text-left whitespace-pre-wrap">
                        "{post?.content || '[No text content]'}"
                      </blockquote>
                    </div>
                  )}
                </div>

                {/* 3. Postcard Footer Strip */}
                <div className="shrink-0 px-4 py-2.5 bg-[#111924] border-t border-white/10 flex items-center justify-between text-xs text-white/50 flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-white/70">
                      <Heart size={13} className="text-red-400" /> {post?.likes_count ?? 0} likes
                    </span>
                    <span className="flex items-center gap-1 text-white/70">
                      <MessageSquare size={13} className="text-blue-400" /> {post?.comments_count ?? 0} comments
                    </span>
                    <span className="text-[11px] font-mono text-white/40">
                      ID: {(report.post_id || post?.id || '').slice(0, 8)}…
                    </span>
                  </div>

                  {!post?.is_deleted && !post?.is_deleted_from_feed && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={async () => {
                        const targetPostId = report.post_id || post?.id;
                        if (!targetPostId) return;
                        if (!window.confirm('Delete this reported post from feed?')) return;
                        setBusy(true);
                        try {
                          await apiClient.adminDeleteReportedPost(report.id, targetPostId);
                          notify.success('Post deleted from feed');
                          onChanged();
                          onClose();
                        } catch (err: any) {
                          notify.error('Failed to delete post', err.message);
                        } finally {
                          setBusy(false);
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 size={12} />
                      <span>Delete Post From Feed</span>
                    </button>
                  )}
                </div>
              </>
            )}

            {isMessageReport && (
              /* Chat Message Evidence View */
              <div className="w-full h-full flex flex-col">
                <div className="shrink-0 px-4 py-3 bg-[#111924] border-b border-white/10 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      <MessageSquare size={12} /> Flagged Chat Message
                    </span>
                    <span className="text-xs text-white/70">
                      From: {message?.sender_name || getReportedDisplayName(report)}
                    </span>
                  </div>
                  <span className="text-[10px] text-white/40 font-mono">
                    MSG: {(report.message_id || message?.id || '').slice(0, 8)}…
                  </span>
                </div>

                <div className="flex-1 p-6 overflow-y-auto flex flex-col justify-center items-center">
                  <div className="max-w-xl w-full p-4 rounded-2xl bg-[#1E293B] border border-amber-400/50 shadow-xl space-y-3">
                    {message?.image_url && (
                      message.image_url === '[removed]' ? (
                        <div className="w-full p-4 rounded-xl bg-black/40 border border-dashed border-white/20 text-center space-y-1">
                          <ImageOff size={24} className="mx-auto text-white/40 mb-1" />
                          <p className="text-xs text-white/60 italic">This photo was removed for violating community standards.</p>
                        </div>
                      ) : (
                        <div
                          className="rounded-xl overflow-hidden aspect-video bg-black/40 border border-white/10 relative cursor-pointer group"
                          onClick={() => setPreviewImage(message.image_url!)}
                          title="Click to view entire picture in fullscreen"
                        >
                          <img src={message.image_url} alt="Attached" className="w-full h-full object-contain" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1">
                            <Maximize2 size={14} /> View Entire Picture Fullscreen
                          </div>
                        </div>
                      )
                    )}
                    <p className="text-sm text-white leading-relaxed">{message?.content || '[Image Only]'}</p>
                    <p className="text-[10px] text-white/40 text-right">
                      {message?.created_at ? new Date(message.created_at).toLocaleString() : ''}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── SINGLE CTA ACTION MODAL (DIRECT FIXED OVERLAY AT Z-[10000]) ── */}
      {actionModalOpen && (
        <div
          className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setActionModalOpen(false)}
        >
          <div
            className="relative max-w-xl w-full max-h-[90vh] overflow-y-auto bg-[#141B24] border border-white/15 text-white p-6 rounded-2xl shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h3 className="font-fraunces text-lg font-bold text-white flex items-center gap-2">
                  <ShieldAlert size={18} className="text-emerald-400" />
                  Take Action on Report
                </h3>
                <p className="text-xs text-white/50 mt-0.5">
                  Select a single moderation resolution for report #{report.id.slice(0, 8)}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActionModalOpen(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Target Summary Strip */}
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <AvatarDisplay
                  src={studentDetail?.avatar_url || report.reported_avatar}
                  name={getReportedDisplayName(report)}
                  className="w-8 h-8 rounded-full border border-white/15"
                />
                <div className="min-w-0">
                  <p className="font-bold text-xs text-white truncate">
                    {studentDetail?.full_name || getReportedDisplayName(report)}
                  </p>
                  <p className="text-[11px] text-white/50 truncate">
                    {report.reported_email || (report.reported_username ? `@${report.reported_username}` : '')}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 uppercase shrink-0">
                {report.violation_label}
              </span>
            </div>

            {/* Action Radio Options */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                Select Moderation Resolution
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* 1. Resolve */}
                <label
                  className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                    selectedAction === 'resolve'
                      ? 'border-emerald-500 bg-emerald-950/30 ring-1 ring-emerald-500'
                      : 'border-white/10 bg-white/5 hover:bg-white/[0.08]'
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
                    <p className="text-xs font-bold text-white flex items-center gap-1.5">
                      <CheckCircle2 size={13} className="text-emerald-400" /> Resolve Report
                    </p>
                    <p className="text-[11px] text-white/50 mt-0.5">Mark resolved without account penalty</p>
                  </div>
                </label>

                {/* 2. Reviewing */}
                <label
                  className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                    selectedAction === 'reviewing'
                      ? 'border-blue-500 bg-blue-950/30 ring-1 ring-blue-500'
                      : 'border-white/10 bg-white/5 hover:bg-white/[0.08]'
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
                    <p className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Clock size={13} className="text-blue-400" /> Mark In Review
                    </p>
                    <p className="text-[11px] text-white/50 mt-0.5">Keep under ongoing investigation</p>
                  </div>
                </label>

                {/* 3. Reject */}
                <label
                  className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                    selectedAction === 'reject'
                      ? 'border-gray-400 bg-white/10 ring-1 ring-gray-400'
                      : 'border-white/10 bg-white/5 hover:bg-white/[0.08]'
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
                    <p className="text-xs font-bold text-white flex items-center gap-1.5">
                      <X size={13} className="text-gray-400" /> Dismiss / Reject
                    </p>
                    <p className="text-[11px] text-white/50 mt-0.5">Dismiss as unwarranted or false</p>
                  </div>
                </label>

                {/* 4. Warn */}
                <label
                  className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                    selectedAction === 'warn'
                      ? 'border-amber-500 bg-amber-950/30 ring-1 ring-amber-500'
                      : 'border-white/10 bg-white/5 hover:bg-white/[0.08]'
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
                    <p className="text-xs font-bold text-white flex items-center gap-1.5">
                      <ShieldAlert size={13} className="text-amber-400" /> Issue Warning
                    </p>
                    <p className="text-[11px] text-white/50 mt-0.5">Send official warning notification</p>
                  </div>
                </label>

                {/* 5. Suspend */}
                <label
                  className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                    selectedAction === 'suspend'
                      ? 'border-amber-500 bg-amber-950/30 ring-1 ring-amber-500'
                      : 'border-white/10 bg-white/5 hover:bg-white/[0.08]'
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
                    <p className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Clock size={13} className="text-amber-400" /> Suspend Student
                    </p>
                    <p className="text-[11px] text-white/50 mt-0.5">Restrict student account access</p>
                  </div>
                </label>

                {/* 6. Ban */}
                <label
                  className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                    selectedAction === 'ban'
                      ? 'border-red-500 bg-red-950/30 ring-1 ring-red-500'
                      : 'border-white/10 bg-white/5 hover:bg-white/[0.08]'
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
                    <p className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Ban size={13} className="text-red-400" /> Permanent Ban
                    </p>
                    <p className="text-[11px] text-white/50 mt-0.5">Permanently ban student account</p>
                  </div>
                </label>

                {/* 7. Delete Post */}
                {isPostReport && !post?.is_deleted && !post?.is_deleted_from_feed && (
                  <label
                    className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                      selectedAction === 'delete_post'
                        ? 'border-red-500 bg-red-950/30 ring-1 ring-red-500'
                        : 'border-white/10 bg-white/5 hover:bg-white/[0.08]'
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
                      <p className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Trash2 size={13} className="text-red-400" /> Delete Reported Post
                      </p>
                      <p className="text-[11px] text-white/50 mt-0.5">Remove flagged post from student feed</p>
                    </div>
                  </label>
                )}

                {/* 8. Remove Message */}
                {(Boolean(isMessageReport && message?.content) || Boolean(isPostReport && post?.content)) && (
                  <label
                    className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                      selectedAction === 'remove_message'
                        ? 'border-red-500 bg-red-950/30 ring-1 ring-red-500'
                        : 'border-white/10 bg-white/5 hover:bg-white/[0.08]'
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
                      <p className="text-xs font-bold text-white flex items-center gap-1.5">
                        <MessageSquareX size={13} className="text-red-400" /> Remove Message
                      </p>
                      <p className="text-[11px] text-white/50 mt-0.5">Replace with "This message was removed"</p>
                    </div>
                  </label>
                )}

                {/* 9. Remove Media */}
                {(Boolean(isMessageReport && message?.image_url) || Boolean(isPostReport && post?.media && post.media.length > 0)) && (
                  <label
                    className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                      selectedAction === 'remove_media'
                        ? 'border-red-500 bg-red-950/30 ring-1 ring-red-500'
                        : 'border-white/10 bg-white/5 hover:bg-white/[0.08]'
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
                      <p className="text-xs font-bold text-white flex items-center gap-1.5">
                        <ImageOff size={13} className="text-red-400" /> Remove Media
                      </p>
                      <p className="text-[11px] text-white/50 mt-0.5">Replace photo with guidelines notice</p>
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
                      className="text-[10px] px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white/80 transition-colors cursor-pointer"
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
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs outline-none focus:border-amber-400"
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
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white outline-none cursor-pointer"
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
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                Internal Admin Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Private notes visible only to the moderation team..."
                rows={2}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-emerald-500"
              />
            </div>

            {/* Actions Submit */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setActionModalOpen(false)}
                disabled={busy}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors cursor-pointer"
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
