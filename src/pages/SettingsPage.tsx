// src/pages/SettingsPage.tsx
//
// Modernized General Settings Hub for Ally-jis users.
// Provides 4 focused, 100% functional categories:
//  1. Account & Security (Credentials, Password change, Session logout)
//  2. Privacy & Safety (Online presence, Read receipts, Visibility scopes, Blocked users)
//  3. Notifications & Alerts (Streak reminders, Push alerts, Quiet hours)
//  4. Appearance & Danger Zone (Light/Dark/System theme, Permanent account erasure)

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  KeyRound, ShieldOff, ShieldAlert, LogOut, Trash2, ChevronRight, Eye, EyeOff,
  UserCheck, Bell, Shield, Lock, Smartphone, Moon, Sliders,
  Search, ArrowLeft, ShieldCheck, Zap, Sun, Monitor, Palette,
  Flame, MessageSquare, Volume2, Clock, Check, History,
  Pencil, CircleHelp, RotateCw, Ban, X
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useAdminMe } from '@/hooks/useAdminMe';
import { useTheme } from '@/context/ThemeContext';
import { apiClient, isApiConfigured } from '@/api/client';
import type { UserPreferences, UpdateUserPreferencesPayload } from '@/api/types';
import { notify } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';
import { LogoutConfirmModal } from '@/components/auth/LogoutConfirmModal';
import { ActivityLogSection } from '@/components/settings/ActivityLogSection';
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator';

type SettingsTab =
  | 'account'
  | 'privacy'
  | 'notifications'
  | 'activity'
  | 'appearance';

interface CategoryItem {
  id: SettingsTab;
  title: string;
  subtitle: string;
  icon: any;
  keywords: string[];
}

const CATEGORIES: CategoryItem[] = [
  {
    id: 'account',
    title: 'Account & Security',
    subtitle: 'Password, credentials & session access',
    icon: Lock,
    keywords: ['password', 'security', 'credentials', 'login', 'account', 'email'],
  },
  {
    id: 'privacy',
    title: 'Privacy & Safety',
    subtitle: 'Online presence, receipts & visibility',
    icon: Shield,
    keywords: ['privacy', 'safety', 'blocked', 'receipts', 'status', 'online', 'visibility'],
  },
  {
    id: 'notifications',
    title: 'Notifications & Alerts',
    subtitle: 'Streak reminders, alerts & quiet hours',
    icon: Bell,
    keywords: ['notifications', 'alerts', 'streak', 'messages', 'sound', 'quiet hours'],
  },
  {
    id: 'activity',
    title: 'Activity Log',
    subtitle: 'History of your posts, connections & logins',
    icon: History,
    keywords: ['activity', 'log', 'history', 'audit', 'login', 'security', 'interactions', 'posts'],
  },
  {
    id: 'appearance',
    title: 'Appearance & Danger Zone',
    subtitle: 'Theme customization & account deletion',
    icon: Palette,
    keywords: ['appearance', 'theme', 'dark', 'light', 'danger', 'delete'],
  },
];

const DEFAULT_PREFERENCES: UserPreferences = {
  user_id: '',
  discovery_enabled: true,
  match_gender_preference: 'any',
  match_department_preference: 'any',
  match_same_year_only: false,
  interests_strict_match: false,
  show_online_status: true,
  show_last_active: true,
  read_receipts_enabled: true,
  account_privacy: 'public',
  profile_visibility: 'campus',
  feed_post_audience: 'campus',
  typing_indicators_enabled: true,
  auto_reveal_identity_stage: 4,
  notify_chat_messages: true,
  notify_match_requests: true,
  notify_streak_reminders: true,
  notify_confessions: true,
  notify_sound_enabled: true,
  quiet_hours_enabled: false,
  quiet_hours_start: '22:00',
  quiet_hours_end: '07:00',
};

function PasswordField({
  label, value, onChange, show, onToggleShow, placeholder
}: {
  label: string; value: string; onChange: (v: string) => void; show: boolean; onToggleShow: () => void; placeholder?: string;
}) {
  return (
    <div>
      <label className="font-jakarta text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || '••••••••'}
          className="w-full px-4 py-3 pr-11 rounded-xl border border-gray-200 dark:border-white/10 focus:border-[#1A6B3C] dark:focus:border-emerald-500 focus:ring-2 focus:ring-[#1A6B3C]/10 dark:focus:ring-emerald-500/20 bg-white dark:bg-white/5 font-jakarta text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none transition-all shadow-xs"
          autoComplete="new-password"
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1 cursor-pointer"
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}

function ToggleItem({
  title, description, checked, onChange, icon: Icon, disabled = false
}: {
  title: string; description: string; checked: boolean; onChange: (val: boolean) => void; icon?: any; disabled?: boolean;
}) {
  return (
    <div className={cn(
      "flex items-center justify-between p-4 rounded-xl bg-white dark:bg-[#111827] border border-gray-200/80 dark:border-white/10 hover:border-[#1A6B3C]/30 dark:hover:border-emerald-500/30 transition-all shadow-xs",
      disabled && "opacity-50 pointer-events-none"
    )}>
      <div className="flex items-start gap-3.5 pr-4">
        {Icon && (
          <div className="w-9 h-9 rounded-lg bg-[#1A6B3C]/10 dark:bg-emerald-500/15 flex items-center justify-center flex-shrink-0 text-[#1A6B3C] dark:text-emerald-400 mt-0.5">
            <Icon size={18} />
          </div>
        )}
        <div>
          <h4 className="font-jakarta text-sm font-bold text-gray-900 dark:text-white">{title}</h4>
          <p className="font-jakarta text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{description}</p>
        </div>
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`w-12 h-6 rounded-full transition-colors p-0.5 relative flex-shrink-0 cursor-pointer ${
          checked ? 'bg-[#1A6B3C] dark:bg-emerald-600' : 'bg-gray-200 dark:bg-gray-700'
        }`}
      >
        <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <h3 className="font-jakarta text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2.5 mt-6 px-1">
      {title}
    </h3>
  );
}

