/**
 * ConfirmPage — handles Supabase email-confirmation and Google OAuth redirects.
 *
 * Flow:
 *  1. Google OAuth:
 *     - Reads access_token/refresh_token from URL hash or Supabase session.
 *     - POSTs to /api/auth/oauth/google to verify if the Google account is
 *       a CHMSU institutional email (@chmsu.edu.ph) or an external personal email.
 *     - If CHMSU email: auto-verified, routed to onboarding if new, or dashboard if complete.
 *     - If Personal email: flagged as external; still requires student verification (student ID / COR).
 *  2. Magic Link Email confirmation:
 *     - Reads token_hash from query params and calls /api/auth/confirm.
 */
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, ArrowRight, XCircle, Loader2 } from 'lucide-react';
import { apiClient } from '@/api/client';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { getWebRegisterCache, saveWebRegisterCache, dataUrlToFile, rotateImageFile } from '@/lib/registerCache';

type State = 'loading' | 'success' | 'oauth_success' | 'error' | 'missing_token' | 'pending';

export default function ConfirmPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { completeLogin } = useAuth();
  const [state, setState] = useState<State>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const didRun = useRef(false);
  const didProcess = useRef(false);

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    // Check for OAuth error in URL hash or query params
    const hashStr = window.location.hash.replace(/^#/, '');
    const hashParams = new URLSearchParams(hashStr);
    const errorParam =
      searchParams.get('error_description') ||
      hashParams.get('error_description') ||
      searchParams.get('error') ||
      hashParams.get('error');

    if (errorParam) {
      setErrorMessage(decodeURIComponent(errorParam).replace(/\+/g, ' '));
      setState('error');
      return;
    }

    // Post-registration redirect: user just registered and needs to check email
    if (searchParams.get('pending') === 'true') {
      setState('pending');
      return;
    }

    const tokenHash = searchParams.get('token_hash');
    const hashAccessToken = hashParams.get('access_token');
    const hashRefreshToken = hashParams.get('refresh_token');

    // ─── OAuth Session Verification ──────────────────────────────────────────
    const processOAuthSession = async (accessToken: string, refreshToken?: string) => {
      if (didProcess.current) return;
      didProcess.current = true;
      try {
        const session = await apiClient.oauthGoogle(accessToken, refreshToken);
        const emailType = session.user?.user_metadata?.email_type;
        const isChmsu = emailType === 'chmsu';
        const isApproved = session.user?.user_metadata?.is_approved;
        const needsOnboard = !session.user?.user_metadata?.onboarding_complete;
        let hasStudentId = Boolean(
          session.user?.user_metadata?.student_id_url ||
          (session.user as any)?.student_id_url
        );

        // Check if there is an uploaded ID in local registration cache
        const cached = getWebRegisterCache();
        const hasCachedId = Boolean(cached?.frontPreviewDataUrl);

        if (!isChmsu && !hasStudentId && hasCachedId && session.user?.id) {
          try {
            const frontFile = dataUrlToFile(cached!.frontPreviewDataUrl!, 'student-id-front.jpg');
            if (frontFile) {
              const rotatedFront = cached?.frontRotation
                ? await rotateImageFile(frontFile, cached.frontRotation)
                : frontFile;
              await apiClient.uploadStudentId(session.user.id, rotatedFront, 'front');
              hasStudentId = true;
            }
            if (cached?.backPreviewDataUrl) {
              const backFile = dataUrlToFile(cached.backPreviewDataUrl, 'student-id-back.jpg');
              if (backFile) {
                const rotatedBack = cached.backRotation
                  ? await rotateImageFile(backFile, cached.backRotation)
                  : backFile;
                await apiClient.uploadStudentId(session.user.id, rotatedBack, 'back');
              }
            }
            // Fetch updated session after upload so student_id_url is present
            const updated = await apiClient.getSession();
            if (updated) {
              completeLogin(updated, true);
            } else {
              completeLogin(session, true);
            }
          } catch (uploadErr) {
            console.warn('[ConfirmPage] Auto-upload cached student ID warning:', uploadErr);
            completeLogin(session, true);
          }
        } else {
          // Atomically update AuthContext
          completeLogin(session, true);
        }

        // If user has an ID (either on server or in cache) and needs onboarding,
        // update cache step so it aligns seamlessly with Step 2 (academic & username)
        if (hasStudentId || hasCachedId) {
          saveWebRegisterCache({
            step: 2,
            idSubStep: 'none',
            academicSubStep: 'username',
          });
        }

        // Next Step determination:
        // - CHMSU institutional accounts auto-pass student ID requirement.
        // - External accounts: if they have a student ID (server or cache), proceed straight to Step 2 if incomplete.
        let nextUrl: string;
        if (isChmsu) {
          nextUrl = needsOnboard ? '/register?step=2' : '/dashboard';
        } else {
          if (!hasStudentId && !hasCachedId && !isApproved) {
            nextUrl = '/register?uploadId=true&idSubStep=front';
          } else if (needsOnboard) {
            nextUrl = '/register?step=2';
          } else if (!isApproved) {
            nextUrl = '/pending-approval';
          } else {
            nextUrl = '/dashboard';
          }
        }

        // Automatic instant redirect (no CTA button)
        navigate(nextUrl, { replace: true });
      } catch (err: any) {
        console.error('Google OAuth backend error:', err);
        setErrorMessage(err?.message ?? 'Google authentication failed. Please try again.');
        setState('error');
      }
    };

    const handleAuth = async () => {
      // 1. Direct PKCE code exchange (Supabase JS v2 default flow)
      const code = searchParams.get('code');
      if (code) {
        try {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error('[ConfirmPage] exchangeCodeForSession error:', error);
            setErrorMessage(error.message || 'Could not verify OAuth code.');
            setState('error');
            return;
          }
          if (data?.session?.access_token) {
            await processOAuthSession(data.session.access_token, data.session.refresh_token);
            return;
          }
        } catch (err: any) {
          console.error('[ConfirmPage] exchangeCodeForSession exception:', err);
          setErrorMessage(err?.message || 'Could not exchange authorization code.');
          setState('error');
          return;
        }
      }

      // 2. Hash fragment access_token (Implicit OAuth flow)
      if (hashAccessToken) {
        await processOAuthSession(hashAccessToken, hashRefreshToken || undefined);
        return;
      }

      // 3. Supabase client already extracted an active session
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.access_token) {
          await processOAuthSession(data.session.access_token, data.session.refresh_token);
          return;
        }
      } catch {
        // Fall through
      }

      // 4. Legacy magic-link confirmation token
      if (tokenHash) {
        try {
          const session = await apiClient.confirmEmail(tokenHash);
          completeLogin(session, true);
          navigate('/dashboard', { replace: true });
        } catch (err: any) {
          setErrorMessage(err?.message ?? 'Something went wrong. Please try again.');
          setState('error');
        }
        return;
      }

      // 5. Neither token_hash, code, nor OAuth hash found
      setState('missing_token');
    };

    void handleAuth();

    // 6. Asynchronous auth listener in case session resolution is still in flight
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && currentSession?.access_token) {
        if (!didProcess.current) {
          await processOAuthSession(currentSession.access_token, currentSession.refresh_token);
        }
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [searchParams, navigate, completeLogin]);

  return (
    <div className="min-h-[100dvh] bg-[#F7F4EF] dark:bg-[#090D16] flex flex-col items-center justify-center px-4">
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
            <span className="font-fraunces font-semibold text-2xl text-[#1A6B3C] dark:text-emerald-400">
              lly<span className="text-[#E8A838]">-jis</span>
            </span>
          </Link>
        </div>

        <div className="bg-white dark:bg-[#111827] rounded-3xl shadow-xl border border-[#1A6B3C]/8 dark:border-white/10 p-8 text-center">

          {/* ── Error ───────────────────────────────────────────────── */}
          {state === 'error' && (
            <>
              <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/40 flex items-center justify-center mx-auto mb-5">
                <XCircle size={32} className="text-red-500 dark:text-red-400" />
              </div>
              <h1 className="font-fraunces text-2xl font-bold text-gray-800 dark:text-white mb-1.5">
                Verification failed
              </h1>
              <p className="font-jakarta text-gray-500 dark:text-gray-400 text-sm mb-2">
                {errorMessage}
              </p>
              <p className="font-jakarta text-gray-400 text-xs mb-7">
                Authentication sessions or links may expire. Please try logging in or registering again.
              </p>
              <Link
                to="/login"
                className="w-full flex items-center justify-center gap-2 bg-[#1A6B3C] dark:bg-emerald-600 text-white font-jakarta font-bold py-3.5 rounded-full transition-all shadow-lg hover:bg-[#155a33] dark:hover:bg-emerald-500 active:scale-[0.98]"
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
              <h1 className="font-fraunces text-2xl font-bold text-[#1A6B3C] dark:text-emerald-400 mb-1.5">
                Check your email!
              </h1>
              <p className="font-jakarta text-[#1A6B3C]/60 dark:text-gray-400 text-sm mb-7">
                We've sent a confirmation link to your inbox. Click it to verify your account and then sign in.
              </p>
              <Link
                to="/login"
                className="w-full flex items-center justify-center gap-2 bg-[#1A6B3C] dark:bg-emerald-600 text-white font-jakarta font-bold py-3.5 rounded-full transition-all shadow-lg hover:bg-[#155a33] dark:hover:bg-emerald-500 active:scale-[0.98]"
              >
                Go to Login <ArrowRight size={18} />
              </Link>
            </>
          )}

          {/* ── Missing token ────────────────────────────────────────── */}
          {state === 'missing_token' && (
            <>
              <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center mx-auto mb-5">
                <XCircle size={32} className="text-amber-500 dark:text-amber-400" />
              </div>
              <h1 className="font-fraunces text-2xl font-bold text-gray-800 dark:text-white mb-1.5">
                No confirmation token
              </h1>
              <p className="font-jakarta text-gray-500 dark:text-gray-400 text-sm mb-7">
                This page is meant to be opened from a confirmation link or OAuth provider redirect.
              </p>
              <Link
                to="/login"
                className="w-full flex items-center justify-center gap-2 bg-[#1A6B3C] dark:bg-emerald-600 text-white font-jakarta font-bold py-3.5 rounded-full transition-all shadow-lg hover:bg-[#155a33] dark:hover:bg-emerald-500 active:scale-[0.98]"
              >
                Go to Login <ArrowRight size={18} />
              </Link>
            </>
          )}

          {/* ── Default / Automatic Loading Screen (no CTA button) ──── */}
          {state !== 'error' && state !== 'pending' && state !== 'missing_token' && (
            <>
              <div className="w-16 h-16 rounded-full bg-[#1A6B3C]/10 dark:bg-emerald-950/50 flex items-center justify-center mx-auto mb-5">
                <Loader2 size={32} className="text-[#1A6B3C] dark:text-emerald-400 animate-spin" />
              </div>
              <h1 className="font-fraunces text-2xl font-bold text-[#1A6B3C] dark:text-emerald-400 mb-1.5">
                Verifying your account…
              </h1>
              <p className="font-jakarta text-[#1A6B3C]/60 dark:text-gray-400 text-sm">
                Please wait while we verify your credentials and redirect you.
              </p>
            </>
          )}
        </div>

        <p className="text-center font-jakarta text-xs text-[#1A6B3C]/40 dark:text-emerald-400/40 mt-6">
          For CHMSU Alijis Campus students only
        </p>
      </div>
    </div>
  );
}