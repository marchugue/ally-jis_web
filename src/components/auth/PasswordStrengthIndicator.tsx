import { PASSWORD_RULES, passwordStrengthColor, passwordStrengthLabel, passwordStrengthPercent } from '@/lib/password';

export function PasswordStrengthIndicator({ password }: { password: string }) {
  if (!password.length) return null;

  const pct = passwordStrengthPercent(password);
  const barColor = passwordStrengthColor(pct);
  const strengthLabel = passwordStrengthLabel(pct);

  return (
    <div className="mt-2.5 space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${pct}%`, backgroundColor: barColor }}
          />
        </div>
        <span className="text-[11px] font-bold font-jakarta" style={{ color: barColor }}>
          {strengthLabel}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-y-1">
        {PASSWORD_RULES.map((rule) => {
          const ok = rule.test(password);
          return (
            <div key={rule.key} className="flex items-center gap-1.5">
              <div
                className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                  ok ? 'bg-green-500' : 'bg-gray-200 dark:bg-white/10'
                }`}
              >
                {ok ? (
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                    <path
                      d="M1.5 4.5L3.5 6.5L7.5 2.5"
                      stroke="white"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M2 2L6 6M6 2L2 6" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                )}
              </div>
              <span
                className={`text-[11px] font-jakarta transition-colors ${
                  ok ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                {rule.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
