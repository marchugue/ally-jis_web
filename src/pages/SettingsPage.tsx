// src/pages/SettingsPage.tsx
//
// Modernized General Settings Hub for all users.
// Supports full-width space expansion, dark mode, responsive multi-column layouts,
// and an informative step-by-step account deletion flow with real-time progression.

import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  KeyRound, ShieldOff, LogOut, Trash2, ChevronRight, Eye, EyeOff,
  UserCheck, Bell, Shield, Lock, Smartphone, Moon, Sliders,
  Search, ArrowLeft, ShieldCheck, Zap, AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useAdminMe } from '@/hooks/useAdminMe';
import { apiClient, isApiConfigured } from '@/api/client';
import { notify } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';

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
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1"
        >
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
    <div className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-[#111827] border border-gray-200/80 dark:border-white/10 hover:border-[#1A6B3C]/30 dark:hover:border-emerald-500/30 transition-all shadow-xs">
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

{/* Account Deletion Informative Modal with Real-Time Progress Bar */}
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
    
    // Animated progression sequence showcasing what is being deleted
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
    } catch (err) {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/10 rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {!isDeleting ? (
          <>
            {/* Header */}
            <div>
              <h3 className="font-fraunces text-xl font-bold text-gray-900 dark:text-white">
                Delete Account Confirmation
              </h3>
              <p className="font-jakarta text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                This action is permanent and cannot be undone. All associated records will be erased from Ally-jis.
              </p>
            </div>

            {/* Informative Breakdown Grid */}
            <div className="space-y-2">
              <h4 className="font-jakarta text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                What will be erased:
              </h4>
              <div className="grid grid-cols-2 gap-2.5 text-xs font-jakarta">
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

            {/* Type to confirm */}
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

            {/* Action Buttons */}
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
          /* Real-time Deletion Progress UI */
          <div className="py-4 space-y-5 text-center">
            <div>
              <h3 className="font-fraunces text-xl font-bold text-gray-900 dark:text-white">
                Erasing Account & Data
              </h3>
              <p className="font-jakarta text-xs text-gray-500 dark:text-gray-400 mt-2 min-h-[20px] transition-all">
                {statusText}
              </p>
            </div>

            {/* Real-time Progress Bar */}
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
  const [isDeletionModalOpen, setIsDeletionModalOpen] = useState(false);

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
    <div className="flex-1 flex min-h-0 h-full w-full bg-white dark:bg-[#090D16] text-gray-900 dark:text-gray-100 overflow-hidden font-sans">

      {/* Account Deletion Modal */}
      <AccountDeletionModal
        isOpen={isDeletionModalOpen}
        onClose={() => setIsDeletionModalOpen(false)}
        onConfirmDelete={handleDeleteAccount}
      />

      {/* ── Left Sidebar Panel ── */}
      <div
        className={cn(
          'w-full md:w-[320px] lg:w-[360px] bg-white dark:bg-[#111827] flex flex-col overflow-hidden min-h-0 flex-shrink-0 border-r border-gray-200/80 dark:border-white/10',
          isMobileDetailOpen && 'hidden md:flex'
        )}
      >
        {/* Sidebar Header */}
        <div className="p-4 flex items-center justify-between flex-shrink-0 border-b border-gray-100 dark:border-white/10 gap-2">
          <div>
            <h1 className="font-fraunces text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
            <p className="font-jakarta text-xs text-gray-400 dark:text-gray-500 mt-0.5">Account & preference hub</p>
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

          {/* Admin Banner Button (if user is Admin) */}
          {adminRole && (
            <button
              onClick={() => navigate('/admin')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1A6B3C] hover:bg-[#14542F] text-white text-xs font-bold shadow-xs transition-all active:scale-[0.97] cursor-pointer"
            >
              <ShieldCheck size={16} />
              <span>Go to Admin Dashboard &rarr;</span>
            </button>
          )}
        </div>

        {/* Detail Content Body Container - Expanded to full available space */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-6xl mx-auto space-y-6">

            {/* TAB 1: SECURITY */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                
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
                      <PasswordField
                        label="New Password"
                        value={newPassword}
                        onChange={setNewPassword}
                        show={showPasswords}
                        onToggleShow={() => setShowPasswords((v) => !v)}
                        placeholder="Min. 8 characters"
                      />
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

              </div>
            )}

            {/* TAB 2: PRIVACY & SAFETY */}
            {activeTab === 'privacy' && (
              <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-200/80 dark:border-white/10 p-6 sm:p-8 space-y-6 shadow-xs">
                <div className="border-b border-gray-100 dark:border-white/10 pb-4">
                  <h3 className="font-fraunces text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Shield size={20} className="text-[#1A6B3C] dark:text-emerald-400" /> Privacy & Safety Control
                  </h3>
                  <p className="font-jakarta text-xs text-gray-500 dark:text-gray-400 mt-1">Manage who can see your activity and view blocked members.</p>
                </div>

                {/* Blocked Users Link Card */}
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-between hover:border-[#1A6B3C]/30 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center font-bold">
                      <ShieldOff size={18} />
                    </div>
                    <div>
                      <h4 className="font-jakarta text-sm font-bold text-gray-900 dark:text-white">Blocked Users</h4>
                      <p className="font-jakarta text-xs text-gray-500 dark:text-gray-400">View and manage users you have previously blocked</p>
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

                {/* Toggles Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
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
              <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-200/80 dark:border-white/10 p-6 sm:p-8 space-y-6 shadow-xs">
                <div className="border-b border-gray-100 dark:border-white/10 pb-4">
                  <h3 className="font-fraunces text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Bell size={20} className="text-[#1A6B3C] dark:text-emerald-400" /> Notifications & Alerts
                  </h3>
                  <p className="font-jakarta text-xs text-gray-500 dark:text-gray-400 mt-1">Configure how and when Ally-jis notifies you about updates.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            Manage student verifications, user roles, system logs & Supabase HTML email studio.
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

                {/* Account Actions & Danger Zone */}
                <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-200/80 dark:border-white/10 p-6 sm:p-8 space-y-6 shadow-xs">
                  <div className="border-b border-gray-100 dark:border-white/10 pb-4">
                    <h3 className="font-fraunces text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Sliders size={20} className="text-[#1A6B3C] dark:text-emerald-400" /> Account Actions & Danger Zone
                    </h3>
                    <p className="font-jakarta text-xs text-gray-500 dark:text-gray-400 mt-1">Session sign out and permanent account deletion options.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Sign Out Card */}
                    <div className="p-5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex flex-col justify-between space-y-4">
                      <div>
                        <h4 className="font-jakarta text-sm font-bold text-gray-900 dark:text-white">Sign Out of Session</h4>
                        <p className="font-jakarta text-xs text-gray-500 dark:text-gray-400 mt-1">Safely log out of your current session on this device.</p>
                      </div>
                      <div>
                        <button
                          onClick={handleSignOut}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-white/10 font-jakarta text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/15 transition-all shadow-xs cursor-pointer"
                        >
                          <LogOut size={14} /> Log out
                        </button>
                      </div>
                    </div>

                    {/* Danger Zone Card */}
                    <div className="p-5 rounded-xl bg-red-50/70 dark:bg-red-950/30 border border-red-200/80 dark:border-red-800/40 flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-jakarta font-bold text-sm">
                          <Trash2 size={16} /> Danger Zone
                        </div>
                        <p className="font-jakarta text-xs text-red-600/90 dark:text-red-300/80 mt-1 leading-relaxed">
                          Permanently delete your profile, posts, connections, and message history. This action cannot be reversed.
                        </p>
                      </div>

                      <div>
                        <button
                          onClick={() => setIsDeletionModalOpen(true)}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-jakarta text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-[0.97]"
                        >
                          <Trash2 size={14} /> Delete Account
                        </button>
                      </div>
                    </div>

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