function SlimSwitch({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      className={cn(
        'w-11 h-6 rounded-full transition-colors p-0.5 relative flex-shrink-0 cursor-pointer outline-none',
        checked ? 'bg-[#1A6B3C] dark:bg-emerald-600' : 'bg-gray-200 dark:bg-gray-700',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <div
        className={cn(
          'w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out',
          checked ? 'translate-x-5' : 'translate-x-0'
        )}
      />
    </button>
  );
}

function MobileSettingCard({
  icon: Icon,
  title,
  onPress,
  destructive = false,
  badgeText,
  badgeColor = 'text-[#1A6B3C] dark:text-emerald-400',
  badgeBgColor = 'bg-[#1A6B3C]/10 dark:bg-emerald-500/15',
  rightElement,
  loading = false,
}: {
  icon: any;
  title: string;
  onPress?: () => void;
  destructive?: boolean;
  badgeText?: string;
  badgeColor?: string;
  badgeBgColor?: string;
  rightElement?: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      disabled={!onPress && !rightElement}
      className={cn(
        'w-full bg-white dark:bg-[#111827] rounded-[20px] py-[15px] px-[18px] flex items-center mb-2.5 border border-[#F0F2F5] dark:border-white/10 shadow-xs transition-all text-left group',
        onPress ? 'hover:border-[#1A6B3C]/30 active:scale-[0.99] cursor-pointer' : 'cursor-default'
      )}
    >
      <div className="w-6 flex items-center justify-center flex-shrink-0">
        <Icon size={21} className={destructive ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'} strokeWidth={1.8} />
      </div>
      <span
        className={cn(
          'flex-1 ml-3.5 text-[15.5px] font-bold font-jakarta truncate',
          destructive ? 'text-red-600 dark:text-red-400' : 'text-[#111827] dark:text-white'
        )}
      >
        {title}
      </span>
      {loading ? (
        <span className="w-4 h-4 border-2 border-[#1A6B3C] border-t-transparent rounded-full animate-spin" />
      ) : rightElement ? (
        rightElement
      ) : badgeText ? (
        <span className={cn('text-[11.5px] font-jakarta font-bold px-2.5 py-1 rounded-full', badgeBgColor, badgeColor)}>
          {badgeText}
        </span>
      ) : onPress ? (
        <ChevronRight size={19} className="text-[#C4C8D0] dark:text-gray-600 group-hover:text-gray-400 transition-colors" strokeWidth={2.2} />
      ) : null}
    </button>
  );
}

function MobileSettingToggleCard({
  icon: Icon,
  title,
  value,
  onValueChange,
  disabled = false,
}: {
  icon: any;
  title: string;
  value: boolean;
  onValueChange: (val: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div
      onClick={() => !disabled && onValueChange(!value)}
      className={cn(
        'bg-white dark:bg-[#111827] rounded-[20px] py-[15px] px-[18px] flex items-center mb-2.5 border border-[#F0F2F5] dark:border-white/10 shadow-xs transition-all cursor-pointer hover:border-[#1A6B3C]/30 select-none',
        disabled && 'opacity-50 pointer-events-none'
      )}
    >
      <div className="w-6 flex items-center justify-center flex-shrink-0">
        <Icon size={21} className="text-gray-700 dark:text-gray-300" strokeWidth={1.8} />
      </div>
      <span className="flex-1 ml-3.5 text-[15.5px] font-bold font-jakarta text-[#111827] dark:text-white truncate">
        {title}
      </span>
      <SlimSwitch checked={value} onChange={onValueChange} disabled={disabled} />
    </div>
  );
}

function HelpItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      onClick={() => setOpen(!open)}
      className="bg-[#F9F8F6] dark:bg-white/5 rounded-2xl p-4 mb-2.5 border border-[#EAE7E1] dark:border-white/10 cursor-pointer transition-colors"
    >
      <div className="flex items-center justify-between gap-2">
        <h5 className="text-[13.5px] font-bold font-jakarta text-gray-900 dark:text-white flex-1">
          {question}
        </h5>
        <ChevronRight
          size={16}
          className={cn('text-gray-400 transition-transform duration-200', open && 'rotate-90')}
        />
      </div>
      {open && (
        <p className="text-[12.5px] font-jakarta text-gray-600 dark:text-gray-300 mt-2.5 leading-relaxed">
          {answer}
        </p>
      )}
    </div>
  );
}

function AccountDeletionModal({
  isOpen,
  onClose,
  onConfirmDelete,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: () => Promise<void>;
}) {
  const [confirmInput, setConfirmInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Initializing account erasure...');

  useEffect(() => {
    if (!isOpen) {
      setConfirmInput('');
      setIsDeleting(false);
      setProgress(0);
      setStatusText('Initializing account erasure...');
    }
  }, [isOpen]);

  const handleStartDeletion = async () => {
    setIsDeleting(true);

    const steps = [
      { p: 15, msg: 'Revoking active tokens & session state...' },
      { p: 35, msg: 'Archiving and scrubbing chat history & interactions...' },
      { p: 60, msg: 'Purging authored feed posts, comments, & reactions...' },
      { p: 85, msg: 'Unlinking student verification records & avatars...' },
      { p: 98, msg: 'Executing permanent profile record removal...' },
    ];

    for (const step of steps) {
      await new Promise((r) => setTimeout(r, 400));
      setProgress(step.p);
      setStatusText(step.msg);
    }

    try {
      await onConfirmDelete();
      setProgress(100);
      setStatusText('Account erased. Goodbye.');
    } catch {
      setIsDeleting(false);
      setProgress(0);
      setStatusText('Deletion failed. Please try again or contact support.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-[#111827] rounded-2xl border border-red-200 dark:border-red-900/40 p-6 sm:p-8 space-y-6 shadow-2xl relative">
        {!isDeleting ? (
          <>
            <div>
              <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mb-4">
                <Trash2 size={24} />
              </div>
              <h3 className="font-fraunces text-xl font-bold text-gray-900 dark:text-white">
                Delete Account Permanently?
              </h3>
              <p className="font-jakarta text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                This action is non-reversible. Once initiated, all your data will be permanently wiped from the Ally-jis database:
              </p>
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-xs font-jakarta">
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200/80 dark:border-white/5 text-gray-700 dark:text-gray-300">
                  <span className="font-bold block text-gray-900 dark:text-white mb-0.5">Chat History</span>
                  Sent messages & media
                </div>
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200/80 dark:border-white/5 text-gray-700 dark:text-gray-300">
                  <span className="font-bold block text-gray-900 dark:text-white mb-0.5">Posts & Feed</span>
                  Authored posts & comments
                </div>
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200/80 dark:border-white/5 text-gray-700 dark:text-gray-300">
                  <span className="font-bold block text-gray-900 dark:text-white mb-0.5">Ally Connections</span>
                  Saved friend connections
                </div>
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200/80 dark:border-white/5 text-gray-700 dark:text-gray-300">
                  <span className="font-bold block text-gray-900 dark:text-white mb-0.5">Preferences</span>
                  Custom configurations
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-jakarta text-xs font-semibold text-gray-600 dark:text-gray-300 block">
                To confirm deletion, type <code className="bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded font-mono font-bold">DELETE</code> below:
              </label>
              <input
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder="DELETE"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white font-mono text-sm outline-none focus:border-red-500 dark:focus:border-red-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 font-jakarta text-xs font-semibold hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStartDeletion}
                disabled={confirmInput.trim().toUpperCase() !== 'DELETE'}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-jakarta text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Permanently Erase Account
              </button>
            </div>
          </>
        ) : (
          <div className="py-4 space-y-5 text-center">
            <div>
              <h3 className="font-fraunces text-xl font-bold text-gray-900 dark:text-white">
                Erasing Account & Data
              </h3>
              <p className="font-jakarta text-xs text-gray-500 dark:text-gray-400 mt-2 min-h-[20px] transition-all">
                {statusText}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-mono font-bold text-gray-500 dark:text-gray-400">
                <span>Erasure Status</span>
                <span className="text-red-600 dark:text-red-400">{progress}%</span>
              </div>
              <div className="w-full h-3 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-red-500 to-rose-600 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { user, signOut, deleteAccount } = useAuth();
  const { role: adminRole } = useAdminMe();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const navigate = useNavigate();
  const useBackend = Boolean(isApiConfigured && user);

  const [activeTab, setActiveTab] = useState<SettingsTab>('account');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // User Preferences State
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [blockedCount, setBlockedCount] = useState<number | null>(null);
  const [restrictedCount, setRestrictedCount] = useState<number | null>(null);
  const [isDeletionModalOpen, setIsDeletionModalOpen] = useState(false);

  // Mobile View Modals & Actions
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showActivityLogModal, setShowActivityLogModal] = useState(false);
  const [checkingUpdate, setCheckingUpdate] = useState(false);

  // Load preferences from backend
  useEffect(() => {
    if (!useBackend) return;
    apiClient.getMyPreferences()
      .then((data) => {
        if (data) setPreferences(data);
      })
      .catch((err) => {
        console.warn('[SettingsPage] Could not load user preferences:', err);
      });

    apiClient.listBlockedUsers()
      .then((rows) => setBlockedCount(rows.length))
      .catch(() => setBlockedCount(null));

    apiClient.listRestrictedUsers()
      .then((rows) => setRestrictedCount(rows.length))
      .catch(() => setRestrictedCount(null));
  }, [useBackend]);

  // Generic patch preference handler with optimistic update
  const handleUpdatePref = useCallback(async (updates: UpdateUserPreferencesPayload) => {
    // Optimistic UI update
    setPreferences((prev) => ({ ...prev, ...updates }));

    try {
      if (useBackend) {
        await apiClient.updateMyPreferences(updates);
      }
      notify.success('Preference updated');
    } catch (err: any) {
      notify.error('Failed to save preference', err?.message);
      // Revert from backend if error
      if (useBackend) {
        apiClient.getMyPreferences().then((data) => {
          if (data) setPreferences(data);
        }).catch(() => {});
      }
    }
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
    try {
      await deleteAccount();
      notify.success('Account deleted', 'Your account and data have been removed.');
      navigate('/', { replace: true });
    } catch (err: any) {
      notify.error('Delete failed', err?.message);
      throw err;
    }
  };

  return (
    <div className="flex-1 flex min-h-0 h-full w-full bg-[#F7F8FA] dark:bg-[#070A10] text-gray-900 dark:text-[#E2E8F0] overflow-hidden font-sans">

      {/* Account Deletion Modal */}
      <AccountDeletionModal
        isOpen={isDeletionModalOpen}
        onClose={() => setIsDeletionModalOpen(false)}
        onConfirmDelete={handleDeleteAccount}
      />

      {/* ── MOBILE SETTINGS VIEW (Visible on < md screens, identical to mobile app settings UI) ── */}
      <div className="md:hidden flex-1 flex flex-col h-full min-h-0 overflow-y-auto bg-[#F7F8FA] dark:bg-[#0B0F17]">
        {/* Top Header with Back Navigation */}
        <div className="px-5 pt-4 pb-1 flex items-center justify-between flex-shrink-0">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-[38px] h-[38px] rounded-full bg-white dark:bg-[#1A2333] border border-gray-200 dark:border-white/10 flex items-center justify-center shadow-xs hover:bg-gray-50 dark:hover:bg-white/5 active:scale-95 transition-all cursor-pointer text-gray-900 dark:text-white"
            aria-label="Go back"
          >
            <ArrowLeft size={18} />
          </button>
        </div>

        {/* Large Page Title */}
        <div className="px-5 pt-2 pb-3 flex-shrink-0">
          <h1 className="text-[32px] font-bold text-gray-900 dark:text-white tracking-[-0.6px] font-jakarta">
            Setting
          </h1>
        </div>

        <div className="px-5 pb-12 flex-1">
          {/* ── 1. ACCOUNT ── */}
          <SectionTitle title="Account" />

          {/* User Account / Email */}
          <MobileSettingCard
            icon={ShieldCheck}
            title={user?.email ? user.email.split('@')[0] : 'Verified Student'}
            badgeText="Verified"
            badgeColor="text-[#1A6B3C] dark:text-emerald-400"
            badgeBgColor="bg-[#1A6B3C]/10 dark:bg-emerald-500/15"
          />

          {/* Edit Profile */}
          <MobileSettingCard
            icon={Pencil}
            title="Edit Profile"
            onPress={() => navigate('/profile')}
          />

          {/* Change Password */}
          <MobileSettingCard
            icon={KeyRound}
            title="Change Password"
            onPress={() => setShowPasswordModal(true)}
          />

          {/* ── 2. PRIVACY & SECURITY ── */}
          <SectionTitle title="Privacy & Security" />

          {/* Privacy Controls */}
          <MobileSettingCard
            icon={Lock}
            title="Privacy Controls"
            onPress={() => setShowPrivacyModal(true)}
          />

          {/* Permissions */}
          <MobileSettingCard
            icon={Shield}
            title="Permissions"
            onPress={() => {
              notify.info('Permissions', 'Browser permissions can be configured in your site settings.');
            }}
          />

          {/* Private Account */}
          <MobileSettingToggleCard
            icon={EyeOff}
            title="Private Account"
            value={preferences.account_privacy === 'private'}
            onValueChange={(val) => handleUpdatePref({ account_privacy: val ? 'private' : 'public' })}
          />

          {/* Online Status */}
          <MobileSettingToggleCard
            icon={Smartphone}
            title="Online Status"
            value={preferences.show_online_status}
            onValueChange={(val) => handleUpdatePref({ show_online_status: val })}
          />

          {/* Last Active Timestamp */}
          <MobileSettingToggleCard
            icon={Clock}
            title="Last Active Timestamp"
            value={preferences.show_last_active}
            onValueChange={(val) => handleUpdatePref({ show_last_active: val })}
          />

          {/* Read Receipts */}
          <MobileSettingToggleCard
            icon={UserCheck}
            title="Read Receipts"
            value={preferences.read_receipts_enabled}
            onValueChange={(val) => handleUpdatePref({ read_receipts_enabled: val })}
          />

          {/* Blocked Users */}
          <MobileSettingCard
            icon={Ban}
            title="Blocked Users"
            badgeText={blockedCount !== null ? `${blockedCount} blocked` : undefined}
            onPress={() => navigate('/blocked-users')}
          />

          {/* Restricted Users */}
          <MobileSettingCard
            icon={ShieldAlert}
            title="Restricted Users"
            badgeText={restrictedCount !== null ? `${restrictedCount} restricted` : undefined}
            onPress={() => navigate('/restricted-users')}
          />

          {/* Privacy Policy */}
          <MobileSettingCard
            icon={ShieldCheck}
            title="Privacy Policy"
            onPress={() => window.open('https://ally-jis.com/privacy', '_blank')}
          />

          {/* ── 3. APPEARANCE & ALERTS ── */}
          <SectionTitle title="Appearance & Alerts" />

          {/* Dark Mode */}
          <MobileSettingToggleCard
            icon={resolvedTheme === 'dark' ? Moon : Sun}
            title="Dark Mode"
            value={resolvedTheme === 'dark'}
            onValueChange={(val) => setTheme(val ? 'dark' : 'light')}
          />

          {/* Notifications / Direct Chat */}
          <MobileSettingToggleCard
            icon={Bell}
            title="Direct Chat Messages"
            value={preferences.notify_chat_messages}
            onValueChange={(val) => handleUpdatePref({ notify_chat_messages: val })}
          />

          {/* Match & Ally Requests */}
          <MobileSettingToggleCard
            icon={Bell}
            title="Match & Ally Requests"
            value={preferences.notify_match_requests}
            onValueChange={(val) => handleUpdatePref({ notify_match_requests: val })}
          />

          {/* Streak Reminders */}
          <MobileSettingToggleCard
            icon={Flame}
            title="Streak Reminders"
            value={preferences.notify_streak_reminders}
            onValueChange={(val) => handleUpdatePref({ notify_streak_reminders: val })}
          />

          {/* Feed & Confession Alerts */}
          <MobileSettingToggleCard
            icon={MessageSquare}
            title="Feed & Confession Alerts"
            value={preferences.notify_confessions}
            onValueChange={(val) => handleUpdatePref({ notify_confessions: val })}
          />

          {/* In-App Sounds */}
          <MobileSettingToggleCard
            icon={Volume2}
            title="In-App Sounds"
            value={preferences.notify_sound_enabled}
            onValueChange={(val) => handleUpdatePref({ notify_sound_enabled: val })}
          />

          {/* Quiet Hours (Do Not Disturb) */}
          <MobileSettingToggleCard
            icon={Moon}
            title="Quiet Hours (Do Not Disturb)"
            value={preferences.quiet_hours_enabled}
            onValueChange={(val) => handleUpdatePref({ quiet_hours_enabled: val })}
          />

          {/* Quiet Hours Schedule Picker */}
          {preferences.quiet_hours_enabled && (
            <div className="bg-white dark:bg-[#111827] rounded-[20px] p-4 mb-2.5 border border-[#F0F2F5] dark:border-white/10 shadow-xs">
              <span className="text-xs font-jakarta font-bold text-gray-700 dark:text-gray-300 block mb-2.5">
                Quiet Hours Schedule
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-[#F9F8F6] dark:bg-white/5 rounded-xl p-3 border border-[#EAE7E1] dark:border-white/10">
                  <label className="text-[11px] font-jakarta font-bold text-gray-400 block mb-1">
                    Starts at
                  </label>
                  <input
                    type="time"
                    value={preferences.quiet_hours_start}
                    onChange={(e) => handleUpdatePref({ quiet_hours_start: e.target.value })}
                    className="w-full bg-transparent font-jakarta font-bold text-sm text-[#1A6B3C] dark:text-emerald-400 outline-none cursor-pointer"
                  />
                </div>
                <div className="bg-[#F9F8F6] dark:bg-white/5 rounded-xl p-3 border border-[#EAE7E1] dark:border-white/10">
                  <label className="text-[11px] font-jakarta font-bold text-gray-400 block mb-1">
                    Ends at
                  </label>
                  <input
                    type="time"
                    value={preferences.quiet_hours_end}
                    onChange={(e) => handleUpdatePref({ quiet_hours_end: e.target.value })}
                    className="w-full bg-transparent font-jakarta font-bold text-sm text-[#1A6B3C] dark:text-emerald-400 outline-none cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── 4. SUPPORT ── */}
          <SectionTitle title="Support" />

          {/* Help & FAQ */}
          <MobileSettingCard
            icon={CircleHelp}
            title="Help & FAQ"
            onPress={() => setShowHelpModal(true)}
          />

          {/* Activity Log */}
          <MobileSettingCard
            icon={History}
            title="Activity Log"
            onPress={() => setShowActivityLogModal(true)}
          />

          {/* Check for Updates */}
          <MobileSettingCard
            icon={RotateCw}
            title={checkingUpdate ? 'Checking for updates…' : 'Check for Updates'}
            loading={checkingUpdate}
            onPress={() => {
              setCheckingUpdate(true);
              setTimeout(() => {
                setCheckingUpdate(false);
                notify.success('Up to Date', 'Ally-jis is running the latest version (v5).');
              }, 600);
            }}
          />

          {/* ── 5. ADMIN CONSOLE (If Admin) ── */}
          {adminRole && (
            <>
              <SectionTitle title="Administration" />
              <MobileSettingCard
                icon={Zap}
                title="Admin Management Console"
                badgeText={adminRole}
                badgeBgColor="bg-emerald-500/20"
                badgeColor="text-emerald-500 font-mono"
                onPress={() => navigate('/admin')}
              />
            </>
          )}

          {/* ── 6. DANGER ZONE ── */}
          <SectionTitle title="Danger Zone" />

          {/* Delete Account */}
          <MobileSettingCard
            icon={Trash2}
            title="Delete Account Permanently"
            destructive
            onPress={() => setIsDeletionModalOpen(true)}
          />

          {/* ── 7. SESSION / LOG OUT (Centered Red Text Only) ── */}
          <div className="mt-6 mb-2 flex items-center justify-center">
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              className="py-3 px-6 text-[16px] font-bold font-jakarta text-[#DC2626] dark:text-red-400 hover:text-red-700 transition-colors cursor-pointer"
            >
              Log Out
            </button>
          </div>

          {/* App Footer Info */}
          <div className="mt-4 mb-8 text-center text-xs font-jakarta text-gray-400 dark:text-gray-500 leading-relaxed">
            Ally-jis v5 • CHMSU Alijis Campus<br />
            © 2026 Ally-jis. All rights reserved.
          </div>
        </div>
      </div>

      {/* ── DESKTOP SETTINGS VIEW (Visible on md+ screens) ── */}
      <div className="hidden md:flex flex-1 min-h-0 h-full w-full overflow-hidden">
        {/* Left Sidebar Panel */}
        <div
          className="w-full md:w-[320px] lg:w-[360px] bg-white dark:bg-[#111827] flex flex-col overflow-hidden min-h-0 flex-shrink-0 border-r border-gray-200/80 dark:border-white/10"
        >
        {/* Sidebar Header */}
        <div className="p-4 flex items-center justify-between flex-shrink-0 border-b border-gray-100 dark:border-white/10 gap-2">
          <div>
            <h1 className="font-fraunces text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
            <p className="font-jakarta text-xs text-gray-400 dark:text-gray-500 mt-0.5">Control your preferences & account</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 py-3 flex-shrink-0 border-b border-gray-100 dark:border-white/10">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search settings..."
              className="w-full bg-gray-100 dark:bg-white/5 rounded-xl pl-9 pr-4 py-2 text-xs font-jakarta text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-[#1A6B3C]/20 dark:focus:ring-emerald-500/20 transition-all border border-transparent dark:border-white/5"
            />
          </div>
        </div>

        {/* Categories List */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50 dark:divide-white/5">
          {filteredCategories.length === 0 ? (
            <div className="p-6 text-center text-gray-400 dark:text-gray-500 text-xs font-jakarta">
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
                    'w-full text-left p-4 flex items-start gap-3.5 transition-colors relative cursor-pointer',
                    isActive
                      ? 'bg-[#1A6B3C]/8 dark:bg-emerald-950/40 border-l-4 border-[#1A6B3C] dark:border-emerald-500'
                      : 'hover:bg-gray-50/80 dark:hover:bg-white/5 border-l-4 border-transparent'
                  )}
                >
                  <div
                    className={cn(
                      'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 transition-all',
                      isActive
                        ? 'bg-[#1A6B3C] text-white shadow-xs dark:bg-emerald-600'
                        : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300'
                    )}
                  >
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={cn('font-jakarta text-sm font-bold truncate', isActive ? 'text-[#1A6B3C] dark:text-emerald-400' : 'text-gray-900 dark:text-white')}>
                        {cat.title}
                      </span>
                      <ChevronRight size={14} className={cn('flex-shrink-0', isActive ? 'text-[#1A6B3C] dark:text-emerald-400' : 'text-gray-300 dark:text-gray-600')} />
                    </div>
                    <p className="font-jakarta text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">{cat.subtitle}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Right Content View Pane (Full-width space expansion) ── */}
      <div
        className={cn(
          'flex-1 bg-[#FAF9F6] dark:bg-[#070A10] flex flex-col overflow-hidden min-h-0',
          !isMobileDetailOpen && 'hidden md:flex'
        )}
      >
        {/* Top Header Bar for Right Pane */}
        <div className="px-6 py-4 bg-white dark:bg-[#111827] border-b border-gray-200/80 dark:border-white/10 flex items-center justify-between flex-shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileDetailOpen(false)}
              className="md:hidden p-2 rounded-xl text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all cursor-pointer"
              aria-label="Back to settings list"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h2 className="font-fraunces text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                {activeCategoryInfo.title}
              </h2>
              <p className="font-jakarta text-xs text-gray-500 dark:text-gray-400">{activeCategoryInfo.subtitle}</p>
            </div>
          </div>
        </div>

        {/* Detail Content Body Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-5xl mx-auto space-y-6">

            {/* TAB 1: ACCOUNT & SECURITY */}
            {activeTab === 'account' && (
              <div className="space-y-6">
                {/* Account Credentials Summary Card */}
                <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-200/80 dark:border-white/10 p-6 sm:p-8 space-y-4 shadow-xs">
                  <div className="border-b border-gray-100 dark:border-white/10 pb-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-fraunces text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Lock size={20} className="text-[#1A6B3C] dark:text-emerald-400" /> Account Identity
                      </h3>
                      <p className="font-jakarta text-xs text-gray-500 dark:text-gray-400 mt-1">Verified email and student credentials.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200/80 dark:border-white/5">
                      <span className="text-xs font-jakarta font-medium text-gray-400 dark:text-gray-500 block mb-1">Email Address</span>
                      <span className="font-jakarta text-sm font-semibold text-gray-900 dark:text-white break-all">
                        {user?.email || 'Not logged in'}
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200/80 dark:border-white/5 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-jakarta font-medium text-gray-400 dark:text-gray-500 block mb-1">Student Status</span>
                        <span className="font-jakarta text-sm font-semibold text-[#1A6B3C] dark:text-emerald-400 flex items-center gap-1.5">
                          <ShieldCheck size={16} /> Campus Ally Verified
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Password Change Card */}
                <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-200/80 dark:border-white/10 p-6 sm:p-8 space-y-6 shadow-xs">
                  <div className="border-b border-gray-100 dark:border-white/10 pb-4">
                    <h3 className="font-fraunces text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <KeyRound size={20} className="text-[#1A6B3C] dark:text-emerald-400" /> Change Password
                    </h3>
                    <p className="font-jakarta text-xs text-gray-500 dark:text-gray-400 mt-1">Ensure your account is using a strong, unique password.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <PasswordField
                        label="Current Password"
                        value={currentPassword}
                        onChange={setCurrentPassword}
                        show={showPasswords}
                        onToggleShow={() => setShowPasswords((v) => !v)}
                      />
                      <div>
                        <PasswordField
                          label="New Password"
                          value={newPassword}
                          onChange={setNewPassword}
                          show={showPasswords}
                          onToggleShow={() => setShowPasswords((v) => !v)}
                          placeholder="Min. 8 characters"
                        />
                        {newPassword.length > 0 && (
                          <PasswordStrengthIndicator password={newPassword} />
                        )}
                      </div>
                    </div>

                    <PasswordField
                      label="Confirm New Password"
                      value={confirmPassword}
                      onChange={setConfirmPassword}
                      show={showPasswords}
                      onToggleShow={() => setShowPasswords((v) => !v)}
                    />

                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={handleChangePassword}
                        disabled={changingPassword || !currentPassword || !newPassword}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#1A6B3C] hover:bg-[#14542F] text-white font-jakarta text-xs font-bold active:scale-[0.97] transition-all disabled:opacity-50 shadow-xs cursor-pointer"
                      >
                        <KeyRound size={16} /> {changingPassword ? 'Updating...' : 'Update Password'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Session Sign Out Card */}
                <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-200/80 dark:border-white/10 p-6 sm:p-8 space-y-4 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="font-jakarta text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <LogOut size={16} className="text-gray-500" /> Current Session
                      </h4>
                      <p className="font-jakarta text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Log out of your active account session on this device.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowLogoutConfirm(true)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-white/10 font-jakarta text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/15 transition-all shadow-xs cursor-pointer shrink-0"
                    >
                      <LogOut size={14} /> Log out
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: PRIVACY & SAFETY */}
            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-200/80 dark:border-white/10 p-6 sm:p-8 space-y-6 shadow-xs">
                  <div className="border-b border-gray-100 dark:border-white/10 pb-4">
                    <h3 className="font-fraunces text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Shield size={20} className="text-[#1A6B3C] dark:text-emerald-400" /> Privacy & Safety Controls
                    </h3>
                    <p className="font-jakarta text-xs text-gray-500 dark:text-gray-400 mt-1">Manage presence visibility, read receipts, and safety blocks.</p>
                  </div>

                  {/* Blocked Users Link Card */}
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-between hover:border-[#1A6B3C]/30 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center font-bold">
                        <ShieldOff size={18} />
                      </div>
                      <div>
                        <h4 className="font-jakarta text-sm font-bold text-gray-900 dark:text-white">Blocked Users</h4>
                        <p className="font-jakarta text-xs text-gray-500 dark:text-gray-400">View and manage users you have blocked from messaging and interactions</p>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate('/blocked-users')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 font-jakarta text-xs font-bold text-gray-700 dark:text-gray-200 hover:border-[#1A6B3C] hover:text-[#1A6B3C] dark:hover:text-emerald-400 transition-all shadow-xs cursor-pointer"
                    >
                      <span>{blockedCount !== null ? `${blockedCount} blocked` : 'Manage'}</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>

                  {/* Restricted Users Link Card */}
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-between hover:border-[#1A6B3C]/30 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                        <ShieldAlert size={18} />
                      </div>
                      <div>
                        <h4 className="font-jakarta text-sm font-bold text-gray-900 dark:text-white">Restricted Users</h4>
                        <p className="font-jakarta text-xs text-gray-500 dark:text-gray-400">View and manage users whose online presence is mutually hidden</p>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate('/restricted-users')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 font-jakarta text-xs font-bold text-gray-700 dark:text-gray-200 hover:border-[#1A6B3C] hover:text-[#1A6B3C] dark:hover:text-emerald-400 transition-all shadow-xs cursor-pointer"
                    >
                      <span>{restrictedCount !== null ? `${restrictedCount} restricted` : 'Manage'}</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>

                  {/* Presence Toggles Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <ToggleItem
                      title="Private Account"
                      description="Only allies can see your posts. Your profile page stays reachable and anonymous to everyone else."
                      checked={preferences.account_privacy === 'private'}
                      onChange={(val) => handleUpdatePref({ account_privacy: val ? 'private' : 'public' })}
                      icon={Lock}
                    />
                    <ToggleItem
                      title="Online Status"
                      description="Display the green active indicator when you are using the app."
                      checked={preferences.show_online_status}
                      onChange={(val) => handleUpdatePref({ show_online_status: val })}
                      icon={Smartphone}
                    />
                    <ToggleItem
                      title="Last Active Timestamp"
                      description="Show when you were last seen across chat headers."
                      checked={preferences.show_last_active}
                      onChange={(val) => handleUpdatePref({ show_last_active: val })}
                      icon={Clock}
                    />
                    <ToggleItem
                      title="Read Receipts"
                      description="Allow chat partners to see when you've viewed their messages."
                      checked={preferences.read_receipts_enabled}
                      onChange={(val) => handleUpdatePref({ read_receipts_enabled: val })}
                      icon={UserCheck}
                    />
                  </div>

                  {/* Scope Selectors Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200/80 dark:border-white/5 space-y-2">
                      <label className="font-jakarta text-xs font-bold text-gray-900 dark:text-white block">
                        Profile Visibility Scope
                      </label>
                      <p className="font-jakarta text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
                        Who can view your full bio and profile details.
                      </p>
                      <select
                        value={preferences.profile_visibility}
                        onChange={(e) => handleUpdatePref({ profile_visibility: e.target.value as any })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111827] text-gray-900 dark:text-white font-jakarta text-xs outline-none focus:border-[#1A6B3C] dark:focus:border-emerald-500 cursor-pointer"
                      >
                        <option value="campus">Campus Allies (All verified students)</option>
                        <option value="matches_only">Connected Friends Only</option>
                        <option value="hidden">Hidden / Incognito</option>
                      </select>
                    </div>

                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200/80 dark:border-white/5 space-y-2">
                      <label className="font-jakarta text-xs font-bold text-gray-900 dark:text-white block">
                        Default Feed Post Audience
                      </label>
                      <p className="font-jakarta text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
                        Initial audience setting when drafting confessions and campus posts.
                      </p>
                      <select
                        value={preferences.feed_post_audience}
                        onChange={(e) => handleUpdatePref({ feed_post_audience: e.target.value as any })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111827] text-gray-900 dark:text-white font-jakarta text-xs outline-none focus:border-[#1A6B3C] dark:focus:border-emerald-500 cursor-pointer"
                      >
                        <option value="campus">Campus Public (All students)</option>
                        <option value="matches_only">Mutual Allies Only</option>
                        <option value="anonymous_only">Always Post Anonymously</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: NOTIFICATIONS & ALERTS */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-200/80 dark:border-white/10 p-6 sm:p-8 space-y-6 shadow-xs">
                  <div className="border-b border-gray-100 dark:border-white/10 pb-4">
                    <h3 className="font-fraunces text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Bell size={20} className="text-[#1A6B3C] dark:text-emerald-400" /> Notifications & Alerts
                    </h3>
                    <p className="font-jakarta text-xs text-gray-500 dark:text-gray-400 mt-1">Configure push alerts, streak warnings, and notification quiet hours.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ToggleItem
                      title="Streak Reminders (10:00 PM)"
                      description="Receive a notification reminder before midnight if your daily streak hasn't been activated."
                      checked={preferences.notify_streak_reminders}
                      onChange={(val) => handleUpdatePref({ notify_streak_reminders: val })}
                      icon={Flame}
                    />
                    <ToggleItem
                      title="Direct Chat Messages"
                      description="Receive instant alerts when someone sends you a message."
                      checked={preferences.notify_chat_messages}
                      onChange={(val) => handleUpdatePref({ notify_chat_messages: val })}
                      icon={MessageSquare}
                    />
                    <ToggleItem
                      title="Match & Ally Requests"
                      description="Be alerted when an Ally connection is requested."
                      checked={preferences.notify_match_requests}
                      onChange={(val) => handleUpdatePref({ notify_match_requests: val })}
                      icon={Bell}
                    />
                    <ToggleItem
                      title="Feed & Confession Alerts"
                      description="Notifications for likes, replies, and campus confessions."
                      checked={preferences.notify_confessions}
                      onChange={(val) => handleUpdatePref({ notify_confessions: val })}
                      icon={Bell}
                    />
                    <ToggleItem
                      title="In-App Sound Effects"
                      description="Play audio chimes for incoming messages and match achievements."
                      checked={preferences.notify_sound_enabled}
                      onChange={(val) => handleUpdatePref({ notify_sound_enabled: val })}
                      icon={Volume2}
                    />
                  </div>

                  {/* Quiet Hours Section */}
                  <div className="p-5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200/80 dark:border-white/5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                          <Clock size={18} />
                        </div>
                        <div>
                          <h4 className="font-jakarta text-sm font-bold text-gray-900 dark:text-white">Quiet Hours (Do Not Disturb)</h4>
                          <p className="font-jakarta text-xs text-gray-500 dark:text-gray-400">Mute all notification push alerts during selected hours</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleUpdatePref({ quiet_hours_enabled: !preferences.quiet_hours_enabled })}
                        className={`w-12 h-6 rounded-full transition-colors p-0.5 relative flex-shrink-0 cursor-pointer ${
                          preferences.quiet_hours_enabled ? 'bg-[#1A6B3C] dark:bg-emerald-600' : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                          preferences.quiet_hours_enabled ? 'translate-x-6' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>

                    {preferences.quiet_hours_enabled && (
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div>
                          <label className="font-jakarta text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1.5">
                            Starts at
                          </label>
                          <input
                            type="time"
                            value={preferences.quiet_hours_start}
                            onChange={(e) => handleUpdatePref({ quiet_hours_start: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111827] text-gray-900 dark:text-white font-mono text-xs outline-none focus:border-[#1A6B3C] cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="font-jakarta text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1.5">
                            Ends at
                          </label>
                          <input
                            type="time"
                            value={preferences.quiet_hours_end}
                            onChange={(e) => handleUpdatePref({ quiet_hours_end: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111827] text-gray-900 dark:text-white font-mono text-xs outline-none focus:border-[#1A6B3C] cursor-pointer"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: ACTIVITY LOG */}
            {activeTab === 'activity' && (
              <ActivityLogSection />
            )}

            {/* TAB 5: APPEARANCE & DANGER ZONE */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                {/* Admin Management Card (For authorized admins) */}
                {adminRole && (
                  <div className="bg-[#111827] rounded-2xl border border-emerald-500/30 p-6 text-white space-y-4 shadow-md bg-gradient-to-r from-[#111827] to-[#16221B]">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold border border-emerald-500/30 shrink-0">
                          <Zap size={22} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-fraunces text-base font-bold">Administrative Console Active</h4>
                            <span className="bg-emerald-500/30 text-emerald-300 text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full">
                              {adminRole}
                            </span>
                          </div>
                          <p className="font-jakarta text-xs text-gray-300 mt-0.5">
                            Manage student verifications, user roles, system logs & email studio.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate('/admin')}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1A6B3C] hover:bg-[#14542F] text-white font-jakarta text-xs font-bold transition-all active:scale-[0.97] cursor-pointer shadow-xs shrink-0"
                      >
                        <ShieldCheck size={16} /> Open Admin Console &rarr;
                      </button>
                    </div>
                  </div>
                )}

                {/* Appearance Card */}
                <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-200/80 dark:border-white/10 p-6 sm:p-8 space-y-6 shadow-xs">
                  <div className="border-b border-gray-100 dark:border-white/10 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="font-fraunces text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Palette size={20} className="text-[#1A6B3C] dark:text-emerald-400" /> Interface Appearance
                      </h3>
                      <p className="font-jakarta text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Choose daylight or nocturnal palette, or follow your operating system.
                      </p>
                    </div>
                    <span className="self-start sm:self-auto px-3 py-1 rounded-full text-xs font-jakarta font-bold bg-[#1A6B3C]/10 dark:bg-emerald-500/15 text-[#1A6B3C] dark:text-emerald-400 capitalize">
                      Active: {theme === 'system' ? `System (${resolvedTheme})` : theme}
                    </span>
                  </div>

                  {/* 3 Interactive Theme Selector Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    {[
                      {
                        id: 'light' as const,
                        label: 'Light Mode',
                        desc: 'Daylight ivory background with forest emerald accents.',
                        icon: Sun,
                        previewBg: 'bg-[#F7F4EF] border-gray-300 text-gray-900',
                        accent: 'bg-[#1A6B3C]',
                      },
                      {
                        id: 'dark' as const,
                        label: 'Dark Mode',
                        desc: 'Nocturnal slate canvas with jade emerald accents.',
                        icon: Moon,
                        previewBg: 'bg-[#121212] border-white/20 text-gray-200',
                        accent: 'bg-[#38C185]',
                      },
                      {
                        id: 'system' as const,
                        label: 'System Sync',
                        desc: 'Matches your device operating system theme automatically.',
                        icon: Monitor,
                        previewBg: 'bg-gradient-to-br from-[#F7F4EF] to-[#121212] border-gray-400 text-gray-800',
                        accent: 'bg-amber-500',
                      },
                    ].map((opt) => {
                      const isSelected = theme === opt.id;
                      const Icon = opt.icon;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setTheme(opt.id)}
                          className={cn(
                            'p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer group',
                            isSelected
                              ? 'border-[#1A6B3C] dark:border-emerald-500 ring-2 ring-[#1A6B3C]/20 dark:ring-emerald-500/20 bg-[#1A6B3C]/5 dark:bg-emerald-950/20 shadow-xs'
                              : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 bg-gray-50/50 dark:bg-white/5'
                          )}
                        >
                          <div>
                            <div className={cn(
                              'w-full h-16 rounded-xl border mb-3 p-2 flex flex-col justify-between overflow-hidden shadow-xs',
                              opt.previewBg
                            )}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-2 h-2 rounded-full bg-red-400" />
                                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                                  <div className="w-2 h-2 rounded-full bg-green-400" />
                                </div>
                                <div className={cn('w-2 h-2 rounded-full', opt.accent)} />
                              </div>
                              <div className="space-y-1">
                                <div className="w-1/2 h-2 rounded-full bg-current opacity-40" />
                                <div className="w-3/4 h-1.5 rounded-full bg-current opacity-20" />
                              </div>
                            </div>

                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <Icon size={16} className={cn(isSelected ? 'text-[#1A6B3C] dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400')} />
                                <span className={cn('font-jakarta text-sm font-bold', isSelected ? 'text-[#1A6B3C] dark:text-emerald-400' : 'text-gray-900 dark:text-white')}>
                                  {opt.label}
                                </span>
                              </div>
                              {isSelected && (
                                <div className="w-2 h-2 rounded-full bg-[#1A6B3C] dark:bg-emerald-400 animate-pulse" />
                              )}
                            </div>
                            <p className="font-jakarta text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                              {opt.desc}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Account Actions & Danger Zone */}
                <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-200/80 dark:border-white/10 p-6 sm:p-8 space-y-6 shadow-xs">
                  <div className="border-b border-gray-100 dark:border-white/10 pb-4">
                    <h3 className="font-fraunces text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Sliders size={20} className="text-[#1A6B3C] dark:text-emerald-400" /> Danger Zone
                    </h3>
                    <p className="font-jakarta text-xs text-gray-500 dark:text-gray-400 mt-1">Permanent and irreversible data erasure actions.</p>
                  </div>

                  <div className="p-5 rounded-xl bg-red-50/70 dark:bg-red-950/30 border border-red-200/80 dark:border-red-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-jakarta font-bold text-sm">
                        <Trash2 size={16} /> Delete Account Permanently
                      </div>
                      <p className="font-jakarta text-xs text-red-600/90 dark:text-red-300/80 mt-1 leading-relaxed">
                        Permanently purge your profile, posts, connections, and message history. This cannot be undone.
                      </p>
                    </div>

                    <button
                      onClick={() => setIsDeletionModalOpen(true)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-jakarta text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-[0.97] shrink-0"
                    >
                      <Trash2 size={14} /> Delete Account
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
      </div>

      {/* ── Mobile Change Password Modal ── */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#111827] rounded-3xl border border-gray-200 dark:border-white/10 p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#1A6B3C]/10 dark:bg-emerald-500/15 text-[#1A6B3C] dark:text-emerald-400 flex items-center justify-center">
                  <KeyRound size={18} />
                </div>
                <div>
                  <h3 className="font-fraunces text-lg font-bold text-gray-900 dark:text-white">Change Password</h3>
                  <p className="font-jakarta text-xs text-gray-500 dark:text-gray-400">Update your account login credentials</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <PasswordField
                label="Current Password"
                value={currentPassword}
                onChange={setCurrentPassword}
                show={showPasswords}
                onToggleShow={() => setShowPasswords(!showPasswords)}
              />
              <div>
                <PasswordField
                  label="New Password"
                  value={newPassword}
                  onChange={setNewPassword}
                  show={showPasswords}
                  onToggleShow={() => setShowPasswords(!showPasswords)}
                  placeholder="Min. 8 characters"
                />
                {newPassword.length > 0 && <PasswordStrengthIndicator password={newPassword} />}
              </div>
              <PasswordField
                label="Confirm New Password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                show={showPasswords}
                onToggleShow={() => setShowPasswords(!showPasswords)}
              />

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 font-jakarta text-xs font-semibold hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await handleChangePassword();
                    setShowPasswordModal(false);
                  }}
                  disabled={changingPassword || !currentPassword || !newPassword}
                  className="px-5 py-2.5 rounded-xl bg-[#1A6B3C] hover:bg-[#14542F] text-white font-jakarta text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {changingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile Privacy Controls Modal ── */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full sm:max-w-md bg-white dark:bg-[#111827] rounded-t-3xl sm:rounded-3xl border border-gray-200 dark:border-white/10 p-6 space-y-5 shadow-2xl animate-in slide-in-from-bottom-6 sm:zoom-in-95">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-fraunces text-lg font-bold text-gray-900 dark:text-white">Privacy Controls</h3>
                <p className="font-jakarta text-xs text-gray-500 dark:text-gray-400">Control who can view your profile and posts</p>
              </div>
              <button
                type="button"
                onClick={() => setShowPrivacyModal(false)}
                className="text-xs font-bold font-jakarta text-[#1A6B3C] dark:text-emerald-400 hover:underline p-1 cursor-pointer"
              >
                Done
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#F9F8F6] dark:bg-white/5 border border-[#EAE7E1] dark:border-white/10 space-y-2">
                <label className="text-xs font-bold font-jakarta text-gray-900 dark:text-white block">
                  Profile Visibility
                </label>
                <p className="text-[11.5px] font-jakarta text-gray-500 dark:text-gray-400 leading-relaxed mb-2">
                  Control who can view your full bio and profile details.
                </p>
                <select
                  value={preferences.profile_visibility}
                  onChange={(e) => handleUpdatePref({ profile_visibility: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111827] text-gray-900 dark:text-white font-jakarta text-xs outline-none focus:border-[#1A6B3C] cursor-pointer"
                >
                  <option value="campus">Campus Allies (All verified students)</option>
                  <option value="matches_only">Connected Friends Only</option>
                  <option value="hidden">Hidden / Incognito</option>
                </select>
              </div>

              <div className="p-4 rounded-2xl bg-[#F9F8F6] dark:bg-white/5 border border-[#EAE7E1] dark:border-white/10 space-y-2">
                <label className="text-xs font-bold font-jakarta text-gray-900 dark:text-white block">
                  Default Feed Audience
                </label>
                <p className="text-[11.5px] font-jakarta text-gray-500 dark:text-gray-400 leading-relaxed mb-2">
                  Initial audience when drafting confessions and campus posts.
                </p>
                <select
                  value={preferences.feed_post_audience}
                  onChange={(e) => handleUpdatePref({ feed_post_audience: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111827] text-gray-900 dark:text-white font-jakarta text-xs outline-none focus:border-[#1A6B3C] cursor-pointer"
                >
                  <option value="campus">Campus Public (All students)</option>
                  <option value="matches_only">Mutual Allies Only</option>
                  <option value="anonymous_only">Always Post Anonymously</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile Help & FAQ Modal ── */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-[#111827] rounded-3xl border border-gray-200 dark:border-white/10 p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-white/10 flex-shrink-0">
              <div className="flex items-center gap-2">
                <CircleHelp size={20} className="text-[#1A6B3C] dark:text-emerald-400" />
                <h3 className="font-fraunces text-lg font-bold text-gray-900 dark:text-white">Help & FAQ</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2 overflow-y-auto pr-1">
              <HelpItem
                question="How does student matching work?"
                answer="Ally-jis matches students using campus interests and study preferences. Chats begin anonymously and reveal progressively as you converse."
              />
              <HelpItem
                question="How do streaks work?"
                answer="Chat with your allies daily before midnight to maintain your streak flame! If inactive, your streak resets."
              />
              <HelpItem
                question="Is my identity protected?"
                answer="Yes! All confessions and initial chats keep your avatar and real name hidden until you choose to reveal yourself."
              />
              <HelpItem
                question="How do I report inappropriate behavior?"
                answer="Tap the three dots on any confession or chat header to block or report users immediately to campus moderation."
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile Activity Log Modal ── */}
      {showActivityLogModal && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#FAF9F6] dark:bg-[#070A10]">
          <div className="px-5 py-4 bg-white dark:bg-[#111827] border-b border-gray-200 dark:border-white/10 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowActivityLogModal(false)}
                className="p-2 rounded-xl text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all cursor-pointer"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <h3 className="font-fraunces text-lg font-bold text-gray-900 dark:text-white">Activity Log</h3>
                <p className="font-jakarta text-xs text-gray-500 dark:text-gray-400">History of your posts, logins, and interactions</p>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <ActivityLogSection />
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      <LogoutConfirmModal
        open={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleSignOut}
      />

    </div>
  );
}
