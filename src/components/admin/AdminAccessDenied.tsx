import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home, LifeBuoy } from 'lucide-react';

export function AdminAccessDenied() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-gradient-to-b from-[#FBF9F4] to-[#F3EFE6] dark:from-[#0C110E] dark:to-[#080B09] transition-colors select-none">
      <div className="relative w-full max-w-md bg-white dark:bg-[#141B16] rounded-3xl p-7 sm:p-9 shadow-2xl border border-black/[0.06] dark:border-white/10 text-center animate-in fade-in zoom-in-95 duration-200">
        {/* Glow behind icon */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-28 h-28 bg-amber-500/10 dark:bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

        {/* Shield Icon Badge */}
        <div className="relative w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-5 shadow-sm">
          <ShieldAlert size={32} strokeWidth={2.2} />
        </div>

        {/* Title */}
        <h2 className="font-fraunces text-2xl font-bold text-gray-900 dark:text-white tracking-tight mb-2">
          Administrator Access Required
        </h2>

        {/* Friendly Description */}
        <p className="font-jakarta text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
          You are currently signed in as a student or standard user. This portal is strictly reserved for authorized campus administrators, faculty, and moderators.
        </p>

        {/* Helpful Tip */}
        <div className="p-3.5 mb-6 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 text-left text-xs text-gray-500 dark:text-gray-400 leading-normal flex items-start gap-2.5">
          <span className="text-base select-none leading-none">💡</span>
          <span>
            If you were recently granted staff or moderator permissions, try logging out and back in to refresh your account credentials.
          </span>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2.5">
          <Link
            to="/dashboard"
            className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-[#1A6B3C] hover:bg-[#15592F] text-white font-jakarta font-semibold text-sm shadow-md shadow-[#1A6B3C]/20 transition-all cursor-pointer"
          >
            <Home size={16} />
            Return to Dashboard
          </Link>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 font-jakarta font-medium text-xs transition-colors cursor-pointer"
            >
              <ArrowLeft size={14} />
              Go Back
            </button>

            <Link
              to="/support"
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 font-jakarta font-medium text-xs transition-colors cursor-pointer"
            >
              <LifeBuoy size={14} />
              Campus Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
