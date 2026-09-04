// src/pages/admin/AdminUsersPage.tsx

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Search, MoreHorizontal, ShieldCheck, ShieldOff, Ban, Clock,
  KeyRound, LogOut as LogOutIcon, Trash2, BadgeCheck, X, Loader2,
  CheckCircle2, XCircle, CreditCard, ExternalLink, Calendar,
  Building2, GraduationCap, Mail, UserCheck, ImageOff
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

export default function AdminUsersPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'pending'>('users');
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

  const loadPending = () => {
    setPendingItems(null);
    apiClient.adminListPendingVerifications()
      .then((items) => {
        setPendingItems(items);
        setPendingCount(items.length);
      })
      .catch((err: any) => {
        console.error('Failed to load pending verifications:', err);
        setPendingItems([]);
        notify.error('Failed to load pending verifications', err.message);
      });
  };

  const load = (nextC: string | null = null) => {
    setUsers(null);
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
        setUsers([]);
        notify.error('Failed to load users', err.message);
      });
  };

  useEffect(() => {
    if (activeTab === 'users') load(null);
    else loadPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, activeTab]);

  const runAction = async (userId: string, label: string, action: () => Promise<void>) => {
    try {
      await action();
      notify.success(label);
      load(cursor);
      if (activeTab === 'pending') loadPending();
    } catch (err: any) {
      notify.error(`Could not ${label.toLowerCase()}`, err.message);
    }
  };

  return (
    <div className="space-y-6 w-full pb-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#161D19] p-4 sm:p-5 rounded-2xl border border-gray-200/80 dark:border-white/5 shadow-xs">
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
            onClick={() => setActiveTab('users')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-150 active:scale-[0.98] ${
              activeTab === 'users'
                ? 'bg-white dark:bg-white/10 text-[#1A6B3C] dark:text-emerald-400 shadow-xs'
                : 'text-gray-500 dark:text-white/50 hover:text-gray-700 dark:hover:text-white'
            }`}
          >
            All Users
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-150 active:scale-[0.98] ${
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
        <PendingVerificationsPanel items={pendingItems} onAction={loadPending} />
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
      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold">{confirmAction?.label}</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-gray-500 dark:text-white/50">
              This action will be logged into the permanent administrative activity audit trail.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={async () => {
                if (!confirmAction) return;
                await runAction(confirmAction.userId, 'Action executed', confirmAction.run);
                setConfirmAction(null);
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
        <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-gray-600 transition-colors">
          <MoreHorizontal size={18} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {user.is_banned ? (
          <DropdownMenuItem onClick={() => onAction(user.id, 'User Unbanned', () => apiClient.adminUnbanUser(user.id))}>
            <ShieldCheck size={14} className="mr-2 text-emerald-600" /> Unban Account
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onClick={() => onConfirm({ userId: user.id, label: `Ban @${user.username ?? user.full_name}?`, run: () => apiClient.adminBanUser(user.id) })}
            className="text-red-600 dark:text-red-400"
          >
            <Ban size={14} className="mr-2" /> Ban Account
          </DropdownMenuItem>
        )}

        {user.is_suspended ? (
          <DropdownMenuItem onClick={() => onAction(user.id, 'User Unsuspended', () => apiClient.adminUnsuspendUser(user.id))}>
            <ShieldOff size={14} className="mr-2 text-amber-600" /> Remove Suspension
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => onAction(user.id, 'User Suspended for 24h', () => apiClient.adminSuspendUser(user.id))}>
            <Clock size={14} className="mr-2 text-amber-600" /> Suspend (24h)
          </DropdownMenuItem>
        )}

        {user.admin_verified ? (
          <DropdownMenuItem onClick={() => onAction(user.id, 'Verification Revoked', () => apiClient.adminUnverifyUser(user.id))}>
            <X size={14} className="mr-2 text-gray-500" /> Revoke Verification
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => onAction(user.id, 'User Verified', () => apiClient.adminVerifyUser(user.id))}>
            <BadgeCheck size={14} className="mr-2 text-emerald-600" /> Grant Verification
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => onAction(user.id, 'User Forced Signed Out', () => apiClient.adminForceLogoutUser(user.id))}>
          <LogOutIcon size={14} className="mr-2" /> Force Logout
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => onAction(user.id, 'Password Reset Sent', () => apiClient.adminResetUserPassword(user.id))}>
          <KeyRound size={14} className="mr-2" /> Reset Password
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => onConfirm({ userId: user.id, label: `Permanently delete account for ${user.email}?`, run: () => apiClient.adminDeleteUser(user.id) })}
          className="text-red-600 dark:text-red-400 font-semibold"
        >
          <Trash2 size={14} className="mr-2" /> Delete Account
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UserDetailSheet({ userId, onClose, onUpdate }: { userId: string | null; onClose: () => void; onUpdate: () => void }) {
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [processing, setProcessing] = useState<'approve' | 'reject' | null>(null);
  const [imgError, setImgError] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

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

              {/* Uploaded Student ID Card Preview Section */}
              <div className="bg-gray-50 dark:bg-white/5 p-3.5 rounded-2xl border border-gray-100 dark:border-white/5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-500 dark:text-white/60 uppercase tracking-wide flex items-center gap-1.5">
                    <CreditCard size={14} className="text-[#1A6B3C] dark:text-emerald-400" /> Uploaded Student ID
                  </p>
                  {detail.student_id_url && (
                    <a
                      href={detail.student_id_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#1A6B3C] dark:text-emerald-400 font-semibold flex items-center gap-1 hover:underline"
                    >
                      View Original <ExternalLink size={12} />
                    </a>
                  )}
                </div>

                {detail.student_id_url && !imgError ? (
                  <div
                    onClick={() => setLightboxOpen(true)}
                    className="rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 h-52 bg-black/5 relative group cursor-pointer"
                  >
                    <img
                      src={detail.student_id_url}
                      alt="Uploaded Student ID"
                      onError={() => setImgError(true)}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1.5">
                      <ExternalLink size={14} /> Click to Enlarge
                    </div>
                  </div>
                ) : detail.student_id_url && imgError ? (
                  <div className="p-4 rounded-xl border border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-950/10 text-center space-y-1.5">
                    <ImageOff size={24} className="mx-auto text-red-500" />
                    <p className="text-xs font-semibold text-red-700 dark:text-red-300">Could Not Render ID Image Preview</p>
                    <p className="text-[11px] text-gray-500 dark:text-white/50">The uploaded image file link may be protected or unavailable.</p>
                    <a
                      href={detail.student_id_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-red-600 underline font-medium pt-1"
                    >
                      Open Image Link Directly <ExternalLink size={12} />
                    </a>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-gray-200 dark:border-white/10 bg-white/50 dark:bg-white/[0.02] text-center space-y-1">
                    <ImageOff size={24} className="mx-auto text-gray-400 dark:text-white/30" />
                    <p className="text-xs font-medium text-gray-600 dark:text-white/60">No Student ID Image Uploaded</p>
                    <p className="text-[11px] text-gray-400 dark:text-white/40">
                      {detail.email_type === 'chmsu'
                        ? 'CHMSU domain email accounts are automatically verified.'
                        : 'External email accounts require an uploaded ID photo.'}
                    </p>
                  </div>
                )}
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
      {lightboxOpen && detail?.student_id_url && createPortal(
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
            <div className="flex items-center justify-between px-2 text-white">
              <span className="text-sm font-semibold flex items-center gap-2">
                <CreditCard size={16} className="text-emerald-400" />
                {detail.full_name ?? detail.username} — Uploaded Student ID
              </span>
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
            <div className="rounded-xl overflow-hidden bg-black/40 border border-white/5 flex items-center justify-center min-h-[300px]">
              <img
                src={detail.student_id_url}
                alt="Uploaded Student ID Full"
                className="w-full h-full max-h-[80vh] object-contain rounded-lg"
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

function PendingVerificationsPanel({ items, onAction }: { items: PendingVerificationItem[] | null; onAction: () => void }) {
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
        <div key={item.id} className="bg-white dark:bg-[#161D19] rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          {item.student_id_url ? (
            <a href={item.student_id_url} target="_blank" rel="noopener noreferrer" className="block relative group">
              <img src={item.student_id_url} alt="Student ID" className="w-full h-44 object-cover group-hover:opacity-90 transition-opacity" />
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

          <div className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <StudentAvatar src={item.avatar_url} name={item.full_name ?? item.username} size="md" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {item.full_name ?? item.username ?? 'Unnamed Student'}
                </p>
                <p className="text-xs text-gray-400 truncate">{item.email}</p>
              </div>
            </div>

            <p className="text-xs text-gray-500 dark:text-white/40">
              {item.course ?? item.department ?? 'General Student'} · {new Date(item.created_at).toLocaleDateString()}
            </p>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => handle(item.id, 'approve')}
                disabled={processingId === item.id}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors disabled:opacity-50 shadow-sm"
              >
                {processingId === item.id ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={14} />}
                Approve ID
              </button>
              <button
                onClick={() => handle(item.id, 'reject')}
                disabled={processingId === item.id}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors disabled:opacity-50 shadow-sm"
              >
                <XCircle size={14} /> Reject
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
