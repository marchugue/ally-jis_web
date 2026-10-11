// src/components/match/AvatarRevealCeremony.tsx
//
// Full-screen celebration played ONCE per match when the avatar reaches
// 100% (250 pts). The animal mask splits apart, the real photo snaps into
// focus, the name types in and confetti falls.

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { AVATAR_EMOJI, DEFAULT_AVATAR_EMOJI, avatarColorFor } from '@/lib/matchOptions';
import { revealSeenKey } from '@/lib/avatarReveal';

export interface AvatarRevealCeremonyProps {
  matchId: string | null | undefined;
  isRevealed: boolean;
  avatarUrl?: string | null;
  avatarKey?: string | null;
  fullName?: string | null;
  partnerAlias?: string | null;
  onSayHi?: () => void;
}

const CONFETTI_COLORS = ['#10B981', '#F59E0B', '#2DD4BF', '#F472B6', '#60A5FA', '#FDE047'];

function useTypewriter(text: string, active: boolean, delayMs: number) {
  const [out, setOut] = useState('');
  useEffect(() => {
    if (!active) return setOut('');
    let i = 0;
    let interval: ReturnType<typeof setInterval> | undefined;
    const start = setTimeout(() => {
      interval = setInterval(() => {
        i += 1;
        setOut(text.slice(0, i));
        if (i >= text.length && interval) clearInterval(interval);
      }, 55);
    }, delayMs);
    return () => {
      clearTimeout(start);
      if (interval) clearInterval(interval);
    };
  }, [text, active, delayMs]);
  return out;
}

