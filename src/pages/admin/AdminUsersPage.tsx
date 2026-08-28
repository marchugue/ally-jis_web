// src/pages/admin/AdminUsersPage.tsx

import { useEffect, useState } from 'react';
import {
  Search, MoreHorizontal, ShieldCheck, ShieldOff, Ban, Clock,
  KeyRound, LogOut as LogOutIcon, Trash2, BadgeCheck, X, Loader2,
} from 'lucide-react';
import { apiClient } from '@/api/client';
import type { AdminUserDetail, AdminUserListItem, ListUsersQuery } from '@/api/client';
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

function StatusBadge({ user }: { user: AdminUserListItem }) {
  if (user.is_banned) return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Banned</Badge>;
  if (user.is_suspended) return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Suspended</Badge>;
  return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Active</Badge>;
}

const STATUS_FILTERS: { value: ListUsersQuery['status']; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'banned', label: 'Banned' },
  { value: 'suspended', label: 'Suspended' },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserListItem[] | null>(null);
  const [total, setTotal] = useState(0);
  const [cursor, setCursor] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ListUsersQuery['status']>('all');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ userId: string; label: string; run: () => Promise<void> } | null>(null);

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
      .catch((err: any) => notify.error('Failed to load users', err.message));
  };

  useEffect(() => {
    load(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const runAction = async (userId: string, label: string, action: () => Promise<void>) => {
    try {
      await action();
      notify.success(label);
      load(cursor);
    } catch (err: any) {
      notify.error(`Could not ${label.toLowerCase()}`, err.message);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-fraunces text-2xl font-bold text-gray-900 dark:text-white">Users</h1>
        <p className="text-sm text-gray-400 dark:text-white/40 mt-0.5">{total.toLocaleString()} total students</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load(null)}
            placeholder="Search by name, username, or email…"
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-white text-sm outline-none focus:border-[#1A6B3C]"
          />
        </div>
        <div className="flex gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatus(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                status === f.value ? 'bg-[#1A6B3C] dark:bg-emerald-600 text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-white/50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-[#161D19] rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden">
        {!users ? (
          <div className="flex justify-center py-14"><Loader2 className="animate-spin text-[#1A6B3C]" size={22} /></div>
        ) : users.length === 0 ? (
          <p className="text-center text-sm text-gray-400 dark:text-white/40 py-14">No users match.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/5 text-left text-xs text-gray-400 dark:text-white/40 uppercase tracking-wide">
                <th className="px-5 py-3 font-medium">Student</th>
                <th className="px-5 py-3 font-medium">Department</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Joined</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-gray-50 dark:border-white/5 last:border-0 hover:bg-gray-50/50 dark:hover:bg-white/[0.02]">
                  <td className="px-5 py-3 cursor-pointer" onClick={() => setSelectedUserId(u.id)}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden shrink-0">
                        {u.avatar_url && <img src={u.avatar_url} className="w-full h-full object-cover" alt="" />}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-white/90 flex items-center gap-1">
                          {u.username ? `@${u.username}` : u.full_name ?? 'Unnamed'}
                          {u.admin_verified && <BadgeCheck size={13} className="text-[#1A6B3C] dark:text-emerald-400" />}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-white/40">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-600 dark:text-white/70">{u.department ?? '—'}</td>
                  <td className="px-5 py-3"><StatusBadge user={u} /></td>
                  <td className="px-5 py-3 text-gray-400 dark:text-white/40">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="px-5 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400"><MoreHorizontal size={16} /></button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {u.is_banned ? (
                          <DropdownMenuItem onClick={() => runAction(u.id, 'Unbanned', () => apiClient.adminUnbanUser(u.id))}>
                            <ShieldCheck size={14} className="mr-2" /> Unban
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => setConfirmAction({ userId: u.id, label: 'Ban this user?', run: () => apiClient.adminBanUser(u.id) })} className="text-red-600">
                            <Ban size={14} className="mr-2" /> Ban
                          </DropdownMenuItem>
                        )}
                        {u.is_suspended ? (
                          <DropdownMenuItem onClick={() => runAction(u.id, 'Unsuspended', () => apiClient.adminUnsuspendUser(u.id))}>
                            <ShieldOff size={14} className="mr-2" /> Unsuspend
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => runAction(u.id, 'Suspended', () => apiClient.adminSuspendUser(u.id))}>
                            <Clock size={14} className="mr-2" /> Suspend
                          </DropdownMenuItem>
                        )}
                        {u.admin_verified ? (
                          <DropdownMenuItem onClick={() => runAction(u.id, 'Verification removed', () => apiClient.adminUnverifyUser(u.id))}>
                            <X size={14} className="mr-2" /> Remove Verification
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => runAction(u.id, 'Verified', () => apiClient.adminVerifyUser(u.id))}>
                            <BadgeCheck size={14} className="mr-2" /> Verify
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => runAction(u.id, 'Signed out', () => apiClient.adminForceLogoutUser(u.id))}>
                          <LogOutIcon size={14} className="mr-2" /> Force Logout
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => runAction(u.id, 'Reset email sent', () => apiClient.adminResetUserPassword(u.id))}>
                          <KeyRound size={14} className="mr-2" /> Reset Password
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setConfirmAction({ userId: u.id, label: `Permanently delete this account?`, run: () => apiClient.adminDeleteUser(u.id) })}
                          className="text-red-600"
                        >
                          <Trash2 size={14} className="mr-2" /> Delete Account
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex justify-between items-center text-xs text-gray-400 dark:text-white/40">
        <span>Showing {users?.length ?? 0} of {total.toLocaleString()}</span>
        <button
          onClick={() => nextCursor && load(nextCursor)}
          disabled={!nextCursor}
          className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-white/5 disabled:opacity-40 font-semibold"
        >
          Next page
        </button>
      </div>

      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmAction?.label}</AlertDialogTitle>
            <AlertDialogDescription>This action is logged to the admin activity log.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={async () => {
                if (!confirmAction) return;
                await runAction(confirmAction.userId, 'Done', confirmAction.run);
                setConfirmAction(null);
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <UserDetailSheet userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
    </div>
  );
}

function UserDetailSheet({ userId, onClose }: { userId: string | null; onClose: () => void }) {
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);

  useEffect(() => {
    if (!userId) {
      setDetail(null);
      return;
    }
    apiClient.adminGetUserDetail(userId).then(setDetail).catch((err: any) => notify.error('Failed to load user', err.message));
  }, [userId]);

  return (
    <Sheet open={!!userId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-fraunces">{detail?.full_name ?? detail?.username ?? 'Loading…'}</SheetTitle>
        </SheetHeader>
        {!detail ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-[#1A6B3C]" size={20} /></div>
        ) : (
          <div className="mt-4 space-y-4 text-sm">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-gray-100 overflow-hidden">
                {detail.avatar_url && <img src={detail.avatar_url} className="w-full h-full object-cover" alt="" />}
              </div>
              <div>
                <p className="font-semibold">{detail.username ? `@${detail.username}` : detail.full_name}</p>
                <p className="text-xs text-gray-400">{detail.email}</p>
              </div>
            </div>
            {detail.bio && <p className="text-gray-600">{detail.bio}</p>}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3"><p className="text-lg font-bold">{detail.postsCount}</p><p className="text-xs text-gray-400">Posts</p></div>
              <div className="bg-gray-50 rounded-xl p-3"><p className="text-lg font-bold">{detail.reportsAgainstCount}</p><p className="text-xs text-gray-400">Reports Against</p></div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between"><span className="text-gray-400">Department</span><span>{detail.department ?? '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Course</span><span>{detail.course ?? '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Year Level</span><span>{detail.year_level ?? '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Joined</span><span>{new Date(detail.created_at).toLocaleDateString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Last Active</span><span>{detail.last_seen_at ? new Date(detail.last_seen_at).toLocaleString() : 'Never'}</span></div>
            </div>
            {detail.interests.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {detail.interests.map((i) => <Badge key={i} variant="secondary">{i}</Badge>)}
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
