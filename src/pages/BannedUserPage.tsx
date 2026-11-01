// src/pages/BannedUserPage.tsx
//
// Shown to users whose account has been banned by campus administrators/moderators.
// Minimalist, flat, and easy to read — matching PendingApprovalPage.tsx.
// Supports submitting a formal conduct appeal and automatically detects when
// an account is unbanned via real-time socket events and fast polling.

import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, LogOut, Scale, Clock, CheckCircle2, AlertTriangle, X, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiClient, BanStatusResponse } from '@/api/client';
import { getSocket } from '@/lib/socket';
import { toast } from 'sonner';

export default function BannedUserPage() {
  const { session, completeLogin, isBanned, signOut } = useAuth();
  const navigate = useNavigate();

  const [banStatus, setBanStatus] = useState<BanStatusResponse | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [isAppealModalOpen, setIsAppealModalOpen] = useState(false);
  const [appealStatement, setAppealStatement] = useState('');
  const [isSubmittingAppeal, setIsSubmittingAppeal] = useState(false);
  const [appealAffirmed, setAppealAffirmed] = useState(false);

  const isCheckingRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // If the user lands here but is not banned, redirect immediately to dashboard
  useEffect(() => {
    if (!isBanned && session) {
      navigate('/dashboard', { replace: true });
    }
  }, [isBanned, session, navigate]);

  // Load ban details from backend
  const loadBanDetails = useCallback(async () => {
    try {
      const data = await apiClient.getBanStatus();
      setBanStatus(data);
    } catch (err) {
      console.warn('[BannedUserPage] Could not load ban status:', err);
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    void loadBanDetails();
  }, [loadBanDetails]);

  // Check whether the user's account has been unbanned
  const checkStatus = useCallback(async () => {
    if (isCheckingRef.current) return;
    isCheckingRef.current = true;
    try {
      const updated = await apiClient.getSession();
      if (!updated?.user) return;

      const updatedMeta = updated.user.user_metadata || {};
      const stillBanned = Boolean(
        updatedMeta.is_banned === true ||
        updatedMeta.status === 'banned' ||
        updatedMeta.is_suspended === true ||
        updatedMeta.status === 'suspended' ||
        (updated.user as any)?.is_banned === true ||
        (updated.user as any)?.status === 'banned' ||
        (updated.user as any)?.is_suspended === true ||
        (updated.user as any)?.status === 'suspended'
      );

      if (!stillBanned) {
        toast.success('Your account has been reinstated!', {
          description: 'Welcome back to the CHMSU community.',
        });
        completeLogin(updated, true);
        navigate('/dashboard', { replace: true });
        return;
      }

      // Also refresh ban details in background
      void loadBanDetails();
    } catch {
      // Silently ignore network errors during polling
    } finally {
      isCheckingRef.current = false;
    }
  }, [completeLogin, navigate, loadBanDetails]);

  // Fast polling check (every 4 seconds)
  useEffect(() => {
    intervalRef.current = setInterval(checkStatus, 4_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [checkStatus]);

  // Real-time socket listener: immediate wakeup when unbanned or appeal updated
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleRealtimeUpdate = (data?: any) => {
      console.info('[BannedUserPage] Realtime update received', data);
      void checkStatus();
    };

    socket.on('user:updated', handleRealtimeUpdate);
    socket.on('profile:updated', handleRealtimeUpdate);
    socket.on('user:banned', handleRealtimeUpdate);
    socket.on('user:unbanned', handleRealtimeUpdate);
    socket.on('user:suspended', handleRealtimeUpdate);
    socket.on('user:unsuspended', handleRealtimeUpdate);
    socket.on('report:appeal_submitted', handleRealtimeUpdate);
    socket.on('user:appeal_submitted', handleRealtimeUpdate);

    return () => {
      socket.off('user:updated', handleRealtimeUpdate);
      socket.off('profile:updated', handleRealtimeUpdate);
      socket.off('user:banned', handleRealtimeUpdate);
      socket.off('user:unbanned', handleRealtimeUpdate);
      socket.off('user:suspended', handleRealtimeUpdate);
      socket.off('user:unsuspended', handleRealtimeUpdate);
      socket.off('report:appeal_submitted', handleRealtimeUpdate);
      socket.off('user:appeal_submitted', handleRealtimeUpdate);
    };
  }, [checkStatus]);

  // Tab focus re-check
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void checkStatus();
      }
    };
    document.addEventListener('change', handleVisibility);
    window.addEventListener('focus', handleVisibility);
    return () => {
      document.removeEventListener('change', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
    };
  }, [checkStatus]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch { }
    navigate('/login', { replace: true });
  };

  const handleSubmitAppeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appealStatement.trim() || appealStatement.trim().length < 20) {
      toast.error('Statement too short', {
        description: 'Please write at least 20 characters explaining your grounds for appeal.',
      });
      return;
    }
    if (!appealAffirmed) {
      toast.error('Affirmation required', {
        description: 'Please affirm that your statement is truthful before submitting.',
      });
      return;
    }

    setIsSubmittingAppeal(true);
    try {
      const res = await apiClient.submitBanAppeal(appealStatement.trim(), banStatus?.reportId || undefined);
      toast.success('Appeal submitted successfully', {
        description: `Docket ${res.appealDocketId} has been queued for review by the Conduct Appeals Board.`,
      });
      setIsAppealModalOpen(false);
      setBanStatus((prev) =>
        prev
          ? {
            ...prev,
            appealSubmitted: true,
            appealDocketId: res.appealDocketId,
            appealStatement: appealStatement.trim(),
          }
          : null
      );
    } catch (err: any) {
      toast.error('Failed to submit appeal', {
        description: err?.message || 'Please check your connection and try again.',
      });
    } finally {
      setIsSubmittingAppeal(false);
    }
  };

  const isSuspended = Boolean(
    banStatus?.isSuspended ||
    banStatus?.status === 'suspended' ||
    session?.user?.user_metadata?.is_suspended ||
    session?.user?.user_metadata?.status === 'suspended' ||
    (session?.user as any)?.is_suspended ||
    (session?.user as any)?.status === 'suspended'
  );

  const bannedDateFormatted = banStatus?.bannedAt
    ? new Date(banStatus.bannedAt).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    : 'Recent';

  return (
    <div className="min-h-screen bg-white dark:bg-[#090D16] flex flex-col justify-between px-6 py-6 sm:py-10 transition-colors select-none font-jakarta">
      {/* Top bar with quick sign out */}

      {/* Top spacer */}
      <div className="flex-1 min-h-[20px]" />

      <div className="w-full max-w-md mx-auto flex flex-col items-center">
        {/* Shield Icon with Horizontal Line Alignment (mirroring PendingApprovalPage) */}
        <div className="flex items-center justify-center w-full my-4">
          <div className="flex-1 h-[1.5px] bg-[#E5E7EB] dark:bg-neutral-800" />
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-4 shrink-0 transition-colors shadow-sm ${
            isSuspended
              ? 'bg-amber-100 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/40 text-amber-600 dark:text-amber-400'
              : 'bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400'
          }`}>
            <ShieldAlert className="w-8 h-8" strokeWidth={2.4} />
          </div>
          <div className="flex-1 h-[1.5px] bg-[#E5E7EB] dark:bg-neutral-800" />
        </div>

        {/* Main Headings */}
        <div className="flex flex-col items-center text-center mt-3 max-w-[360px] sm:max-w-[420px]">
          <h1 className="text-[22px] sm:text-2xl font-extrabold text-[#111827] dark:text-white tracking-tight mb-2">
            {isSuspended ? 'Account Temporarily Suspended' : 'Account Permanently Banned'}
          </h1>
          <p className="text-sm text-[#6B7280] dark:text-gray-400 leading-relaxed mb-4">
            {isSuspended
              ? 'Your access to Ally-jis has been temporarily suspended due to violations of CHMSU Community Guidelines and student conduct policies.'
              : 'Your access to Ally-jis has been revoked due to serious violations of CHMSU Community Guidelines and student safety policies.'}
          </p>
        </div>

        {/* Details Card */}
        <div className="w-full bg-[#F9FAFB] dark:bg-[#111622] border border-[#E5E7EB] dark:border-neutral-800 rounded-2xl p-4 sm:p-5 text-left mb-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-gray-200/70 dark:border-white/5 mb-3 text-xs">
            <span className="font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Sanction Docket
            </span>
            <span className="font-mono font-bold text-gray-900 dark:text-white bg-gray-200/80 dark:bg-white/10 px-2 py-0.5 rounded">
              {banStatus?.docketId || (isSuspended ? `CHMSU-SUSP-${session?.user?.id?.slice(0, 8).toUpperCase() || 'OFFICIAL'}` : `CHMSU-BAN-${session?.user?.id?.slice(0, 8).toUpperCase() || 'OFFICIAL'}`)}
            </span>
          </div>

          <div className="space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between items-start">
              <span className="text-gray-500 dark:text-gray-400">Violation:</span>
              <span className="font-semibold text-gray-900 dark:text-gray-200 text-right max-w-[240px]">
                {banStatus?.violationLabel || 'Safety & Conduct Policy'}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-500 dark:text-gray-400">Enforced On:</span>
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {bannedDateFormatted}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-500 dark:text-gray-400">Status:</span>
              {isSuspended ? (
                <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  {banStatus?.suspendedUntil
                    ? `Suspended Until ${new Date(banStatus.suspendedUntil).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}`
                    : 'Temporary Suspension'}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-bold text-red-600 dark:text-red-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                  Permanent Ban
                </span>
              )}
            </div>
          </div>

          {/* Reason Statement */}
          <div className="mt-3.5 pt-3 border-t border-gray-200/70 dark:border-white/5">
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed italic bg-white dark:bg-black/20 p-2.5 rounded-lg border border-gray-200/60 dark:border-white/5">
              "{banStatus?.reason || (isSuspended
                ? 'Account privileges temporarily suspended following formal conduct investigation. Platform features are restricted during this period.'
                : 'Account privileges terminated following formal conduct investigation. All features are restricted.')}"
            </p>
          </div>
        </div>

        {/* Appeal Status Callout (if appeal already submitted) */}
        {banStatus?.appealSubmitted && (
          <div className="w-full bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl p-4 text-left shadow-sm mb-4">
            <div className="flex items-center gap-2 mb-1.5">
              <Clock className="w-4 h-4 text-[#1A6B3C] dark:text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#1A6B3C] dark:text-emerald-400">
                Appeal Under Review
              </span>
              {banStatus.appealDocketId && (
                <span className="ml-auto text-[11px] font-mono text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/50 px-1.5 py-0.5 rounded">
                  {banStatus.appealDocketId}
                </span>
              )}
            </div>
            <p className="text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed">
              Your formal appeal has been received by the Conduct Appeals Board. You will be automatically notified once a verdict is rendered.
            </p>
            {banStatus.appealStatement && (
              <div className="mt-2 text-xs bg-white/70 dark:bg-black/30 p-2 rounded border border-emerald-200/60 dark:border-emerald-800/30 text-gray-700 dark:text-gray-300 italic line-clamp-2">
                "{banStatus.appealStatement}"
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom spacer */}
      <div className="flex-[2] min-h-[30px]" />

      {/* Action Area: Appeal Button + Log Out + Support Link */}
      <div className="w-full max-w-sm mx-auto flex flex-col items-center gap-3 pb-4">
        {!banStatus?.appealSubmitted ? (
          <button
            type="button"
            onClick={() => setIsAppealModalOpen(true)}
            className="w-full py-3.5 px-6 rounded-full bg-[#1A6B3C] hover:bg-[#155a33] text-white text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            <Scale size={16} />
            Submit Conduct Appeal
          </button>
        ) : (
          <button
            type="button"
            onClick={checkStatus}
            disabled={loadingStatus}
            className="w-full py-3.5 px-6 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            <RefreshCw size={16} className={loadingStatus ? 'animate-spin' : ''} />
            Check Appeal Status
          </button>
        )}

        <button
          type="button"
          onClick={handleSignOut}
          className="w-full py-3.5 px-6 rounded-full text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] bg-gray-100 hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-[#111827] dark:text-gray-200 border border-gray-200 dark:border-neutral-700"
        >
          <LogOut size={16} />
          Log out
        </button>

        {/* Support Link */}
        <div className="py-1 px-3">
          <p className="text-xs sm:text-sm text-[#6B7280] dark:text-gray-400 text-center">
            Questions regarding this decision?{' '}
            <Link
              to="/support"
              className="text-[#1A6B3C] dark:text-emerald-400 font-bold underline hover:opacity-85 transition-opacity"
            >
              Contact safety desk
            </Link>
          </p>
        </div>
      </div>

      {/* Appeal Modal */}
      {isAppealModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#111622] border border-gray-200 dark:border-neutral-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative text-left">
            <button
              onClick={() => setIsAppealModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-[#1A6B3C] dark:text-emerald-400 shrink-0">
                <Scale size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Submit Conduct Appeal
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Case Docket: {banStatus?.docketId || 'Official Review'}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitAppeal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Grounds for Appeal & Statement
                </label>
                <textarea
                  value={appealStatement}
                  onChange={(e) => setAppealStatement(e.target.value)}
                  placeholder="Explain why you believe this sanction should be reconsidered. Provide context, mitigating factors, or clarifications..."
                  rows={5}
                  className="w-full text-sm p-3.5 rounded-xl border border-gray-300 dark:border-neutral-700 bg-white dark:bg-black/30 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1A6B3C] dark:focus:ring-emerald-500 transition-all placeholder:text-gray-400"
                />
                <div className="flex justify-between items-center text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                  <span>Minimum 20 characters</span>
                  <span>{appealStatement.length} chars</span>
                </div>
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-gray-600 dark:text-gray-300 pt-1">
                <input
                  type="checkbox"
                  checked={appealAffirmed}
                  onChange={(e) => setAppealAffirmed(e.target.checked)}
                  className="mt-0.5 rounded border-gray-300 text-[#1A6B3C] focus:ring-[#1A6B3C]"
                />
                <span>
                  I affirm that the information provided in this appeal statement is true, accurate, and submitted in good faith to the Conduct Appeals Board.
                </span>
              </label>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAppealModalOpen(false)}
                  className="flex-1 py-3 px-4 rounded-xl border border-gray-300 dark:border-neutral-700 text-gray-700 dark:text-gray-200 text-sm font-semibold hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAppeal || appealStatement.trim().length < 20 || !appealAffirmed}
                  className="flex-1 py-3 px-4 rounded-xl bg-[#1A6B3C] hover:bg-[#155a33] text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmittingAppeal ? 'Submitting...' : 'Submit Formal Appeal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

