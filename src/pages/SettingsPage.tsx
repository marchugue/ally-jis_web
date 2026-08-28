// src/pages/SettingsPage.tsx
//
// General settings hub with a full-bleed split-pane layout matching MessagesPage.
// Left sidebar lists settings categories and search; right pane displays the active section.

import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  KeyRound, ShieldOff, LogOut, Trash2, ChevronRight, Eye, EyeOff,
  UserCheck, Bell, Shield, Lock, Smartphone, Moon, CheckCircle2, Sliders,
  Search, ArrowLeft, User
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiClient, isApiConfigured } from '@/api/client';
import { profileService } from '@/lib/services/profileService';
import { notify } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

type SettingsTab = 'security' | 'privacy' | 'preferences' | 'account';

interface CategoryItem {
  id: SettingsTab;
  title: string;
  subtitle: string;
  icon: any;
  keywords: string[];
}

const CATEGORIES: CategoryItem[] = [
  {
    id: 'security',
    title: 'Password & Security',
    subtitle: 'Manage credentials and account access',
    icon: Lock,
    keywords: ['password', 'security', 'credentials', 'login', 'change'],
  },
  {
    id: 'privacy',
    title: 'Privacy & Safety',
    subtitle: 'Blocked users, read receipts & status',
    icon: Shield,
    keywords: ['privacy', 'safety', 'blocked', 'receipts', 'status', 'online'],
  },
  {
    id: 'preferences',
    title: 'Notifications & Alerts',
    subtitle: 'Push alerts & digest preferences',
    icon: Bell,
    keywords: ['notifications', 'alerts', 'email', 'digest', 'match'],
  },
  {
    id: 'account',
    title: 'Account & Danger Zone',
    subtitle: 'Sign out and permanent deletion',
    icon: Sliders,
    keywords: ['account', 'delete', 'logout', 'signout', 'danger', 'remove'],
  },
];

