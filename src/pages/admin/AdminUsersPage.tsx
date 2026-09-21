// src/pages/admin/AdminUsersPage.tsx

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { createPortal } from 'react-dom';
import {
  Search, MoreHorizontal, ShieldCheck, ShieldOff, Ban, Clock,
  KeyRound, LogOut as LogOutIcon, Trash2, BadgeCheck, X, Loader2,
  CheckCircle2, XCircle, CreditCard, ExternalLink, Calendar,
  Building2, GraduationCap, Mail, UserCheck, ImageOff, RotateCw
} from 'lucide-react';
import { apiClient } from '@/api/client';
import type { AdminUserDetail, AdminUserListItem, ListUsersQuery, PendingVerificationItem } from '@/api/client';
import { notify } from '@/components/ui/sonner';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

function StudentAvatar({
  src,
  name,
  size = 'md',
}: {
  src?: string | null;
  name?: string | null;
  size?: 'sm' | 'md' | 'lg';
}) {
  const [error, setError] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-xs',
    lg: 'w-16 h-16 text-xl font-bold',
  }[size];

  const initial = (name ?? 'U').trim()[0]?.toUpperCase() ?? 'U';

  return (
    <div className={`${sizeClasses} rounded-full bg-gradient-to-br from-[#1A6B3C]/20 to-emerald-600/30 dark:from-emerald-500/30 dark:to-teal-500/30 overflow-hidden shrink-0 border border-gray-200 dark:border-white/10 flex items-center justify-center text-[#1A6B3C] dark:text-emerald-300 font-bold shadow-xs select-none`}>
      {src && !error ? (
        <img
          src={src}
          onError={() => setError(true)}
          className="w-full h-full object-cover"
          alt={name ?? 'Student avatar'}
        />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );
}

function StatusBadge({ user, onClick }: { user: AdminUserListItem; onClick?: () => void }) {
  if (user.is_banned) {
    return (
      <Badge
        onClick={onClick}
        className="bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 hover:bg-red-500/20 cursor-pointer flex items-center gap-1 w-fit"
      >
        <Ban size={11} /> Banned
      </Badge>
    );
  }
  if (user.is_suspended) {
    return (
      <Badge
        onClick={onClick}
        className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 cursor-pointer flex items-center gap-1 w-fit"
      >
        <Clock size={11} /> Suspended
      </Badge>
    );
  }
  if (user.admin_verified || user.chmsu_auto_verified || user.student_verification_status === 'approved') {
    return (
      <Badge
        onClick={onClick}
        className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 cursor-pointer flex items-center gap-1 w-fit"
      >
        <BadgeCheck size={11} /> Verified
      </Badge>
    );
  }
  if (user.student_verification_status === 'rejected') {
    return (
      <Badge
        onClick={onClick}
        className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 cursor-pointer flex items-center gap-1 w-fit"
      >
        <XCircle size={11} /> ID Rejected
      </Badge>
    );
  }

  // Verification Needed (Yellow / Amber Pulsing Badge)
  const isPendingVerification =
    user.email_type === 'external' ||
    user.pending_student_verification === true ||
    user.student_verification_status === 'pending' ||
    Boolean(user.student_id_url);

  if (isPendingVerification) {
    return (
      <Badge
        onClick={onClick}
        className="bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 cursor-pointer flex items-center gap-1 w-fit animate-pulse font-semibold"
      >
        <CreditCard size={11} /> Verification Needed
      </Badge>
    );
  }

  return (
    <Badge
      onClick={onClick}
      className="bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-500/20 hover:bg-teal-500/20 cursor-pointer flex items-center gap-1 w-fit"
    >
      <UserCheck size={11} /> Active
    </Badge>
  );
}

function FormatLastSeen({ dateStr }: { dateStr: string | null }) {
  if (!dateStr) return <span className="text-xs text-gray-400 dark:text-white/30">Offline</span>;
  const lastSeen = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - lastSeen.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));

  if (diffMins < 5) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> Online
      </span>
    );
  }
  if (diffMins < 60) return <span className="text-xs text-gray-400 dark:text-white/40">{diffMins}m ago</span>;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return <span className="text-xs text-gray-400 dark:text-white/40">{diffHours}h ago</span>;
  return <span className="text-xs text-gray-400 dark:text-white/40">{lastSeen.toLocaleDateString()}</span>;
}

