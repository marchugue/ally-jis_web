import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Eye, EyeOff, ArrowLeft, Shield, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient, isApiConfigured } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { notify } from '@/components/ui/sonner';

export default function LoginPage() {
  const { user, loading, setMockUser, completeLogin, needsOnboarding, isPendingApproval } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [showDemoOption, setShowDemoOption] = useState(false);

  // Login page is strictly light-mode only — ensure dark class is removed on mount
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark');
    root.style.colorScheme = 'light';
  }, []);

  useEffect(() => {
    if (!loading && user) {
      if (needsOnboarding) {
        navigate('/onboarding', { replace: true });
      } else if (isPendingApproval) {
        navigate('/pending-approval', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, loading, needsOnboarding, isPendingApproval, navigate]);

  const handleDemoLogin = () => {
    setMockUser({
      id: 'mock-user-id',
      email: 'demo@chmsu.edu.ph',
      user_metadata: { full_name: 'Demo Student' },
      app_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    });
    navigate('/dashboard');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      notify.error('Missing fields', 'Please fill in your email and password.');
      return;
    }
    if (!isApiConfigured) {
      notify.warning('API not configured', 'Add VITE_API_BASE_URL to your .env file.');
      setShowDemoOption(true);
      return;
    }
    setFormLoading(true);
    setShowDemoOption(false);
    try {
      const session = await apiClient.login(form.email, form.password);
      completeLogin(session, true);
      notify.success('Signed in successfully', 'Welcome back!');
      setFormLoading(false);

      const userNeedsOnboarding = !session.user?.user_metadata?.onboarding_complete;
      const isPending =
        session.user?.user_metadata?.pending_student_verification === true &&
        session.user?.user_metadata?.student_verification_status !== 'approved';

      if (userNeedsOnboarding) {
        notify.info('Profile Setup Required', 'Please complete your student profile to proceed.');
        navigate('/onboarding', { replace: true });
      } else if (isPending) {
        navigate('/pending-approval', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }

    } catch (err: any) {
      console.error('Login error:', err);

      if (err.status === 403 && err.body?.requiresOtp) {
        const { userId, email } = err.body;
        navigate(`/verify-email?userId=${encodeURIComponent(userId)}&email=${encodeURIComponent(email ?? form.email)}`);
      } else if (err.status === 403) {
        notify.warning('Email not verified', 'Please verify your email to continue.');
      } else if (err.status === 0) {
        notify.error('Cannot reach server', 'The backend is unreachable. Check your connection.');
        setShowDemoOption(true);
      } else {
        notify.error('Login failed', err.message || 'Invalid email or password.');
      }
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F4EF] dark:bg-[#090D16] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#1A6B3C]/20 border-t-[#1A6B3C] dark:border-emerald-500/20 dark:border-t-emerald-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F4EF] dark:bg-[#090D16] text-[#1A6B3C] dark:text-emerald-400 selection:bg-[#1A6B3C] selection:text-white flex flex-col justify-between overflow-x-hidden">

      {/* ── TOP NAVIGATION ── */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#F7F4EF]/85 dark:bg-[#090D16]/85 border-b border-[#1A6B3C]/10 dark:border-white/10 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <motion.div
              whileHover={{ scale: 1.08, rotate: -4 }}
              whileTap={{ scale: 0.94 }}
              className="w-11 h-11 rounded-full bg-[#1A6B3C] dark:bg-emerald-600 flex items-center justify-center text-white font-fraunces font-bold text-xl shadow-sm transition-transform"
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

          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-[#1A6B3C] dark:text-white bg-white dark:bg-white/10 hover:bg-[#EDE7DB] dark:hover:bg-white/20 px-4 py-2.5 rounded-full transition-all shadow-xs border border-transparent dark:border-white/10"
            >
              <ArrowLeft size={14} /> Back to Home
            </Link>
          </motion.div>
        </div>
      </header>

      {/* ── MAIN CONTENT (EDITORIAL SPLIT / HIGH LEGIBILITY AUTH) ── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-6 sm:py-12 lg:py-20 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">

          {/* Left Column: Magazine Narrative & Brand Statement (Hidden on mobile for clean, uncluttered card view) */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="hidden lg:block lg:col-span-6 space-y-8"
          >
            <div className="space-y-4">
              <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.25em] text-[#1A6B3C]/70 dark:text-emerald-400/70">
                <span className="w-2 h-2 rounded-full bg-[#E8A838]" />
                <span>Student Secure Access</span>
              </div>

              <h1 className="font-fraunces text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight text-[#1A6B3C] dark:text-white leading-[0.95]">
                Welcome <br />
                back to <br />
                <span className="italic font-normal text-[#E8A838]">Alijis.</span>
              </h1>
            </div>

            <p className="font-jakarta text-base sm:text-lg text-gray-700 dark:text-gray-300 leading-relaxed max-w-lg">
              Sign in to access your student network, check real-time campus match affinity, and chat securely with peers.
            </p>

            <div className="space-y-3 pt-2 font-mono text-xs text-[#1A6B3C]/80 dark:text-emerald-400/80">
              <div className="flex items-center gap-2.5">
                <Shield size={15} className="text-[#E8A838]" />
                <span>Protected with end-to-end encrypted session tokens</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Sparkles size={15} className="text-[#E8A838]" />
                <span>Exclusive to Carlos Hilado Memorial State University</span>
              </div>
            </div>
          </motion.div>

          {/* Right Column: High-Legibility, High-Contrast Form Workspace */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md mx-auto lg:max-w-none lg:col-span-6"
          >
            <div className="bg-[#EDE7DB] dark:bg-[#111827] dark:border dark:border-white/10 p-6 sm:p-12 rounded-3xl sm:rounded-[36px] shadow-sm space-y-6 sm:space-y-8 border-none">

              <div className="space-y-1.5 border-b border-[#1A6B3C]/15 dark:border-white/10 pb-6">
                <span className="font-mono text-[11px] uppercase tracking-widest text-[#1A6B3C]/70 dark:text-emerald-400/70">
                  Authentication
                </span>
                <h2 className="font-fraunces text-3xl font-bold text-[#1A6B3C] dark:text-white">
                  Sign In with Credentials
                </h2>
              </div>

              {!isApiConfigured && (
                <div className="bg-amber-100/80 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 text-xs font-jakarta p-4 rounded-2xl">
                  API is currently in local development mode. Add VITE_API_BASE_URL in your .env file or use demo mode.
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-6">
                {/* Email Field with high-contrast label */}
                <div className="space-y-2">
                  <label className="font-jakarta font-bold text-xs uppercase tracking-wider text-[#1A6B3C] dark:text-emerald-400 block">
                    Campus Email or Username
                  </label>
                  <input
                    type="email"
                    placeholder="yourname@chmsu.edu.ph"
                    value={form.email}
                    onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-5 py-4 rounded-full border-2 border-[#1A6B3C]/15 dark:border-white/10 focus:border-[#1A6B3C] dark:focus:border-emerald-400 bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 font-jakarta text-sm outline-none transition-all shadow-xs"
                    autoComplete="email"
                  />
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-jakarta font-bold text-xs uppercase tracking-wider text-[#1A6B3C] dark:text-emerald-400">
                      Password
                    </label>
                    <Link
                      to="/forgot-password"
                      className="font-jakarta text-xs font-bold text-[#1A6B3C] dark:text-emerald-400 hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your account password"
                      value={form.password}
                      onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full px-5 py-4 pr-12 rounded-full border-2 border-[#1A6B3C]/15 dark:border-white/10 focus:border-[#1A6B3C] dark:focus:border-emerald-400 bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 font-jakarta text-sm outline-none transition-all shadow-xs"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#1A6B3C] dark:hover:text-emerald-400 transition-colors p-1"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Submit Pill Button */}
                <motion.button
                  type="submit"
                  disabled={formLoading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className={cn(
                    'w-full flex items-center justify-center gap-3 bg-[#1A6B3C] dark:bg-emerald-600 text-white font-mono text-xs uppercase tracking-wider font-bold py-4 rounded-full transition-all shadow-md',
                    formLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#13502D] dark:hover:bg-emerald-500'
                  )}
                >
                  {formLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Login</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </motion.button>

                {showDemoOption && (
                  <button
                    type="button"
                    onClick={handleDemoLogin}
                    className="w-full flex items-center justify-center gap-2 bg-[#E8A838] text-[#13502D] font-mono text-xs uppercase tracking-wider font-bold py-4 rounded-full hover:bg-[#d4952e] transition-all shadow-sm"
                  >
                    Enter Demo Mode (Skip Auth)
                  </button>
                )}
              </form>

              {/* Registration Prompt */}
              <div className="pt-6 border-t border-[#1A6B3C]/15 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-jakarta">
                <span className="text-gray-700 dark:text-gray-400">Don't have an account yet?</span>
                <Link
                  to="/register"
                  className="font-mono text-xs uppercase tracking-wider font-bold text-[#1A6B3C] dark:text-emerald-400 bg-white dark:bg-white/10 hover:bg-[#F7F4EF] dark:hover:bg-white/20 px-5 py-2.5 rounded-full transition-all shadow-xs"
                >
                  Join Circle Now →
                </Link>
              </div>

            </div>
          </motion.div>

        </div>
      </main>

      {/* ── FOOTER SIMPLE STRIP ── */}
      <footer className="py-6 px-4 text-center font-mono text-[11px] text-[#1A6B3C]/60 dark:text-gray-400 border-t border-[#1A6B3C]/10 dark:border-white/10">
        Carlos Hilado Memorial State University – Alijis Campus • Ally-jis v1.0
      </footer>

    </div>
  );
}