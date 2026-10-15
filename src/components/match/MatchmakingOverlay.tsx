// src/components/match/MatchmakingOverlay.tsx
//
// Full-screen matchmaking queue overlay — inspired by Litmatch Soul Match.
// Powered by Animotion CSS3 and Framer Motion.
// Rendered via React Portal directly on document.body.
//
// • Searching phase  → Consecutively cycling horizontal avatars (Left -> Center -> Right),
//                      pure clean carousel, acoustic equalizer waveform,
//                      and campus telemetry status ticker.
// • Match-found phase → Carousel locks onto the matched avatar in the CENTER, shockwave burst,
//                      "Match Found!" badge with soul affinity score.
// • Revealed phase   → Editorial confirmation card, online badge, shared interest tags,
//                      affinity stats, and "Connect & Chat" action.

import { useEffect, useState, memo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Check,
  X,
  Sparkles,
  RotateCw,
  Radio,
} from 'lucide-react';
import './animotionQueue.css';
import { AnonymousAvatar } from './AnonymousAvatar';
import { avatarColorFor, ANIMAL_KEYS } from '@/lib/matchOptions';
import type { MatchIdentityView, MatchmakingPreferences } from '@/api/client';

// ─── Countdown Hook ───────────────────────────────────────────────────────────
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

// ─── Telemetry Status Messages ───────────────────────────────────────────────
const TELEMETRY_MESSAGES = [
  'Scanning active student souls on Alijis campus…',
  'Harmonizing mutual interests & curriculum year…',
  'Analyzing course compatibility & vibe synergy…',
  'Filtering campus vibes and shared passions…',
  'Locking onto an anonymous peer session…',
];

// ─── Celestial Starfield Data ────────────────────────────────────────────────
const STARFIELD_STARS = [
  { id: 1, top: '7%', left: '11%', size: 2, color: '#E8A838', anim: 'animotion-twinkle-fast', delay: '0.2s' },
  { id: 2, top: '14%', left: '86%', size: 2.5, color: '#56E39F', anim: 'animotion-twinkle-medium', delay: '0.8s' },
  { id: 3, top: '21%', left: '26%', size: 1.5, color: '#FFFFFF', anim: 'animotion-twinkle-slow', delay: '1.4s' },
  { id: 4, top: '26%', left: '74%', size: 2, color: '#FCD34D', anim: 'animotion-twinkle-fast', delay: '0.5s' },
  { id: 5, top: '34%', left: '7%', size: 2, color: '#FFFFFF', anim: 'animotion-twinkle-medium', delay: '2.1s' },
  { id: 6, top: '39%', left: '93%', size: 1.5, color: '#6EE7B7', anim: 'animotion-twinkle-slow', delay: '1.1s' },
  { id: 7, top: '64%', left: '13%', size: 2.5, color: '#E8A838', anim: 'animotion-twinkle-fast', delay: '1.7s' },
  { id: 8, top: '73%', left: '84%', size: 2, color: '#FFFFFF', anim: 'animotion-twinkle-medium', delay: '0.3s' },
  { id: 9, top: '84%', left: '22%', size: 1.5, color: '#56E39F', anim: 'animotion-twinkle-slow', delay: '2.5s' },
  { id: 10, top: '89%', left: '69%', size: 2, color: '#FCD34D', anim: 'animotion-twinkle-fast', delay: '1.9s' },
  { id: 11, top: '9%', left: '46%', size: 1.5, color: '#FFFFFF', anim: 'animotion-twinkle-slow', delay: '3.0s' },
  { id: 12, top: '58%', left: '79%', size: 2, color: '#6EE7B7', anim: 'animotion-twinkle-medium', delay: '0.7s' },
  { id: 13, top: '79%', left: '38%', size: 1.5, color: '#E8A838', anim: 'animotion-twinkle-fast', delay: '2.2s' },
  { id: 14, top: '47%', left: '16%', size: 2, color: '#FFFFFF', anim: 'animotion-twinkle-medium', delay: '1.3s' },
  { id: 15, top: '31%', left: '89%', size: 2.5, color: '#56E39F', anim: 'animotion-twinkle-slow', delay: '0.9s' },
  { id: 16, top: '4%', left: '64%', size: 2, color: '#FCD34D', anim: 'animotion-twinkle-fast', delay: '1.6s' },
  { id: 17, top: '93%', left: '9%', size: 1.5, color: '#FFFFFF', anim: 'animotion-twinkle-slow', delay: '2.8s' },
  { id: 18, top: '87%', left: '91%', size: 2, color: '#E8A838', anim: 'animotion-twinkle-medium', delay: '0.4s' },
  { id: 19, top: '52%', left: '83%', size: 1.5, color: '#FFFFFF', anim: 'animotion-twinkle-fast', delay: '1.5s' },
  { id: 20, top: '18%', left: '5%', size: 2, color: '#56E39F', anim: 'animotion-twinkle-slow', delay: '2.4s' },
];

