// src/pages/admin/AdminManagementPage.tsx

import { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, Loader2, Search, UserPlus } from 'lucide-react';
import { apiClient } from '@/api/client';
import type { AdminListItem, AdminRole, AdminUserListItem } from '@/api/client';
import { notify } from '@/components/ui/sonner';
import { AvatarDisplay } from '@/components/ally/AvatarDisplay';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const ROLE_OPTIONS: { value: AdminRole | 'student'; label: string }[] = [
  { value: 'moderator', label: 'Moderator' },
  { value: 'admin', label: 'Admin' },
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'student', label: 'Remove admin access' },
];

export default function AdminManagementPage() {
  const [admins, setAdmins] = useState<AdminListItem[] | null>(null);
  const [pendingChange, setPendingChange] = useState<{ userId: string; role: string; name: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [grantOpen, setGrantOpen] = useState(false);
  const [students, setStudents] = useState<AdminUserListItem[] | null>(null);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStudents = useMemo(() => {
    if (!students) return [];
    const notAlreadyAdmin = students.filter((s) => !admins?.some((a) => a.id === s.id));
    const q = searchQuery.trim().toLowerCase();
    if (!q) return notAlreadyAdmin.slice(0, 10);
    return notAlreadyAdmin
      .filter(
        (s) =>
          (s.full_name ?? '').toLowerCase().includes(q) ||
          (s.username ?? '').toLowerCase().includes(q) ||
          (s.email ?? '').toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [students, searchQuery, admins]);

  const load = () => {
    apiClient.listAdmins().then(setAdmins).catch((err: any) => notify.error('Failed to load admins', err.message));
  };

  const loadStudents = (search?: string) => {
    setLoadingStudents(true);
    apiClient
      .adminListUsers({ search: search?.trim() || undefined, limit: 100 })
      .then((res) => {
        setStudents(res.items);
      })
      .catch((err: any) => notify.error('Failed to load students', err.message))
      .finally(() => setLoadingStudents(false));
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (grantOpen && !students) {
      loadStudents();
    }
  }, [grantOpen, students]);

  const ensurePointerEvents = () => {
    setTimeout(() => {
      document.body.style.pointerEvents = '';
    }, 50);
  };

  const confirmChange = async () => {
    if (!pendingChange || saving) return;
    const target = { ...pendingChange };
    setSaving(true);
    try {
      await apiClient.setUserRole(target.userId, target.role);
      notify.success(`Role updated to ${target.role.replace('_', ' ')} for ${target.name}`);
      setPendingChange(null);
      load();
      if (grantOpen) {
        loadStudents();
      }
    } catch (err: any) {
      notify.error('Could not update role', err.message);
    } finally {
      setSaving(false);
      ensurePointerEvents();
    }
  };

  return (
    <div className="space-y-6 w-full pb-8">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="font-fraunces text-2xl font-bold text-gray-900 dark:text-white">Admins</h1>
          <p className="text-sm text-gray-400 dark:text-white/40 mt-0.5">
            Current administrator accounts. Grant access to an existing student account below.
          </p>
        </div>
        <button
          onClick={() => setGrantOpen((v) => !v)}
          className="flex items-center justify-center gap-1.5 px-4 py-2 min-h-[44px] rounded-xl bg-[#1A6B3C] dark:bg-emerald-600 hover:bg-[#155730] text-white text-sm font-semibold shrink-0 cursor-pointer shadow-xs transition-all active:scale-[0.98]"
        >
          <UserPlus size={14} /> Grant Access
        </button>
      </div>

      {grantOpen && (
        <div className="bg-white dark:bg-[#161D19] rounded-2xl border border-gray-200/80 dark:border-white/10 p-4 shadow-xs">
          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search students by real name, username, or email…"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white text-sm outline-none focus:border-[#1A6B3C] dark:focus:border-emerald-500 transition-all"
            />
          </div>
          {loadingStudents && !students ? (
            <div className="flex justify-center py-6">
              <Loader2 className="animate-spin text-[#1A6B3C] dark:text-emerald-400" size={18} />
            </div>
          ) : filteredStudents.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-white/40 text-center py-4">No matching students.</p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-white/5">
              {filteredStudents.map((s) => (
                <div
                  key={s.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl hover:bg-gray-50/80 dark:hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <AvatarDisplay
                      src={s.avatar_url}
                      name={s.full_name || s.username || s.email}
                      className="w-10 h-10 rounded-full shrink-0 border border-gray-200 dark:border-white/10"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {s.full_name || 'Student'}
                        </p>
                        {s.username && (
                          <span className="text-xs text-gray-400 dark:text-white/40 truncate">
                            @{s.username}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-white/50 truncate">
                        {s.email}
                        {s.department ? ` • ${s.department}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 sm:self-center self-end">
                    <button
                      type="button"
                      onClick={() =>
                        setPendingChange({
                          userId: s.id,
                          role: 'moderator',
                          name: s.full_name || (s.username ? `@${s.username}` : s.email),
                        })
                      }
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1A6B3C]/10 dark:bg-emerald-500/10 text-[#1A6B3C] dark:text-emerald-400 hover:bg-[#1A6B3C]/20 dark:hover:bg-emerald-500/20 transition-colors cursor-pointer"
                    >
                      Make Moderator
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setPendingChange({
                          userId: s.id,
                          role: 'admin',
                          name: s.full_name || (s.username ? `@${s.username}` : s.email),
                        })
                      }
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 hover:bg-blue-500/20 dark:hover:bg-blue-500/30 transition-colors cursor-pointer"
                    >
                      Make Admin
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="bg-white dark:bg-[#161D19] rounded-2xl border border-gray-200/80 dark:border-white/10 overflow-hidden shadow-xs">
        {!admins ? (
          <div className="flex justify-center py-14">
            <Loader2 className="animate-spin text-[#1A6B3C] dark:text-emerald-400" size={22} />
          </div>
        ) : admins.length === 0 ? (
          <p className="text-center text-sm text-gray-400 dark:text-white/40 py-14">No admins yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02] text-left text-xs text-gray-400 dark:text-white/40 uppercase tracking-wide">
                  <th className="px-5 py-3 font-semibold">Admin</th>
                  <th className="px-5 py-3 font-semibold">Role</th>
                  <th className="px-5 py-3 font-semibold">Since</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr key={admin.id} className="border-b border-gray-50 dark:border-white/5 last:border-0 hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <AvatarDisplay
                          src={admin.avatar_url}
                          name={admin.full_name || admin.username || admin.email}
                          className="w-9 h-9 rounded-full shrink-0 border border-gray-200 dark:border-white/10"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-800 dark:text-white/90 truncate">
                            {admin.full_name ?? (admin.username ? `@${admin.username}` : 'Unnamed')}
                          </p>
                          <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-white/40">
                            {admin.username && <span>@{admin.username} •</span>}
                            <span className="truncate">{admin.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                        admin.role === 'super_admin'
                          ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20'
                          : admin.role === 'admin'
                          ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20'
                          : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                      }`}>
                        <ShieldCheck size={12} />
                        {admin.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-400 dark:text-white/40 text-xs">
                      {new Date(admin.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Select onValueChange={(role) => setPendingChange({ userId: admin.id, role, name: admin.full_name ?? (admin.username ? `@${admin.username}` : admin.email) })}>
                        <SelectTrigger className="w-[170px] ml-auto h-9 text-xs dark:bg-white/5 dark:border-white/10 dark:text-white">
                          <SelectValue placeholder="Change role…" />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-[#161D19] dark:border-white/10">
                          {ROLE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value} className="cursor-pointer text-xs">{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AlertDialog
        open={!!pendingChange}
        onOpenChange={(open) => {
          if (!open && !saving) {
            setPendingChange(null);
            ensurePointerEvents();
          }
        }}
      >
        <AlertDialogContent className="dark:bg-[#161D19] dark:border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-white">
              Change role for {pendingChange?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription className="dark:text-white/60">
              {pendingChange?.role === 'student'
                ? 'This removes their administrative access entirely. They will return to a standard student account.'
                : `This grants them administrative access with the role "${pendingChange?.role.replace('_', ' ')}".`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={saving}
              onClick={() => {
                setPendingChange(null);
                ensurePointerEvents();
              }}
              className="dark:bg-white/5 dark:border-white/10 dark:text-white"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmChange();
              }}
              disabled={saving}
              className="bg-[#1A6B3C] dark:bg-emerald-600 text-white flex items-center gap-1.5"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {saving ? 'Saving…' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
