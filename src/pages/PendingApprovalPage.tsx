// src/pages/PendingApprovalPage.tsx
//
// Shown to external-email students whose student ID is pending admin review.
// Minimalist, flat, and easy to read — matching the mobile phone design.
// Automatically detects approval via real-time socket events and fast polling,
// seamlessly redirecting the user to the dashboard once verified.

import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, XCircle, Upload, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/api/client';
import { getSocket } from '@/lib/socket';

export default function PendingApprovalPage() {
  const { session, completeLogin, isPendingApproval, signOut } = useAuth();
  const navigate = useNavigate();
  const [, setChecking] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isCheckingRef = useRef(false);

  const meta = session?.user?.user_metadata;
  const isExternal =
    meta?.email_type === 'external' ||
    (!meta?.email_type && session?.user?.email && !session.user.email.toLowerCase().endsWith('@chmsu.edu.ph'));

  const isApproved = Boolean(
    meta?.is_approved ||
    meta?.admin_verified ||
    meta?.student_verification_status === 'approved' ||
    meta?.chmsu_auto_verified ||
    !isExternal
  );

  const status: string = (meta?.student_verification_status as string) ?? (isApproved ? 'approved' : 'pending');
  const isRejected = status === 'rejected';
  const hasStudentId = Boolean(
    meta?.student_id_url || (session?.user as any)?.student_id_url
  );

  // If somehow the user lands here but is already approved, immediately send them to the dashboard
  useEffect(() => {
    if ((isApproved || !isPendingApproval) && session) {
      navigate('/dashboard', { replace: true });
    }
  }, [isApproved, isPendingApproval, session, navigate]);

  const checkStatus = useCallback(async () => {
    if (isCheckingRef.current) return;
    isCheckingRef.current = true;
    setChecking(true);
    try {
      const updated = await apiClient.getSession();
      if (!updated?.user) return;

      const updatedMeta = updated.user.user_metadata || {};
      const updatedIsExternal =
        updatedMeta.email_type === 'external' ||
        (!updatedMeta.email_type && updated.user.email && !updated.user.email.toLowerCase().endsWith('@chmsu.edu.ph'));

      const updatedIsApproved = Boolean(
        updatedMeta.is_approved ||
        updatedMeta.admin_verified ||
        updatedMeta.student_verification_status === 'approved' ||
        updatedMeta.chmsu_auto_verified ||
        !updatedIsExternal
      );

      if (updatedIsApproved) {
        completeLogin(updated, true);
        navigate('/dashboard', { replace: true });
        return;
      }

      // If status changed (e.g. from pending to rejected or re-uploaded), update state
      if (updatedMeta.student_verification_status !== meta?.student_verification_status) {
        completeLogin(updated, true);
      }
    } catch {
      // Silently ignore network errors — try again next tick
    } finally {
      isCheckingRef.current = false;
      setChecking(false);
    }
  }, [completeLogin, navigate, meta?.student_verification_status]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {}
    navigate('/login', { replace: true });
  };

  // Fast-polling check (every 3 seconds)
  useEffect(() => {
    void checkStatus();
    intervalRef.current = setInterval(checkStatus, 3_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [checkStatus]);

  // Real-time socket listener: instant transition as soon as admin approves or updates
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleRealtimeUpdate = (data?: any) => {
      console.info('[PendingApproval] Realtime verification update received', data);
      void checkStatus();
    };

    socket.on('user:verification_status', handleRealtimeUpdate);
    socket.on('user:updated', handleRealtimeUpdate);
    socket.on('profile:updated', handleRealtimeUpdate);

    return () => {
      socket.off('user:verification_status', handleRealtimeUpdate);
      socket.off('user:updated', handleRealtimeUpdate);
      socket.off('profile:updated', handleRealtimeUpdate);
    };
  }, [checkStatus]);

  // Check immediately on tab switch / window focus
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void checkStatus();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
    };
  }, [checkStatus]);

  return (
    <div className="min-h-screen bg-white dark:bg-[#090D16] flex flex-col justify-between px-6 py-6 sm:py-10 transition-colors select-none">
      {/* Top bar with quick sign out */}
      <div className="w-full max-w-md mx-auto flex justify-end">
        <button
          type="button"
          onClick={handleSignOut}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer py-1 px-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800"
          title="Sign out of account"
        >
          <LogOut size={15} />
          <span>Log out</span>
        </button>
      </div>

      {/* Top spacer */}
      <div className="flex-1 min-h-[30px]" />

      <div className="w-full max-w-md mx-auto flex flex-col items-center">
        {/* Magnifying Glass Icon with Horizontal Line Alignment */}
        <div className="flex items-center justify-center w-full my-4">
          <div className="flex-1 h-[1.5px] bg-[#E5E7EB] dark:bg-neutral-800" />
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center mx-4 shrink-0 transition-colors ${
              isRejected
                ? 'bg-red-100 dark:bg-red-950/60'
                : 'bg-[#DCFCE7] dark:bg-emerald-950/60'
            }`}
          >
            {isRejected ? (
              <XCircle className="w-7 h-7 text-red-600 dark:text-red-400" strokeWidth={2.4} />
            ) : (
              <Search className="w-7 h-7 text-[#1A6B3C] dark:text-emerald-400" strokeWidth={2.4} />
            )}
          </div>
          <div className="flex-1 h-[1.5px] bg-[#E5E7EB] dark:bg-neutral-800" />
        </div>

        {/* Main Headings */}
        <div className="flex flex-col items-center text-center mt-3 max-w-[340px] sm:max-w-[400px]">
          <h1 className="text-[22px] sm:text-2xl font-extrabold text-[#111827] dark:text-white tracking-tight mb-2">
            {isRejected ? 'Verification Rejected' : 'Your account is under review'}
          </h1>
          <p className="text-sm text-[#6B7280] dark:text-gray-400 leading-relaxed">
            {isRejected
              ? 'Your student ID could not be verified. Please contact campus support for enrollment assistance.'
              : 'Our administrators are verifying your student credentials. You will gain full access to the campus community as soon as review is complete.'}
          </p>
        </div>
      </div>

      {/* Bottom spacer */}
      <div className="flex-[2] min-h-[40px]" />

      {/* Action Area: Upload ID (if missing or rejected) + Log Out + Support Link */}
      <div className="w-full max-w-sm mx-auto flex flex-col items-center gap-3.5 pb-4">
        {(!hasStudentId || isRejected) && (
          <button
            type="button"
            onClick={() => navigate('/register?uploadId=true&idSubStep=front')}
            className="w-full py-3.5 px-6 rounded-full bg-[#1A6B3C] hover:bg-[#155a33] text-white text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            <Upload size={16} />
            {!hasStudentId ? 'Upload Student ID Now' : 'Re-upload Student ID'}
          </button>
        )}

        <button
          type="button"
          onClick={handleSignOut}
          className={`w-full py-3.5 px-6 rounded-full text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] ${
            !hasStudentId || isRejected
              ? 'bg-gray-100 hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-[#111827] dark:text-gray-200 border border-gray-200 dark:border-neutral-700'
              : 'bg-[#1A6B3C] hover:bg-[#155a33] text-white'
          }`}
        >
          <LogOut size={16} />
          Log out
        </button>

        {/* Support Link */}
        <div className="py-1.5 px-3">
          <p className="text-xs sm:text-sm text-[#6B7280] dark:text-gray-400 text-center">
            Need help?{' '}
            <Link
              to="/support"
              className="text-[#1A6B3C] dark:text-emerald-400 font-bold underline hover:opacity-85 transition-opacity"
            >
              Contact support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