const SPARKLE_CONSTELLATIONS = [
  { id: 's1', top: '12%', left: '18%', size: 'text-xs', color: 'text-amber-300/80', delay: '0.4s' },
  { id: 's2', top: '16%', left: '81%', size: 'text-sm', color: 'text-emerald-300/85', delay: '1.2s' },
  { id: 's3', top: '70%', left: '10%', size: 'text-xs', color: 'text-emerald-400/75', delay: '2.0s' },
  { id: 's4', top: '81%', left: '87%', size: 'text-sm', color: 'text-amber-300/85', delay: '0.9s' },
  { id: 's5', top: '44%', left: '95%', size: 'text-xs', color: 'text-white/70', delay: '1.7s' },
  { id: 's6', top: '3%', left: '35%', size: 'text-xs', color: 'text-amber-400/70', delay: '2.6s' },
];

// ─── Memoized Starfield Background ───
const StarfieldLayer = memo(() => (
  <>
    <div className="absolute inset-0 pointer-events-none opacity-45 animotion-starfield" />
    <div className="absolute -top-12 right-1/4 w-36 h-[2px] bg-gradient-to-r from-transparent via-amber-200 to-white animotion-shooting-star pointer-events-none opacity-80" />
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {STARFIELD_STARS.map((star) => (
        <span
          key={star.id}
          className={`absolute rounded-full pointer-events-none ${star.anim}`}
          style={{
            top: star.top,
            left: star.left,
            width: `${star.size}px`,
            height: `${star.size}px`,
            backgroundColor: star.color,
            boxShadow: `0 0 6px ${star.color}`,
            animationDelay: star.delay,
          }}
        />
      ))}
      {SPARKLE_CONSTELLATIONS.map((sp) => (
        <span
          key={sp.id}
          className={`absolute pointer-events-none select-none font-serif ${sp.size} ${sp.color} animotion-twinkle-medium`}
          style={{
            top: sp.top,
            left: sp.left,
            animationDelay: sp.delay,
            filter: 'drop-shadow(0 0 6px currentColor)',
          }}
        >
          ✦
        </span>
      ))}
    </div>
  </>
));

// ─── Props ────────────────────────────────────────────────────────────────────
export interface MatchmakingOverlayProps {
  phase: 'searching' | 'pending';
  identity: MatchIdentityView | null;
  preferences?: MatchmakingPreferences | null;
  myAccepted: boolean;
  acceptDeadline: number | null;
  compatibilityScore?: number | null;
  onCancel: () => void;
  onAccept: () => void;
  onDecline: () => void;
  // Mock mode test controls
  isMock?: boolean;
  onForceMatch?: () => void;
  onRestartSearch?: () => void;
  onCyclePartner?: () => void;
}

