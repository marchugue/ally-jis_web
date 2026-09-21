import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Cookie, X } from 'lucide-react';
import { notify } from '@/components/ui/sonner';
import { useAuth } from '@/context/AuthContext';

export const COOKIE_CONSENT_KEY = 'allyjis_cookie_consent';
export const COOKIE_CONSENT_EVENT = 'open-cookie-settings';
export const COOKIE_CONSENT_CHANGED_EVENT = 'cookie-consent-changed';

export type CookieConsentLevel = 'all' | 'essential' | 'declined';

export function areCookiesAllowed(): boolean {
  try {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY) as CookieConsentLevel | null;
    return consent === 'all' || consent === 'essential';
  } catch {
    return false;
  }
}

export function useCookieConsent() {
  const [consent, setConsent] = useState<CookieConsentLevel | null>(() => {
    try {
      return localStorage.getItem(COOKIE_CONSENT_KEY) as CookieConsentLevel | null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<CookieConsentLevel>;
      if (customEvent.detail) {
        setConsent(customEvent.detail);
      } else {
        try {
          const stored = localStorage.getItem(COOKIE_CONSENT_KEY) as CookieConsentLevel | null;
          setConsent(stored);
        } catch {
          setConsent(null);
        }
      }
    };

    window.addEventListener(COOKIE_CONSENT_CHANGED_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener(COOKIE_CONSENT_CHANGED_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const isAllowed = consent === 'all' || consent === 'essential';

  return { consent, isAllowed };
}

export function openCookieSettings() {
  window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_EVENT));
}

export function CookieConsentCard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, session, needsOnboarding, isPendingApproval } = useAuth();
  const isWelcomePage = location.pathname === '/' || location.pathname === '/welcome';
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if consent has already been chosen
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY) as CookieConsentLevel | null;
    if (!stored) {
      // Delay entrance slightly for a smooth, non-disruptive page arrival
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
    };

    window.addEventListener(COOKIE_CONSENT_EVENT, handleOpen);
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, handleOpen);
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'all');
    localStorage.setItem(`${COOKIE_CONSENT_KEY}_timestamp`, new Date().toISOString());
    setIsVisible(false);
    window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_CHANGED_EVENT, { detail: 'all' }));
    notify.success(
      'Cookie preferences saved',
      'You will stay securely signed in across sessions.'
    );

    if ((user || session) && isWelcomePage) {
      if (needsOnboarding) {
        navigate('/onboarding', { replace: true });
      } else if (isPendingApproval) {
        navigate('/pending-approval', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  };

  const handleAcceptEssential = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'essential');
    localStorage.setItem(`${COOKIE_CONSENT_KEY}_timestamp`, new Date().toISOString());
    setIsVisible(false);
    window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_CHANGED_EVENT, { detail: 'essential' }));
    notify.info(
      'Essential cookies only',
      'Only strictly required session security cookies will be used.'
    );

    if ((user || session) && isWelcomePage) {
      if (needsOnboarding) {
        navigate('/onboarding', { replace: true });
      } else if (isPendingApproval) {
        navigate('/pending-approval', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Subtle backdrop scrim */}
          <motion.div
            key="cookie-consent-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleDismiss}
            className={cn(
              "fixed inset-0 z-[99998] transition-opacity",
              isWelcomePage
                ? "bg-black/10 backdrop-blur-[1px]"
                : "bg-black/15 dark:bg-black/50 backdrop-blur-[1px]"
            )}
            aria-hidden="true"
          />

          {/* Floating bottom card / banner */}
          <motion.div
            key="cookie-consent-card"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className="fixed bottom-3 sm:bottom-5 inset-x-3 sm:inset-x-6 max-w-4xl mx-auto z-[99999] pointer-events-auto"
            role="dialog"
            aria-labelledby="cookie-consent-title"
            aria-describedby="cookie-consent-desc"
          >
            <div className={cn(
              "p-4 sm:p-5 rounded-2xl sm:rounded-3xl border shadow-xl backdrop-blur-xl transition-all",
              isWelcomePage
                ? "bg-[#FAF7F2]/95 border-[#1A6B3C]/20 shadow-[0_10px_35px_rgba(0,0,0,0.1)]"
                : "bg-[#FAF7F2]/95 dark:bg-[#111827]/95 border-[#1A6B3C]/20 dark:border-white/10 shadow-[0_10px_35px_rgba(0,0,0,0.15)] dark:shadow-[0_15px_40px_rgba(0,0,0,0.7)]"
            )}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Left: Icon & Concise copy */}
                <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#1A6B3C]/10 dark:bg-emerald-500/15 border border-[#1A6B3C]/15 dark:border-emerald-500/20 flex items-center justify-center text-[#1A6B3C] dark:text-emerald-400 shrink-0">
                    <Cookie size={20} />
                  </div>
                  <div className="space-y-0.5">
                    <h3 id="cookie-consent-title" className="font-fraunces text-sm sm:text-base font-bold text-gray-900 dark:text-white leading-tight">
                      We use cookies
                    </h3>
                    <p id="cookie-consent-desc" className="text-xs text-gray-600 dark:text-gray-300 font-jakarta leading-relaxed">
                      We use essential cookies to keep you signed in and remember your preferences.{' '}
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

                {/* Right: Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={handleAcceptEssential}
                    className="px-3.5 py-2 rounded-xl border border-gray-300 dark:border-white/15 bg-white/60 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 text-xs font-semibold font-jakarta transition-all cursor-pointer"
                  >
                    Essential Only
                  </button>
                  <button
                    type="button"
                    onClick={handleAcceptAll}
                    className="px-4 py-2 rounded-xl bg-[#1A6B3C] hover:bg-[#155730] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-semibold font-jakarta shadow-sm shadow-[#1A6B3C]/20 transition-all cursor-pointer"
                  >
                    Allow All
                  </button>
                  <button
                    type="button"
                    onClick={handleDismiss}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg transition-colors cursor-pointer"
                    aria-label="Dismiss"
                    title="Dismiss"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default CookieConsentCard;
