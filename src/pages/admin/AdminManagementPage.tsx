// src/pages/admin/AdminManagementPage.tsx

import { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, Loader2, Search, UserPlus } from 'lucide-react';
import { apiClient } from '@/api/client';
import type { AdminListItem, AdminRole, ProfileRow } from '@/api/client';
import { notify } from '@/components/ui/sonner';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
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
  const [students, setStudents] = useState<ProfileRow[] | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStudents = useMemo(() => {
    if (!students) return [];
    const q = searchQuery.trim().toLowerCase();
    const notAlreadyAdmin = students.filter((s) => !admins?.some((a) => a.id === s.id));
    if (!q) return notAlreadyAdmin.slice(0, 8);
    return notAlreadyAdmin
      .filter((s) => (s.username ?? '').toLowerCase().includes(q) || (s.full_name ?? '').toLowerCase().includes(q))
      .slice(0, 8);
  }, [students, searchQuery, admins]);

  const load = () => {
    apiClient.listAdmins().then(setAdmins).catch((err: any) => notify.error('Failed to load admins', err.message));
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (grantOpen && !students) {
      apiClient.listProfiles().then(setStudents).catch((err: any) => notify.error('Failed to load students', err.message));
    }
  }, [grantOpen, students]);

  const ensurePointerEvents = () => {
    setTimeout(() => {
      document.body.style.pointerEvents = '';
    }, 50);
  };

  const confirmChange = async () => {
    if (!pendingChange) return;
    setSaving(true);
    try {
      await apiClient.setUserRole(pendingChange.userId, pendingChange.role);
      notify.success('Role updated');
      setPendingChange(null);
      load();
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
              placeholder="Search students by name or username…"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white text-sm outline-none focus:border-[#1A6B3C] dark:focus:border-emerald-500 transition-all"
            />
          </div>
          {!students ? (
            <div className="flex justify-center py-6"><Loader2 className="animate-spin text-[#1A6B3C] dark:text-emerald-400" size={18} /></div>
          ) : filteredStudents.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-white/40 text-center py-4">No matching students.</p>
          ) : (
            <div className="space-y-1">
              {filteredStudents.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setPendingChange({ userId: s.id, role: 'moderator', name: s.username ?? s.full_name ?? 'this student' })}
                  className="w-full flex items-center justify-between px-3 py-2.5 min-h-[44px] rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 text-left transition-colors cursor-pointer"
                >
                  <span className="text-sm font-medium text-gray-700 dark:text-white/80">
                    {s.username ? `@${s.username}` : s.full_name ?? 'Student'}
                  </span>
                  <span className="text-xs text-[#1A6B3C] dark:text-emerald-400 font-semibold">Make Moderator</span>
                </button>
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
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#1A6B3C]/10 dark:bg-emerald-500/10 flex items-center justify-center">
                          <ShieldCheck size={14} className="text-[#1A6B3C] dark:text-emerald-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 dark:text-white/90">
                            {admin.username ? `@${admin.username}` : admin.full_name ?? 'Unnamed'}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-white/40">{admin.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 capitalize text-gray-600 dark:text-white/70 font-medium">{admin.role.replace('_', ' ')}</td>
                    <td className="px-5 py-3.5 text-gray-400 dark:text-white/40 text-xs">
                      {new Date(admin.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Select onValueChange={(role) => setPendingChange({ userId: admin.id, role, name: admin.username ?? admin.full_name ?? 'this admin' })}>
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
          if (!open) {
            setPendingChange(null);
            ensurePointerEvents();
          }
        }}
      >
        <AlertDialogContent className="dark:bg-[#161D19] dark:border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-white">Change role for {pendingChange?.name}?</AlertDialogTitle>
            <AlertDialogDescription className="dark:text-white/60">
              {pendingChange?.role === 'student'
                ? 'This removes their admin access entirely.'
                : `This changes their role to ${pendingChange?.role.replace('_', ' ')}.`}
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
            <AlertDialogAction onClick={confirmChange} disabled={saving} className="bg-[#1A6B3C] dark:bg-emerald-600 text-white">
              {saving ? 'Saving…' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
