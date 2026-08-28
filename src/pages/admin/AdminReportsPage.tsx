// src/pages/admin/AdminReportsPage.tsx

import { useEffect, useState } from 'react';
import { Loader2, MessageSquareWarning, Ban, Clock, ShieldAlert } from 'lucide-react';
import { apiClient } from '@/api/client';
import type { AdminReportListItem, ReportStatus, ReportStatusCounts } from '@/api/client';
import { notify } from '@/components/ui/sonner';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

const STATUS_TABS: { value: ReportStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'reviewing', label: 'Reviewing' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'rejected', label: 'Rejected' },
];

const STATUS_COLORS: Record<ReportStatus, string> = {
  pending: 'bg-amber-100 text-amber-700',
  reviewing: 'bg-blue-100 text-blue-700',
  resolved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-gray-100 text-gray-500',
};

export default function AdminReportsPage() {
  const [status, setStatus] = useState<ReportStatus | 'all'>('pending');
  const [reports, setReports] = useState<AdminReportListItem[] | null>(null);
  const [counts, setCounts] = useState<ReportStatusCounts | null>(null);
  const [selected, setSelected] = useState<AdminReportListItem | null>(null);

  const load = () => {
    setReports(null);
    apiClient.adminListReports({ status, cursor: null }).then((res) => setReports(res.items)).catch((err: any) => notify.error('Failed to load reports', err.message));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    apiClient.adminGetReportStatusCounts().then(setCounts).catch(() => setCounts(null));
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-fraunces text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>
        <p className="text-sm text-gray-400 dark:text-white/40 mt-0.5">
          {counts ? `${counts.pending} pending · ${counts.reviewing} being reviewed` : 'Loading…'}
        </p>
      </div>

      <div className="flex gap-1.5">
        {STATUS_TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setStatus(t.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              status === t.value ? 'bg-[#1A6B3C] dark:bg-emerald-600 text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-white/50'
            }`}
          >
            {t.label} {t.value !== 'all' && counts ? `(${counts[t.value as ReportStatus]})` : ''}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-[#161D19] rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden">
        {!reports ? (
          <div className="flex justify-center py-14"><Loader2 className="animate-spin text-[#1A6B3C]" size={22} /></div>
        ) : reports.length === 0 ? (
          <p className="text-center text-sm text-gray-400 dark:text-white/40 py-14">No reports here.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/5 text-left text-xs text-gray-400 dark:text-white/40 uppercase tracking-wide">
                <th className="px-5 py-3 font-medium">Reported</th>
                <th className="px-5 py-3 font-medium">Reporter</th>
                <th className="px-5 py-3 font-medium">Violation</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id} onClick={() => setSelected(r)} className="border-b border-gray-50 dark:border-white/5 last:border-0 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-white/[0.02]">
                  <td className="px-5 py-3 font-semibold text-gray-800 dark:text-white/90">{r.reported_username ? `@${r.reported_username}` : '—'}</td>
                  <td className="px-5 py-3 text-gray-500 dark:text-white/60">{r.reporter_username ? `@${r.reporter_username}` : '—'}</td>
                  <td className="px-5 py-3">
                    <p className="text-gray-700 dark:text-white/80">{r.violation_label}</p>
                    <p className="text-xs text-gray-400">{r.category_label}</p>
                  </td>
                  <td className="px-5 py-3"><Badge className={`${STATUS_COLORS[r.status]} hover:${STATUS_COLORS[r.status]}`}>{r.status}</Badge></td>
                  <td className="px-5 py-3 text-gray-400 dark:text-white/40">{new Date(r.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-fraunces">Report Details</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-0.5">Reported</p>
              <p className="font-semibold">{report.reported_username ? `@${report.reported_username}` : '—'}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-0.5">Reporter</p>
              <p className="font-semibold">{report.reporter_username ? `@${report.reporter_username}` : '—'}</p>
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-400 mb-1">Violation</p>
            <p className="font-semibold">{report.violation_label}</p>
            <p className="text-xs text-gray-400">{report.category_label} · {new Date(report.created_at).toLocaleString()}</p>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-1">Internal Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-[#1A6B3C]"
              placeholder="Notes visible only to admins…"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button disabled={busy} onClick={() => setStatus('reviewing')} className="px-3 py-2 rounded-xl bg-blue-50 text-blue-700 text-xs font-semibold disabled:opacity-50">Mark Reviewing</button>
            <button disabled={busy} onClick={() => setStatus('resolved')} className="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold disabled:opacity-50">Resolve</button>
            <button disabled={busy} onClick={() => setStatus('rejected')} className="px-3 py-2 rounded-xl bg-gray-100 text-gray-600 text-xs font-semibold disabled:opacity-50">Reject</button>
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Actions against reported user</p>
            <div className="flex gap-2">
              <textarea
                value={warnMessage}
                onChange={(e) => setWarnMessage(e.target.value)}
                placeholder="Warning message…"
                rows={2}
                className="flex-1 px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-[#1A6B3C]"
              />
              <button
                disabled={busy || !warnMessage.trim()}
                onClick={() => doAction('Warning sent', () => apiClient.adminWarnReportedUser(report.id, warnMessage))}
                className="px-3 rounded-xl bg-amber-50 text-amber-700 text-xs font-semibold disabled:opacity-50 shrink-0"
              >
                <ShieldAlert size={14} className="mx-auto mb-0.5" /> Warn
              </button>
            </div>
            <div className="flex gap-2">
              <button disabled={busy} onClick={() => doAction('User suspended', () => apiClient.adminSuspendReportedUser(report.id))} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 text-amber-700 text-xs font-semibold disabled:opacity-50">
                <Clock size={13} /> Suspend
              </button>
              <button disabled={busy} onClick={() => doAction('User banned', () => apiClient.adminBanReportedUser(report.id))} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 text-red-700 text-xs font-semibold disabled:opacity-50">
                <Ban size={13} /> Ban
              </button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