export function MatchmakingOverlay({
  phase,
  identity,
  preferences,
  myAccepted,
  acceptDeadline,
  compatibilityScore,
  onCancel,
  onAccept,
  onDecline,
  isMock = false,
  onForceMatch,
  onRestartSearch,
  onCyclePartner,
}: MatchmakingOverlayProps) {
  const remainingMs = useCountdown(acceptDeadline);
  const seconds = Math.ceil(remainingMs / 1000);
  const partnerAvatarKey = identity?.partnerAvatar ?? 'wolf';
  const matchColor = avatarColorFor(partnerAvatarKey);

  // Visual stage choreography (Litmatch style):
  // 'searching' → Clean carousel of avatars cycling: Left -> Center -> Right!
  // 'detected'  → Cycling locks, matched avatar pops in the CENTER!
  // 'revealed'  → Confirmation card animates in.
  const [stage, setStage] = useState<'searching' | 'detected' | 'revealed'>(
    phase === 'pending' ? 'revealed' : 'searching',
  );

  useEffect(() => {
    if (phase === 'pending') {
      setStage('detected');
      const timer = setTimeout(() => {
        setStage('revealed');
      }, 1250);
      return () => clearTimeout(timer);
    } else {
      setStage('searching');
    }
  }, [phase, identity?.partnerAvatar]);

  // Consecutive Horizontal Avatar Cycling:
  // Each step moves avatars from Left (-1) -> Center (0) -> Right (+1)!
  const [cycleStep, setCycleStep] = useState(0);

  useEffect(() => {
    if (stage !== 'searching') return;
    const interval = setInterval(() => {
      setCycleStep((prev) => prev + 1);
    }, 720); // 720ms cadence
    return () => clearInterval(interval);
  }, [stage]);

  // Cycling telemetry status
  const [telemetryIndex, setTelemetryIndex] = useState(0);
  useEffect(() => {
    if (phase !== 'searching') return;
    const interval = setInterval(() => {
      setTelemetryIndex((prev) => (prev + 1) % TELEMETRY_MESSAGES.length);
    }, 2600);
    return () => clearInterval(interval);
  }, [phase]);

  // Handle escape key to dismiss/cancel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  return createPortal(
    <motion.div
      key="matchmaking-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-between p-4 sm:p-6 overflow-hidden select-none"
      style={{
        background: 'radial-gradient(circle at 50% 35%, #0B1E13 0%, #06110A 55%, #030805 100%)',
      }}
    >
      {/* ── Layer 1-3: Memoized Starfield Background ── */}
      <StarfieldLayer />

      {/* ── Layer 4: Ambient Core Nebula Glow ── */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[540px] h-[540px] rounded-full blur-3xl pointer-events-none opacity-35 transition-colors duration-700"
        style={{
          background: `radial-gradient(circle, ${matchColor} 0%, rgba(26,107,60,0.45) 45%, transparent 70%)`,
        }}
      />

      {/* ── Header: Brand Bar with Litmatch-Style Soul Match Badge ── */}
      <div className="relative z-20 w-full max-w-2xl flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#1A6B3C] flex items-center justify-center shadow-md">
            <span className="text-white font-fraunces font-bold text-base leading-none">A</span>
          </div>
          <span className="font-fraunces font-bold text-lg text-white tracking-wide">
            Ally<span className="text-[#E8A838]">-jis</span>
          </span>
        </div>

        <button
          onClick={onCancel}
          className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Cancel search"
        >
          <X size={18} />
        </button>
      </div>

      {/* ── Central Main Arena ── */}
      <div className="relative z-10 flex-1 w-full max-w-md flex items-center justify-center py-2">
        <div className="w-full grid grid-cols-1 grid-rows-1 place-items-center -translate-y-8 sm:-translate-y-12">
          <AnimatePresence>
            {stage !== 'revealed' ? (
              /* ═══════════════════════════════════════════════════════════
                 STAGE 1 & 2: PURE CLEAN LITMATCH HORIZONTAL CAROUSEL
                 - No background pulse animation (just the carousel)
                 - No avatar animal emoji badges
                 - No borders around the avatars
                 - No anonymous user persona tag
                 - Elevated slightly higher
                 ═══════════════════════════════════════════════════════════ */
              <motion.div
                key="litmatch-queue-stage"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="col-start-1 row-start-1 flex flex-col items-center gap-4 sm:gap-5 w-full text-center"
              >
                {/* Litmatch Badge Header */}
                <div className="flex flex-col items-center gap-1.5">
                  <h3 className="font-fraunces font-bold text-xl sm:text-2xl text-white tracking-wide">
                    Finding Your Campus Ally
                  </h3>
                </div>

                {/* ── Litmatch Avatar Conveyor Track (Pure Carousel, No Background Pulse Rings) ── */}
                <div
                  className="relative w-full max-w-[360px] h-[175px] flex items-center justify-center overflow-hidden"
                  style={{
                    maskImage: 'linear-gradient(to right, transparent 0%, black 18%, black 82%, transparent 100%)',
                    WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 18%, black 82%, transparent 100%)',
                  }}
                >
                  {/* ── Horizontal Conveyor Avatars Stream ── */}
                  {/* Renders a sliding window of avatars: [-2, -1, 0, +1, +2] */}
                  {/* pos = cycleStep - i: travels from Left (-1) -> Center (0) -> Right (+1) */}
                  {[-2, -1, 0, 1, 2].map((offset) => {
                    const i = cycleStep - offset;
                    const pos = offset; // -2: far-left, -1: left, 0: center, 1: right, 2: far-right
                    const slotAvatarKey =
                      stage === 'detected' && pos === 0
                        ? partnerAvatarKey
                        : ANIMAL_KEYS[((i % ANIMAL_KEYS.length) + ANIMAL_KEYS.length) % ANIMAL_KEYS.length];

                    // Coordinates & scale mapping:
                    // Left (-1)  -> x: -116px, scale: 0.78, opacity: 0.45
                    // Center (0) -> x: 0px,    scale: 1.25, opacity: 1
                    // Right (+1) -> x: 116px,  scale: 0.78, opacity: 0.45
                    const slotOffsetPx = 116;
                    let targetX = pos * slotOffsetPx;
                    let targetScale = pos === 0 ? 1.25 : 0.78;
                    let targetOpacity = pos === 0 ? 1 : Math.abs(pos) === 1 ? 0.45 : 0;

                    // When match is detected:
                    // Center avatar locks into center, neighbors glide off
                    if (stage === 'detected') {
                      if (pos === 0) {
                        targetX = 0;
                        targetScale = 1.35;
                        targetOpacity = 1;
                      } else {
                        targetX = pos < 0 ? -220 : 220;
                        targetScale = 0.4;
                        targetOpacity = 0;
                      }
                    }

                    return (
                      <motion.div
                        key={i}
                        layout
                        initial={false}
                        animate={{
                          x: targetX,
                          scale: targetScale,
                          opacity: targetOpacity,
                        }}
                        transition={{
                          type: 'spring',
                          stiffness: 220,
                          damping: 24,
                          mass: 0.8,
                        }}
                        onClick={pos === 0 && onForceMatch ? onForceMatch : undefined}
                        className={`absolute flex flex-col items-center justify-center select-none ${
                          pos === 0 && onForceMatch ? 'z-20 cursor-pointer' : 'z-10 pointer-events-none'
                        }`}
                      >
                        {/* Clean Avatar without borders or animal emojis */}
                        <div className="relative rounded-full transition-transform duration-300">
                          {/* Matched celebration shockwave explosion in center ONLY on match detected */}
                          {stage === 'detected' && pos === 0 && (
                            <>
                              <span className="absolute -inset-4 rounded-full border-2 border-emerald-400 pointer-events-none animotion-shockwave" />
                              <span
                                className="absolute -inset-8 rounded-full border border-amber-300 pointer-events-none animotion-shockwave"
                                style={{ animationDelay: '0.15s' }}
                              />
                            </>
                          )}

                          <AnonymousAvatar
                            avatarKey={slotAvatarKey}
                            size={pos === 0 ? 84 : 64}
                            borderless={true}
                            className="transition-transform duration-300 shadow-md"
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* ── Status Ticker & Acoustic Waveform ── */}
                <div className="space-y-3 max-w-sm px-4">
                  {/* Match Found Badge ONLY when match is detected */}
                  <div className="h-6 flex items-center justify-center">
                    <AnimatePresence mode="wait">
                      {stage === 'detected' ? (
                        <motion.div
                          key="detected-tag"
                          initial={{ opacity: 0, scale: 0.85, y: 4 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          className="flex items-center gap-1.5 px-4 py-1 rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-500 text-gray-950 font-jakarta font-extrabold text-xs shadow-lg shadow-emerald-500/25 tracking-wide uppercase animotion-badge-pulse"
                        >
                          <Sparkles size={13} className="text-gray-950" />
                          <span>Match Found!</span>
                          <Sparkles size={13} className="text-gray-950" />
                        </motion.div>
                      ) : (
                        <motion.p
                          key={telemetryIndex}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="font-jakarta text-xs sm:text-sm font-semibold text-emerald-300/90 tracking-wide"
                        >
                          {TELEMETRY_MESSAGES[telemetryIndex]}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Affinity score when match is detected */}
                  {stage === 'detected' && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="font-jakarta text-xs sm:text-sm font-bold text-amber-300 tracking-wide flex items-center justify-center gap-1.5"
                    >
                      <span>★</span>
                      <span>
                        {compatibilityScore ? `${compatibilityScore}%` : '96%'} Soul Affinity with{' '}
                        {identity?.partnerAlias ?? 'Campus Ally'}
                      </span>
                    </motion.p>
                  )}

                  {/* Litmatch Frequency Equalizer Waveform */}
                  <div className="flex items-center justify-center gap-1.5 pt-1">
                    {[0, 0.12, 0.24, 0.36, 0.48, 0.6, 0.72].map((delay, i) => (
                      <span
                        key={i}
                        className="w-1 rounded-full bg-gradient-to-t from-[#1A6B3C] to-[#E8A838]"
                        style={{
                          animation: `animotion-waveformLoader 1.1s ease-in-out ${delay}s infinite`,
                          animationPlayState: stage === 'detected' ? 'paused' : 'running',
                        }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              /* ═══════════════════════════════════════════════════════════
                 STAGE 3: RENOVATED CONFIRMATION CARD (EDITORIAL PROFILE LAYOUT)
                 ═══════════════════════════════════════════════════════════ */
              <motion.div
                key="pending-stage"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="col-start-1 row-start-1 flex flex-col items-center w-full"
              >
                {/* Profile Card Matching Reference (Scaled & Styled to Ally-jis System) */}
                <div
                  className="relative z-10 w-full max-w-[370px] sm:max-w-[400px] rounded-[36px] p-6 sm:p-7 border border-emerald-400/25 shadow-2xl space-y-4 sm:space-y-5 overflow-hidden"
                  style={{
                    background: 'linear-gradient(150deg, #1A6B3C 0%, #155731 28%, #0D3820 65%, #071F12 100%)',
                    boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.75), 0 0 40px rgba(26, 107, 60, 0.35)',
                  }}
                >
                  {/* Warm Amber Glow in Upper-Right Corner */}
                  <div
                    className="absolute -top-12 -right-12 w-44 h-44 rounded-full pointer-events-none opacity-20 blur-2xl"
                    style={{ background: 'radial-gradient(circle, #E8A838 0%, transparent 70%)' }}
                  />

                  {/* Diagonal Angled Sheen Overlay for Depth */}
                  <div
                    className="absolute inset-0 pointer-events-none opacity-15"
                    style={{
                      background:
                        'linear-gradient(125deg, rgba(255,255,255,0.4) 0%, transparent 40%, rgba(0,0,0,0.4) 100%)',
                    }}
                  />

                  {/* Card Top Row: Avatar on Left + 'X' Dismiss on Upper Right */}
                  <div className="relative z-10 flex items-start justify-between">
                    {/* Avatar Container with Online Indicator */}
                    <div className="relative">
                      <div className="relative z-10 rounded-full p-1 bg-white/20 backdrop-blur-md shadow-xl border border-white/30">
                        <AnonymousAvatar avatarKey={partnerAvatarKey} size={80} />
                      </div>

                      {/* Active Online Status Indicator (Green Badge matching system dark forest border) */}
                      <span
                        className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-[#10B981] border-2 border-[#071F12] shadow-md z-20"
                        title="Online now"
                      />
                    </div>

                    {/* Upper Right 'X' Button */}
                    <button
                      type="button"
                      onClick={onDecline}
                      className="w-8 h-8 rounded-full bg-black/35 hover:bg-black/55 border border-white/25 flex items-center justify-center text-white/80 hover:text-white transition-all cursor-pointer shadow-md active:scale-90"
                      aria-label="Pass match"
                      title="Pass / Dismiss"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Identity: Name & Subtitle */}
                  <div className="relative z-10 space-y-0.5 pt-1">
                    <h2 className="font-jakarta text-2xl sm:text-[25px] font-extrabold text-white tracking-tight leading-tight">
                      {identity?.partnerAlias ?? 'Campus Ally'}
                    </h2>
                    <p className="font-jakarta text-xs sm:text-sm text-white/80 font-medium">
                      {preferences?.course ?? 'Information Technology'} Student
                    </p>
                  </div>

                  {/* Interest Pills (Uniform dark glass style for maximum readability) */}
                  <div className="relative z-10 flex flex-wrap items-center gap-1.5 pt-1">
                    {(preferences?.specialization
                      ? [preferences.specialization, 'Tech & Code', 'Campus Life']
                      : ['Tech & Code', 'Web Design', 'Figma', 'Study']
                    ).map((interest, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-full text-xs font-jakarta font-medium text-white bg-black/45 backdrop-blur-md border border-white/15 shadow-xs"
                      >
                        {interest}
                      </span>
                    ))}
                    <span className="px-2.5 py-1 rounded-full text-xs font-jakarta font-semibold text-white/80 bg-black/35 backdrop-blur-md border border-white/15">
                      +3
                    </span>
                  </div>

                  {/* Stats Row (3 Columns: Affinity, Campus, Timer) */}
                  <div className="relative z-10 grid grid-cols-3 gap-2 pt-2 border-t border-white/15 text-center">
                    <div>
                      <div className="text-sm sm:text-base font-bold font-jakarta text-white flex items-center justify-center gap-1">
                        <span className="text-amber-300">★</span> {compatibilityScore ? `${compatibilityScore}%` : '96%'}
                      </div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-white/65">
                        Affinity
                      </span>
                    </div>

                    <div>
                      <div className="text-sm sm:text-base font-bold font-jakarta text-white flex items-center justify-center gap-1">
                        <span className="text-emerald-300">🎓</span> Alijis
                      </div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-white/65">
                        Campus
                      </span>
                    </div>

                    <div>
                      <div className="text-sm sm:text-base font-bold font-jakarta text-white flex items-center justify-center gap-1">
                        <span className="text-amber-200">⏳</span> {seconds}s
                      </div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-white/65">
                        Response
                      </span>
                    </div>
                  </div>

                  {/* Primary CTA Button (Clean White Pill matching reference) */}
                  <div className="relative z-10 pt-2">
                    {myAccepted ? (
                      <div className="w-full py-3.5 rounded-full bg-white/20 border border-white/30 text-white font-jakarta text-sm font-bold flex items-center justify-center gap-2 backdrop-blur-md">
                        <div className="animate-spin">
                          <RotateCw size={16} />
                        </div>
                        <span>Waiting for peer…</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={onAccept}
                        className="w-full py-3.5 sm:py-4 rounded-full bg-white hover:bg-gray-100 text-gray-900 font-jakarta text-sm sm:text-base font-extrabold shadow-xl hover:shadow-2xl transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Sparkles size={16} className="text-amber-500" />
                        <span>Connect & Chat</span>
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Footer: Clean Cancel Action (Stable Height, Zero Layout Shift) ── */}
      <div className="relative z-20 w-full max-w-md flex flex-col items-center justify-center min-h-[44px] pb-3">
        <div
          className={`transition-opacity duration-300 ${stage === 'searching' ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
        >
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 rounded-full font-jakarta text-xs font-medium text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          >
            Cancel search
          </button>
        </div>
      </div>
    </motion.div>,
    document.body,
  );
}
