import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, CheckCircle2, Shield, KeyRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient, isApiConfigured } from '@/api/client';
import { notify } from '@/components/ui/sonner';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [requestSent, setRequestSent] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

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
      await apiClient.forgotPassword(email, 'web');
      setRequestSent(true);
    } catch (err: any) {
      notify.error('Request failed', err.message || 'Something went wrong. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F4EF] dark:bg-[#090D16] text-[#1A6B3C] dark:text-emerald-400 selection:bg-[#1A6B3C] selection:text-white flex flex-col justify-between overflow-x-hidden">
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

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-12 sm:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
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
              Enter your registered university email. We&apos;ll send a secure link to reset your password on the web.
            </p>
            <div className="space-y-3 pt-2 font-mono text-xs text-[#1A6B3C]/80 dark:text-emerald-400/80">
              <div className="flex items-center gap-2.5">
                <Shield size={15} className="text-[#E8A838]" />
                <span>Encrypted single-use recovery token</span>
              </div>
              <div className="flex items-center gap-2.5">
                <KeyRound size={15} className="text-[#E8A838]" />
                <span>Same secure email delivery as OTP verification</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="lg:col-span-6"
          >
            <div className="bg-[#EDE7DB] dark:bg-[#111827] dark:border dark:border-white/10 p-8 sm:p-12 rounded-[36px] shadow-sm space-y-8">
              <div className="space-y-1.5 border-b border-[#1A6B3C]/15 dark:border-white/10 pb-6">
                <span className="font-mono text-[11px] uppercase tracking-widest text-[#1A6B3C]/70 dark:text-emerald-400/70">
                  Credentials Assistance
                </span>
                <h2 className="font-fraunces text-3xl font-bold text-[#1A6B3C] dark:text-white">Send Recovery Email</h2>
              </div>

              {!isApiConfigured && (
                <div className="bg-amber-100/80 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 text-xs font-jakarta p-4 rounded-2xl">
                  API is currently in local development mode. Add VITE_API_BASE_URL in your .env file.
                </div>
              )}

              {!requestSent && (
                <form onSubmit={handleRequestReset} className="space-y-6">
                  <div className="space-y-2">
                    <label className="font-jakarta font-bold text-xs uppercase tracking-wider text-[#1A6B3C] dark:text-emerald-400 block">
                      Registered Student Email
                    </label>
                    <input
                      type="email"
                      placeholder="yourname@chmsu.edu.ph"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-5 py-4 rounded-full border-2 border-[#1A6B3C]/15 dark:border-white/10 focus:border-[#1A6B3C] dark:focus:border-emerald-400 bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder:text-gray-400 font-jakarta text-sm outline-none transition-all shadow-xs"
                      autoComplete="email"
                    />
                  </div>
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
                        <span>Send Recovery Link</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </motion.button>
                </form>
              )}

              {requestSent && (
                <div className="text-center py-4 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-[#1A6B3C]/10 dark:bg-emerald-500/20 flex items-center justify-center mx-auto text-[#1A6B3C] dark:text-emerald-400">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="font-fraunces font-bold text-2xl text-[#1A6B3C] dark:text-white">Recovery Email Dispatched</h3>
                  <p className="font-jakarta text-sm text-gray-700 dark:text-gray-300 leading-relaxed max-w-sm mx-auto">
                    If an account is associated with{' '}
                    <span className="font-bold text-[#1A6B3C] dark:text-emerald-400">{email}</span>, check your inbox
                    for a link to set a new password.
                  </p>
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider font-bold text-[#1A6B3C] dark:text-emerald-400 bg-white dark:bg-white/10 px-6 py-3 rounded-full hover:bg-[#F7F4EF] dark:hover:bg-white/20 transition-all shadow-xs"
                  >
                    Return to Sign In →
                  </Link>
                </div>
              )}

              <div className="pt-6 border-t border-[#1A6B3C]/15 dark:border-white/10 flex items-center justify-between text-xs font-jakarta">
                <span className="text-gray-700 dark:text-gray-400">Remembered credentials?</span>
                <Link to="/login" className="font-mono text-xs uppercase tracking-wider font-bold text-[#1A6B3C] dark:text-emerald-400 hover:underline">
                  Return to Sign In
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      <footer className="py-6 px-4 text-center font-mono text-[11px] text-[#1A6B3C]/60 dark:text-gray-400 border-t border-[#1A6B3C]/10 dark:border-white/10">
        Carlos Hilado Memorial State University – Alijis Campus • Ally-jis v1.0
      </footer>
    </div>
  );
}
