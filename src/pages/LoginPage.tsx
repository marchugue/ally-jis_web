import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient, isApiConfigured } from '@/api/client';
import type { AdminRole } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { notify } from '@/components/ui/sonner';
import { RoleSelectionModal } from '@/components/RoleSelectionModal';

export default function LoginPage() {
  const { user, loading, setMockUser, completeLogin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [showDemoOption, setShowDemoOption] = useState(false);
  const [pendingRole, setPendingRole] = useState<AdminRole | null>(null);

  useEffect(() => {
    if (!loading && user) {
      // Let ProtectedRoute handle the pending-approval redirect if needed
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleDemoLogin = () => {
    setMockUser({
      id: 'mock-user-id',
      email: 'demo@chmsu.edu.ph',
      user_metadata: { full_name: 'Demo User' },
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
      // If login succeeds, Supabase has already validated credentials AND
      // email confirmation. The backend returns 403 for unverified accounts,
      // which is caught below and shown as a clear message.
      const session = await apiClient.login(form.email, form.password);

      // Atomically set session + verified=true to prevent ProtectedRoute
      // redirect loop (session true but verified still false).
      completeLogin(session, true);
      notify.success('Signed in successfully', 'Welcome back!');
      setFormLoading(false);

      // Check if user has an elevated role (admin / moderator / super_admin).
      // getAdminMe returns 403 for regular users — treat that as "no role".
      try {
        const adminInfo = await apiClient.getAdminMe();
        if (adminInfo?.role) {
          // Show modal so user can choose admin panel vs regular app.
          setPendingRole(adminInfo.role);
          return;
        }
      } catch {
        // 403 or network error → regular user, proceed normally
      }

      // Non-CHMSU students pending admin approval go to the waiting room.
      // All others go to the dashboard (ProtectedRoute also enforces this).
      const isPending =
        session.user?.user_metadata?.pending_student_verification === true &&
        session.user?.user_metadata?.student_verification_status !== 'approved';

      navigate(isPending ? '/pending-approval' : '/dashboard', { replace: true });

    } catch (err: any) {
      console.error('Login error:', err);

      // 403 with requiresOtp = user registered but hasn't verified OTP yet
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

  if (pendingRole) {
    return (
      <RoleSelectionModal
        role={pendingRole}
        onClose={() => setPendingRole(null)}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F4EF] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#1A6B3C]/20 border-t-[#1A6B3C] rounded-full animate-spin" />
      </div>
    );
  }

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
          <h1 className="font-fraunces text-3xl font-bold text-[#1A6B3C] mt-4 mb-1">Welcome back!</h1>
          <p className="font-jakarta text-[#1A6B3C]/60 text-sm">Sign in to your CHMSU account</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-[#1A6B3C]/8 p-8">
          {!isApiConfigured && (
            <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-jakarta px-4 py-3 rounded-xl">
              API is not configured. Add VITE_API_BASE_URL in a local .env file.
            </div>
          )}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="font-jakarta font-semibold text-sm text-gray-700 block mb-1.5">Email</label>
              <input
                type="email"
                placeholder="your@chmsu.edu.ph"
                value={form.email}
                onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A6B3C] bg-gray-50 focus:bg-white font-jakarta text-sm outline-none transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-jakarta font-semibold text-sm text-gray-700">Password</label>
                <Link
                  to="/forgot-password"
                  className="font-jakarta text-xs font-semibold text-[#1A6B3C]/70 hover:text-[#1A6B3C] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))}
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
                <>Sign In <ArrowRight size={18} /></>
              )}
            </button>

            {showDemoOption && (
              <button
                type="button"
                onClick={handleDemoLogin}
                className="w-full flex items-center justify-center gap-2 bg-[#E8A838]/10 text-[#E8A838] border border-[#E8A838]/30 font-jakarta font-bold py-3.5 rounded-xl hover:bg-[#E8A838]/20 transition-all active:scale-[0.98]"
              >
                Try Demo Mode (Skip Auth)
              </button>
            )}
          </form>

          <div className="mt-6 text-center">
            <p className="font-jakarta text-sm text-gray-500">
              Don't have an account?{' '}
              <Link to="/onboarding" className="text-[#1A6B3C] font-semibold hover:underline">
                Join Ally-jis
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