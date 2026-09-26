import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Shield,
  KeyRound,
  Eye,
  EyeOff,
  Mail,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient, isApiConfigured } from '@/api/client';
import { notify } from '@/components/ui/sonner';
import { validatePassword } from '@/lib/password';
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator';

type ResetStep = 'email' | 'otp' | 'new_password' | 'success';
const OTP_LENGTH = 6;

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState<ResetStep>('email');
  const [email, setEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startCooldown = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCooldown(60);
    timerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // ── Step 1: Send OTP ───────────────────────────────────────────────────────
  const handleRequestReset = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim()) {
      notify.error('Missing email', 'Please enter your email address.');
      return;
    }
    if (!isApiConfigured) {
      notify.warning('API not configured', 'Add VITE_API_BASE_URL to your .env file.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await apiClient.forgotPassword(email.trim().toLowerCase(), 'web');
      setStep('otp');
      setOtpDigits(Array(OTP_LENGTH).fill(''));
      startCooldown();
      notify.success('Code sent', `A 6-digit code has been sent to ${email.trim()}`);
      setTimeout(() => {
        inputsRef.current[0]?.focus();
      }, 300);
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.');
      notify.error('Request failed', err?.message || 'Could not send reset code.');
    } finally {
      setLoading(false);
    }
  };

  // ── Resend Code ────────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (loading || cooldown > 0 || !email.trim()) return;
    setLoading(true);
    setError('');
    try {
      await apiClient.forgotPassword(email.trim().toLowerCase(), 'web');
      setOtpDigits(Array(OTP_LENGTH).fill(''));
      startCooldown();
      notify.success('New code sent', `A fresh 6-digit code was sent to ${email.trim()}`);
      inputsRef.current[0]?.focus();
    } catch (err: any) {
      setError(err?.message || 'Could not resend code. Please try again.');
      notify.error('Resend failed', err?.message || 'Could not resend code.');
    } finally {
      setLoading(false);
    }
  };

  // ── OTP Handlers ───────────────────────────────────────────────────────────
  const handleDigitChange = (idx: number, val: string) => {
    setError('');
    const cleaned = val.replace(/\D/g, '');

    // Handle auto-paste of full code
    if (cleaned.length >= OTP_LENGTH) {
      const next = cleaned.slice(0, OTP_LENGTH).split('');
      setOtpDigits(next);
      inputsRef.current[OTP_LENGTH - 1]?.focus();
      submitOtpCode(next.join(''));
      return;
    }

    const single = cleaned.slice(-1);
    const next = [...otpDigits];
    next[idx] = single;
    setOtpDigits(next);

    // Auto-advance
    if (single && idx < OTP_LENGTH - 1) {
      inputsRef.current[idx + 1]?.focus();
    }

    // Auto-verify when all 6 filled
    if (single && next.every(Boolean) && next.join('').length === OTP_LENGTH) {
      submitOtpCode(next.join(''));
    }
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[idx] && idx > 0) {
        const next = [...otpDigits];
        next[idx - 1] = '';
        setOtpDigits(next);
        inputsRef.current[idx - 1]?.focus();
      } else {
        const next = [...otpDigits];
        next[idx] = '';
        setOtpDigits(next);
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
    text.split('').forEach((c, i) => {
      next[i] = c;
    });
    setOtpDigits(next);
    inputsRef.current[Math.min(text.length, OTP_LENGTH - 1)]?.focus();
    if (text.length === OTP_LENGTH) {
      submitOtpCode(text);
    }
  };

  // ── Step 2: Verify OTP ─────────────────────────────────────────────────────
  const submitOtpCode = async (codeToVerify: string) => {
    if (loading) return;
    const code = codeToVerify.trim();
    if (code.length !== OTP_LENGTH) {
      setError('Please enter the full 6-digit code.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await apiClient.verifyPasswordResetOtp(email.trim().toLowerCase(), code);
      setStep('new_password');
      notify.success('Code verified', 'Please set your new password.');
    } catch (err: any) {
      setError(err?.message || 'Incorrect verification code. Please check and try again.');
      setOtpDigits(Array(OTP_LENGTH).fill(''));
      inputsRef.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: Complete Password Reset ────────────────────────────────────────
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const pwError = validatePassword(newPassword);
    if (pwError) {
      setError(pwError);
      notify.error('Invalid password', pwError);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      notify.error('Mismatch', 'Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await apiClient.resetPassword({
        email: email.trim().toLowerCase(),
        code: otpDigits.join(''),
        password: newPassword,
      });

      setStep('success');
      notify.success('Password updated!', 'You can now sign in with your new password.');
    } catch (err: any) {
      setError(err?.message || 'Failed to update password. Please try again.');
      notify.error('Reset failed', err?.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F4EF] dark:bg-[#090D16] text-[#1A6B3C] dark:text-emerald-400 selection:bg-[#1A6B3C] selection:text-white flex flex-col justify-between overflow-x-hidden">
      {/* ── Top Header ── */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#F7F4EF]/85 dark:bg-[#090D16]/85 border-b border-[#1A6B3C]/10 dark:border-white/10 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <motion.div
              whileHover={{ scale: 1.08, rotate: -4 }}
              whileTap={{ scale: 0.94 }}
              className="w-11 h-11 rounded-full bg-[#1A6B3C] dark:bg-emerald-600 flex items-center justify-center text-white font-fraunces font-bold text-xl shadow-sm"
            >
              A
            </motion.div>
            <div className="flex flex-col">
              <span className="font-fraunces font-bold text-2xl tracking-tight text-[#1A6B3C] dark:text-white leading-none">
                Ally<span className="text-[#E8A838]">-jis</span>
              </span>
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#1A6B3C]/60 dark:text-gray-300 pt-0.5">
                CHMSU Alijis
              </span>
            </div>
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-[#1A6B3C] dark:text-white bg-white dark:bg-white/10 hover:bg-[#EDE7DB] dark:hover:bg-white/20 px-4 py-2.5 rounded-full transition-all shadow-xs border border-transparent dark:border-white/10"
          >
            <ArrowLeft size={14} /> Back to Sign In
          </Link>
        </div>
      </header>

      {/* ── Main Container ── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-12 sm:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Hero Column */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-6 space-y-8"
          >
            <div className="space-y-4">
              <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.25em] text-[#1A6B3C]/70 dark:text-emerald-400/70">
                <span className="w-2 h-2 rounded-full bg-[#E8A838]" />
                <span>Account Recovery</span>
              </div>
              <h1 className="font-fraunces text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight text-[#1A6B3C] dark:text-white leading-[0.95]">
                Recover <br />
                your student <br />
                <span className="italic font-normal text-[#E8A838]">access.</span>
              </h1>
            </div>
            <p className="font-jakarta text-base sm:text-lg text-gray-700 dark:text-gray-300 leading-relaxed max-w-lg">
              Enter your registered university email. We&apos;ll send a 6-digit verification code to quickly and securely reset your password.
            </p>
            <div className="space-y-3 pt-2 font-mono text-xs text-[#1A6B3C]/80 dark:text-emerald-400/80">
              <div className="flex items-center gap-2.5">
                <Shield size={15} className="text-[#E8A838]" />
                <span>Encrypted 6-digit verification code</span>
              </div>
              <div className="flex items-center gap-2.5">
                <KeyRound size={15} className="text-[#E8A838]" />
                <span>Instant in-app verification &amp; password update</span>
              </div>
            </div>
          </motion.div>

          {/* Right Form Card */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="lg:col-span-6"
          >
            <div className="bg-[#EDE7DB] dark:bg-[#111827] dark:border dark:border-white/10 p-8 sm:p-12 rounded-[36px] shadow-sm space-y-8">
              <div className="space-y-1.5 border-b border-[#1A6B3C]/15 dark:border-white/10 pb-6">
                <span className="font-mono text-[11px] uppercase tracking-widest text-[#1A6B3C]/70 dark:text-emerald-400/70">
                  {step === 'email' && 'Step 1 of 3 • Email'}
                  {step === 'otp' && 'Step 2 of 3 • Verification'}
                  {step === 'new_password' && 'Step 3 of 3 • New Password'}
                  {step === 'success' && 'Complete'}
                </span>
                <h2 className="font-fraunces text-3xl font-bold text-[#1A6B3C] dark:text-white">
                  {step === 'email' && 'Reset Password'}
                  {step === 'otp' && 'Check your email'}
                  {step === 'new_password' && 'Create New Password'}
                  {step === 'success' && 'Password Updated!'}
                </h2>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-jakarta p-4 rounded-2xl">
                  {error}
                </div>
              )}

              {/* ── STEP 1: Enter Email ── */}
              {step === 'email' && (
                <form onSubmit={handleRequestReset} className="space-y-6">
                  <div className="space-y-2">
                    <label className="font-jakarta font-bold text-xs uppercase tracking-wider text-[#1A6B3C] dark:text-emerald-400 block">
                      Registered Student Email
                    </label>
                    <input
                      type="email"
                      placeholder="yourname@chmsu.edu.ph"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError('');
                      }}
                      className="w-full px-5 py-4 rounded-full border-2 border-[#1A6B3C]/15 dark:border-white/10 focus:border-[#1A6B3C] dark:focus:border-emerald-400 bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder:text-gray-400 font-jakarta text-sm outline-none transition-all shadow-xs"
                      autoComplete="email"
                      required
                    />
                  </div>
                  <motion.button
                    type="submit"
                    disabled={loading || !email.trim()}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className={cn(
                      'w-full flex items-center justify-center gap-3 bg-[#1A6B3C] dark:bg-emerald-600 text-white font-mono text-xs uppercase tracking-wider font-bold py-4 rounded-full transition-all shadow-md',
                      loading || !email.trim()
                        ? 'opacity-70 cursor-not-allowed'
                        : 'hover:bg-[#13502D] dark:hover:bg-emerald-500'
                    )}
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Send Reset Code</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </motion.button>
                </form>
              )}

              {/* ── STEP 2: Enter OTP Code ── */}
              {step === 'otp' && (
                <div className="space-y-6">
                  <div className="space-y-2 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-[#1A6B3C]/10 dark:bg-emerald-500/20 flex items-center justify-center mx-auto text-[#1A6B3C] dark:text-emerald-400 mb-2">
                      <Mail size={28} />
                    </div>
                    <p className="font-jakarta text-xs text-gray-600 dark:text-gray-300">
                      We sent a 6-digit verification code to
                    </p>
                    <p className="font-jakarta font-bold text-sm text-[#1A6B3C] dark:text-emerald-400">
                      {email}
                    </p>
                  </div>

                  {/* 6 OTP Digit Boxes */}
                  <div className="flex justify-center gap-2.5 sm:gap-3" onPaste={handlePaste}>
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => {
                          inputsRef.current[idx] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleDigitChange(idx, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(idx, e)}
                        className={cn(
                          'w-11 h-14 sm:w-13 sm:h-16 text-center text-2xl font-bold font-mono rounded-2xl border-2 transition-all outline-none',
                          digit
                            ? 'border-[#1A6B3C] dark:border-emerald-400 bg-white dark:bg-emerald-950/20 text-[#1A6B3C] dark:text-emerald-400'
                            : 'border-[#1A6B3C]/15 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white',
                          'focus:border-[#1A6B3C] dark:focus:border-emerald-400 shadow-xs'
                        )}
                        autoComplete="one-time-code"
                      />
                    ))}
                  </div>

                  {/* Verify button */}
                  <motion.button
                    type="button"
                    onClick={() => submitOtpCode(otpDigits.join(''))}
                    disabled={loading || !otpDigits.every(Boolean)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className={cn(
                      'w-full flex items-center justify-center gap-3 bg-[#1A6B3C] dark:bg-emerald-600 text-white font-mono text-xs uppercase tracking-wider font-bold py-4 rounded-full transition-all shadow-md',
                      loading || !otpDigits.every(Boolean)
                        ? 'opacity-70 cursor-not-allowed'
                        : 'hover:bg-[#13502D] dark:hover:bg-emerald-500'
                    )}
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <span>Verify Code</span>
                    )}
                  </motion.button>

                  {/* Resend row under verify button */}
                  <div className="flex flex-col sm:flex-row items-center justify-between text-xs font-jakarta gap-2 pt-2 border-t border-[#1A6B3C]/10 dark:border-white/10">
                    <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                      <span>Didn&apos;t receive code?</span>
                      {cooldown > 0 ? (
                        <span className="font-bold text-gray-400">Resend in {cooldown}s</span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResend}
                          disabled={loading}
                          className="font-bold text-[#1A6B3C] dark:text-emerald-400 hover:underline cursor-pointer"
                        >
                          Resend
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setStep('email');
                        setError('');
                      }}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      ← Change email
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP 3: Set New Password ── */}
              {step === 'new_password' && (
                <form onSubmit={handleSavePassword} className="space-y-6">
                  <div className="space-y-2">
                    <label className="font-jakarta font-bold text-xs uppercase tracking-wider text-[#1A6B3C] dark:text-emerald-400 block">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="At least 8 characters"
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          setError('');
                        }}
                        className="w-full px-5 py-4 pr-12 rounded-full border-2 border-[#1A6B3C]/15 dark:border-white/10 focus:border-[#1A6B3C] dark:focus:border-emerald-400 bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder:text-gray-400 font-jakarta text-sm outline-none transition-all shadow-xs"
                        autoComplete="new-password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {newPassword && (
                      <div className="pt-2">
                        <PasswordStrengthIndicator password={newPassword} />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="font-jakarta font-bold text-xs uppercase tracking-wider text-[#1A6B3C] dark:text-emerald-400 block">
                      Confirm New Password
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Re-enter new password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setError('');
                      }}
                      className="w-full px-5 py-4 rounded-full border-2 border-[#1A6B3C]/15 dark:border-white/10 focus:border-[#1A6B3C] dark:focus:border-emerald-400 bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder:text-gray-400 font-jakarta text-sm outline-none transition-all shadow-xs"
                      autoComplete="new-password"
                      required
                    />
                  </div>

                  <motion.button
                    type="submit"
                    disabled={loading || !newPassword || !confirmPassword}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className={cn(
                      'w-full flex items-center justify-center gap-3 bg-[#1A6B3C] dark:bg-emerald-600 text-white font-mono text-xs uppercase tracking-wider font-bold py-4 rounded-full transition-all shadow-md',
                      loading || !newPassword || !confirmPassword
                        ? 'opacity-70 cursor-not-allowed'
                        : 'hover:bg-[#13502D] dark:hover:bg-emerald-500'
                    )}
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Save New Password</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </motion.button>
                </form>
              )}

              {/* ── STEP 4: Success ── */}
              {step === 'success' && (
                <div className="text-center py-4 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-[#1A6B3C]/10 dark:bg-emerald-500/20 flex items-center justify-center mx-auto text-[#1A6B3C] dark:text-emerald-400">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="font-fraunces font-bold text-2xl text-[#1A6B3C] dark:text-white">
                    Password Reset Complete
                  </h3>
                  <p className="font-jakarta text-sm text-gray-700 dark:text-gray-300 leading-relaxed max-w-sm mx-auto">
                    Your password has been successfully updated. You can now sign in with your new credentials.
                  </p>
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider font-bold text-[#1A6B3C] dark:text-emerald-400 bg-white dark:bg-white/10 px-6 py-3 rounded-full hover:bg-[#F7F4EF] dark:hover:bg-white/20 transition-all shadow-xs"
                  >
                    Return to Sign In →
                  </Link>
                </div>
              )}

              {step !== 'success' && (
                <div className="pt-6 border-t border-[#1A6B3C]/15 dark:border-white/10 flex items-center justify-between text-xs font-jakarta">
                  <span className="text-gray-700 dark:text-gray-400">Remembered credentials?</span>
                  <Link
                    to="/login"
                    className="font-mono text-xs uppercase tracking-wider font-bold text-[#1A6B3C] dark:text-emerald-400 hover:underline"
                  >
                    Return to Sign In
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="py-6 px-4 text-center font-mono text-[11px] text-[#1A6B3C]/60 dark:text-gray-400 border-t border-[#1A6B3C]/10 dark:border-white/10">
        Carlos Hilado Memorial State University – Alijis Campus • Ally-jis v1.0
      </footer>
    </div>
  );
}
