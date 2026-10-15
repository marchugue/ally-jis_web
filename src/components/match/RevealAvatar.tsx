// src/components/match/RevealAvatar.tsx
//
// Progressive real-avatar reveal ("pet seamlessly morphs into real avatar").
//
// Layers (bottom → top):
//   1. Aura        — radial glow from photo dominant color
//   2. Real Photo  — emerges underneath with blur easing from 16px -> 0px
//   3. Avatar Pet  — animal emoji / Fluent 3D art centered on top, smoothly dissolving
//                    (opacity 1.0 -> 0.0) so the real avatar emerges directly through the pet!
//   4. Shimmer     — light sweep effect on tier up / point gain
//   5. Progress Ring — SVG ring showing match progress (0 -> 250 pts)
//   6. +N pt chip  — floats up on point updates

import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { AVATAR_EMOJI, DEFAULT_AVATAR_EMOJI, avatarColorFor } from '@/lib/matchOptions';
import { getCrittersAvatarDataUri, getCrittersHttpUrl } from '@/lib/dicebearCritters';
import { computeRevealVisual } from '@/lib/avatarReveal';
import type { AvatarRevealView } from '@/api/types';

export interface RevealAvatarProps {
  reveal?: AvatarRevealView | null | undefined;
  avatarKey?: string | null;
  /** Diameter of the avatar circle in px (ring is drawn outside it). */
  size?: number;
  showRing?: boolean;
  showGainChip?: boolean;
  /** Fallback initials for partners without a photo (tier 5 only). */
  fallbackInitials?: string | null;
  className?: string;
  /** Called once when a new tier is crossed while mounted. */
  onTierUp?: (tier: number) => void;
}

const RING_GAP = 3.5;

function PetGraphic({ avatarKey, px }: { avatarKey?: string | null; px: number }) {
  const [failed, setFailed] = useState(false);
  const bg = avatarColorFor(avatarKey);
  const src = failed
    ? getCrittersHttpUrl(avatarKey, bg)
    : getCrittersAvatarDataUri(avatarKey, bg, px);

  return (
    <img
      src={src}
      alt={avatarKey || 'Pet'}
      draggable={false}
      onError={() => setFailed(true)}
      className="w-full h-full object-cover rounded-full pointer-events-none select-none drop-shadow-md"
    />
  );
}

