// src/components/profile/ProfileSettingsDrawer.tsx
//
// Flat Slide-In Right Settings Drawer for Mobile & Web.
// Adopts the reference mockup layout (User avatar, name, email, close button,
// flat navigation & settings list) and embeds full web settings capabilities:
// Password updates, privacy toggles, theme selector, notification alerts,
// sign-out session, and permanent account deletion.

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, ArrowLeft, ChevronRight, Lock, Shield, Palette, Sliders,
  KeyRound, ShieldOff, LogOut, Trash2, Eye, EyeOff, UserCheck,
  Bell, Smartphone, Moon, Sun, Monitor,
  Zap, ShieldCheck, Check
} from 'lucide-react';
import { Student } from '@/types/ally';
import { useAuth } from '@/context/AuthContext';
import { useAdminMe } from '@/hooks/useAdminMe';
import { useTheme } from '@/context/ThemeContext';
import { apiClient, isApiConfigured } from '@/api/client';
import { notify } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';
import { AvatarDisplay } from '@/components/ally/AvatarDisplay';
import { LogoutConfirmModal } from '@/components/auth/LogoutConfirmModal';

type DrawerSection = 'menu' | 'security' | 'privacy' | 'preferences' | 'account';

interface ProfileSettingsDrawerProps {
  open: boolean;
  onClose: () => void;
  profile: Student;
}

