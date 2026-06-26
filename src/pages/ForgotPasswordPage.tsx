import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient, isApiConfigured } from '@/api/client';

/**
 * Combined Forgot / Reset Password page.
 *
 * - Default mode: user enters their email, we call apiClient.forgotPassword.
 * - Reset mode: triggered when Supabase redirects back here with a recovery
 *   token in the URL *hash* (e.g. #access_token=...&type=recovery). Hash
 *   fragments never reach the server, so we parse window.location.hash on
 *   mount rather than using useSearchParams (which only sees query params).
 */
export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [recoveryToken, setRecoveryToken] = useState<string | null>(null);
  const [checkingHash, setCheckingHash] = useState(true);

  // ── Request-reset-email form state ──────────────────────────────────────
  const [email, setEmail] = useState('');
  const [requestSent, setRequestSent] = useState(false);

  // ── Set-new-password form state ─────────────────────────────────────────
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // ── Shared state ─────────────────────────────────────────────────────────
  const [error, setError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
      const params = new URLSearchParams(hash.slice(1)); // drop leading '#'
      const token = params.get('access_token');
      const type = params.get('type');

      if (token && type === 'recovery') {
        setRecoveryToken(token);
        // Clean the sensitive token out of the visible URL/history once captured.
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
    setCheckingHash(false);
  }, []);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    if (!isApiConfigured) {
      setError('API is not configured. Add VITE_API_BASE_URL to your .env file.');
      return;
    }
    setFormLoading(true);
    setError('');
    try {
      await apiClient.forgotPassword(email);
      setRequestSent(true);
    } catch (err: any) {
      console.error('Forgot password error:', err);
      // Intentionally generic: backend always resolves successfully to avoid
      // leaking which emails are registered, but network/config errors still
      // deserve a message.
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!recoveryToken) {
      setError('Reset link is invalid or has expired. Please request a new one.');
      return;
    }
    setFormLoading(true);
    setError('');
    try {
      await apiClient.resetPassword(recoveryToken, password);
      setResetSuccess(true);
    } catch (err: any) {
      console.error('Reset password error:', err);
      setError(err.message || 'Reset link is invalid or has expired. Please request a new one.');
    } finally {
      setFormLoading(false);
    }
  };

  if (checkingHash) {
    return (
      <div className="min-h-screen bg-[#F7F4EF] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#1A6B3C]/20 border-t-[#1A6B3C] rounded-full animate-spin" />
      </div>
    );
  }

  const mode: 'request' | 'reset' = recoveryToken ? 'reset' : 'request';

  return (
    <div className="min-h-[100dvh] bg-[#F7F4EF] flex flex-col items-center justify-center px-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-[#1A6B3C]/5 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] rounded-full bg-[#E8A838]/8 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-[#1A6B3C] flex items-center justify-center shadow-lg">
              <span className="text-white font-fraunces font-bold text-xl">A</span>
            </div>
            <span className="font-fraunces font-semibold text-2xl text-[#1A6B3C]">
              lly<span className="text-[#E8A838]">-jis</span>
            </span>
          </Link>
          <h1 className="font-fraunces text-3xl font-bold text-[#1A6B3C] mt-4 mb-1">
            {mode === 'reset' ? 'Set a new password' : 'Forgot your password?'}
          </h1>
          <p className="font-jakarta text-[#1A6B3C]/60 text-sm">
            {mode === 'reset'
              ? 'Choose a new password for your account'
              : "No worries, we'll send you a reset link"}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-[#1A6B3C]/8 p-8">
          {!isApiConfigured && (
            <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-jakarta px-4 py-3 rounded-xl">
              API is not configured. Add VITE_API_BASE_URL in a local .env file.
            </div>
          )}

          {/* ── MODE: request reset email ───────────────────────────────── */}
          {mode === 'request' && !requestSent && (
            <form onSubmit={handleRequestReset} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm font-jakarta px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              <div>
                <label className="font-jakarta font-semibold text-sm text-gray-700 block mb-1.5">Email</label>
                <input
                  type="email"
                  placeholder="your@chmsu.edu.ph"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A6B3C] bg-gray-50 focus:bg-white font-jakarta text-sm outline-none transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={formLoading}
                className={cn(
                  'w-full flex items-center justify-center gap-2 bg-[#1A6B3C] text-white font-jakarta font-bold py-3.5 rounded-xl transition-all shadow-lg',
                  formLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#155a33] active:scale-[0.98]'
                )}
              >
                {formLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Send Reset Link <ArrowRight size={18} /></>
                )}
              </button>
            </form>
          )}

          {/* ── MODE: request sent confirmation ─────────────────────────── */}
          {mode === 'request' && requestSent && (
            <div className="text-center py-2">
              <div className="w-14 h-14 rounded-full bg-[#1A6B3C]/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="text-[#1A6B3C]" size={28} />
              </div>
              <h2 className="font-fraunces font-bold text-lg text-[#1A6B3C] mb-1.5">Check your email</h2>
              <p className="font-jakarta text-sm text-gray-500">
                If an account exists for <span className="font-semibold text-gray-700">{email}</span>, we've sent a
                link to reset your password.
              </p>
            </div>
          )}

          {/* ── MODE: set new password ───────────────────────────────────── */}
          {mode === 'reset' && !resetSuccess && (
            <form onSubmit={handleSetNewPassword} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm font-jakarta px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              <div>
                <label className="font-jakarta font-semibold text-sm text-gray-700 block mb-1.5">
                  New password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 focus:border-[#1A6B3C] bg-gray-50 focus:bg-white font-jakarta text-sm outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="font-jakarta font-semibold text-sm text-gray-700 block mb-1.5">
                  Confirm new password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Re-enter your new password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A6B3C] bg-gray-50 focus:bg-white font-jakarta text-sm outline-none transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={formLoading}
                className={cn(
                  'w-full flex items-center justify-center gap-2 bg-[#1A6B3C] text-white font-jakarta font-bold py-3.5 rounded-xl transition-all shadow-lg',
                  formLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#155a33] active:scale-[0.98]'
                )}
              >
                {formLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Reset Password <ArrowRight size={18} /></>
                )}
              </button>
            </form>
          )}

          {/* ── MODE: reset success ─────────────────────────────────────── */}
          {mode === 'reset' && resetSuccess && (
            <div className="text-center py-2">
              <div className="w-14 h-14 rounded-full bg-[#1A6B3C]/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="text-[#1A6B3C]" size={28} />
              </div>
              <h2 className="font-fraunces font-bold text-lg text-[#1A6B3C] mb-1.5">Password updated</h2>
              <p className="font-jakarta text-sm text-gray-500 mb-5">
                Your password has been reset. You can now sign in with your new password.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="w-full flex items-center justify-center gap-2 bg-[#1A6B3C] text-white font-jakarta font-bold py-3.5 rounded-xl hover:bg-[#155a33] active:scale-[0.98] transition-all shadow-lg"
              >
                Go to Sign In <ArrowRight size={18} />
              </button>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="font-jakarta text-sm text-gray-500">
              Remembered your password?{' '}
              <Link to="/login" className="text-[#1A6B3C] font-semibold hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center font-jakarta text-xs text-[#1A6B3C]/40 mt-6">
          For CHMSU Alijis Campus students only
        </p>
      </div>
    </div>
  );
}