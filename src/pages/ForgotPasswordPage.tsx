import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, Eye, EyeOff, CheckCircle2, Shield, KeyRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient, isApiConfigured } from '@/api/client';
import { notify } from '@/components/ui/sonner';

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
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
      const params = new URLSearchParams(hash.slice(1));
      const token = params.get('access_token');
      const type = params.get('type');

      if (token && type === 'recovery') {
        setRecoveryToken(token);
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
    setCheckingHash(false);
  }, []);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      notify.error('Missing email', 'Please enter your email address.');
      return;
    }
    if (!isApiConfigured) {
      notify.warning('API not configured', 'Add VITE_API_BASE_URL to your .env file.');
      return;
    }
    setFormLoading(true);
    try {
      await apiClient.forgotPassword(email);
      setRequestSent(true);
    } catch (err: any) {
      console.error('Forgot password error:', err);
      notify.error('Request failed', err.message || 'Something went wrong. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      notify.error('Missing fields', 'Please fill in all fields.');
      return;
    }
    if (password.length < 8) {
      notify.error('Password too short', 'Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      notify.error('Passwords do not match', 'Make sure both password fields are identical.');
      return;
    }
    if (!recoveryToken) {
      notify.error('Invalid link', 'Reset link is invalid or has expired. Please request a new one.');
      return;
    }
    setFormLoading(true);
    try {
      await apiClient.resetPassword(recoveryToken, password);
      setResetSuccess(true);
    } catch (err: any) {
      console.error('Reset password error:', err);
      notify.error('Reset failed', err.message || 'Failed to update password.');
    } finally {
      setFormLoading(false);
    }
  };

  const mode = recoveryToken ? 'reset' : 'request';

  if (checkingHash) {
    return (
      <div className="min-h-screen bg-[#F7F4EF] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#1A6B3C]/20 border-t-[#1A6B3C] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F4EF] text-[#1A6B3C] selection:bg-[#1A6B3C] selection:text-white flex flex-col justify-between overflow-x-hidden">
      
      {/* ── TOP NAVIGATION ── */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#F7F4EF]/85 border-b border-[#1A6B3C]/10 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <motion.div 
              whileHover={{ scale: 1.08, rotate: -4 }}
              whileTap={{ scale: 0.94 }}
              className="w-11 h-11 rounded-full bg-[#1A6B3C] flex items-center justify-center text-white font-fraunces font-bold text-xl shadow-sm transition-transform"
            >
              A
            </motion.div>
            <div className="flex flex-col">
              <span className="font-fraunces font-bold text-2xl tracking-tight text-[#1A6B3C] leading-none">
                Ally<span className="text-[#E8A838]">-jis</span>
              </span>
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#1A6B3C]/60 pt-0.5">
                CHMSU Alijis
              </span>
            </div>
          </Link>

          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
            <Link 
              to="/login" 
              className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-[#1A6B3C] bg-white px-4 py-2.5 rounded-full hover:bg-[#1A6B3C] hover:text-white transition-all shadow-xs"
            >
              <ArrowLeft size={14} /> Back to Sign In
            </Link>
          </motion.div>
        </div>
      </header>

      {/* ── MAIN EDITORIAL LAYOUT ── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-12 sm:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Narrative */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-6 space-y-8"
          >
            <div className="space-y-4">
              <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.25em] text-[#1A6B3C]/70">
                <span className="w-2 h-2 rounded-full bg-[#E8A838]" />
                <span>Account Recovery</span>
              </div>
              
              <h1 className="font-fraunces text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight text-[#1A6B3C] leading-[0.95]">
                {mode === 'reset' ? (
                  <>
                    Set a new <br />
                    account <br />
                    <span className="italic font-normal text-[#E8A838]">password.</span>
                  </>
                ) : (
                  <>
                    Recover <br />
                    your student <br />
                    <span className="italic font-normal text-[#E8A838]">access.</span>
                  </>
                )}
              </h1>
            </div>

            <p className="font-jakarta text-base sm:text-lg text-gray-700 leading-relaxed max-w-lg">
              {mode === 'reset'
                ? 'Create a strong, new password with at least 8 characters to secure your Ally-jis profile.'
                : 'Enter your registered university email to receive a secure password reset link.'}
            </p>

            <div className="space-y-3 pt-2 font-mono text-xs text-[#1A6B3C]/80">
              <div className="flex items-center gap-2.5">
                <Shield size={15} className="text-[#E8A838]" />
                <span>Encrypted single-use recovery token protocol</span>
              </div>
              <div className="flex items-center gap-2.5">
                <KeyRound size={15} className="text-[#E8A838]" />
                <span>Instant verification for CHMSU student accounts</span>
              </div>
            </div>
          </motion.div>

          {/* Right Column: High-Legibility Form */}
          <motion.div 
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-6"
          >
            <div className="bg-[#EDE7DB] p-8 sm:p-12 rounded-[36px] shadow-sm space-y-8 border-none">
              
              <div className="space-y-1.5 border-b border-[#1A6B3C]/15 pb-6">
                <span className="font-mono text-[11px] uppercase tracking-widest text-[#1A6B3C]/70">
                  Credentials Assistance
                </span>
                <h2 className="font-fraunces text-3xl font-bold text-[#1A6B3C]">
                  {mode === 'reset' ? 'Create New Password' : 'Send Recovery Email'}
                </h2>
              </div>

              {!isApiConfigured && (
                <div className="bg-amber-100/80 border border-amber-300 text-amber-900 text-xs font-jakarta p-4 rounded-2xl">
                  API is currently in local development mode. Add VITE_API_BASE_URL in your .env file.
                </div>
              )}

              {/* MODE: Request Reset Email */}
              {mode === 'request' && !requestSent && (
                <form onSubmit={handleRequestReset} className="space-y-6">
                  <div className="space-y-2">
                    <label className="font-jakarta font-bold text-xs uppercase tracking-wider text-[#1A6B3C] block">
                      Registered Student Email
                    </label>
                    <input
                      type="email"
                      placeholder="yourname@chmsu.edu.ph"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full px-5 py-4 rounded-full border-2 border-[#1A6B3C]/15 focus:border-[#1A6B3C] bg-white text-gray-900 placeholder:text-gray-400 font-jakarta text-sm outline-none transition-all shadow-xs"
                      autoComplete="email"
                    />
                  </div>

                  <motion.button
                    type="submit"
                    disabled={formLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className={cn(
                      'w-full flex items-center justify-center gap-3 bg-[#1A6B3C] text-white font-mono text-xs uppercase tracking-wider font-bold py-4 rounded-full transition-all shadow-md',
                      formLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#13502D]'
                    )}
                  >
                    {formLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Send Recovery Link</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </motion.button>
                </form>
              )}

              {/* MODE: Request Sent Confirmation */}
              {mode === 'request' && requestSent && (
                <div className="text-center py-4 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-[#1A6B3C]/10 flex items-center justify-center mx-auto text-[#1A6B3C]">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="font-fraunces font-bold text-2xl text-[#1A6B3C]">Recovery Email Dispatched</h3>
                  <p className="font-jakarta text-sm text-gray-700 leading-relaxed max-w-sm mx-auto">
                    If an account is associated with <span className="font-bold text-[#1A6B3C]">{email}</span>, a secure recovery link has been delivered to your inbox.
                  </p>
                  <div className="pt-2">
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider font-bold text-[#1A6B3C] bg-white px-6 py-3 rounded-full hover:bg-[#F7F4EF] transition-all shadow-xs"
                    >
                      Return to Sign In →
                    </Link>
                  </div>
                </div>
              )}

              {/* MODE: Set New Password */}
              {mode === 'reset' && !resetSuccess && (
                <form onSubmit={handleSetNewPassword} className="space-y-6">
                  <div className="space-y-2">
                    <label className="font-jakarta font-bold text-xs uppercase tracking-wider text-[#1A6B3C] block">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="At least 8 characters"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full px-5 py-4 pr-12 rounded-full border-2 border-[#1A6B3C]/15 focus:border-[#1A6B3C] bg-white text-gray-900 placeholder:text-gray-400 font-jakarta text-sm outline-none transition-all shadow-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#1A6B3C]"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="font-jakarta font-bold text-xs uppercase tracking-wider text-[#1A6B3C] block">
                      Confirm New Password
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Re-enter your new password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="w-full px-5 py-4 rounded-full border-2 border-[#1A6B3C]/15 focus:border-[#1A6B3C] bg-white text-gray-900 placeholder:text-gray-400 font-jakarta text-sm outline-none transition-all shadow-xs"
                    />
                  </div>

                  <motion.button
                    type="submit"
                    disabled={formLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className={cn(
                      'w-full flex items-center justify-center gap-3 bg-[#1A6B3C] text-white font-mono text-xs uppercase tracking-wider font-bold py-4 rounded-full transition-all shadow-md',
                      formLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#13502D]'
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
              )}

              {/* MODE: Reset Success */}
              {mode === 'reset' && resetSuccess && (
                <div className="text-center py-4 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-[#1A6B3C]/10 flex items-center justify-center mx-auto text-[#1A6B3C]">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="font-fraunces font-bold text-2xl text-[#1A6B3C]">Password Successfully Updated</h3>
                  <p className="font-jakarta text-sm text-gray-700 leading-relaxed max-w-sm mx-auto">
                    Your password has been changed. You can now sign in with your new credentials.
                  </p>
                  <div className="pt-2">
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider font-bold text-white bg-[#1A6B3C] px-8 py-4 rounded-full hover:bg-[#13502D] transition-all shadow-md"
                    >
                      Sign In Now →
                    </Link>
                  </div>
                </div>
              )}

              <div className="pt-6 border-t border-[#1A6B3C]/15 flex items-center justify-between text-xs font-jakarta">
                <span className="text-gray-700">Remembered credentials?</span>
                <Link to="/login" className="font-mono text-xs uppercase tracking-wider font-bold text-[#1A6B3C] hover:underline">
                  Return to Sign In
                </Link>
              </div>

            </div>
          </motion.div>

        </div>
      </main>

      {/* ── FOOTER SIMPLE STRIP ── */}
      <footer className="py-6 px-4 text-center font-mono text-[11px] text-[#1A6B3C]/60 border-t border-[#1A6B3C]/10">
        Carlos Hilado Memorial State University – Alijis Campus • Ally-jis v1.0
      </footer>

    </div>
  );
}