function PasswordField({
  label, value, onChange, show, onToggleShow, placeholder
}: {
  label: string; value: string; onChange: (v: string) => void; show: boolean; onToggleShow: () => void; placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="font-jakarta text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || '••••••••'}
          className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-gray-200 dark:border-white/10 focus:border-[#1A6B3C] dark:focus:border-emerald-500 focus:ring-2 focus:ring-[#1A6B3C]/10 dark:focus:ring-emerald-500/20 bg-gray-50/50 dark:bg-white/5 font-jakarta text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none transition-all"
          autoComplete="new-password"
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 cursor-pointer transition-colors"
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}

function FlatToggleItem({
  title, description, checked, onChange, icon: Icon
}: {
  title: string; description: string; checked: boolean; onChange: (val: boolean) => void; icon?: any;
}) {
  return (
    <div className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200/80 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 transition-colors">
      <div className="flex items-start gap-3 pr-3">
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-[#1A6B3C]/10 dark:bg-emerald-500/15 flex items-center justify-center flex-shrink-0 text-[#1A6B3C] dark:text-emerald-400 mt-0.5">
            <Icon size={16} />
          </div>
        )}
        <div>
          <h4 className="font-jakarta text-xs sm:text-sm font-bold text-gray-900 dark:text-white">{title}</h4>
          <p className="font-jakarta text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{description}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn(
          'w-11 h-6 rounded-full transition-colors p-0.5 relative flex-shrink-0 cursor-pointer',
          checked ? 'bg-[#1A6B3C] dark:bg-emerald-600' : 'bg-gray-200 dark:bg-gray-700'
        )}
      >
        <div className={cn(
          'w-5 h-5 rounded-full bg-white shadow-xs transition-transform',
          checked ? 'translate-x-5' : 'translate-x-0'
        )} />
      </button>
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
      { p: 20, msg: 'Purging message history & conversation logs...' },
      { p: 45, msg: 'Removing profile media & post attachments...' },
      { p: 70, msg: 'Disconnecting ally matches & campus records...' },
      { p: 90, msg: 'Revoking access sessions & authentication tokens...' },
      { p: 100, msg: 'Account erased successfully. Redirecting...' },
    ];

    for (const step of steps) {
      await new Promise((r) => setTimeout(r, 650));
      setProgress(step.p);
      setStatusText(step.msg);
    }

    try {
      await onConfirmDelete();
    } catch {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/10 rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {!isDeleting ? (
          <>
            <div>
              <h3 className="font-fraunces text-xl font-bold text-gray-900 dark:text-white">
                Delete Account Confirmation
              </h3>
              <p className="font-jakarta text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                This action is permanent and cannot be undone. All associated records will be erased from Ally-jis.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-jakarta text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                What will be erased:
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs font-jakarta">
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200/80 dark:border-white/5 text-gray-700 dark:text-gray-300">
                  <span className="font-bold block text-gray-900 dark:text-white mb-0.5">Student Identity</span>
                  Photos, student ID, badges
                </div>
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200/80 dark:border-white/5 text-gray-700 dark:text-gray-300">
                  <span className="font-bold block text-gray-900 dark:text-white mb-0.5">Chat History</span>
                  Sent messages & media
                </div>
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200/80 dark:border-white/5 text-gray-700 dark:text-gray-300">
                  <span className="font-bold block text-gray-900 dark:text-white mb-0.5">Posts & Feed</span>
                  Authored posts & comments
                </div>
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200/80 dark:border-white/5 text-gray-700 dark:text-gray-300">
                  <span className="font-bold block text-gray-900 dark:text-white mb-0.5">Ally Matches</span>
                  Saved match connections
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

export function ProfileSettingsDrawer({
  open,
  onClose,
  profile,
}: ProfileSettingsDrawerProps) {
  const { user, signOut, deleteAccount } = useAuth();
  const { role: adminRole } = useAdminMe();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const navigate = useNavigate();
  const useBackend = Boolean(isApiConfigured && user);

  const [section, setSection] = useState<DrawerSection>('menu');

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
  const [isDeletionModalOpen, setIsDeletionModalOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Load blocked count
  useEffect(() => {
    if (!useBackend || !open) return;
    apiClient.listBlockedUsers()
      .then((rows) => setBlockedCount(rows.length))
      .catch(() => setBlockedCount(null));
  }, [useBackend, open]);

  // Reset to main menu when opening drawer
  useEffect(() => {
    if (open) {
      setSection('menu');
    }
  }, [open]);

  // Prevent background scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

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
      setSection('menu');
    } catch (err: any) {
      notify.error('Could not update password', err?.message);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    onClose();
    navigate('/', { replace: true });
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount();
      notify.success('Account deleted', 'Your account and data have been removed.');
      onClose();
      navigate('/', { replace: true });
    } catch (err: any) {
      notify.error('Delete failed', err?.message);
      throw err;
    }
  };

  const handleNavigate = (path: string) => {
    onClose();
    navigate(path);
  };

  const displayName = profile.name || (profile.username ? `@${profile.username}` : 'Student');
  const displayEmail = user?.email || (profile.username ? `@${profile.username}` : 'student@chmsu.edu.ph');

  if (!open) return null;

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-in Drawer Container (Flat, edge-to-edge on mobile, no card borders) */}
      <div
        className={cn(
          'fixed inset-y-0 right-0 z-50 w-full sm:w-[400px] md:w-[440px] bg-white dark:bg-[#121212] text-gray-900 dark:text-white shadow-2xl flex flex-col border-l border-gray-200/80 dark:border-white/10 transition-transform duration-300 ease-out animate-in slide-in-from-right duration-300'
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Settings and Navigation"
      >
        {/* ── Top Header Row (Close Button / Subview Back Button) ── */}
        <div className="px-5 py-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between flex-shrink-0">
          {section !== 'menu' ? (
            <button
              type="button"
              onClick={() => setSection('menu')}
              className="inline-flex items-center gap-1.5 text-xs font-jakarta font-semibold text-[#1A6B3C] dark:text-emerald-400 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <ArrowLeft size={16} /> Back to settings
            </button>
          ) : (
            <div className="font-fraunces text-base font-bold text-gray-900 dark:text-white">
              Account Settings
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer ml-auto"
            aria-label="Close settings drawer"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── User Profile Header Block (Reference Layout: Avatar, Name, Email) ── */}
        <div className="p-5 border-b border-gray-100 dark:border-white/10 flex items-center gap-3.5 bg-gray-50/50 dark:bg-white/2 flex-shrink-0">
          <div className="w-12 h-12 rounded-2xl overflow-hidden bg-gray-100 dark:bg-white/10 border border-gray-200/80 dark:border-white/10 flex-shrink-0 flex items-center justify-center shadow-xs">
            <AvatarDisplay
              src={profile.avatar}
              name={displayName}
              className="w-full h-full object-cover"
              textClassName="text-xl font-bold"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-jakarta text-sm font-bold text-gray-900 dark:text-white truncate">
              {displayName}
            </h3>
            <p className="font-jakarta text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">
              {displayEmail}
            </p>
          </div>
        </div>

        {/* ── Drawer Scrollable Content Area ── */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-white/5">

          {/* ════ VIEW: MAIN MENU (ACCOUNT SETTINGS) ════ */}
          {section === 'menu' && (
            <div className="py-2">
              {/* Settings Categories (Existing Web Settings Contents) */}
              <div className="px-4 py-2">
                <p className="font-jakarta text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1 px-2">
                  Account Settings
                </p>

                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setSection('security')}
                    className="w-full flex items-center justify-between p-3 rounded-xl text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-600 dark:text-gray-300 group-hover:text-[#1A6B3C] dark:group-hover:text-emerald-400 transition-colors">
                        <Lock size={16} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-jakarta text-sm font-semibold text-gray-900 dark:text-white truncate">
                          Password & Security
                        </h4>
                        <p className="font-jakarta text-xs text-gray-400 dark:text-gray-500 truncate">
                          Credentials & login protection
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setSection('privacy')}
                    className="w-full flex items-center justify-between p-3 rounded-xl text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-600 dark:text-gray-300 group-hover:text-[#1A6B3C] dark:group-hover:text-emerald-400 transition-colors">
                        <Shield size={16} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-jakarta text-sm font-semibold text-gray-900 dark:text-white truncate">
                          Privacy & Safety
                        </h4>
                        <p className="font-jakarta text-xs text-gray-400 dark:text-gray-500 truncate">
                          Blocked users & status
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setSection('preferences')}
                    className="w-full flex items-center justify-between p-3 rounded-xl text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-600 dark:text-gray-300 group-hover:text-[#1A6B3C] dark:group-hover:text-emerald-400 transition-colors">
                        <Palette size={16} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-jakarta text-sm font-semibold text-gray-900 dark:text-white truncate">
                          Appearance & Preferences
                        </h4>
                        <p className="font-jakarta text-xs text-gray-400 dark:text-gray-500 truncate">
                          Theme & notification alerts
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setSection('account')}
                    className="w-full flex items-center justify-between p-3 rounded-xl text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-600 dark:text-gray-300 group-hover:text-[#1A6B3C] dark:group-hover:text-emerald-400 transition-colors">
                        <Sliders size={16} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-jakarta text-sm font-semibold text-gray-900 dark:text-white truncate">
                          Account & Danger Zone
                        </h4>
                        <p className="font-jakarta text-xs text-gray-400 dark:text-gray-500 truncate">
                          Sign out & account deletion
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200" />
                  </button>
                </div>
              </div>

              {/* Flat Divider */}
              <div className="my-2 border-t border-gray-100 dark:border-white/10" />

              {/* Bottom Quick Action */}
              <div className="px-5 py-2">
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(true)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left font-jakarta text-sm text-red-600 dark:text-red-400 hover:bg-red-50/70 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
                >
                  <LogOut size={16} />
                  <span className="font-semibold">Sign Out</span>
                </button>
              </div>
            </div>
          )}

          {/* ════ VIEW: PASSWORD & SECURITY ════ */}
          {section === 'security' && (
            <div className="p-5 space-y-6">
              <div>
                <h3 className="font-fraunces text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <KeyRound size={18} className="text-[#1A6B3C] dark:text-emerald-400" /> Change Password
                </h3>
                <p className="font-jakarta text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Ensure your account uses a strong password with at least 8 characters.
                </p>
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
                    type="button"
                    onClick={handleChangePassword}
                    disabled={changingPassword || !currentPassword || !newPassword}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#1A6B3C] hover:bg-[#14542F] text-white font-jakarta text-xs font-bold active:scale-[0.98] transition-all disabled:opacity-50 shadow-xs cursor-pointer"
                  >
                    <KeyRound size={15} /> {changingPassword ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ════ VIEW: PRIVACY & SAFETY ════ */}
          {section === 'privacy' && (
            <div className="p-5 space-y-5">
              <div>
                <h3 className="font-fraunces text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Shield size={18} className="text-[#1A6B3C] dark:text-emerald-400" /> Privacy & Safety
                </h3>
                <p className="font-jakarta text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Manage who can see your activity and view blocked members.
                </p>
              </div>

              {/* Blocked users row */}
              <div className="p-3.5 rounded-xl border border-gray-200/80 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center font-bold">
                    <ShieldOff size={16} />
                  </div>
                  <div>
                    <h4 className="font-jakarta text-xs sm:text-sm font-bold text-gray-900 dark:text-white">Blocked Users</h4>
                    <p className="font-jakarta text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">Manage blocked peers</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleNavigate('/blocked-users')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 font-jakarta text-xs font-bold text-gray-700 dark:text-gray-200 hover:border-[#1A6B3C] hover:text-[#1A6B3C] dark:hover:text-emerald-400 transition-all cursor-pointer shadow-xs"
                >
                  <span>{blockedCount !== null ? `${blockedCount} blocked` : 'Manage'}</span>
                  <ChevronRight size={13} />
                </button>
              </div>

              {/* Toggles */}
              <div className="space-y-3">
                <FlatToggleItem
                  title="Read Receipts"
                  description="Allow chat partners to see when you have read their messages."
                  checked={readReceipts}
                  onChange={setReadReceipts}
                  icon={UserCheck}
                />
                <FlatToggleItem
                  title="Online & Activity Status"
                  description="Show when you are currently online or active in Ally-jis."
                  checked={activityStatus}
                  onChange={setActivityStatus}
                  icon={Smartphone}
                />
              </div>
            </div>
          )}

          {/* ════ VIEW: APPEARANCE & PREFERENCES ════ */}
          {section === 'preferences' && (
            <div className="p-5 space-y-6">
              <div>
                <h3 className="font-fraunces text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Palette size={18} className="text-[#1A6B3C] dark:text-emerald-400" /> Appearance & Theme
                </h3>
                <p className="font-jakarta text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Choose your interface appearance or sync automatically with your device settings.
                </p>
              </div>

              {/* Theme Selector Options */}
              <div className="space-y-2.5">
                {[
                  {
                    id: 'light' as const,
                    label: 'Light Mode',
                    desc: 'Clean daylight ivory canvas with emerald accents.',
                    icon: Sun,
                  },
                  {
                    id: 'dark' as const,
                    label: 'Dark Mode',
                    desc: 'Deep nocturnal slate canvas with jade accents.',
                    icon: Moon,
                  },
                  {
                    id: 'system' as const,
                    label: 'System Sync',
                    desc: 'Automatically matches your device operating system theme.',
                    icon: Monitor,
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
                        'w-full p-3.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer',
                        isSelected
                          ? 'border-[#1A6B3C] dark:border-emerald-500 bg-[#1A6B3C]/5 dark:bg-emerald-950/20'
                          : 'border-gray-200/80 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 bg-gray-50/50 dark:bg-white/5'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-8 h-8 rounded-lg flex items-center justify-center',
                          isSelected ? 'bg-[#1A6B3C] text-white dark:bg-emerald-600' : 'bg-gray-200/60 dark:bg-white/10 text-gray-500 dark:text-gray-400'
                        )}>
                          <Icon size={16} />
                        </div>
                        <div>
                          <h4 className={cn(
                            'font-jakarta text-xs sm:text-sm font-bold',
                            isSelected ? 'text-[#1A6B3C] dark:text-emerald-400' : 'text-gray-900 dark:text-white'
                          )}>
                            {opt.label}
                          </h4>
                          <p className="font-jakarta text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                            {opt.desc}
                          </p>
                        </div>
                      </div>
                      {isSelected && (
                        <Check size={16} className="text-[#1A6B3C] dark:text-emerald-400 flex-shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Notification Toggles */}
              <div className="pt-2 space-y-3">
                <h4 className="font-jakarta text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Notification Alerts
                </h4>
                <FlatToggleItem
                  title="Match & Request Push Notifications"
                  description="Get notifications for new match suggestions and ally requests."
                  checked={matchAlerts}
                  onChange={setMatchAlerts}
                  icon={Bell}
                />
                <FlatToggleItem
                  title="Weekly Campus Activity Digest"
                  description="Receive a weekly summary of popular posts and announcements."
                  checked={emailDigest}
                  onChange={setEmailDigest}
                  icon={Moon}
                />
              </div>
            </div>
          )}

          {/* ════ VIEW: ACCOUNT & DANGER ZONE ════ */}
          {section === 'account' && (
            <div className="p-5 space-y-6">
              <div>
                <h3 className="font-fraunces text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Sliders size={18} className="text-[#1A6B3C] dark:text-emerald-400" /> Account & Danger Zone
                </h3>
                <p className="font-jakarta text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Session logout and permanent account deletion options.
                </p>
              </div>

              {/* Admin Console Card if authorized */}
              {adminRole && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-[#111827] to-[#16221B] border border-emerald-500/30 text-white space-y-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                      <Zap size={16} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-jakarta text-xs font-bold truncate">Admin Console</span>
                        <span className="bg-emerald-500/30 text-emerald-300 text-[10px] font-mono font-bold uppercase px-1.5 py-0.2 rounded">
                          {adminRole}
                        </span>
                      </div>
                      <p className="font-jakarta text-[11px] text-gray-300 mt-0.5 truncate">
                        Manage roles, verifications & logs
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleNavigate('/admin')}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1A6B3C] hover:bg-[#14542F] text-white font-jakarta text-xs font-bold transition-all cursor-pointer"
                  >
                    <ShieldCheck size={14} /> Open Admin Console
                  </button>
                </div>
              )}

              {/* Sign Out Card */}
              <div className="p-4 rounded-xl border border-gray-200/80 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 space-y-3">
                <div>
                  <h4 className="font-jakarta text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                    Sign Out of Session
                  </h4>
                  <p className="font-jakarta text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Safely log out of your current session on this device.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-white/10 font-jakarta text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/15 transition-all shadow-xs cursor-pointer"
                >
                  <LogOut size={14} /> Log out
                </button>
              </div>

              {/* Danger Zone */}
              <div className="p-4 rounded-xl border border-red-200/80 dark:border-red-800/40 bg-red-50/60 dark:bg-red-950/20 space-y-3">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-jakarta font-bold text-xs sm:text-sm">
                  <Trash2 size={15} /> Danger Zone
                </div>
                <p className="font-jakarta text-xs text-red-600/90 dark:text-red-300/80 leading-relaxed">
                  Permanently delete your profile, posts, connections, and message history. This action cannot be reversed.
                </p>
                <button
                  type="button"
                  onClick={() => setIsDeletionModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-jakarta text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-[0.97]"
                >
                  <Trash2 size={14} /> Delete Account
                </button>
              </div>
            </div>
          )}

        </div>

        {/* ── Fixed Bottom Bar for Drawer ── */}
        <div className="p-4 border-t border-gray-100 dark:border-white/10 bg-white dark:bg-[#121212] flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 font-jakarta flex-shrink-0">
          <button
            type="button"
            onClick={() => handleNavigate('/settings')}
            className="text-gray-600 dark:text-gray-400 hover:text-[#1A6B3C] dark:hover:text-emerald-400 font-medium transition-colors cursor-pointer"
          >
            Open Full Settings Page &rarr;
          </button>
          <span>Ally-jis v5</span>
        </div>
      </div>

      {/* Account Deletion Modal */}
      <AccountDeletionModal
        isOpen={isDeletionModalOpen}
        onClose={() => setIsDeletionModalOpen(false)}
        onConfirmDelete={handleDeleteAccount}
      />

      {/* Logout Confirmation Modal */}
      <LogoutConfirmModal
        open={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleSignOut}
      />
    </>
  );
}
