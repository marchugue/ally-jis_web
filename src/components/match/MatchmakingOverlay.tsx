// src/components/match/MatchmakingOverlay.tsx
//
// Full-screen matchmaking queue overlay — rendered via React Portal
// directly on document.body so it's never clipped by an ancestor's
// overflow / stacking context.
//
// • Searching phase  → carousel of anonymous avatars endlessly sliding
// • Match-found phase → matched avatar pops in + accept / decline buttons

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Check, X } from 'lucide-react';
import { AnonymousAvatar } from './AnonymousAvatar';
import { AVATAR_EMOJI, avatarColorFor } from '@/lib/matchOptions';
import type { MatchIdentityView } from '@/api/client';

// ─── Countdown hook ──────────────────────────────────────────────────────────
function useCountdown(deadline: number | null): number {
  const [remaining, setRemaining] = useState(() =>
    deadline ? Math.max(0, deadline - Date.now()) : 0,
  );
  useEffect(() => {
    if (!deadline) return;
    const tick = () => setRemaining(Math.max(0, deadline - Date.now()));
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [deadline]);
  return remaining;
}

// ─── Avatar carousel items ───────────────────────────────────────────────────
const CAROUSEL_KEYS = Object.keys(AVATAR_EMOJI);
const LOOP_ITEMS = [...CAROUSEL_KEYS, ...CAROUSEL_KEYS];

const CARD_W = 88;
const CARD_GAP = 12;

function AvatarCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const xRef = useRef(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const totalW = CAROUSEL_KEYS.length * (CARD_W + CARD_GAP);
    const speed = 0.6;

    const step = () => {
      xRef.current -= speed;
      if (Math.abs(xRef.current) >= totalW) xRef.current = 0;
      if (trackRef.current) {
        trackRef.current.style.transform = `translateX(${xRef.current}px)`;
      }
      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div
      className="overflow-hidden w-full"
      style={{ maskImage: 'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)' }}
    >
      <div
        ref={trackRef}
        className="flex"
        style={{ gap: CARD_GAP, width: 'max-content', willChange: 'transform' }}
      >
        {LOOP_ITEMS.map((key, idx) => {
          const color = avatarColorFor(key);
          const emoji = AVATAR_EMOJI[key];
          return (
            <div
              key={`${key}-${idx}`}
              style={{
                width: CARD_W - CARD_GAP,
                height: CARD_W - CARD_GAP,
                borderRadius: 20,
                backgroundColor: `${color}18`,
                border: `2px solid ${color}55`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 32,
                flexShrink: 0,
              }}
            >
              {emoji}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Pulsing search dots ─────────────────────────────────────────────────────
function SearchingDots() {
  return (
    <div className="flex items-center gap-1.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            backgroundColor: '#1A6B3C',
            display: 'inline-block',
            animation: `searching-bounce 1.2s ease-in-out ${i * 0.18}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes searching-bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40%            { transform: scale(1);   opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
interface MatchmakingOverlayProps {
  phase: 'searching' | 'pending';
  identity: MatchIdentityView | null;
  myAccepted: boolean;
  acceptDeadline: number | null;
  onCancel: () => void;
  onAccept: () => void;
  onDecline: () => void;
}

export function MatchmakingOverlay({
  phase,
  identity,
  myAccepted,
  acceptDeadline,
  onCancel,
  onAccept,
  onDecline,
}: MatchmakingOverlayProps) {
  const remainingMs = useCountdown(acceptDeadline);
  const seconds = Math.ceil(remainingMs / 1000);
  const matchColor = avatarColorFor(identity?.partnerAvatar);

  return createPortal(
    <motion.div
      key="matchmaking-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      // z-[9999] ensures it's on top of everything — portal puts it on body
      // so no ancestor overflow container can clip or re-stack it.
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{
        background: 'linear-gradient(160deg, #0a1f12 0%, #0d2b1a 50%, #0a1f12 100%)',
      }}
    >
      {/* Animated radial glow */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse 60% 50% at 50% 40%, ${
            phase === 'pending' ? matchColor : '#1A6B3C'
          }22 0%, transparent 70%)`,
          pointerEvents: 'none',
          transition: 'background 0.6s',
        }}
      />

      <div className="relative z-10 flex flex-col items-center w-full max-w-sm px-6 gap-8">

        {/* Brand mark */}
        <div className="flex flex-col items-center gap-1 mt-2">
          <p className="font-fraunces text-white/40 text-xs tracking-widest uppercase">
            Match Buddy
          </p>
        </div>

        {/* Central visual area */}
        <AnimatePresence mode="wait">
          {phase === 'searching' ? (
            <motion.div
              key="searching"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center gap-6 w-full"
            >
              <div className="w-full">
                <AvatarCarousel />
              </div>

              {/* Ping rings */}
              <div className="relative flex items-center justify-center" style={{ width: 88, height: 88 }}>
                {[1, 2, 3].map((i) => (
                  <span
                    key={i}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: '50%',
                      border: '2px solid #1A6B3C',
                      animation: `ping-ring 2s ease-out ${i * 0.55}s infinite`,
                      opacity: 0,
                    }}
                  />
                ))}
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #1A6B3C, #2d8a56)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 32,
                    boxShadow: '0 0 0 4px #1A6B3C33',
                  }}
                >
                  🎭
                </div>
              </div>

              <style>{`
                @keyframes ping-ring {
                  0%   { transform: scale(1);   opacity: 0.6; }
                  100% { transform: scale(2.2); opacity: 0; }
                }
              `}</style>

              <div className="text-center space-y-2">
                <p className="font-jakarta text-white text-lg font-semibold">
                  Finding your anonymous match…
                </p>
                <p className="font-jakarta text-white/50 text-sm">
                  Someone at CHMSU is about to appear
                </p>
                <SearchingDots />
              </div>
            </motion.div>
          ) : (
            /* MATCH FOUND */
            <motion.div
              key="match-found"
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: -20 }}
              transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
              className="flex flex-col items-center gap-6 w-full"
            >
              {/* Avatar reveal */}
              <div className="relative flex items-center justify-center">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.5, ease: 'easeOut' }}
                  style={{
                    position: 'absolute',
                    width: 140,
                    height: 140,
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${matchColor}44 0%, transparent 70%)`,
                  }}
                />
                <motion.div
                  initial={{ scale: 0, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.15, duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
                >
                  <AnonymousAvatar
                    avatarKey={identity?.partnerAvatar}
                    size={104}
                    className=""
                  />
                </motion.div>
              </div>

              {/* Name + tagline */}
              <div className="text-center space-y-1.5">
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="font-fraunces text-white text-2xl font-bold"
                >
                  {identity?.partnerAlias ?? 'A match'}
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.35 }}
                  className="font-jakarta text-white/55 text-sm"
                >
                  is ready to chat anonymously
                </motion.p>
              </div>

              {/* Countdown bar */}
              {!myAccepted && acceptDeadline && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="w-full"
                >
                  <div
                    className="h-1 rounded-full bg-white/10 overflow-hidden w-full"
                    style={{ maxWidth: 240, margin: '0 auto' }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.min(100, (remainingMs / 30000) * 100)}%`,
                        background:
                          remainingMs < 8000
                            ? 'linear-gradient(90deg, #ff6b6b, #ff3b3b)'
                            : `linear-gradient(90deg, ${matchColor}, #2d8a56)`,
                        transition: 'width 0.25s linear, background 0.5s',
                        borderRadius: 999,
                      }}
                    />
                  </div>
                  <p className="font-jakarta text-white/40 text-xs text-center mt-1.5 flex items-center justify-center gap-1">
                    <Clock size={11} />
                    {seconds > 0 ? `${seconds}s to respond` : 'Expiring…'}
                  </p>
                </motion.div>
              )}

              {/* Action buttons */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="w-full"
              >
                {myAccepted ? (
                  <div className="flex flex-col items-center gap-2 py-4">
                    <motion.div
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 1.4, repeat: Infinity }}
                    >
                      <Clock className="text-[#1A6B3C]" size={28} />
                    </motion.div>
                    <p className="font-jakarta text-white/60 text-sm">
                      Waiting for them to accept…
                    </p>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <button
                      onClick={onDecline}
                      className="flex-1 flex items-center justify-center gap-2 border border-white/15 text-white/70 font-jakarta font-medium py-3.5 rounded-2xl hover:bg-white/8 transition-colors active:scale-95"
                    >
                      <X size={17} /> Skip
                    </button>
                    <button
                      onClick={onAccept}
                      className="flex-1 flex items-center justify-center gap-2 font-jakarta font-bold py-3.5 rounded-2xl active:scale-95 transition-all"
                      style={{
                        background: `linear-gradient(135deg, ${matchColor}, #2d8a56)`,
                        color: '#fff',
                        boxShadow: `0 4px 20px ${matchColor}66`,
                      }}
                    >
                      <Check size={17} /> Chat!
                    </button>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cancel / leave queue */}
        {phase === 'searching' && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            onClick={onCancel}
            className="font-jakarta text-sm text-white/35 hover:text-white/70 transition-colors py-2 px-6 rounded-full hover:bg-white/5"
          >
            Cancel search
          </motion.button>
        )}
      </div>
    </motion.div>,
    document.body,
  );
}
