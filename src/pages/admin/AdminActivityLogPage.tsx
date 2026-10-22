// src/pages/admin/AdminActivityLogPage.tsx

import { useEffect, useState } from 'react';
import { Loader2, ScrollText } from 'lucide-react';
import { apiClient } from '@/api/client';
import type { AdminActivityLogRow } from '@/api/client';
import { notify } from '@/components/ui/sonner';
import { AvatarDisplay } from '@/components/ally/AvatarDisplay';

const ACTION_LABELS: Record<string, string> = {
  ban_user: 'Banned user',
  unban_user: 'Unbanned user',
  suspend_user: 'Suspended user',
  unsuspend_user: 'Unsuspended user',
  verify_user: 'Verified user',
  unverify_user: 'Removed verification',
  force_logout: 'Forced logout',
  reset_user_password: 'Sent password reset',
  delete_user: 'Deleted account',
  update_user: 'Edited profile',
  set_user_role: 'Changed role',
  grant_role_permission: 'Granted permission',
  revoke_role_permission: 'Revoked permission',
  warn_user: 'Warned user',
  report_pending: 'Marked report pending',
  report_reviewing: 'Marked report reviewing',
  report_resolved: 'Resolved report',
  report_rejected: 'Rejected report',
  report_add_notes: 'Added report notes',
};

export default function AdminActivityLogPage() {
  const [entries, setEntries] = useState<AdminActivityLogRow[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [filterQuery, setFilterQuery] = useState('');

  const load = (nextC: string | null = null, append = false) => {
    apiClient
      .listActivityLog(nextC)
      .then((res) => {
        setEntries((prev) => (append && prev ? [...prev, ...res.items] : res.items));
        setNextCursor(res.nextCursor);
        setCursor(nextC);
      })
      .catch((err: any) => notify.error('Failed to load activity log', err.message));
  };

  useEffect(() => {
    load(null);
  }, []);

  const filtered = entries?.filter((e) => {
    if (!filterQuery) return true;
    const q = filterQuery.toLowerCase();
    return (
      e.action.toLowerCase().includes(q) ||
      (ACTION_LABELS[e.action] ?? '').toLowerCase().includes(q) ||
      (e.target_user_id ?? '').toLowerCase().includes(q) ||
      (e.target_full_name ?? '').toLowerCase().includes(q) ||
      (e.target_username ?? '').toLowerCase().includes(q) ||
      (e.target_email ?? '').toLowerCase().includes(q) ||
      (e.admin_name ?? '').toLowerCase().includes(q) ||
      (e.admin_username ?? '').toLowerCase().includes(q) ||
      (e.admin_email ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 w-full pb-8">
      <div>
        <h1 className="font-fraunces text-2xl font-bold text-gray-900 dark:text-white">Activity Log</h1>
        <p className="text-sm text-gray-400 dark:text-white/40 mt-0.5">Every admin-tier action, logged automatically.</p>
      </div>

      <input
        value={filterQuery}
        onChange={(e) => setFilterQuery(e.target.value)}
        placeholder="Filter by action, admin, or target student name / email…"
        className="w-full max-w-md px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-white text-sm outline-none focus:border-[#1A6B3C]"
      />

      <div className="bg-white dark:bg-[#161D19] rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden">
        {!entries ? (
          <div className="flex justify-center py-14"><Loader2 className="animate-spin text-[#1A6B3C]" size={22} /></div>
        ) : filtered?.length === 0 ? (
          <p className="text-center text-sm text-gray-400 dark:text-white/40 py-14">No matching activity.</p>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-white/5">
            {filtered?.map((e) => {
              const targetDisplayName =
                e.target_full_name ||
                (e.target_username ? `@${e.target_username}` : e.target_user_id ? e.target_user_id.slice(0, 8) + '…' : null);
              const adminDisplayName = e.admin_name || (e.admin_username ? `@${e.admin_username}` : 'Admin');

              return (
                <div key={e.id} className="flex items-start sm:items-center gap-3.5 px-5 py-3.5 hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-[#1A6B3C]/10 dark:bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                    <ScrollText size={14} className="text-[#1A6B3C] dark:text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                        {ACTION_LABELS[e.action] ?? e.action}
                      </p>
                      <span className="text-[11px] text-gray-400 dark:text-white/40">
                        by <span className="font-medium text-gray-600 dark:text-white/70">{adminDisplayName}</span>
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-500 dark:text-white/50 mt-1">
                      {targetDisplayName ? (
                        <div className="flex items-center gap-1.5">
                          <span>Target:</span>
                          <AvatarDisplay
                            src={e.target_avatar}
                            name={targetDisplayName}
                            className="w-4 h-4 rounded-full inline-block"
                          />
                          <span className="font-medium text-gray-800 dark:text-white/80">
                            {targetDisplayName}
                          </span>
                          {e.target_username && e.target_full_name && (
                            <span className="text-[11px] text-gray-400">(@{e.target_username})</span>
                          )}
                          {e.target_email && (
                            <span className="text-[11px] text-gray-400">· {e.target_email}</span>
                          )}
                        </div>
                      ) : (
                        <span>No specific target</span>
                      )}
                      {e.ip_address && (
                        <span className="text-gray-400 dark:text-white/30 text-[11px]">· {e.ip_address}</span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-white/40 shrink-0 self-start sm:self-center">
                    {new Date(e.created_at).toLocaleString()}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {nextCursor && (
        <button onClick={() => load(nextCursor, true)} className="w-full text-center text-xs font-semibold text-[#1A6B3C] dark:text-emerald-400 py-2">
          Load more
        </button>
      )}
    </div>
  );
}