export const RevealAvatar: React.FC<RevealAvatarProps> = ({
  reveal,
  avatarKey,
  size = 40,
  showRing = true,
  showGainChip = false,
  fallbackInitials,
  className,
  onTierUp,
}) => {
  const reduceMotion = useReducedMotion();
  const gradId = `reveal-ring-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const accent = avatarColorFor(avatarKey);

  const tier = reveal?.tier ?? 0;
  const matchPoints = reveal?.matchPoints ?? 0;
  const target = reveal?.target ?? 250;
  const progress = reveal?.progress ?? 0;
  const isRevealed = tier >= 5;

  const visual = useMemo(
    () =>
      computeRevealVisual(
        {
          tier,
          matchPoints,
          tierStart: reveal?.tierStart ?? 0,
          tierEnd: reveal?.tierEnd ?? target,
          progress,
        },
        size,
      ),
    [tier, matchPoints, reveal?.tierStart, reveal?.tierEnd, target, progress, size],
  );

  // Seamless pet dissolve curve:
  // Starts 100% solid, fades to 0% as progress reaches 100% (250 pts)
  const petOpacity = isRevealed ? 0 : Math.max(0, 1 - Math.pow(progress, 0.72));
  const photoOpacity = tier === 0 ? 0 : Math.min(1, 0.3 + progress * 0.75);

  // ── Track gains & tier crossings ─────────────────────────────────────────
  const prevPoints = useRef<number | null>(null);
  const prevTier = useRef<number | null>(null);
  const [gain, setGain] = useState<{ id: number; amount: number } | null>(null);
  const [sweepKey, setSweepKey] = useState(0);

  useEffect(() => {
    if (prevPoints.current !== null && matchPoints > prevPoints.current) {
      setGain({ id: Date.now(), amount: matchPoints - prevPoints.current });
      setSweepKey((k) => k + 1);
    }
    prevPoints.current = matchPoints;
  }, [matchPoints]);

  useEffect(() => {
    if (prevTier.current !== null && tier > prevTier.current) {
      setSweepKey((k) => k + 1);
      onTierUp?.(tier);
    }
    prevTier.current = tier;
  }, [tier, onTierUp]);

  useEffect(() => {
    if (!gain) return;
    const t = setTimeout(() => setGain(null), 1400);
    return () => clearTimeout(t);
  }, [gain]);

  // ── Geometry ────────────────────────────────────────────────────────────
  const outer = showRing ? size + RING_GAP * 2 + 4 : size;
  const inset = (outer - size) / 2;
  const stroke = Math.max(2.5, Math.round(size * 0.05));
  const radius = outer / 2 - stroke / 2;
  const circumference = 2 * Math.PI * radius;

  const petSize = Math.round(size * 0.78);
  const aura = reveal?.dominantColor ?? accent;
  const ease = [0.22, 1, 0.36, 1] as const;
  const dur = (s: number) => (reduceMotion ? 0 : s);

  const thresholds = (reveal?.tierThresholds ?? [0, 50, 100, 150, 200, 250]).slice(1, -1);

  return (
    <div
      className={cn('relative shrink-0 select-none flex items-center justify-center', className)}
      style={{ width: outer, height: outer }}
      role="img"
      aria-label={
        isRevealed
          ? 'Real avatar revealed'
          : `Avatar ${Math.round(progress * 100)}% revealed (${matchPoints}/${target} pts)`
      }
    >
      {/* ── Progress Ring (SVG) ── */}
      {showRing && (
        <svg width={outer} height={outer} className="absolute inset-0 -rotate-90 overflow-visible pointer-events-none">
          <circle
            cx={outer / 2}
            cy={outer / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            className="stroke-black/10 dark:stroke-white/15"
          />
          <motion.circle
            cx={outer / 2}
            cy={outer / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            stroke={isRevealed ? `url(#${gradId}-done)` : `url(#${gradId})`}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference * (1 - progress) }}
            transition={{ duration: dur(0.8), ease }}
          />
          {thresholds.map((pts) => {
            const a = (pts / target) * Math.PI * 2;
            const reached = matchPoints >= pts;
            const r1 = radius - stroke * 0.9;
            const r2 = radius + stroke * 0.9;
            return (
              <line
                key={pts}
                x1={outer / 2 + Math.cos(a) * r1}
                y1={outer / 2 + Math.sin(a) * r1}
                x2={outer / 2 + Math.cos(a) * r2}
                y2={outer / 2 + Math.sin(a) * r2}
                strokeWidth={Math.max(1, stroke * 0.35)}
                strokeLinecap="round"
                className={reached ? 'stroke-white dark:stroke-[#0D131F]' : 'stroke-black/20 dark:stroke-white/20'}
              />
            );
          })}
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1A6B3C" />
              <stop offset="60%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#2DD4BF" />
            </linearGradient>
            <linearGradient id={`${gradId}-done`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
          </defs>
        </svg>
      )}

      {/* ── Main Avatar Circle Frame ── */}
      <div
        className="absolute rounded-full overflow-hidden flex items-center justify-center transition-all duration-300"
        style={{
          left: inset,
          top: inset,
          width: size,
          height: size,
          backgroundColor: `${accent}1F`,
          boxShadow: `inset 0 0 0 1.5px ${accent}66`,
        }}
      >
        {/* Layer 1: Ambient Aura Glow */}
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${aura}88 0%, ${aura}33 55%, transparent 100%)`,
          }}
          animate={
            tier === 0 && !reduceMotion
              ? { scale: [0.92, 1.06, 0.92], opacity: [0.6, 0.95, 0.6] }
              : { opacity: 0.8 }
          }
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Layer 2: Real Photo (Emerging from blur & increasing opacity) */}
        <AnimatePresence initial={false}>
          {reveal?.previewUrl && photoOpacity > 0 ? (
            <motion.img
              key={reveal.previewUrl}
              src={reveal.previewUrl}
              alt=""
              draggable={false}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
              initial={{ opacity: 0, filter: `blur(${visual.blurPx + 4}px)`, scale: 1.15 }}
              animate={{
                opacity: photoOpacity,
                filter: `blur(${visual.blurPx}px)`,
                scale: isRevealed ? 1 : 1.08,
              }}
              transition={{ duration: dur(0.85), ease }}
            />
          ) : isRevealed && !reveal?.previewUrl ? (
            <motion.div
              className="absolute inset-0 flex items-center justify-center font-jakarta font-black text-white"
              style={{ fontSize: size * 0.36, background: `linear-gradient(135deg, ${accent}, ${aura})` }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: dur(0.6) }}
            >
              {(fallbackInitials || '?').slice(0, 2).toUpperCase()}
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Layer 3: Avatar Pet Graphic (Centered, smoothly dissolving as points grow!) */}
        {petOpacity > 0.01 && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            initial={false}
            animate={{
              opacity: petOpacity,
              scale: isRevealed ? 1.12 : 1 + progress * 0.05,
            }}
            transition={{ duration: dur(0.85), ease }}
            style={{ width: size, height: size }}
          >
            <div style={{ width: petSize, height: petSize }} className="flex items-center justify-center">
              <PetGraphic avatarKey={avatarKey} px={petSize} />
            </div>
          </motion.div>
        )}

        {/* Layer 4: Shimmer Light Sweep on Points Gain / Tier Up */}
        <AnimatePresence>
          {sweepKey > 0 && !reduceMotion && (
            <motion.div
              key={sweepKey}
              className="absolute inset-y-0 w-3/4 pointer-events-none"
              style={{
                background:
                  'linear-gradient(105deg, transparent 0%, rgba(255,255,255,0.0) 25%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0) 75%, transparent 100%)',
              }}
              initial={{ x: '-130%' }}
              animate={{ x: '230%' }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, ease: 'easeInOut' }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Layer 5: +N Points Gain Chip */}
      <AnimatePresence>
        {showGainChip && gain && (
          <motion.span
            key={gain.id}
            className="absolute -top-3.5 left-1/2 z-30 -translate-x-1/2 rounded-full bg-amber-400 px-1.5 py-0.2 text-[10px] font-black font-mono text-amber-950 shadow-md whitespace-nowrap pointer-events-none"
            initial={{ opacity: 0, y: 4, scale: 0.8 }}
            animate={{ opacity: 1, y: -6, scale: 1 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: dur(0.4), ease }}
          >
            +{gain.amount} pt
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RevealAvatar;
