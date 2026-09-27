// src/pages/MaintenancePage.tsx

import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wrench,
  Cog,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  Clock,
  Mail,
  Copy,
  Check,
  AlertTriangle,
  ArrowLeft,
  Sun,
  Moon,
  Server,
  Lock,
} from 'lucide-react';
import { useMaintenance } from '@/context/MaintenanceContext';
import { useTheme } from '@/context/ThemeContext';
import { toast } from 'sonner';

export default function MaintenancePage() {
  const { isMaintenance, maintenanceMessage, isChecking, checkMaintenance, isPreview, setPreview } =
    useMaintenance();
  const { resolvedTheme, toggleTheme } = useTheme();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const isPreviewMode = isPreview || searchParams.get('preview') === 'true';
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [countdown, setCountdown] = useState(15);

  // Auto-countdown ticker for the next background check
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Trigger silent background check
          void checkMaintenance(false);
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [checkMaintenance]);

  const handleManualCheck = async () => {
    setCountdown(15);
    const stillActive = await checkMaintenance(true);
    if (!stillActive && !isPreviewMode) {
      navigate('/dashboard', { replace: true });
    }
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('support@ally-jis.com');
    setCopiedEmail(true);
    toast.success('Email copied to clipboard');
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const displayMessage =
    maintenanceMessage && maintenanceMessage.trim().length > 0
      ? maintenanceMessage
      : 'Ally-jis is undergoing scheduled maintenance to upgrade services and optimize system performance. We will be back shortly!';

  return (
    <div className="min-h-screen bg-[#F7F4EF] dark:bg-[#090D16] text-gray-800 dark:text-gray-100 flex flex-col justify-between relative overflow-hidden transition-colors selection:bg-[#1A6B3C] dark:selection:bg-emerald-500 selection:text-white font-jakarta">
      {/* ── AMBIENT BACKGROUND GLOWS ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#1A6B3C]/10 dark:bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-[#E8A838]/15 dark:bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-[500px] h-[500px] bg-[#1A6B3C]/5 dark:bg-emerald-600/5 rounded-full blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage: `radial-gradient(currentColor 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />
      </div>

      {/* ── ADMIN PREVIEW BAR (When opened from Admin Settings) ── */}
      {isPreviewMode && (
        <div className="relative z-50 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white px-4 py-2.5 shadow-md flex items-center justify-between text-xs sm:text-sm font-medium">
          <div className="flex items-center gap-2 max-w-xl">
            <AlertTriangle size={16} className="shrink-0 animate-bounce" />
            <span>
              <strong>Admin Preview Mode:</strong> This is the live maintenance screen students see when maintenance mode is active.
            </span>
          </div>
          <button
            onClick={() => {
              setPreview(false);
              navigate('/admin/settings');
            }}
            className="flex items-center gap-1.5 px-3 py-1 bg-black/25 hover:bg-black/40 rounded-lg text-xs font-semibold backdrop-blur-xs transition-all active:scale-95 shrink-0 ml-3"
          >
            <ArrowLeft size={13} /> Return to Admin Settings
          </button>
        </div>
      )}

      {/* ── TOP NAV BAR ── */}
      <header className="relative z-40 max-w-7xl mx-auto w-full px-4 sm:px-8 h-20 sm:h-24 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#1A6B3C] to-[#14532D] dark:from-emerald-600 dark:to-teal-800 flex items-center justify-center text-white font-fraunces font-bold text-2xl shadow-md shadow-[#1A6B3C]/20 transition-transform">
            A
          </div>
          <div className="flex flex-col">
            <span className="font-fraunces font-bold text-2xl tracking-tight text-[#1A6B3C] dark:text-white leading-none">
              Ally<span className="text-[#E8A838]">-jis</span>
            </span>
            <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-[#1A6B3C]/70 dark:text-gray-400 pt-0.5">
              CHMSU Alijis Campus
            </span>
          </div>
        </div>

        {/* Right Controls: Theme Toggle & Support */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-xl bg-white/80 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/10 transition-all shadow-xs active:scale-95"
            aria-label="Toggle theme"
            title="Toggle light/dark theme"
          >
            {resolvedTheme === 'dark' ? (
              <Sun size={18} className="text-amber-400 animate-spin-slow" />
            ) : (
              <Moon size={18} />
            )}
          </button>

          <button
            onClick={() => setShowSupportModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/80 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/10 transition-all shadow-xs active:scale-95"
          >
            <Mail size={15} />
            <span className="hidden sm:inline">Get Help</span>
          </button>
        </div>
      </header>

      {/* ── MAIN CONTENT HERO CARD ── */}
      <main className="relative z-30 flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="max-w-2xl w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white/85 dark:bg-[#121915]/90 backdrop-blur-xl border border-gray-200/90 dark:border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-emerald-950/5 dark:shadow-black/40 text-center relative overflow-hidden"
          >
            {/* Top decorative stripe */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#1A6B3C] via-[#E8A838] to-[#1A6B3C] dark:from-emerald-500 dark:via-amber-400 dark:to-emerald-500" />

            {/* ── ANIMATED GRAPHIC / ICON ── */}
            <div className="relative w-28 h-28 mx-auto mb-6 flex items-center justify-center">
              {/* Outer pulsing ring */}
              <motion.div
                animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-0 rounded-full bg-amber-400/20 dark:bg-amber-400/10 blur-md"
              />

              {/* Rotating outer gear */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-1 text-amber-500/30 dark:text-amber-400/20 flex items-center justify-center"
              >
                <Cog size={100} strokeWidth={1.2} />
              </motion.div>

              {/* Counter-rotating small gear */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
                className="absolute bottom-0 right-0 text-[#1A6B3C]/40 dark:text-emerald-400/30 flex items-center justify-center"
              >
                <Cog size={46} strokeWidth={1.5} />
              </motion.div>

              {/* Center icon badge */}
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#1A6B3C] to-emerald-600 dark:from-emerald-600 dark:to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-700/30"
              >
                <Wrench size={30} className="transform -rotate-12 drop-shadow-sm" />
              </motion.div>
            </div>

            {/* ── STATUS PILL ── */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-semibold tracking-wide uppercase mb-4">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              <span>Platform Maintenance In Progress</span>
            </div>

            {/* ── HEADING & DESCRIPTION ── */}
            <h1 className="font-fraunces text-2xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-3">
              We’re Upgrading Your Experience
            </h1>

            <p className="text-sm sm:text-base text-gray-600 dark:text-white/70 max-w-lg mx-auto leading-relaxed mb-6 font-normal">
              Ally-jis is temporarily offline for scheduled system improvements. We’re working diligently to bring all services back online.
            </p>

            {/* ── DYNAMIC ADMIN NOTICE MESSAGE ── */}
            <div className="bg-[#F7F4EF]/80 dark:bg-white/[0.04] border border-[#1A6B3C]/15 dark:border-white/10 rounded-2xl p-4 sm:p-5 text-left mb-6 relative">
              <div className="flex items-center gap-2 mb-2 text-[#1A6B3C] dark:text-emerald-400 font-semibold text-xs uppercase tracking-wider">
                <Sparkles size={14} />
                <span>Notice from Site Administrators</span>
              </div>
              <p className="text-xs sm:text-sm text-gray-700 dark:text-white/90 italic leading-relaxed">
                "{displayMessage}"
              </p>
            </div>

            {/* ── 3 STATUS METRICS ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8 text-left">
              <div className="bg-white/60 dark:bg-white/[0.03] border border-gray-200/60 dark:border-white/5 rounded-2xl p-3.5 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900 dark:text-white">Data Safe</h4>
                  <p className="text-[11px] text-gray-500 dark:text-white/50 leading-tight mt-0.5">
                    Messages & accounts preserved
                  </p>
                </div>
              </div>

              <div className="bg-white/60 dark:bg-white/[0.03] border border-gray-200/60 dark:border-white/5 rounded-2xl p-3.5 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Server size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900 dark:text-white">API Systems</h4>
                  <p className="text-[11px] text-gray-500 dark:text-white/50 leading-tight mt-0.5">
                    Optimization underway
                  </p>
                </div>
              </div>

              <div className="bg-white/60 dark:bg-white/[0.03] border border-gray-200/60 dark:border-white/5 rounded-2xl p-3.5 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Clock size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900 dark:text-white">Auto-Checking</h4>
                  <p className="text-[11px] text-gray-500 dark:text-white/50 leading-tight mt-0.5">
                    Retrying in {countdown}s
                  </p>
                </div>
              </div>
            </div>

            {/* ── ACTION CONTROLS ── */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={handleManualCheck}
                disabled={isChecking}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#1A6B3C] hover:bg-[#14532D] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-semibold text-sm transition-all shadow-md shadow-[#1A6B3C]/20 active:scale-[0.98] disabled:opacity-50"
              >
                <RefreshCw size={16} className={isChecking ? 'animate-spin' : ''} />
                <span>{isChecking ? 'Checking Platform Status…' : 'Check System Status'}</span>
              </button>

              <button
                onClick={() => setShowSupportModal(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gray-100 hover:bg-gray-200/80 dark:bg-white/10 dark:hover:bg-white/15 text-gray-700 dark:text-white font-semibold text-sm transition-all active:scale-[0.98]"
              >
                <Mail size={16} />
                <span>Contact Support</span>
              </button>
            </div>

            {/* Countdown progress bar */}
            <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-gray-400 dark:text-white/40">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Next automatic reconnect check in {countdown} seconds</span>
            </div>
          </motion.div>

          {/* ── ADMIN BYPASS & FOOTER LINKS ── */}
          <div className="mt-8 text-center space-y-2">
            <p className="text-xs text-gray-500 dark:text-white/40">
              Are you an authorized administrator?{' '}
              <Link
                to="/login"
                className="font-semibold text-[#1A6B3C] dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
              >
                <Lock size={12} /> Sign in to Admin Console
              </Link>
            </p>
          </div>
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer className="relative z-30 max-w-7xl mx-auto w-full px-4 sm:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 dark:text-white/40 border-t border-gray-200/60 dark:border-white/5">
        <div>
          © {new Date().getFullYear()} Ally-jis. Carlos Hilado Memorial State University – Alijis Campus.
        </div>
        <div className="flex items-center gap-4">
          <Link to="/privacy" className="hover:text-gray-900 dark:hover:text-white transition-colors">
            Privacy Policy
          </Link>
          <span>•</span>
          <Link to="/terms" className="hover:text-gray-900 dark:hover:text-white transition-colors">
            Terms of Service
          </Link>
          <span>•</span>
          <Link to="/support" className="hover:text-gray-900 dark:hover:text-white transition-colors">
            Support FAQs
          </Link>
        </div>
      </footer>

      {/* ── SUPPORT / HELP MODAL ── */}
      <AnimatePresence>
        {showSupportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSupportModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative z-10 w-full max-w-md bg-white dark:bg-[#161D19] border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Mail size={17} />
                  </div>
                  <h3 className="font-fraunces text-lg font-bold text-gray-900 dark:text-white">
                    Ally-jis Support Team
                  </h3>
                </div>
                <button
                  onClick={() => setShowSupportModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-500 dark:text-white/60 hover:text-gray-900 dark:hover:text-white"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs sm:text-sm text-gray-600 dark:text-white/70 mb-4 leading-relaxed">
                If you have an urgent inquiry or questions about the maintenance window, our technical team is here to help.
              </p>

              <div className="bg-gray-50 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 rounded-2xl p-4 space-y-3 mb-5">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 dark:text-white/40 uppercase tracking-wider block mb-1">
                    Direct Support Email
                  </span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs sm:text-sm font-mono text-[#1A6B3C] dark:text-emerald-400 font-semibold select-all">
                      support@ally-jis.com
                    </span>
                    <button
                      onClick={handleCopyEmail}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 text-xs font-medium hover:bg-gray-50 dark:hover:bg-white/15 transition-all text-gray-700 dark:text-white"
                    >
                      {copiedEmail ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                      <span>{copiedEmail ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-200/60 dark:border-white/5 text-[11px] text-gray-500 dark:text-white/50">
                  Campus: Carlos Hilado Memorial State University – Alijis Campus
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setShowSupportModal(false)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#1A6B3C] hover:bg-[#14532D] text-white text-xs sm:text-sm font-semibold transition-all"
                >
                  Understood
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
