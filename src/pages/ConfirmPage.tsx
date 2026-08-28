/**
 * ConfirmPage — handles the Supabase email-confirmation redirect.
 *
 * Flow:
 *  1. User registers → Supabase sends a confirmation email.
 *  2. User clicks the link → Supabase redirects to
 *       http://localhost:5173/confirmation-page?token_hash=XXX&type=signup
 *  3. This page reads token_hash from the URL, POSTs it to
 *       POST /api/auth/confirm
 *  4. On success: user is logged in automatically and redirected to /dashboard.
 *  5. On failure: a clear error message is shown with a retry link.
 */
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, ArrowRight, XCircle, Loader2 } from 'lucide-react';
import { apiClient } from '@/api/client';
import { useAuth } from '@/context/AuthContext';

type State = 'loading' | 'success' | 'error' | 'missing_token' | 'pending';

export default function ConfirmPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { completeLogin } = useAuth();
  const [state, setState] = useState<State>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const didRun = useRef(false);

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    // Post-registration redirect: user just registered and needs to check email
    if (searchParams.get('pending') === 'true') {
      setState('pending');
      return;
    }

    const tokenHash = searchParams.get('token_hash');

    if (!tokenHash) {
      // Page was visited without a token (e.g. user navigated here manually)
      setState('missing_token');
      return;
    }

    const confirm = async () => {
      try {
        const session = await apiClient.confirmEmail(tokenHash);
        // Atomically push session + verified into context
        completeLogin(session, true);
        setState('success');
        // Give the user a moment to see the success state, then redirect
        setTimeout(() => navigate('/dashboard', { replace: true }), 2000);
      } catch (err: any) {
        setErrorMessage(err?.message ?? 'Something went wrong. Please try again.');
        setState('error');
      }
    };

    confirm();
  }, [searchParams, navigate, completeLogin]);

  return (
    <div className="min-h-[100dvh] bg-[#F7F4EF] flex flex-col items-center justify-center px-4">
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-[#1A6B3C]/5 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] rounded-full bg-[#E8A838]/8 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-[#1A6B3C] flex items-center justify-center shadow-lg">
              <span className="text-white font-fraunces font-bold text-xl">A</span>
            </div>
            <span className="font-fraunces font-semibold text-2xl text-[#1A6B3C]">
              lly<span className="text-[#E8A838]">-jis</span>
            </span>
          </Link>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-[#1A6B3C]/8 p-8 text-center">

          {/* ── Loading ─────────────────────────────────────────────── */}
          {state === 'loading' && (
            <>
              <div className="w-16 h-16 rounded-full bg-[#1A6B3C]/10 flex items-center justify-center mx-auto mb-5">
                <Loader2 size={32} className="text-[#1A6B3C] animate-spin" />
              </div>
              <h1 className="font-fraunces text-2xl font-bold text-[#1A6B3C] mb-1.5">
                Verifying your email…
              </h1>
              <p className="font-jakarta text-[#1A6B3C]/60 text-sm">
                Please wait while we confirm your account.
              </p>
            </>
          )}

          {/* ── Success ─────────────────────────────────────────────── */}
          {state === 'success' && (
            <>
              <div className="w-16 h-16 rounded-full bg-[#1A6B3C]/10 flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 size={32} className="text-[#1A6B3C]" />
              </div>
              <h1 className="font-fraunces text-2xl font-bold text-[#1A6B3C] mb-1.5">
                Email verified!
              </h1>
              <p className="font-jakarta text-[#1A6B3C]/60 text-sm mb-7">
                Your account is confirmed. Taking you to your dashboard…
              </p>
              <Link
                to="/dashboard"
                className="w-full flex items-center justify-center gap-2 bg-[#1A6B3C] text-white font-jakarta font-bold py-3.5 rounded-xl transition-all shadow-lg hover:bg-[#155a33] active:scale-[0.98]"
              >
                Go to Dashboard <ArrowRight size={18} />
              </Link>
            </>
          )}

          {/* ── Error ───────────────────────────────────────────────── */}
          {state === 'error' && (
            <>
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
                <XCircle size={32} className="text-red-500" />
              </div>
              <h1 className="font-fraunces text-2xl font-bold text-gray-800 mb-1.5">
                Verification failed
              </h1>
              <p className="font-jakarta text-gray-500 text-sm mb-2">
                {errorMessage}
              </p>
              <p className="font-jakarta text-gray-400 text-xs mb-7">
                Confirmation links expire after 24 hours. If yours has expired, you can request a new one by registering again or contacting support.
              </p>
              <Link
                to="/login"
                className="w-full flex items-center justify-center gap-2 bg-[#1A6B3C] text-white font-jakarta font-bold py-3.5 rounded-xl transition-all shadow-lg hover:bg-[#155a33] active:scale-[0.98]"
              >
                Go to Login <ArrowRight size={18} />
              </Link>
            </>
          )}

          {/* ── Pending (just registered, no token yet) ──────────────── */}
          {state === 'pending' && (
            <>
              <div className="w-16 h-16 rounded-full bg-[#E8A838]/10 flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 size={32} className="text-[#E8A838]" />
              </div>
              <h1 className="font-fraunces text-2xl font-bold text-[#1A6B3C] mb-1.5">
                Check your email!
              </h1>
              <p className="font-jakarta text-[#1A6B3C]/60 text-sm mb-7">
                We've sent a confirmation link to your inbox. Click it to verify your account and then sign in.
              </p>
              <Link
                to="/login"
                className="w-full flex items-center justify-center gap-2 bg-[#1A6B3C] text-white font-jakarta font-bold py-3.5 rounded-xl transition-all shadow-lg hover:bg-[#155a33] active:scale-[0.98]"
              >
                Go to Login <ArrowRight size={18} />
              </Link>
            </>
          )}

          {/* ── Missing token ────────────────────────────────────────── */}
          {state === 'missing_token' && (
            <>
              <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-5">
                <XCircle size={32} className="text-amber-500" />
              </div>
              <h1 className="font-fraunces text-2xl font-bold text-gray-800 mb-1.5">
                No confirmation token
              </h1>
              <p className="font-jakarta text-gray-500 text-sm mb-7">
                This page should be opened from the confirmation link in your email. Please check your inbox and click the link there.
              </p>
              <Link
                to="/login"
                className="w-full flex items-center justify-center gap-2 bg-[#1A6B3C] text-white font-jakarta font-bold py-3.5 rounded-xl transition-all shadow-lg hover:bg-[#155a33] active:scale-[0.98]"
              >
                Go to Login <ArrowRight size={18} />
              </Link>
            </>
          )}
        </div>

        <p className="text-center font-jakarta text-xs text-[#1A6B3C]/40 mt-6">
          For CHMSU Alijis Campus students only
        </p>
      </div>
    </div>
  );
}