function PasswordField({
  label, value, onChange, show, onToggleShow, placeholder
}: {
  label: string; value: string; onChange: (v: string) => void; show: boolean; onToggleShow: () => void; placeholder?: string;
}) {
  return (
    <div>
      <label className="font-jakarta text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || '••••••••'}
          className="w-full px-4 py-3 pr-11 rounded-xl border border-gray-200 focus:border-[#1A6B3C] focus:ring-2 focus:ring-[#1A6B3C]/10 bg-white font-jakarta text-sm outline-none transition-all shadow-sm"
          autoComplete="new-password"
        />
        <button type="button" onClick={onToggleShow} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1">
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}

function ToggleItem({
  title, description, checked, onChange, icon: Icon
}: {
  title: string; description: string; checked: boolean; onChange: (val: boolean) => void; icon?: any;
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-white border border-gray-200/80 hover:border-[#1A6B3C]/20 transition-all">
      <div className="flex items-start gap-3.5 pr-4">
        {Icon && (
          <div className="w-9 h-9 rounded-lg bg-[#1A6B3C]/8 flex items-center justify-center flex-shrink-0 text-[#1A6B3C] mt-0.5">
            <Icon size={18} />
          </div>
        )}
        <div>
          <h4 className="font-jakarta text-sm font-bold text-gray-900">{title}</h4>
          <p className="font-jakarta text-xs text-gray-500 mt-0.5 leading-relaxed">{description}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`w-12 h-6 rounded-full transition-colors p-0.5 relative flex-shrink-0 ${checked ? 'bg-[#1A6B3C]' : 'bg-gray-200'}`}
      >
        <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const useBackend = Boolean(isApiConfigured && user);

  const [activeTab, setActiveTab] = useState<SettingsTab>('security');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);

  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Preference Toggles
  const [readReceipts, setReadReceipts] = useState(true);
  const [activityStatus, setActivityStatus] = useState(true);
  const [matchAlerts, setMatchAlerts] = useState(true);
  const [emailDigest, setEmailDigest] = useState(false);

  const [blockedCount, setBlockedCount] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!useBackend) return;
    apiClient.listBlockedUsers().then((rows) => setBlockedCount(rows.length)).catch(() => setBlockedCount(null));
  }, [useBackend]);

  const handleSelectTab = (tab: SettingsTab) => {
    setActiveTab(tab);
    setIsMobileDetailOpen(true);
  };

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return CATEGORIES;
    const q = searchQuery.toLowerCase().trim();
    return CATEGORIES.filter(
      (cat) =>
        cat.title.toLowerCase().includes(q) ||
        cat.subtitle.toLowerCase().includes(q) ||
        cat.keywords.some((k) => k.includes(q))
    );
  }, [searchQuery]);

  const activeCategoryInfo = CATEGORIES.find((c) => c.id === activeTab) || CATEGORIES[0];

  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      notify.error('Password too short', 'Use at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      notify.error("Passwords don't match");
      return;
    }
    setChangingPassword(true);
    try {
      await apiClient.changePassword(currentPassword, newPassword);
      notify.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      notify.error('Could not update password', err?.message);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      if (useBackend) await profileService.deleteProfile();
      await signOut();
      navigate('/', { replace: true });
    } catch (err: any) {
      notify.error('Delete failed', err?.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex-1 flex min-h-0 h-full w-full bg-white overflow-hidden">

      {/* ── Left Sidebar Panel (Similar to Messages Page Conversation List) ── */}
      <div
        className={cn(
          'w-full md:w-[320px] lg:w-[360px] bg-white flex flex-col overflow-hidden min-h-0 flex-shrink-0 border-r border-gray-200/80',
          isMobileDetailOpen && 'hidden md:flex'
        )}
      >
        {/* Sidebar Header */}
        <div className="p-4 flex items-center justify-between flex-shrink-0 border-b border-gray-100">
          <div>
            <h1 className="font-fraunces text-2xl font-bold text-gray-900">Settings</h1>
            <p className="font-jakarta text-xs text-gray-400 mt-0.5">Account & preference settings</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 py-3 flex-shrink-0 border-b border-gray-100">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search settings..."
              className="w-full bg-gray-100 rounded-xl pl-9 pr-4 py-2 text-xs font-jakarta text-gray-700 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-[#1A6B3C]/20 transition-all"
            />
          </div>
        </div>

        {/* Categories List */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {filteredCategories.length === 0 ? (
            <div className="p-6 text-center text-gray-400 text-xs font-jakarta">
              No matching settings found
            </div>
          ) : (
            filteredCategories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeTab === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleSelectTab(cat.id)}
                  className={cn(
                    'w-full text-left p-4 flex items-start gap-3.5 transition-colors relative',
                    isActive
                      ? 'bg-[#1A6B3C]/8 border-l-4 border-[#1A6B3C]'
                      : 'hover:bg-gray-50/80 border-l-4 border-transparent'
                  )}
                >
                  <div
                    className={cn(
                      'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5',
                      isActive ? 'bg-[#1A6B3C] text-white shadow-sm' : 'bg-gray-100 text-gray-600'
                    )}
                  >
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={cn('font-jakarta text-sm font-bold truncate', isActive ? 'text-[#1A6B3C]' : 'text-gray-900')}>
                        {cat.title}
                      </span>
                      <ChevronRight size={14} className={cn('flex-shrink-0', isActive ? 'text-[#1A6B3C]' : 'text-gray-300')} />
                    </div>
                    <p className="font-jakarta text-xs text-gray-400 mt-0.5 truncate">{cat.subtitle}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Right Content View Pane (Full-bleed detail view) ── */}
      <div
        className={cn(
          'flex-1 bg-white flex flex-col overflow-hidden min-h-0',
          !isMobileDetailOpen && 'hidden md:flex'
        )}
      >
        {/* Detail Content Body Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#FAF9F6]">
          <div className="max-w-2xl mx-auto space-y-6">

            {/* TAB 1: SECURITY */}
            {activeTab === 'security' && (
              <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8 space-y-6 shadow-sm">
                <div className="border-b border-gray-100 pb-4">
                  <h3 className="font-fraunces text-lg font-bold text-gray-900 flex items-center gap-2">
                    <KeyRound size={20} className="text-[#1A6B3C]" /> Change Password
                  </h3>
                  <p className="font-jakarta text-xs text-gray-500 mt-1">Ensure your account is using a strong, unique password.</p>
                </div>

                <div className="space-y-4">
                  <PasswordField
                    label="Current Password"
                    value={currentPassword}
                    onChange={setCurrentPassword}
                    show={showPasswords}
                    onToggleShow={() => setShowPasswords((v) => !v)}
                  />
                  <PasswordField
                    label="New Password"
                    value={newPassword}
                    onChange={setNewPassword}
                    show={showPasswords}
                    onToggleShow={() => setShowPasswords((v) => !v)}
                    placeholder="Min. 8 characters"
                  />
                  <PasswordField
                    label="Confirm New Password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    show={showPasswords}
                    onToggleShow={() => setShowPasswords((v) => !v)}
                  />

                  <div className="pt-2">
                    <button
                      onClick={handleChangePassword}
                      disabled={changingPassword || !currentPassword || !newPassword}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#1A6B3C] text-white font-jakarta text-sm font-bold hover:bg-[#155a33] active:scale-[0.99] transition-all disabled:opacity-50 shadow-sm"
                    >
                      <KeyRound size={16} /> {changingPassword ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: PRIVACY & SAFETY */}
            {activeTab === 'privacy' && (
              <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8 space-y-6 shadow-sm">
                <div className="border-b border-gray-100 pb-4">
                  <h3 className="font-fraunces text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Shield size={20} className="text-[#1A6B3C]" /> Privacy & Safety Control
                  </h3>
                  <p className="font-jakarta text-xs text-gray-500 mt-1">Manage who can see your activity and view blocked members.</p>
                </div>

                {/* Blocked Users Link Card */}
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between hover:bg-gray-100/70 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center font-bold">
                      <ShieldOff size={18} />
                    </div>
                    <div>
                      <h4 className="font-jakarta text-sm font-bold text-gray-900">Blocked Users</h4>
                      <p className="font-jakarta text-xs text-gray-500">View and manage users you have previously blocked</p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/blocked-users')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-gray-200 font-jakarta text-xs font-bold text-gray-700 hover:border-[#1A6B3C] hover:text-[#1A6B3C] transition-all shadow-sm"
                  >
                    <span>{blockedCount !== null ? `${blockedCount} blocked` : 'Manage'}</span>
                    <ChevronRight size={14} />
                  </button>
                </div>

                <div className="space-y-3 pt-2">
                  <ToggleItem
                    title="Read Receipts"
                    description="Allow chat partners to see when you've read their messages."
                    checked={readReceipts}
                    onChange={setReadReceipts}
                    icon={UserCheck}
                  />
                  <ToggleItem
                    title="Online & Activity Status"
                    description="Show when you are currently online or active in Ally-jis."
                    checked={activityStatus}
                    onChange={setActivityStatus}
                    icon={Smartphone}
                  />
                </div>
              </div>
            )}

            {/* TAB 3: PREFERENCES & NOTIFICATIONS */}
            {activeTab === 'preferences' && (
              <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8 space-y-6 shadow-sm">
                <div className="border-b border-gray-100 pb-4">
                  <h3 className="font-fraunces text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Bell size={20} className="text-[#1A6B3C]" /> Notifications & Alerts
                  </h3>
                  <p className="font-jakarta text-xs text-gray-500 mt-1">Configure how and when Ally-jis notifies you about updates.</p>
                </div>

                <div className="space-y-3">
                  <ToggleItem
                    title="Match & Request Push Notifications"
                    description="Get instant notifications for new match suggestions and ally requests."
                    checked={matchAlerts}
                    onChange={setMatchAlerts}
                    icon={Bell}
                  />
                  <ToggleItem
                    title="Weekly Campus Activity Digest"
                    description="Receive a weekly summary email of popular posts and campus announcements."
                    checked={emailDigest}
                    onChange={setEmailDigest}
                    icon={Moon}
                  />
                </div>
              </div>
            )}

            {/* TAB 4: ACCOUNT & DANGER ZONE */}
            {activeTab === 'account' && (
              <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8 space-y-6 shadow-sm">
                <div className="border-b border-gray-100 pb-4">
                  <h3 className="font-fraunces text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Sliders size={20} className="text-[#1A6B3C]" /> Account Actions & Danger Zone
                  </h3>
                  <p className="font-jakarta text-xs text-gray-500 mt-1">Session sign out and permanent account deletion options.</p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                    <div>
                      <h4 className="font-jakarta text-sm font-bold text-gray-900">Sign Out of Session</h4>
                      <p className="font-jakarta text-xs text-gray-500">Safely log out of your current session on this device.</p>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white font-jakarta text-xs font-bold text-gray-700 hover:bg-gray-100 hover:border-gray-400 transition-all shadow-sm"
                    >
                      <LogOut size={14} /> Log out
                    </button>
                  </div>

                  {/* Danger Zone */}
                  <div className="p-5 rounded-xl bg-red-50/70 border border-red-200/80 space-y-3">
                    <div className="flex items-center gap-2 text-red-700 font-jakarta font-bold text-sm">
                      <Trash2 size={16} /> Danger Zone
                    </div>
                    <p className="font-jakarta text-xs text-red-600/90 leading-relaxed">
                      Permanently delete your profile, posts, connections, and message history. This action cannot be reversed.
                    </p>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white font-jakarta text-xs font-bold hover:bg-red-700 transition-all shadow-sm">
                          <Trash2 size={14} /> Delete Account
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-2xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="font-fraunces text-lg font-bold text-gray-900">Delete your account permanently?</AlertDialogTitle>
                          <AlertDialogDescription className="font-jakarta text-sm text-gray-500">
                            This will permanently remove your profile, posts, match history, and conversations. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel disabled={deleting} className="rounded-xl font-jakarta text-xs font-semibold">Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteAccount}
                            disabled={deleting}
                            className="bg-red-600 hover:bg-red-700 rounded-xl font-jakarta text-xs font-bold"
                          >
                            {deleting ? 'Deleting...' : 'Delete account'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>

    </div>
  );
}
