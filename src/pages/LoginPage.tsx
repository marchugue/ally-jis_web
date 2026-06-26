import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient, isApiConfigured } from '@/api/client';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const { user, loading, setMockUser, setSession } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [showDemoOption, setShowDemoOption] = useState(false);

  useEffect(() => {
    if (!loading && user) {
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
      setError('Please fill in all fields');
      return;
    }
    if (!isApiConfigured) {
      setError('API is not configured. Add VITE_API_BASE_URL to your .env file.');
      setShowDemoOption(false);
      return;
    }
    setFormLoading(true);
    setError('');
    setShowDemoOption(false);
    try {
      const session = await apiClient.login(form.email, form.password);
      setSession(session);
      setFormLoading(false);
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'An unexpected error occurred during login');
      if (err.status === 0) {
        setShowDemoOption(true);
      }
      setFormLoading(false);
    }
  };

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