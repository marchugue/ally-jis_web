// src/pages/OtpVerifyPage.tsx
//
// Email OTP verification screen.
// Reached after registration (from OnboardingPage) or after a login
// attempt on an unverified account.
//
// URL params: ?userId=xxx&email=xxx[&email_type=chmsu|external]

import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ShieldCheck, RefreshCw, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiClient } from '@/api/client';
import { useAuth } from '@/context/AuthContext';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds between resends

export default function OtpVerifyPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { completeLogin } = useAuth();

  const userId = params.get('userId') ?? '';
  const email = params.get('email') ?? '';

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isPendingApproval, setIsPendingApproval] = useState(false);
  const [resendCount, setResendCount] = useState(0);
  const [resendLimit, setResendLimit] = useState(3);
  const [cooldown, setCooldown] = useState(0);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch initial OTP status on mount
  useEffect(() => {
    if (!userId) return;
    apiClient.getOtpStatus(userId).then((status) => {
      setResendCount(status.resendCount);
      setResendLimit(status.resendLimit);
      // If already verified, fetch the session to check pending_student_verification
      // so we route correctly (pending-approval vs dashboard) on page refresh.
      if (status.verified) {
        navigate('/dashboard', { replace: true }); // ProtectedRoute will redirect to /pending-approval if needed
      }
    }).catch(() => {});
  }, [userId, navigate]);

  // Focus first input on mount
  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  // Countdown timer for resend cooldown
  const startCooldown = useCallback(() => {
    setCooldown(RESEND_COOLDOWN);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const fullCode = digits.join('');

  const handleDigitChange = (idx: number, value: string) => {
    setError('');
    const cleaned = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[idx] = cleaned;
    setDigits(next);
    if (cleaned && idx < OTP_LENGTH - 1) {
      inputsRef.current[idx + 1]?.focus();
    }
    // Auto-submit when all filled
    if (cleaned && next.every(Boolean) && next.join('').length === OTP_LENGTH) {
      submitCode(next.join(''));
    }
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[idx] && idx > 0) {
        const next = [...digits];
        next[idx - 1] = '';
        setDigits(next);
        inputsRef.current[idx - 1]?.focus();
      } else {
        const next = [...digits];
        next[idx] = '';
        setDigits(next);
      }
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    } else if (e.key === 'ArrowRight' && idx < OTP_LENGTH - 1) {
      inputsRef.current[idx + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!text) return;
    const next = Array(OTP_LENGTH).fill('');
    text.split('').forEach((c, i) => { next[i] = c; });
    setDigits(next);
    inputsRef.current[Math.min(text.length, OTP_LENGTH - 1)]?.focus();
    if (text.length === OTP_LENGTH) submitCode(text);
  };

  const submitCode = async (code: string) => {
    if (isVerifying || !userId) return;
    setIsVerifying(true);
    setError('');
    try {
      const session = await apiClient.verifyOtp(userId, code);
      const userNeedsOnboarding = !session.user?.user_metadata?.onboarding_complete;
      const isPending =
        session.user?.user_metadata?.pending_student_verification === true &&
        session.user?.user_metadata?.student_verification_status !== 'approved';

      setIsPendingApproval(isPending);
      setSuccess(true);
      await completeLogin(session, true);

      // Route to onboarding if profile is incomplete, pending-approval for unapproved students, or dashboard.
      setTimeout(() => {
        if (userNeedsOnboarding) {
          navigate('/onboarding', { replace: true });
        } else if (isPending) {
          navigate('/pending-approval', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      }, 800);
    } catch (err: any) {
      setError(err?.message ?? 'Incorrect code. Please try again.');
      setDigits(Array(OTP_LENGTH).fill(''));
      inputsRef.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (isResending || cooldown > 0 || resendCount >= resendLimit) return;
    setIsResending(true);
    setError('');
    try {
      const result = await apiClient.resendOtp(userId);
      setResendCount(result.resendCount);
      setResendLimit(result.resendLimit);
      setDigits(Array(OTP_LENGTH).fill(''));
      inputsRef.current[0]?.focus();
      startCooldown();
    } catch (err: any) {
      setError(err?.message ?? 'Could not resend. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const canResend = !isResending && cooldown === 0 && resendCount < resendLimit;
  const resendsLeft = resendLimit - resendCount;

  if (!userId || !email) {
    return (
      <div className="min-h-screen bg-[#F7F4EF] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-[#6B7280]">Invalid verification link. Please register again.</p>
          <button onClick={() => navigate('/onboarding')} className="mt-4 text-[#1A6B3C] underline text-sm">
            Go to Registration
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F4EF] flex flex-col items-center justify-center px-4 py-12">
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#1A6B3C]/6 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-[#E8A838]/8 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md"
      >
        {/* Back link */}
        <button
          onClick={() => navigate('/login')}
          className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#1A6B3C] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </button>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-[#F0EDE8] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#1A6B3C] to-[#2d8a56] px-8 pt-8 pb-6">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
              {success ? (
                <CheckCircle2 className="w-7 h-7 text-white" />
              ) : (
                <Mail className="w-7 h-7 text-white" />
              )}
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Verify your email</h1>
            <p className="text-sm text-white/70 mt-1">
              We sent a 6-digit code to <span className="text-white font-medium">{email}</span>
            </p>
          </div>

          {/* Body */}
          <div className="px-8 py-7">
            <AnimatePresence mode="wait">
              {success ? (
                <div
                  key="success"
                  className="text-center py-4"
                >
                  <CheckCircle2 className="w-16 h-16 text-[#1A6B3C] mx-auto mb-3" />
                  <p className="text-lg font-bold text-[#1A6B3C]">Email verified!</p>
                  <p className="text-sm text-[#6B7280] mt-1">
                    {isPendingApproval
                      ? 'Redirecting to your approval status…'
                      : 'Redirecting to your dashboard…'}
                  </p>
                </div>
              ) : (
                <motion.div key="form">
                  <p className="text-sm text-[#6B7280] mb-6 leading-relaxed">
                    Enter the 6-digit verification code. The code expires in <strong className="text-[#111827]">10 minutes</strong>.
                  </p>

                  {/* OTP Input Boxes */}
                  <div className="flex gap-2.5 mb-6" onPaste={handlePaste}>
                    {digits.map((d, i) => (
                      <input
                        key={i}
                        ref={(el) => { inputsRef.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={d}
                        disabled={isVerifying}
                        onChange={(e) => handleDigitChange(i, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(i, e)}
                        className={[
                          'w-12 h-14 text-center text-xl font-bold rounded-xl border-2 outline-none transition-all',
                          'text-[#111827] bg-[#F7F4EF]',
                          d ? 'border-[#1A6B3C] bg-[#F0FDF4]' : 'border-[#E2DED7]',
                          'focus:border-[#1A6B3C] focus:bg-[#F0FDF4]',
                          isVerifying ? 'opacity-50 cursor-not-allowed' : '',
                          error ? 'border-red-400 bg-red-50' : '',
                        ].join(' ')}
                      />
                    ))}
                  </div>

                  {/* Error message */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 mb-5 text-sm text-red-700"
                      >
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Verify button */}
                  <button
                    onClick={() => submitCode(fullCode)}
                    disabled={fullCode.length < OTP_LENGTH || isVerifying}
                    className={[
                      'w-full h-12 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2',
                      fullCode.length === OTP_LENGTH && !isVerifying
                        ? 'bg-[#1A6B3C] text-white hover:bg-[#155a32] shadow-md shadow-[#1A6B3C]/20'
                        : 'bg-[#E2DED7] text-[#9CA3AF] cursor-not-allowed',
                    ].join(' ')}
                  >
                    {isVerifying ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Verifying…
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        Verify Email
                      </>
                    )}
                  </button>

                  {/* Resend section */}
                  <div className="mt-5 pt-5 border-t border-[#F0EDE8] text-center">
                    {resendCount >= resendLimit ? (
                      <p className="text-sm text-[#9CA3AF]">
                        Maximum resends reached. Please wait or{' '}
                        <a href="mailto:support@ally-jis.xyz" className="text-[#1A6B3C] underline">contact support</a>.
                      </p>
                    ) : (
                      <div>
                        <p className="text-xs text-[#9CA3AF] mb-2">
                          Didn't receive it? {resendsLeft} resend{resendsLeft !== 1 ? 's' : ''} remaining.
                        </p>
                        <button
                          onClick={handleResend}
                          disabled={!canResend}
                          className={[
                            'flex items-center gap-1.5 mx-auto text-sm font-medium transition-all',
                            canResend
                              ? 'text-[#1A6B3C] hover:text-[#155a32]'
                              : 'text-[#9CA3AF] cursor-not-allowed',
                          ].join(' ')}
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                          {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer hint */}
        <p className="text-center text-xs text-[#9CA3AF] mt-5">
          Check your spam folder if you don't see the email.
        </p>
      </motion.div>
    </div>
  );
}
