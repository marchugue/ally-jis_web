// src/pages/PendingApprovalPage.tsx
//
// Shown to external-email students whose student ID is pending admin review.
// They are hard-locked here (via ProtectedRoute) until approved.
// Polls the session every 30s and auto-redirects to /dashboard on approval.

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle2, XCircle, LogOut, RefreshCw, Upload } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/api/client';

type VerificationStatus = 'pending' | 'approved' | 'rejected' | null;

export default function PendingApprovalPage() {
  const { session, signOut, isPendingApproval } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const status: VerificationStatus =
    (session?.user?.user_metadata?.student_verification_status as VerificationStatus) ?? 'pending';

  // If somehow they land here but are already approved, push them out
  useEffect(() => {
    if (!isPendingApproval && session) {
      navigate('/dashboard', { replace: true });
    }
  }, [isPendingApproval, session, navigate]);

  // Poll every 30s — refresh the session to get updated metadata
  const checkStatus = async () => {
    if (checking) return;
    setChecking(true);
    try {
      const updated = await apiClient.getSession();
      if (!updated) return;

      const updatedStatus = updated.user?.user_metadata?.student_verification_status;
      const stillPending = updated.user?.user_metadata?.pending_student_verification;

      if (!stillPending || updatedStatus === 'approved') {
        // Approved! Redirect to dashboard
        navigate('/dashboard', { replace: true });
        window.location.reload(); // force AuthContext to hydrate fresh session
      }
    } catch {
      // Silently ignore — we'll try again next tick
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    intervalRef.current = setInterval(checkStatus, 30_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const isPending = status === 'pending' || status === null;
  const isRejected = status === 'rejected';

  return (
    <div className="min-h-screen bg-[#F7F4EF] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          {/* Top banner */}
          <div
            className={`px-8 py-10 text-center ${
              isRejected
                ? 'bg-gradient-to-br from-red-500 to-rose-600'
                : 'bg-gradient-to-br from-amber-400 to-orange-500'
            }`}
          >
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4 shadow-lg">
              {isRejected ? (
                <XCircle className="text-white" size={32} />
              ) : (
                <Clock className="text-white" size={32} />
              )}
            </div>
            <h1 className="font-fraunces text-2xl font-bold text-white mb-1">
              {isRejected ? 'Verification Rejected' : 'Pending Approval'}
            </h1>
            <p className="text-white/80 text-sm">
              {isRejected
                ? 'Your student ID could not be verified.'
                : 'Your student ID is being reviewed.'}
            </p>
          </div>

          {/* Body */}
          <div className="px-8 py-8 space-y-5">
            {isPending && (
              <>
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800 leading-relaxed">
                  <p className="font-semibold mb-1">What's happening?</p>
                  <p>
                    Our team is reviewing your uploaded student ID to verify if you are a bona fide CHMSU student.
                    This process usually takes <strong>less than 24 hours</strong>.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    Email verified
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    Student ID submitted
                  </div>
                  <div className="flex items-center gap-3 text-sm text-amber-500 font-medium">
                    <Clock size={16} className="shrink-0" />
                    Waiting for admin approval…
                  </div>
                </div>

                <button
                  onClick={checkStatus}
                  disabled={checking}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors disabled:opacity-60"
                >
                  <RefreshCw size={15} className={checking ? 'animate-spin' : ''} />
                  {checking ? 'Checking…' : 'Check Status Now'}
                </button>
              </>
            )}

            {isRejected && (
              <>
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-800 leading-relaxed">
                  <p className="font-semibold mb-1">Why was it rejected?</p>
                  <p>
                    Your student ID could not be verified. This may be due to a blurry image,
                    incorrect document, or missing information. Please re-upload a clear photo
                    of your valid CHMSU student ID.
                  </p>
                </div>

                <button
                  onClick={() => navigate('/onboarding?reupload=1')}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors"
                >
                  <Upload size={15} />
                  Re-upload Student ID
                </button>
              </>
            )}

            {/* Sign out */}
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl border border-gray-200 text-gray-500 hover:bg-gray-50 text-sm font-medium transition-colors"
            >
              <LogOut size={14} />
              Sign out
            </button>

            <p className="text-center text-xs text-gray-400">
              Need help?{' '}
              <a href="/support" className="text-[#1A6B3C] underline underline-offset-2">
                Contact Support
              </a>
            </p>
          </div>
        </div>

        {/* Branding */}
        <p className="text-center text-xs text-gray-400 mt-6 font-fraunces">Ally-jis</p>
      </div>
    </div>
  );
}
