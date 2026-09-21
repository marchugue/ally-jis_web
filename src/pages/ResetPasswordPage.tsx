import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, Eye, EyeOff, KeyRound, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient, isApiConfigured } from '@/api/client';
import { notify } from '@/components/ui/sonner';
import { validatePassword } from '@/lib/password';
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [resetToken, setResetToken] = useState<string | null>(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    const fromQuery = searchParams.get('token');
    if (fromQuery) {
      setResetToken(fromQuery);
      return;
    }

    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
      notify.error(
        'Outdated reset link',
        'Please request a new password reset email — we now use a secure link format.'
      );
    }
  }, [searchParams]);

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const pwError = validatePassword(password);
    if (pwError) {
      notify.error('Invalid password', pwError);
      return;
    }
    if (password !== confirmPassword) {
      notify.error('Passwords do not match', 'Make sure both password fields are identical.');
      return;
    }
    if (!resetToken) {
      notify.error('Invalid link', 'Reset link is invalid or has expired. Please request a new one.');
      return;
    }
    if (!isApiConfigured) {
      notify.warning('API not configured', 'Add VITE_API_BASE_URL to your .env file.');
      return;
    }

    setFormLoading(true);
    try {
      const result = await apiClient.resetPassword(resetToken, password);
      if (result.source === 'mobile' && result.mobileRedirectUrl) {
        window.location.href = result.mobileRedirectUrl;
        return;
      }
      navigate('/password-reset-success', { replace: true });
    } catch (err: any) {
      notify.error('Reset failed', err.message || 'Failed to update password.');
    } finally {
      setFormLoading(false);
    }
  };

  if (!resetToken) {
    return (
      <div className="min-h-screen bg-[#F7F4EF] dark:bg-[#090D16] flex flex-col items-center justify-center px-6 text-center">
        <h1 className="font-fraunces text-3xl font-bold text-[#1A6B3C] dark:text-white mb-3">Invalid or expired link</h1>
        <p className="font-jakarta text-sm text-gray-600 dark:text-gray-300 mb-8 max-w-md">
          This password reset link is missing or no longer valid. Request a new one from the forgot password page.
        </p>
        <Link
          to="/forgot-password"
          className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider font-bold text-white bg-[#1A6B3C] px-8 py-4 rounded-full"
        >
          Request new link <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F4EF] dark:bg-[#090D16] text-[#1A6B3C] dark:text-emerald-400 flex flex-col justify-between overflow-x-hidden">
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#F7F4EF]/85 dark:bg-[#090D16]/85 border-b border-[#1A6B3C]/10 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-[#1A6B3C] dark:bg-emerald-600 flex items-center justify-center text-white font-fraunces font-bold text-xl">
              A
            </div>
            <span className="font-fraunces font-bold text-2xl text-[#1A6B3C] dark:text-white">
              Ally<span className="text-[#E8A838]">-jis</span>
            </span>
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-[#1A6B3C] dark:text-white bg-white dark:bg-white/10 px-4 py-2.5 rounded-full"
          >
            <ArrowLeft size={14} /> Back to Sign In
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-12 sm:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-6 space-y-6"
          >
            <h1 className="font-fraunces text-5xl sm:text-7xl font-bold text-[#1A6B3C] dark:text-white leading-tight">
              Set a new <span className="italic text-[#E8A838]">password.</span>
            </h1>
            <p className="font-jakarta text-gray-700 dark:text-gray-300 max-w-lg">
              Choose a strong password using the same rules as registration. Your email is confirmed when you complete this step.
            </p>
            <div className="flex items-center gap-2.5 font-mono text-xs text-[#1A6B3C]/80">
              <Shield size={15} className="text-[#E8A838]" />
              <span>Single-use secure reset token</span>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-6">
            <div className="bg-[#EDE7DB] dark:bg-[#111827] p-8 sm:p-12 rounded-[36px] shadow-sm space-y-8 dark:border dark:border-white/10">
              <div className="space-y-1.5 border-b border-[#1A6B3C]/15 dark:border-white/10 pb-6">
                <span className="font-mono text-[11px] uppercase tracking-widest text-[#1A6B3C]/70">Secure update</span>
                <h2 className="font-fraunces text-3xl font-bold text-[#1A6B3C] dark:text-white flex items-center gap-2">
                  <KeyRound size={28} /> New password
                </h2>
              </div>

              <form onSubmit={handleSetNewPassword} className="space-y-6">
                <div className="space-y-2">
                  <label className="font-jakarta font-bold text-xs uppercase tracking-wider text-[#1A6B3C] dark:text-emerald-400 block">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-5 py-4 pr-12 rounded-full border-2 border-[#1A6B3C]/15 dark:border-white/10 focus:border-[#1A6B3C] bg-white dark:bg-white/5 text-gray-900 dark:text-white font-jakarta text-sm outline-none"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <PasswordStrengthIndicator password={password} />
                </div>

                <div className="space-y-2">
                  <label className="font-jakarta font-bold text-xs uppercase tracking-wider text-[#1A6B3C] dark:text-emerald-400 block">
                    Confirm New Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-5 py-4 rounded-full border-2 border-[#1A6B3C]/15 dark:border-white/10 focus:border-[#1A6B3C] bg-white dark:bg-white/5 text-gray-900 dark:text-white font-jakarta text-sm outline-none"
                    autoComplete="new-password"
                  />
                </div>

                <motion.button
                  type="submit"
                  disabled={formLoading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className={cn(
                    'w-full flex items-center justify-center gap-3 bg-[#1A6B3C] text-white font-mono text-xs uppercase tracking-wider font-bold py-4 rounded-full shadow-md',
                    formLoading && 'opacity-70 cursor-not-allowed'
                  )}
                >
                  {formLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Update Password</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </motion.button>
              </form>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