const STATUS_FILTERS: { value: ListUsersQuery['status']; label: string }[] = [
  { value: 'all', label: 'All Students' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Verification Needed' },
  { value: 'verified', label: 'Verified' },
  { value: 'banned', label: 'Banned' },
  { value: 'suspended', label: 'Suspended' },
];

const ensurePointerEvents = () => {
  // Radix UI can leave pointer-events stuck at 'none' on document.body
  // when an element or overlay is unmounted mid-animation or mid-action.
  setTimeout(() => {
    document.body.style.pointerEvents = '';
  }, 50);
};

export default function AdminUsersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'users' | 'pending'>(() => {
    return searchParams.get('tab') === 'pending' ? 'pending' : 'users';
  });
  const [users, setUsers] = useState<AdminUserListItem[] | null>(null);
  const [total, setTotal] = useState(0);
  const [cursor, setCursor] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ListUsersQuery['status']>('all');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ userId: string; label: string; run: () => Promise<void> } | null>(null);
  const [pendingItems, setPendingItems] = useState<PendingVerificationItem[] | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  // Sync tab with URL search parameter
  const handleTabChange = (tab: 'users' | 'pending') => {
    setActiveTab(tab);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (tab === 'pending') next.set('tab', 'pending');
      else next.delete('tab');
      return next;
    });
  };

  const loadPending = () => {
    setPendingItems((prev) => (prev === null ? null : prev));
    apiClient.adminListPendingVerifications()
      .then((items) => {
        setPendingItems(items);
        setPendingCount(items.length);
      })
      .catch((err: any) => {
        console.error('Failed to load pending verifications:', err);
        setPendingItems([]);
        notify.error('Failed to load pending verifications', err.message);
      })
      .finally(() => {
        ensurePointerEvents();
      });
  };

  const load = (nextC: string | null = null) => {
    // Only blank out users on initial uninitialized load to prevent violent DOM unmounting
    if (users === null) {
      setUsers(null);
    }
    apiClient
      .adminListUsers({ search: search || undefined, status, cursor: nextC })
      .then((res) => {
        setUsers(res.items);
        setTotal(res.total);
        setNextCursor(res.nextCursor);
        setCursor(nextC);
      })
      .catch((err: any) => {
        console.error('Failed to load users:', err);
        if (!users) setUsers([]);
        notify.error('Failed to load users', err.message);
      })
      .finally(() => {
        ensurePointerEvents();
      });
  };

  useEffect(() => {
    if (activeTab === 'users') load(null);
    else loadPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, activeTab]);

  const runAction = async (userId: string, label: string, action: () => Promise<void>) => {
    try {
      // Optimistic updates to make UI instantaneous and prevent stale UI freezing
      const lower = label.toLowerCase();
      if (lower.includes('delete')) {
        setUsers((prev) => (prev ? prev.filter((u) => u.id !== userId) : prev));
        setTotal((prev) => Math.max(0, prev - 1));
      } else if (lower.includes('unban')) {
        setUsers((prev) =>
          prev ? prev.map((u) => (u.id === userId ? { ...u, is_banned: false } : u)) : prev
        );
      } else if (lower.includes('ban')) {
        setUsers((prev) =>
          prev ? prev.map((u) => (u.id === userId ? { ...u, is_banned: true } : u)) : prev
        );
      } else if (lower.includes('unsuspend')) {
        setUsers((prev) =>
          prev ? prev.map((u) => (u.id === userId ? { ...u, is_suspended: false } : u)) : prev
        );
      } else if (lower.includes('suspend')) {
        setUsers((prev) =>
          prev ? prev.map((u) => (u.id === userId ? { ...u, is_suspended: true } : u)) : prev
        );
      } else if (lower.includes('grant') || lower.includes('verified')) {
        setUsers((prev) =>
          prev ? prev.map((u) => (u.id === userId ? { ...u, admin_verified: true } : u)) : prev
        );
      } else if (lower.includes('revoke')) {
        setUsers((prev) =>
          prev ? prev.map((u) => (u.id === userId ? { ...u, admin_verified: false } : u)) : prev
        );
      }

      await action();
      notify.success(label);
      load(cursor);
      if (activeTab === 'pending') loadPending();
    } catch (err: any) {
      notify.error(`Could not ${label.toLowerCase()}`, err.message);
      load(cursor);
    } finally {
      ensurePointerEvents();
    }
  };

  return (
    <div className="space-y-6 w-full pb-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#161D19] p-4 sm:p-5 rounded-2xl border border-gray-200/80 dark:border-white/10 shadow-xs">
        <div>
          <h1 className="font-fraunces text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            User Directory
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-white/40 mt-0.5 font-medium">
            <span className="tabular-nums font-bold text-gray-800 dark:text-white/80">{total.toLocaleString()}</span> registered students & accounts
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/5 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => handleTabChange('users')}
            className={`flex-1 sm:flex-none px-4 py-2 min-h-[44px] rounded-lg text-xs font-semibold transition-all duration-150 active:scale-[0.98] ${
              activeTab === 'users'
                ? 'bg-white dark:bg-white/10 text-[#1A6B3C] dark:text-emerald-400 shadow-xs'
                : 'text-gray-500 dark:text-white/50 hover:text-gray-700 dark:hover:text-white'
            }`}
          >
            All Users
          </button>
          <button
            onClick={() => handleTabChange('pending')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 min-h-[44px] rounded-lg text-xs font-semibold transition-all duration-150 active:scale-[0.98] ${
              activeTab === 'pending'
                ? 'bg-white dark:bg-white/10 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-gray-500 dark:text-white/50 hover:text-gray-700 dark:hover:text-white'
            }`}
          >
            <CreditCard size={14} /> Verification Needed
            {pendingCount > 0 && (
              <span className="bg-amber-500 text-white rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none animate-pulse tabular-nums font-fraunces">
                {pendingCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === 'pending' && (
        <PendingVerificationsPanel
          items={pendingItems}
          onAction={loadPending}
          onSelectUser={setSelectedUserId}
        />
      )}

      {activeTab === 'users' && (
        <>
          {/* Controls: Search & Filters */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && load(null)}
                placeholder="Search student by name, username, or email…"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white text-sm outline-none focus:border-[#1A6B3C] dark:focus:border-emerald-500 transition-all shadow-xs"
              />
            </div>
            
            {/* Filter pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setStatus(f.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150 active:scale-[0.96] ${
                    status === f.value
                      ? 'bg-[#1A6B3C] dark:bg-emerald-600 text-white shadow-xs font-semibold'
                      : 'bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/10'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* User Table & Mobile Cards */}
          <div className="bg-white dark:bg-[#161D19] rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden">
            {!users ? (
              <div className="flex justify-center py-16">
                <Loader2 className="animate-spin text-[#1A6B3C] dark:text-emerald-400" size={26} />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-16 px-4">
                <Mail className="w-10 h-10 text-gray-300 dark:text-white/20 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-500 dark:text-white/40">No student accounts found matching your query.</p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02] text-xs text-gray-400 dark:text-white/40 uppercase tracking-wider">
                        <th className="px-5 py-3 font-semibold">Student Info</th>
                        <th className="px-5 py-3 font-semibold">Department & Course</th>
                        <th className="px-5 py-3 font-semibold">Verification Status</th>
                        <th className="px-5 py-3 font-semibold">Activity</th>
                        <th className="px-5 py-3 text-right font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                      {users.map((u) => (
                        <tr
                          key={u.id}
                          className="hover:bg-gray-50/80 dark:hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="px-5 py-3.5 cursor-pointer" onClick={() => setSelectedUserId(u.id)}>
                            <div className="flex items-center gap-3">
                              <StudentAvatar src={u.avatar_url} name={u.full_name ?? u.username} size="md" />
                              <div className="min-w-0">
                                <p className="font-semibold text-gray-900 dark:text-white/90 flex items-center gap-1.5 truncate">
                                  {u.full_name ?? u.username ?? 'Unnamed'}
                                  {u.username && <span className="text-xs text-gray-400 font-normal">@{u.username}</span>}
                                </p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <p className="text-xs text-gray-500 dark:text-white/40 truncate">{u.email}</p>
                                  {u.email_type === 'chmsu' ? (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-medium">
                                      CHMSU
                                    </span>
                                  ) : (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 font-medium">
                                      External
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          
                          <td className="px-5 py-3.5 text-gray-600 dark:text-white/70">
                            <p className="text-xs font-medium text-gray-800 dark:text-white/80">{u.department ?? 'No Department'}</p>
                            <p className="text-[11px] text-gray-400 dark:text-white/40">{u.course ?? 'No Course'} {u.year_level ? `· Year ${u.year_level}` : ''}</p>
                          </td>

                          <td className="px-5 py-3.5">
                            <StatusBadge user={u} onClick={() => setSelectedUserId(u.id)} />
                          </td>

                          <td className="px-5 py-3.5">
                            <FormatLastSeen dateStr={u.last_seen_at} />
                          </td>

                          <td className="px-5 py-3.5 text-right">
                            <UserActionDropdown user={u} onAction={runAction} onConfirm={setConfirmAction} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards View */}
                <div className="block sm:hidden divide-y divide-gray-100 dark:divide-white/5">
                  {users.map((u) => (
                    <div key={u.id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 cursor-pointer min-w-0" onClick={() => setSelectedUserId(u.id)}>
                          <StudentAvatar src={u.avatar_url} name={u.full_name ?? u.username} size="md" />
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                              {u.full_name ?? u.username ?? 'Unnamed'}
                            </p>
                            <p className="text-xs text-gray-400 truncate">{u.email}</p>
                          </div>
                        </div>

                        <UserActionDropdown user={u} onAction={runAction} onConfirm={setConfirmAction} />
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <StatusBadge user={u} onClick={() => setSelectedUserId(u.id)} />
                        <FormatLastSeen dateStr={u.last_seen_at} />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-gray-400 dark:text-white/40 pt-1">
            <span>Showing {users?.length ?? 0} of {total.toLocaleString()} total students</span>
            <button
              onClick={() => nextCursor && load(nextCursor)}
              disabled={!nextCursor}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 disabled:opacity-40 font-semibold hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
            >
              Next Page
            </button>
          </div>
        </>
      )}

      {/* Confirmation Modal */}
      <AlertDialog
        open={!!confirmAction}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmAction(null);
            ensurePointerEvents();
          }
        }}
      >
        <AlertDialogContent className="max-w-md bg-white dark:bg-[#161D19] border border-gray-200 dark:border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold text-gray-900 dark:text-white">{confirmAction?.label}</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-gray-500 dark:text-white/50">
              This action will be logged into the permanent administrative activity audit trail.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel
              onClick={() => {
                setConfirmAction(null);
                ensurePointerEvents();
              }}
              className="dark:bg-white/5 dark:border-white/10 dark:text-white"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={async () => {
                if (!confirmAction) return;
                const target = confirmAction;
                setConfirmAction(null);
                ensurePointerEvents();
                await runAction(
                  target.userId,
                  target.label.toLowerCase().includes('delete') ? 'Account Deleted' : 'Action executed',
                  target.run
                );
              }}
            >
              Confirm Execution
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Detail Drawer Sheet */}
      <UserDetailSheet userId={selectedUserId} onClose={() => setSelectedUserId(null)} onUpdate={() => load(cursor)} />
    </div>
  );
}

function UserActionDropdown({
  user,
  onAction,
  onConfirm
}: {
  user: AdminUserListItem;
  onAction: (userId: string, label: string, action: () => Promise<void>) => Promise<void>;
  onConfirm: (val: { userId: string; label: string; run: () => Promise<void> } | null) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
          aria-label="User actions"
        >
          <MoreHorizontal size={18} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 bg-white dark:bg-[#161D19] border border-gray-200 dark:border-white/10 shadow-xl rounded-2xl p-1.5">
        {user.is_banned ? (
          <DropdownMenuItem
            onSelect={() => {
              ensurePointerEvents();
              onAction(user.id, 'User Unbanned', () => apiClient.adminUnbanUser(user.id));
            }}
            className="cursor-pointer text-xs rounded-xl py-2"
          >
            <ShieldCheck size={14} className="mr-2 text-emerald-600 dark:text-emerald-400" /> Unban Account
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setTimeout(() => {
                onConfirm({ userId: user.id, label: `Ban @${user.username ?? user.full_name}?`, run: () => apiClient.adminBanUser(user.id) });
                ensurePointerEvents();
              }, 50);
            }}
            className="text-red-600 dark:text-red-400 cursor-pointer text-xs rounded-xl py-2"
          >
            <Ban size={14} className="mr-2" /> Ban Account
          </DropdownMenuItem>
        )}

        {user.is_suspended ? (
          <DropdownMenuItem
            onSelect={() => {
              ensurePointerEvents();
              onAction(user.id, 'User Unsuspended', () => apiClient.adminUnsuspendUser(user.id));
            }}
            className="cursor-pointer text-xs rounded-xl py-2"
          >
            <ShieldOff size={14} className="mr-2 text-amber-600 dark:text-amber-400" /> Remove Suspension
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onSelect={() => {
              ensurePointerEvents();
              onAction(user.id, 'User Suspended for 24h', () => apiClient.adminSuspendUser(user.id));
            }}
            className="cursor-pointer text-xs rounded-xl py-2"
          >
            <Clock size={14} className="mr-2 text-amber-600 dark:text-amber-400" /> Suspend (24h)
          </DropdownMenuItem>
        )}

        {user.admin_verified ? (
          <DropdownMenuItem
            onSelect={() => {
              ensurePointerEvents();
              onAction(user.id, 'Verification Revoked', () => apiClient.adminUnverifyUser(user.id));
            }}
            className="cursor-pointer text-xs rounded-xl py-2"
          >
            <X size={14} className="mr-2 text-gray-500" /> Revoke Verification
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onSelect={() => {
              ensurePointerEvents();
              onAction(user.id, 'User Verified', () => apiClient.adminVerifyUser(user.id));
            }}
            className="cursor-pointer text-xs rounded-xl py-2"
          >
            <BadgeCheck size={14} className="mr-2 text-emerald-600 dark:text-emerald-400" /> Grant Verification
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator className="bg-gray-100 dark:bg-white/5" />

        <DropdownMenuItem
          onSelect={() => {
            ensurePointerEvents();
            onAction(user.id, 'User Forced Signed Out', () => apiClient.adminForceLogoutUser(user.id));
          }}
          className="cursor-pointer text-xs rounded-xl py-2"
        >
          <LogOutIcon size={14} className="mr-2" /> Force Logout
        </DropdownMenuItem>

        <DropdownMenuItem
          onSelect={() => {
            ensurePointerEvents();
            onAction(user.id, 'Password Reset Sent', () => apiClient.adminResetUserPassword(user.id));
          }}
          className="cursor-pointer text-xs rounded-xl py-2"
        >
          <KeyRound size={14} className="mr-2" /> Reset Password
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-gray-100 dark:bg-white/5" />

        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            setTimeout(() => {
              onConfirm({
                userId: user.id,
                label: `Permanently delete account for ${user.email}?`,
                run: () => apiClient.adminDeleteUser(user.id),
              });
              ensurePointerEvents();
            }, 50);
          }}
          className="text-red-600 dark:text-red-400 font-semibold cursor-pointer text-xs rounded-xl py-2 focus:bg-red-50 dark:focus:bg-red-950/20"
        >
          <Trash2 size={14} className="mr-2" /> Delete Account
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function FlippableIdPreview({
  frontUrl,
  backUrl,
  onEnlarge,
  height = 'h-56',
}: {
  frontUrl?: string | null;
  backUrl?: string | null;
  onEnlarge?: (side: 'front' | 'back') => void;
  height?: string;
}) {
  const [side, setSide] = useState<'front' | 'back'>('front');
  const [frontErr, setFrontErr] = useState(false);
  const [backErr, setBackErr] = useState(false);

  const hasFront = Boolean(frontUrl);
  const hasBack = Boolean(backUrl);
  const currentUrl = side === 'front' ? frontUrl : (backUrl || frontUrl);

  const toggleFlip = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setSide((s) => (s === 'front' ? 'back' : 'front'));
  };

  if (!hasFront && !hasBack) {
    return (
      <div className="p-4 rounded-xl border border-dashed border-gray-200 dark:border-white/10 bg-white/50 dark:bg-white/[0.02] text-center space-y-1">
        <ImageOff size={24} className="mx-auto text-gray-400 dark:text-white/30" />
        <p className="text-xs font-medium text-gray-600 dark:text-white/60">No Student ID Image Uploaded</p>
        <p className="text-[11px] text-gray-400 dark:text-white/40">
          External email accounts require an uploaded ID photo.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {/* Header Controls */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold text-gray-500 dark:text-white/60 uppercase tracking-wide flex items-center gap-1.5">
            <CreditCard size={14} className="text-[#1A6B3C] dark:text-emerald-400" /> Uploaded Student ID
          </p>
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
              side === 'front'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                : 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300'
            }`}
          >
            {side === 'front' ? 'Front Side' : 'Back Side'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Flip Card Button */}
          <button
            type="button"
            onClick={toggleFlip}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-[#1A6B3C] dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all cursor-pointer shadow-2xs"
            title="Click to flip between front and back ID"
          >
            <RotateCw size={12} className="transition-transform duration-300" />
            <span>Flip ID</span>
          </button>

          {/* View Original Link for current active side */}
          {currentUrl && (
            <a
              href={currentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#1A6B3C] dark:text-emerald-400 font-semibold flex items-center gap-1 hover:underline"
            >
              Original <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>

      {/* 3D Flippable Card Stage */}
      <div
        className={`w-full ${height} rounded-xl relative select-none`}
        style={{ perspective: '1200px' }}
      >
        <div
          className="w-full h-full relative transition-transform duration-500 ease-out"
          style={{
            transformStyle: 'preserve-3d',
            transform: side === 'back' ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* ── Front Face ── */}
          <div
            onClick={() => onEnlarge ? onEnlarge('front') : toggleFlip()}
            className="absolute inset-0 w-full h-full rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 bg-black/5 dark:bg-black/20 group cursor-pointer"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }}
          >
            {frontUrl && !frontErr ? (
              <>
                <img
                  src={frontUrl}
                  alt="Student ID Front"
                  onError={() => setFrontErr(true)}
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                />
                <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/65 backdrop-blur-xs text-white text-[10px] font-bold tracking-wider">
                  FRONT
                </div>
                <div
                  onClick={toggleFlip}
                  className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-white/90 dark:bg-black/75 backdrop-blur-xs text-gray-700 dark:text-white/80 text-[10px] font-semibold flex items-center gap-1 shadow-xs hover:bg-white transition-colors"
                >
                  <RotateCw size={10} /> Flip to Back
                </div>
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1.5 pointer-events-none">
                  <ExternalLink size={14} /> Click to Enlarge
                </div>
              </>
            ) : frontUrl && frontErr ? (
              <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-red-50/50 dark:bg-red-950/10">
                <ImageOff size={22} className="text-red-500 mb-1" />
                <p className="text-xs font-semibold text-red-700 dark:text-red-300">Front Preview Unavailable</p>
                <a href={frontUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-red-600 underline mt-1">
                  Open Direct Link
                </a>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-gray-400">
                <CreditCard size={32} className="mb-1 opacity-50" />
                <span className="text-xs font-medium">No Front ID photo</span>
              </div>
            )}
          </div>

          {/* ── Back Face ── */}
          <div
            onClick={() => onEnlarge ? onEnlarge('back') : toggleFlip()}
            className="absolute inset-0 w-full h-full rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 bg-black/5 dark:bg-black/20 group cursor-pointer"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            {backUrl && !backErr ? (
              <>
                <img
                  src={backUrl}
                  alt="Student ID Back"
                  onError={() => setBackErr(true)}
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                />
                <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/65 backdrop-blur-xs text-white text-[10px] font-bold tracking-wider">
                  BACK
                </div>
                <div
                  onClick={toggleFlip}
                  className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-white/90 dark:bg-black/75 backdrop-blur-xs text-gray-700 dark:text-white/80 text-[10px] font-semibold flex items-center gap-1 shadow-xs hover:bg-white transition-colors"
                >
                  <RotateCw size={10} /> Flip to Front
                </div>
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1.5 pointer-events-none">
                  <ExternalLink size={14} /> Click to Enlarge
                </div>
              </>
            ) : backUrl && backErr ? (
              <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-red-50/50 dark:bg-red-950/10">
                <ImageOff size={22} className="text-red-500 mb-1" />
                <p className="text-xs font-semibold text-red-700 dark:text-red-300">Back Preview Unavailable</p>
                <a href={backUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-red-600 underline mt-1">
                  Open Direct Link
                </a>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-5 text-center bg-gray-50/80 dark:bg-white/[0.03]">
                <CreditCard size={32} className="text-gray-400 mb-1.5 opacity-60" />
                <p className="text-xs font-semibold text-gray-700 dark:text-white/80">No Back Side Uploaded</p>
                <p className="text-[11px] text-gray-400 dark:text-white/40 max-w-[210px] mt-0.5">
                  The student only submitted the front side of their ID or COR.
                </p>
                <button
                  type="button"
                  onClick={toggleFlip}
                  className="mt-2.5 px-3 py-1 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-[#1A6B3C] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <RotateCw size={11} /> Flip to Front
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function UserDetailSheet({ userId, onClose, onUpdate }: { userId: string | null; onClose: () => void; onUpdate: () => void }) {
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [processing, setProcessing] = useState<'approve' | 'reject' | null>(null);
  const [imgError, setImgError] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxSide, setLightboxSide] = useState<'front' | 'back'>('front');

  const reload = (id: string) => {
    setDetail(null);
    setImgError(false);
    apiClient.adminGetUserDetail(id).then(setDetail).catch((err: any) => notify.error('Failed to load student details', err.message));
  };

  useEffect(() => {
    if (!userId) { setDetail(null); return; }
    reload(userId);
  }, [userId]);

  // Capture Escape key globally in capture phase to close lightbox ONLY without closing the Sheet
  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        setLightboxOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [lightboxOpen]);

  const handleVerification = async (type: 'approve' | 'reject') => {
    if (!detail) return;
    setProcessing(type);
    try {
      if (type === 'approve') {
        await apiClient.adminApproveStudentVerification(detail.id);
        notify.success('Student ID approved — Account is now fully verified!');
      } else {
        await apiClient.adminRejectStudentVerification(detail.id);
        notify.warning('Student ID verification request rejected');
      }
      reload(detail.id);
      onUpdate();
    } catch (err: any) {
      notify.error('Action failed', err.message);
    } finally {
      setProcessing(null);
    }
  };

  return (
    <>
      <Sheet open={!!userId} onOpenChange={(open) => !open && !lightboxOpen && onClose()}>
        <SheetContent
          onEscapeKeyDown={(e) => {
            if (lightboxOpen) {
              e.preventDefault();
              e.stopPropagation();
              setLightboxOpen(false);
            }
          }}
          onPointerDownOutside={(e) => {
            if (lightboxOpen) {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
          className="w-full sm:max-w-md overflow-y-auto bg-white dark:bg-[#161D19] p-4 sm:p-6 border-l border-gray-200 dark:border-white/10"
        >
          <SheetHeader className="pb-3 border-b border-gray-100 dark:border-white/5">
            <SheetTitle className="font-fraunces text-xl font-bold text-gray-900 dark:text-white">
              Student Profile Details
            </SheetTitle>
          </SheetHeader>

          {!detail ? (
            <div className="flex justify-center py-16">
              <Loader2 className="animate-spin text-[#1A6B3C] dark:text-emerald-400" size={24} />
            </div>
          ) : (
            <div className="mt-4 space-y-5 text-sm">
              {/* Header: Avatar & Info */}
              <div className="flex items-center gap-3.5 bg-gray-50 dark:bg-white/5 p-3.5 rounded-2xl border border-gray-100 dark:border-white/5">
                <StudentAvatar src={detail.avatar_url} name={detail.full_name ?? detail.username} size="lg" />
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 dark:text-white text-base truncate">
                    {detail.full_name ?? 'Unnamed Student'}
                  </p>
                  <p className="text-xs text-[#1A6B3C] dark:text-emerald-400 font-medium">
                    {detail.username ? `@${detail.username}` : 'No username set'}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-white/40 truncate">{detail.email}</p>
                </div>
              </div>

              {/* Email Verification Badges */}
              <div className="flex flex-wrap gap-2">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1 ${
                  detail.email_type === 'chmsu'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                }`}>
                  {detail.email_type === 'chmsu' ? '🎓 CHMSU Campus Email' : '📧 External Email Address'}
                </span>
                {detail.admin_verified && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 flex items-center gap-1">
                    <BadgeCheck size={13} /> Admin Verified
                  </span>
                )}
              </div>

              {/* Uploaded Student ID Card Flippable Preview Section */}
              <div className="bg-gray-50 dark:bg-white/5 p-3.5 rounded-2xl border border-gray-100 dark:border-white/5 space-y-2.5">
                <FlippableIdPreview
                  frontUrl={detail.student_id_url}
                  backUrl={detail.student_id_back_url}
                  onEnlarge={(side) => {
                    setLightboxSide(side);
                    setLightboxOpen(true);
                  }}
                />
              </div>

            {/* Approve / Reject Controls */}
            {detail.student_verification_status === 'pending' && (
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-2xl space-y-2.5">
                <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                  Verification Pending Review
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleVerification('approve')}
                    disabled={!!processing}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors disabled:opacity-50 shadow-sm"
                  >
                    {processing === 'approve' ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={14} />}
                    Approve Student ID
                  </button>
                  <button
                    onClick={() => handleVerification('reject')}
                    disabled={!!processing}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors disabled:opacity-50 shadow-sm"
                  >
                    <XCircle size={14} /> Reject
                  </button>
                </div>
              </div>
            )}

            {/* Activity Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-3.5 border border-gray-100 dark:border-white/5">
                <p className="text-xl font-bold text-gray-900 dark:text-white">{detail.postsCount}</p>
                <p className="text-xs text-gray-400 dark:text-white/40">Feed Posts</p>
              </div>
              <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-3.5 border border-gray-100 dark:border-white/5">
                <p className="text-xl font-bold text-gray-900 dark:text-white">{detail.reportsAgainstCount}</p>
                <p className="text-xs text-gray-400 dark:text-white/40">Reports Received</p>
              </div>
            </div>

            {/* Field Breakdown */}
            <div className="space-y-2 text-xs bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-white/5 divide-y divide-gray-100 dark:divide-white/5">
              <div className="flex justify-between pb-2">
                <span className="text-gray-400 dark:text-white/40 flex items-center gap-1.5">
                  <Building2 size={13} /> Department
                </span>
                <span className="font-semibold text-gray-800 dark:text-white/90">{detail.department ?? '—'}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-400 dark:text-white/40 flex items-center gap-1.5">
                  <GraduationCap size={13} /> Course
                </span>
                <span className="font-semibold text-gray-800 dark:text-white/90">{detail.course ?? '—'}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-400 dark:text-white/40">Year Level</span>
                <span className="font-semibold text-gray-800 dark:text-white/90">{detail.year_level ?? '—'}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-400 dark:text-white/40 flex items-center gap-1.5">
                  <Calendar size={13} /> Joined Date
                </span>
                <span className="font-semibold text-gray-800 dark:text-white/90">
                  {new Date(detail.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-gray-400 dark:text-white/40">Last Presence</span>
                <span className="font-semibold text-gray-800 dark:text-white/90">
                  {detail.last_seen_at ? new Date(detail.last_seen_at).toLocaleString() : 'Never'}
                </span>
              </div>
            </div>

            {/* Bio */}
            {detail.bio && (
              <div>
                <p className="text-xs font-semibold text-gray-400 dark:text-white/40 uppercase mb-1">Biography</p>
                <p className="text-xs text-gray-700 dark:text-white/80 bg-gray-50 dark:bg-white/5 p-3 rounded-xl border border-gray-100 dark:border-white/5">
                  {detail.bio}
                </p>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>

      {/* Student ID Lightbox Modal — Rendered outside Sheet via Portal */}
      {lightboxOpen && (detail?.student_id_url || detail?.student_id_back_url) && createPortal(
        <div
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setLightboxOpen(false);
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full max-h-[90vh] overflow-hidden rounded-2xl bg-[#161D19] p-3.5 border border-white/10 shadow-2xl space-y-2.5 cursor-default"
          >
            <div className="flex items-center justify-between px-2 text-white flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <CreditCard size={16} className="text-emerald-400" />
                <span className="text-sm font-semibold">
                  {detail.full_name ?? detail.username} — Uploaded Student ID
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-900/60 border border-emerald-700 text-emerald-300 uppercase">
                  {lightboxSide === 'front' ? 'Front Side' : 'Back Side'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Flip Button in Lightbox */}
                <button
                  type="button"
                  onClick={() => setLightboxSide((s) => (s === 'front' ? 'back' : 'front'))}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCw size={12} /> Flip to {lightboxSide === 'front' ? 'Back' : 'Front'}
                </button>

                {/* View Original in Lightbox */}
                {(lightboxSide === 'front' ? detail.student_id_url : detail.student_id_back_url) && (
                  <a
                    href={(lightboxSide === 'front' ? detail.student_id_url : detail.student_id_back_url) || ''}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white/10 hover:bg-white/20 text-emerald-300 transition-colors flex items-center gap-1"
                  >
                    Original <ExternalLink size={12} />
                  </a>
                )}

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setLightboxOpen(false);
                  }}
                  className="px-3 py-1 text-xs font-semibold rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <X size={14} /> Close
                </button>
              </div>
            </div>

            <div className="rounded-xl overflow-hidden bg-black/40 border border-white/5 flex items-center justify-center min-h-[300px] max-h-[78vh]">
              {lightboxSide === 'front' && detail.student_id_url ? (
                <img
                  src={detail.student_id_url}
                  alt="Uploaded Student ID Front"
                  className="w-full h-full max-h-[78vh] object-contain rounded-lg"
                />
              ) : lightboxSide === 'back' && detail.student_id_back_url ? (
                <img
                  src={detail.student_id_back_url}
                  alt="Uploaded Student ID Back"
                  className="w-full h-full max-h-[78vh] object-contain rounded-lg"
                />
              ) : (
                <div className="p-8 text-center text-white/60 space-y-2">
                  <CreditCard size={40} className="mx-auto opacity-40 text-emerald-400" />
                  <p className="text-sm font-semibold text-white">No Back Side Uploaded</p>
                  <p className="text-xs text-white/40">The student only submitted the front side of their ID / COR.</p>
                  <button
                    type="button"
                    onClick={() => setLightboxSide('front')}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors inline-flex items-center gap-1.5 mt-2 cursor-pointer"
                  >
                    <RotateCw size={12} /> Flip to Front
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

function PendingVerificationCard({
  item,
  processing,
  onApprove,
  onReject,
  onOpenDetail,
}: {
  item: PendingVerificationItem;
  processing: boolean;
  onApprove: () => void;
  onReject: () => void;
  onOpenDetail?: () => void;
}) {
  const [side, setSide] = useState<'front' | 'back'>('front');

  const toggleSide = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSide((s) => (s === 'front' ? 'back' : 'front'));
  };

  return (
    <div className="bg-white dark:bg-[#161D19] rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
      {/* Flippable image container */}
      <div className="relative w-full h-44 select-none" style={{ perspective: '1000px' }}>
        <div
          className="w-full h-full relative transition-transform duration-500 ease-out"
          style={{
            transformStyle: 'preserve-3d',
            transform: side === 'back' ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front Face */}
          <div
            className="absolute inset-0 w-full h-full overflow-hidden bg-black/5 dark:bg-black/20"
            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
          >
            {item.student_id_url ? (
              <a href={item.student_id_url} target="_blank" rel="noopener noreferrer" className="block w-full h-full relative group">
                <img src={item.student_id_url} alt="Student ID Front" className="w-full h-44 object-cover group-hover:opacity-90 transition-opacity" />
                <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px] font-bold">
                  FRONT
                </div>
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1">
                  Open Full Size <ExternalLink size={12} />
                </div>
              </a>
            ) : (
              <div className="w-full h-44 bg-gray-50 dark:bg-white/5 flex flex-col items-center justify-center text-gray-400">
                <CreditCard size={38} className="mb-2 opacity-50" />
                <span className="text-xs font-medium">No ID photo uploaded</span>
              </div>
            )}
          </div>

          {/* Back Face */}
          <div
            className="absolute inset-0 w-full h-full overflow-hidden bg-black/5 dark:bg-black/20"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            {item.student_id_back_url ? (
              <a href={item.student_id_back_url} target="_blank" rel="noopener noreferrer" className="block w-full h-full relative group">
                <img src={item.student_id_back_url} alt="Student ID Back" className="w-full h-44 object-cover group-hover:opacity-90 transition-opacity" />
                <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px] font-bold">
                  BACK
                </div>
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1">
                  Open Full Size <ExternalLink size={12} />
                </div>
              </a>
            ) : (
              <div className="w-full h-44 bg-gray-50 dark:bg-white/5 flex flex-col items-center justify-center text-gray-400 p-3 text-center">
                <CreditCard size={32} className="mb-1 opacity-50" />
                <span className="text-xs font-medium text-gray-500 dark:text-white/60">No Back Side Uploaded</span>
                <span className="text-[10px] text-gray-400 dark:text-white/40 mt-0.5">Front scan only provided</span>
              </div>
            )}
          </div>
        </div>

        {/* Flip toggle badge button */}
        <button
          type="button"
          onClick={toggleSide}
          className="absolute bottom-2 right-2 px-2 py-1 rounded-md bg-black/70 backdrop-blur-xs text-white hover:bg-black/90 text-[10px] font-semibold flex items-center gap-1 z-10 transition-colors cursor-pointer shadow-sm"
          title="Flip ID"
        >
          <RotateCw size={10} /> Flip ({side === 'front' ? 'Front' : 'Back'})
        </button>
      </div>

      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
        <div className="space-y-2 cursor-pointer" onClick={onOpenDetail}>
          <div className="flex items-center gap-3">
            <StudentAvatar src={item.avatar_url} name={item.full_name ?? item.username} size="md" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate hover:underline">
                {item.full_name ?? item.username ?? 'Unnamed Student'}
              </p>
              <p className="text-xs text-gray-400 truncate">{item.email}</p>
            </div>
          </div>

          <p className="text-xs text-gray-500 dark:text-white/40">
            {item.course ?? item.department ?? 'General Student'} · {new Date(item.created_at).toLocaleDateString()}
          </p>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={onApprove}
            disabled={processing}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors disabled:opacity-50 shadow-sm cursor-pointer"
          >
            {processing ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={14} />}
            Approve ID
          </button>
          <button
            onClick={onReject}
            disabled={processing}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors disabled:opacity-50 shadow-sm cursor-pointer"
          >
            <XCircle size={14} /> Reject
          </button>
        </div>
      </div>
    </div>
  );
}

function PendingVerificationsPanel({
  items,
  onAction,
  onSelectUser,
}: {
  items: PendingVerificationItem[] | null;
  onAction: () => void;
  onSelectUser?: (id: string) => void;
}) {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handle = async (id: string, type: 'approve' | 'reject') => {
    setProcessingId(id);
    try {
      if (type === 'approve') {
        await apiClient.adminApproveStudentVerification(id);
        notify.success('Student ID approved — Account is now verified!');
      } else {
        await apiClient.adminRejectStudentVerification(id);
        notify.warning('Student ID verification request rejected');
      }
      onAction();
    } catch (err: any) {
      notify.error('Action failed', err.message);
    } finally {
      setProcessingId(null);
    }
  };

  if (!items) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="animate-spin text-amber-500" size={26} />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-white dark:bg-[#161D19] rounded-2xl border border-gray-100 dark:border-white/5 py-16 text-center px-4">
        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-90" />
        <p className="text-base font-bold text-gray-800 dark:text-white">All Verifications Clear</p>
        <p className="text-xs text-gray-400 dark:text-white/40 mt-1">There are no pending student ID submissions awaiting approval.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <PendingVerificationCard
          key={item.id}
          item={item}
          processing={processingId === item.id}
          onApprove={() => handle(item.id, 'approve')}
          onReject={() => handle(item.id, 'reject')}
          onOpenDetail={() => onSelectUser?.(item.id)}
        />
      ))}
    </div>
  );
}
