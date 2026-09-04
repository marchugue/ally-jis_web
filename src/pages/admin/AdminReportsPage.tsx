// src/pages/admin/AdminReportsPage.tsx

import { useEffect, useState } from 'react';
import { Loader2, MessageSquareWarning, Ban, Clock, ShieldAlert, Flag, User, CheckCircle2 } from 'lucide-react';
import { apiClient } from '@/api/client';
import type { AdminReportListItem, ReportStatus, ReportStatusCounts } from '@/api/client';
import { notify } from '@/components/ui/sonner';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

const STATUS_TABS: { value: ReportStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Reports' },
  { value: 'pending', label: 'Pending' },
  { value: 'reviewing', label: 'In Review' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'rejected', label: 'Rejected' },
];

const STATUS_COLORS: Record<ReportStatus, string> = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border-amber-300 dark:border-amber-500/30',
  reviewing: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300 border-blue-300 dark:border-blue-500/30',
  resolved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30',
  rejected: 'bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-white/60 border-gray-200 dark:border-white/10',
};

export default function AdminReportsPage() {
  const [status, setStatus] = useState<ReportStatus | 'all'>('pending');
  const [reports, setReports] = useState<AdminReportListItem[] | null>(null);
  const [counts, setCounts] = useState<ReportStatusCounts | null>(null);
  const [selected, setSelected] = useState<AdminReportListItem | null>(null);

  const load = () => {
    setReports(null);
    apiClient.adminListReports({ status, cursor: null })
      .then((res) => setReports(res.items))
      .catch((err: any) => notify.error('Failed to load reports', err.message));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

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

      {/* Filter Pills */}
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
                    <th className="px-5 py-3 font-semibold">Reported User</th>
                    <th className="px-5 py-3 font-semibold">Reporter</th>
                    <th className="px-5 py-3 font-semibold">Violation</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {reports.map((r) => (
                    <tr
                      key={r.id}
                      onClick={() => setSelected(r)}
                      className="cursor-pointer hover:bg-gray-50/80 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-5 py-3.5 font-semibold text-gray-900 dark:text-white">
                        {r.reported_username ? `@${r.reported_username}` : 'Unknown Profile'}
                      </td>
                      <td className="px-5 py-3.5 text-gray-500 dark:text-white/60">
                        {r.reporter_username ? `@${r.reporter_username}` : 'Anonymous Reporter'}
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-gray-800 dark:text-white/90 text-xs">{r.violation_label}</p>
                        <p className="text-[11px] text-gray-400 dark:text-white/40">{r.category_label}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge className={`border text-[11px] capitalize ${STATUS_COLORS[r.status]}`}>
                          {r.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-400 dark:text-white/40">
                        {new Date(r.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="block sm:hidden divide-y divide-gray-100 dark:divide-white/5">
              {reports.map((r) => (
                <div
                  key={r.id}
                  onClick={() => setSelected(r)}
                  className="p-4 space-y-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-gray-900 dark:text-white">
                      {r.reported_username ? `@${r.reported_username}` : 'Unknown Profile'}
                    </span>
                    <Badge className={`border text-[10px] capitalize ${STATUS_COLORS[r.status]}`}>
                      {r.status}
                    </Badge>
                  </div>
                  <p className="text-xs font-medium text-gray-700 dark:text-white/80">{r.violation_label}</p>
                  <div className="flex items-center justify-between text-[11px] text-gray-400 dark:text-white/40">
                    <span>By: {r.reporter_username ? `@${r.reporter_username}` : 'Anonymous'}</span>
                    <span>{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <ReportDetailSheet report={selected} onClose={() => setSelected(null)} onChanged={load} />
    </div>
  );
}

function ReportDetailSheet({ report, onClose, onChanged }: { report: AdminReportListItem | null; onClose: () => void; onChanged: () => void }) {
  const [notes, setNotes] = useState(report?.internal_notes ?? '');
  const [warnMessage, setWarnMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => setNotes(report?.internal_notes ?? ''), [report]);

  if (!report) return null;

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
    }
  };

  return (
    <Sheet open={!!report} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-white dark:bg-[#161D19] p-4 sm:p-6 border-l border-gray-200 dark:border-white/10">
        <SheetHeader className="pb-3 border-b border-gray-100 dark:border-white/5">
          <SheetTitle className="font-fraunces text-xl font-bold text-gray-900 dark:text-white">
            Report Investigation
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-2xl border border-gray-100 dark:border-white/5">
              <p className="text-xs text-gray-400 dark:text-white/40 mb-0.5">Reported Account</p>
              <p className="font-bold text-gray-900 dark:text-white">{report.reported_username ? `@${report.reported_username}` : '—'}</p>
            </div>
            <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-2xl border border-gray-100 dark:border-white/5">
              <p className="text-xs text-gray-400 dark:text-white/40 mb-0.5">Submitted By</p>
              <p className="font-bold text-gray-900 dark:text-white">{report.reporter_username ? `@${report.reporter_username}` : 'Anonymous'}</p>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-white/5 p-3.5 rounded-2xl border border-gray-100 dark:border-white/5 space-y-1">
            <p className="text-xs text-gray-400 dark:text-white/40">Violation Claim</p>
            <p className="font-bold text-gray-900 dark:text-white">{report.violation_label}</p>
            <p className="text-xs text-gray-500 dark:text-white/60">{report.category_label} · {new Date(report.created_at).toLocaleString()}</p>
          </div>

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

          <div className="grid grid-cols-3 gap-2">
            <button disabled={busy} onClick={() => setStatus('reviewing')} className="px-3 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 text-xs font-semibold disabled:opacity-50 hover:bg-blue-100 transition-colors">
              In Review
            </button>
            <button disabled={busy} onClick={() => setStatus('resolved')} className="px-3 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold disabled:opacity-50 hover:bg-emerald-100 transition-colors">
              Resolve
            </button>
            <button disabled={busy} onClick={() => setStatus('rejected')} className="px-3 py-2.5 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/70 text-xs font-semibold disabled:opacity-50 hover:bg-gray-200 transition-colors">
              Reject
            </button>
          </div>

          <div className="border-t border-gray-100 dark:border-white/5 pt-4 space-y-3">
            <p className="text-xs font-semibold text-gray-400 dark:text-white/40 uppercase tracking-wide">Punitive Actions</p>
            <div className="flex gap-2">
              <textarea
                value={warnMessage}
                onChange={(e) => setWarnMessage(e.target.value)}
                placeholder="Official warning message to user…"
                rows={2}
                className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white text-xs outline-none focus:border-[#1A6B3C]"
              />
              <button
                disabled={busy || !warnMessage.trim()}
                onClick={() => doAction('Warning sent', () => apiClient.adminWarnReportedUser(report.id, warnMessage))}
                className="px-3 rounded-xl bg-amber-500 text-white text-xs font-semibold disabled:opacity-50 shrink-0 hover:bg-amber-600 transition-colors flex items-center justify-center gap-1"
              >
                <ShieldAlert size={14} /> Warn
              </button>
            </div>
            <div className="flex gap-2">
              <button disabled={busy} onClick={() => doAction('User suspended', () => apiClient.adminSuspendReportedUser(report.id))} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 text-xs font-semibold disabled:opacity-50 hover:bg-amber-100 transition-colors">
                <Clock size={13} /> Suspend
              </button>
              <button disabled={busy} onClick={() => doAction('User banned', () => apiClient.adminBanReportedUser(report.id))} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-red-600 text-white text-xs font-semibold disabled:opacity-50 hover:bg-red-700 transition-colors shadow-sm">
                <Ban size={13} /> Ban Account
              </button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