export const AvatarRevealCeremony: React.FC<AvatarRevealCeremonyProps> = ({
  matchId,
  isRevealed,
  avatarUrl,
  avatarKey,
  fullName,
  partnerAlias,
  onSayHi,
}) => {
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!matchId || !isRevealed) return;
    try {
      if (localStorage.getItem(revealSeenKey(matchId))) return;
    } catch {
      /* storage unavailable — still show once per mount */
    }
    setOpen(true);
  }, [matchId, isRevealed]);

  const close = () => {
    if (matchId) {
      try {
        localStorage.setItem(revealSeenKey(matchId), new Date().toISOString());
      } catch {
        /* ignore */
      }
    }
    setOpen(false);
  };

  const name = fullName || partnerAlias || 'Your ally';
  const firstName = name.split(' ')[0];
  const typed = useTypewriter(name, open, reduceMotion ? 0 : 1500);
  const accent = avatarColorFor(avatarKey);
  const emoji = (avatarKey && AVATAR_EMOJI[avatarKey.toLowerCase()]) || DEFAULT_AVATAR_EMOJI;
  const animalSrc = `/emojis/animals/${avatarKey?.toLowerCase().trim() || 'default'}.png`;

  const confetti = useMemo(
    () =>
      Array.from({ length: 36 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: 1.1 + Math.random() * 0.6,
        duration: 2.2 + Math.random() * 1.6,
        rotate: Math.random() * 720 - 360,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        w: 6 + Math.random() * 6,
      })),
    [],
  );

  const SIZE = 168;
  const t = (s: number) => (reduceMotion ? 0 : s);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#04110A]/80 backdrop-blur-md p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label={`${name}'s real profile is revealed`}
        >
          {/* Confetti */}
          {!reduceMotion &&
            confetti.map((c) => (
              <motion.span
                key={c.id}
                className="pointer-events-none absolute top-0 rounded-sm"
                style={{ left: `${c.x}%`, width: c.w, height: c.w * 0.45, backgroundColor: c.color }}
                initial={{ y: -40, opacity: 0, rotate: 0 }}
                animate={{ y: '105vh', opacity: [0, 1, 1, 0.6], rotate: c.rotate }}
                transition={{ delay: c.delay, duration: c.duration, ease: 'easeIn' }}
              />
            ))}

          <motion.div
            className="relative w-full max-w-sm rounded-[28px] bg-white dark:bg-[#0D131F] px-6 pb-6 pt-10 text-center shadow-2xl"
            initial={{ scale: 0.9, y: 24, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: t(0.45), ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-[10px] font-extrabold uppercase tracking-[1.5px] text-emerald-600 dark:text-emerald-400">
              250 points reached
            </p>

            {/* Avatar stage */}
            <div className="relative mx-auto mt-5" style={{ width: SIZE, height: SIZE }}>
              {/* Glow */}
              <motion.div
                className="absolute -inset-6 rounded-full"
                style={{ background: `radial-gradient(circle, ${accent}55 0%, transparent 70%)` }}
                animate={reduceMotion ? undefined : { scale: [0.9, 1.1, 1], opacity: [0, 1, 0.7] }}
                transition={{ duration: 1.6, delay: 0.9 }}
              />

              {/* Real photo snaps into focus */}
              <motion.div
                className="absolute inset-0 overflow-hidden rounded-full ring-4 ring-white dark:ring-[#0D131F] shadow-xl"
                style={{ background: `linear-gradient(135deg, ${accent}, #10B981)` }}
                initial={{ filter: 'blur(22px)', scale: 1.08 }}
                animate={{ filter: 'blur(0px)', scale: 1 }}
                transition={{ delay: t(0.9), duration: t(1.1), ease: [0.22, 1, 0.36, 1] }}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-jakarta text-6xl font-black text-white">
                    {name.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </motion.div>

              {/* Animal mask splits in two and falls away */}
              {!reduceMotion &&
                (['left', 'right'] as const).map((side) => (
                  <motion.div
                    key={side}
                    className="absolute inset-0 flex items-center justify-center rounded-full"
                    style={{
                      backgroundColor: `${accent}`,
                      clipPath: side === 'left' ? 'inset(0 50% 0 0)' : 'inset(0 0 0 50%)',
                    }}
                    initial={{ x: 0, rotate: 0, opacity: 1 }}
                    animate={{
                      x: side === 'left' ? -90 : 90,
                      y: 40,
                      rotate: side === 'left' ? -28 : 28,
                      opacity: 0,
                    }}
                    transition={{ delay: 0.55, duration: 0.9, ease: [0.55, 0, 0.75, 0.2] }}
                  >
                    <img
                      src={animalSrc}
                      alt={emoji}
                      className="h-[72%] w-[72%] object-contain"
                      draggable={false}
                    />
                  </motion.div>
                ))}

              {/* Keepsake badge */}
              <motion.div
                className="absolute -bottom-1 -right-1 flex h-12 w-12 items-center justify-center rounded-full bg-white p-1.5 shadow-lg dark:bg-[#1A2333]"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: t(1.6), type: 'spring', stiffness: 380, damping: 18 }}
              >
                <img src={animalSrc} alt="" className="h-full w-full object-contain" draggable={false} />
              </motion.div>
            </div>

            <h2 className="mt-6 min-h-[2rem] font-jakarta text-2xl font-black text-[#0F172A] dark:text-white">
              {reduceMotion ? name : typed}
              {!reduceMotion && typed.length < name.length && (
                <span className="ml-0.5 inline-block w-[2px] animate-pulse bg-emerald-500 align-middle" style={{ height: '1.1em' }} />
              )}
            </h2>
            <p className="mt-1 text-sm text-[#64748B] dark:text-gray-400">
              {partnerAlias && fullName ? `was ${partnerAlias} all along.` : 'Your ally is revealed!'}
            </p>

            <motion.button
              type="button"
              onClick={() => {
                close();
                onSayHi?.();
              }}
              className="mt-6 w-full rounded-2xl bg-[#1A6B3C] py-3 font-jakarta text-sm font-extrabold text-white shadow-md hover:bg-[#15592F] active:scale-[0.98] transition"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: t(2.1) }}
            >
              Say hi, {firstName} 👋
            </motion.button>
            <button
              type="button"
              onClick={close}
              className="mt-2 w-full py-2 text-xs font-semibold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              Maybe later
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
};

export default AvatarRevealCeremony;
