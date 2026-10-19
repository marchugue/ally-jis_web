import { useState } from 'react';
import {
  PASSWORD_RULES,
  passwordStrengthColor,
  passwordStrengthLabel,
  passwordStrengthScore,
  getNextPasswordRequirement,
} from '@/lib/password';
import { Check, Info } from 'lucide-react';

export interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

export function PasswordStrengthIndicator({
  password,
  className = '',
}: PasswordStrengthIndicatorProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  if (!password || password.length === 0) return null;

  const score = passwordStrengthScore(password);
  const barColor = passwordStrengthColor(score);
  const strengthLabel = passwordStrengthLabel(score);
  const nextReq = getNextPasswordRequirement(password);
  const allPassed = score === PASSWORD_RULES.length;

  return (
    <div className={`mt-2.5 space-y-1.5 ${className}`}>
      {/* 5 Segmented Horizontal Bars (Dropbox reference style) */}
      <div className="grid grid-cols-5 gap-1.5 h-1.5 w-full">
        {[0, 1, 2, 3, 4].map((idx) => {
          const isFilled = idx < score;
          return (
            <div
              key={idx}
              className={`h-full rounded-full transition-all duration-300 ease-out ${
                isFilled ? '' : 'bg-gray-200 dark:bg-white/10'
              }`}
              style={isFilled ? { backgroundColor: barColor } : undefined}
            />
          );
        })}
      </div>

      {/* Single Dynamic Status Line */}
      <div className="flex items-center justify-between text-xs font-jakarta pt-0.5">
        {/* Left: Dynamic missing requirement */}
        <div className="flex items-center gap-1.5 min-w-0 mr-2">
          {allPassed ? (
            <>
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Check size={10} strokeWidth={3} />
              </span>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 truncate">
                Password meets all requirements
              </span>
            </>
          ) : (
            <>
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0 transition-colors"
                style={{ backgroundColor: barColor }}
              />
              <span className="text-[11px] font-medium text-gray-600 dark:text-gray-300 truncate">
                {nextReq?.hint || 'Need at least 8 characters'}
              </span>
            </>
          )}
        </div>

        {/* Right: Strength Label + Info Icon */}
        <div className="relative flex items-center gap-1 shrink-0">
          <span
            className="text-[11px] font-bold tracking-wide transition-colors"
            style={{ color: barColor }}
          >
            {strengthLabel}
          </span>
          <div
            className="relative cursor-pointer flex items-center"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onClick={() => setShowTooltip((prev) => !prev)}
            aria-label="Password requirements info"
          >
            <Info
              size={12}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            />
            {showTooltip && (
              <div className="absolute right-0 bottom-full mb-2 w-56 p-2.5 bg-gray-900/95 dark:bg-black/90 backdrop-blur-xs text-white text-[10px] rounded-lg shadow-xl z-50 pointer-events-none">
                <div className="font-semibold text-gray-200 mb-1 border-b border-white/10 pb-1">
                  Requirements
                </div>
                <div className="space-y-1">
                  {PASSWORD_RULES.map((rule) => {
                    const ok = rule.test(password);
                    return (
                      <div key={rule.key} className="flex items-center gap-1.5">
                        <span className={ok ? 'text-emerald-400 font-bold' : 'text-gray-500'}>
                          {ok ? '✓' : '•'}
                        </span>
                        <span className={ok ? 'text-gray-200 line-through opacity-70' : 'text-gray-300'}>
                          {rule.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

