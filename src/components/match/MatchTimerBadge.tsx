import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export const ActiveAllyBadge: React.FC<{ className?: string; size?: number }> = ({
  className,
  size = 16,
}) => (
  <span
    title="Active Ally"
    aria-label="Active Ally"
    className={cn('inline-flex items-center justify-center flex-shrink-0 select-none', className)}
  >
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-[#1A6B3C] dark:text-emerald-400"
    >
      <path
        d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"
        fill="currentColor"
      />
      <path
        d="m9 12 2 2 4-4"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="dark:stroke-[#121212]"
      />
    </svg>
  </span>
);

interface MatchTimerBadgeProps {
  chatExpiresAt?: string | null;
  confirmedAt?: string | null;
  status?: string | null;
  ended?: boolean;
  onExpire?: () => void;
}

export const MatchTimerBadge: React.FC<MatchTimerBadgeProps> = ({
  chatExpiresAt,
  confirmedAt,
  status,
  ended,
  onExpire,
}) => {
  const isConfirmed = status === 'confirmed' || Boolean(confirmedAt);

  const calculateRemaining = () => {
    if (!chatExpiresAt || isConfirmed || ended) return 0;
    const target = new Date(chatExpiresAt).getTime();
    return Math.max(0, Math.floor((target - Date.now()) / 1000));
  };

  const [secondsLeft, setSecondsLeft] = useState<number>(calculateRemaining);

  useEffect(() => {
    if (isConfirmed || ended || !chatExpiresAt) return;

    const initial = calculateRemaining();
    setSecondsLeft(initial);
    if (initial <= 0 && onExpire) {
      onExpire();
      return;
    }

    const timer = setInterval(() => {
      const remaining = calculateRemaining();
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        onExpire?.();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [chatExpiresAt, isConfirmed, ended, onExpire]);

  // If already confirmed or ended, don't show the countdown timer
  if (isConfirmed || ended) return null;

  // If no expiration set or expired
  if (!chatExpiresAt || secondsLeft <= 0) return null;

  // Ticking countdown during first-message handshaking window: only text, slightly big, black
  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const secs = String(secondsLeft % 60).padStart(2, '0');

  return (
    <div
      className="font-mono font-bold text-lg sm:text-xl text-black dark:text-white tracking-wider tabular-nums flex-shrink-0 select-none"
      title="First message response timer"
    >
      {mins}:{secs}
    </div>
  );
};
