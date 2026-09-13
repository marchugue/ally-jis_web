import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  Cookie, 
  ShieldCheck, 
  KeyRound, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  X, 
  Lock, 
  CheckCircle2 
} from 'lucide-react';
import { notify } from '@/components/ui/sonner';

export const COOKIE_CONSENT_KEY = 'allyjis_cookie_consent';
export const COOKIE_CONSENT_EVENT = 'open-cookie-settings';

export type CookieConsentLevel = 'all' | 'essential' | 'declined';

export function openCookieSettings() {
  window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_EVENT));
}

export function CookieConsentCard() {
  const location = useLocation();
  const isWelcomePage = location.pathname === '/' || location.pathname === '/welcome';
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [currentConsent, setCurrentConsent] = useState<CookieConsentLevel | null>(null);

  useEffect(() => {
    // Check if consent has already been chosen
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY) as CookieConsentLevel | null;
    if (stored) {
      setCurrentConsent(stored);
    } else {
      // Delay entrance slightly for a smoother, non-disruptive page arrival
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, []);

  // Listen for external trigger to re-open settings (e.g. from footer or settings page)
  useEffect(() => {
    const handleOpen = () => {
      setIsVisible(true);
      setShowDetails(true);
    };

    window.addEventListener(COOKIE_CONSENT_EVENT, handleOpen);
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, handleOpen);
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'all');
    localStorage.setItem(`${COOKIE_CONSENT_KEY}_timestamp`, new Date().toISOString());
    setCurrentConsent('all');
    setIsVisible(false);
    notify.success(
      'Cookie preferences saved',
      'You will stay securely signed in across sessions.'
    );
  };

  const handleAcceptEssential = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'essential');
    localStorage.setItem(`${COOKIE_CONSENT_KEY}_timestamp`, new Date().toISOString());
    setCurrentConsent('essential');
    setIsVisible(false);
    notify.info(
      'Essential cookies only',
      'Only strictly required session security cookies will be used.'
    );
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Soft backdrop overlay covering page - gentle light scrim on light mode / welcome page */}
          <motion.div
            key="cookie-consent-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={handleDismiss}
            className={cn(
              "fixed inset-0 z-[99998] transition-opacity",
              isWelcomePage
                ? "bg-black/10 backdrop-blur-[1px]"
                : "bg-black/15 dark:bg-black/60 backdrop-blur-[1.5px]"
            )}
            aria-hidden="true"
          />

          {/* Full-width bottom sheet card (top border rounded only, flush bottom) */}
          <motion.div
            key="cookie-consent-bottom-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed bottom-0 left-0 right-0 w-full z-[99999] pointer-events-auto"
            role="dialog"
            aria-labelledby="cookie-consent-title"
            aria-describedby="cookie-consent-desc"
          >
            <div className={cn(
              "w-full rounded-t-3xl sm:rounded-t-[32px] rounded-b-none border-t overflow-hidden transition-colors ring-1",
              isWelcomePage
                ? "border-[#1A6B3C]/20 bg-[#FAF7F2]/98 backdrop-blur-2xl shadow-[0_-15px_40px_rgba(0,0,0,0.12)] ring-black/5"
                : "border-[#1A6B3C]/20 dark:border-emerald-500/30 bg-[#FAF7F2]/98 dark:bg-[#0E131F]/98 backdrop-blur-2xl shadow-[0_-15px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_-20px_50px_rgba(0,0,0,0.85)] ring-black/5 dark:ring-white/10"
            )}>
              
              {/* Top accent gradient bar (top curved edge only) */}
              <div className="h-1.5 w-full bg-gradient-to-r from-[#1A6B3C] via-[#E8A838] to-[#1A6B3C] dark:from-emerald-500 dark:via-amber-400 dark:to-emerald-400" />

              {/* Centered sheet pill handle */}
              <div className="flex justify-center pt-2 pb-1">
                <div className="w-12 h-1.5 rounded-full bg-stone-300/80 dark:bg-gray-700/80" />
              </div>

              {/* Main content container with max-width constraint for wide screens */}
              <div className="max-w-6xl mx-auto px-4 sm:px-8 py-4 sm:py-5">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 sm:gap-6">
                  
                  {/* Left Side: Icon, Badge, Title & Description */}
                  <div className="flex items-start gap-3.5 sm:gap-4 flex-1">
                    <div className="relative flex-shrink-0 mt-0.5">
                      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-[#1A6B3C]/15 to-[#E8A838]/20 dark:from-emerald-500/25 dark:to-amber-400/20 border border-[#1A6B3C]/20 dark:border-emerald-500/30 flex items-center justify-center text-[#1A6B3C] dark:text-emerald-400 shadow-xs">
                        <Cookie className="w-6 h-6 animate-pulse" />
                      </div>
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E8A838] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-[#E8A838]"></span>
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-[#1A6B3C]/10 dark:bg-emerald-500/15 text-[#1A6B3C] dark:text-emerald-400 border border-[#1A6B3C]/15 dark:border-emerald-500/20">
                          Session & Security
                        </span>
                      </div>
                      
                      <h3 
                        id="cookie-consent-title" 
                        className="font-fraunces font-bold text-lg sm:text-xl text-[#1A6B3C] dark:text-white leading-tight"
                      >
                        Allow cookies to stay signed in
                      </h3>

                      <p 
                        id="cookie-consent-desc" 
                        className="text-xs sm:text-sm text-stone-600 dark:text-gray-300 leading-relaxed font-jakarta max-w-2xl"
                      >
                        Like Facebook, Ally-jis uses secure cookies so your account <strong>stays signed in indefinitely</strong> until you choose to log out. They guard your login tokens and prevent random session disconnects.
                      </p>

                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => setShowDetails(!showDetails)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1A6B3C] dark:text-emerald-400 hover:underline transition-all"
                        >
                          <span>{showDetails ? 'Hide explanation' : 'Why are cookies required?'}</span>
                          {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Action Buttons & Controls */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-2.5 sm:gap-3 flex-shrink-0">
                    <div className="flex items-center gap-2.5 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={handleAcceptAll}
                        className="flex-1 sm:flex-initial py-2.5 px-5 rounded-xl bg-[#1A6B3C] hover:bg-[#155730] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-medium text-xs sm:text-sm shadow-md shadow-[#1A6B3C]/20 dark:shadow-emerald-950/40 flex items-center justify-center gap-2 transition-all active:scale-[0.98] whitespace-nowrap"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Allow All & Stay Signed In</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleAcceptEssential}
                        className="py-2.5 px-4 rounded-xl border border-stone-300 dark:border-white/20 bg-white/70 dark:bg-white/5 hover:bg-stone-100 dark:hover:bg-white/10 text-stone-700 dark:text-gray-200 font-medium text-xs sm:text-sm transition-all active:scale-[0.98] whitespace-nowrap"
                      >
                        Essential Only
                      </button>

                      <button
                        onClick={handleDismiss}
                        className="p-2 text-stone-400 hover:text-stone-700 dark:text-gray-400 dark:hover:text-white rounded-xl hover:bg-stone-200/50 dark:hover:bg-white/10 transition-colors"
                        aria-label="Dismiss cookie notice"
                        title="Dismiss for now"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="text-center sm:text-right">
                      <p className="text-[11px] text-stone-500 dark:text-gray-400">
                        Read more in our{' '}
                        <Link 
                          to="/privacy" 
                          onClick={() => setIsVisible(false)}
                          className="text-[#1A6B3C] dark:text-emerald-400 font-semibold underline underline-offset-2 hover:opacity-80"
                        >
                          Privacy Policy
                        </Link>
                      </p>
                    </div>
                  </div>

                </div>

                {/* Expandable "Why do we need this?" grid */}
                <AnimatePresence>
                  {showDetails && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden mt-4 pt-3 border-t border-stone-200/70 dark:border-white/10"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                        <div className="p-3 rounded-2xl bg-white/60 dark:bg-white/5 border border-stone-200/70 dark:border-white/10 space-y-1">
                          <div className="flex items-center gap-2">
                            <KeyRound className="w-4 h-4 text-[#E8A838] dark:text-amber-400 flex-shrink-0" />
                            <strong className="text-stone-800 dark:text-gray-100 font-semibold">Sliding Session</strong>
                          </div>
                          <p className="text-stone-600 dark:text-gray-300 text-[11px] leading-relaxed">
                            Auto-renews your login token on every visit so you never have to re-enter your password unexpectedly.
                          </p>
                        </div>

                        <div className="p-3 rounded-2xl bg-white/60 dark:bg-white/5 border border-stone-200/70 dark:border-white/10 space-y-1">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-[#1A6B3C] dark:text-emerald-400 flex-shrink-0" />
                            <strong className="text-stone-800 dark:text-gray-100 font-semibold">HttpOnly Security</strong>
                          </div>
                          <p className="text-stone-600 dark:text-gray-300 text-[11px] leading-relaxed">
                            Prevents JavaScript from accessing session keys, giving robust immunity against cross-site scripting (XSS).
                          </p>
                        </div>

                        <div className="p-3 rounded-2xl bg-white/60 dark:bg-white/5 border border-stone-200/70 dark:border-white/10 space-y-1">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-[#1A6B3C] dark:text-emerald-400 flex-shrink-0" />
                            <strong className="text-stone-800 dark:text-gray-100 font-semibold">Preferences</strong>
                          </div>
                          <p className="text-stone-600 dark:text-gray-300 text-[11px] leading-relaxed">
                            Retains your active theme (Dark/Light mode), sidebar status, and customized campus filters.
                          </p>
                        </div>

                        <div className="p-3 rounded-2xl bg-white/60 dark:bg-white/5 border border-stone-200/70 dark:border-white/10 space-y-1">
                          <div className="flex items-center gap-2">
                            <Lock className="w-4 h-4 text-stone-500 dark:text-gray-400 flex-shrink-0" />
                            <strong className="text-stone-800 dark:text-gray-100 font-semibold">Zero Ad Tracking</strong>
                          </div>
                          <p className="text-stone-600 dark:text-gray-300 text-[11px] leading-relaxed">
                            Purely functional for the CHMSU community. We never use ad networks or sell student data.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
export default CookieConsentCard;
