// src/lib/avatarRevealCache.ts
//
// Fast in-memory (0ms) and persistent localStorage cache for AvatarRevealView.
// Ensures instant rendering without flashes or loading delays when opening
// chats, chat lists, roadmaps, or switching views.

import type { AvatarRevealView } from '@/api/types';
import { avatarColorFor } from '@/lib/matchOptions';

const REVEAL_CACHE_KEY_PREFIX = 'ally_avatar_reveal_';
const TIER_THRESHOLDS = [0, 50, 100, 150, 200, 250];
const DEFAULT_TARGET = 250;

// L1 In-Memory Cache (0ms synchronous access)
const memoryRevealCache = new Map<string, AvatarRevealView>();

/**
 * Synchronously retrieves cached avatar reveal from memory or localStorage.
 */
export function getCachedAvatarReveal(matchId?: string | null): AvatarRevealView | null {
  if (!matchId) return null;
  const inMem = memoryRevealCache.get(matchId);
  if (inMem) return inMem;

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(REVEAL_CACHE_KEY_PREFIX + matchId);
      if (raw) {
        const parsed = JSON.parse(raw) as AvatarRevealView;
        if (parsed && typeof parsed.tier === 'number') {
          memoryRevealCache.set(matchId, parsed);
          return parsed;
        }
      }
    } catch {
      // Ignore storage errors
    }
  }

  return null;
}

/**
 * Loads cached avatar reveal from memory or falls back to localStorage.
 */
export async function loadCachedAvatarReveal(
  matchId?: string | null
): Promise<AvatarRevealView | null> {
  return getCachedAvatarReveal(matchId);
}

/**
 * Saves avatar reveal data to both memory and localStorage.
 */
export function setCachedAvatarReveal(
  matchId: string,
  reveal: AvatarRevealView
): void {
  if (!matchId || !reveal) return;
  memoryRevealCache.set(matchId, reveal);
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(
        REVEAL_CACHE_KEY_PREFIX + matchId,
        JSON.stringify(reveal)
      );
    } catch {
      // Ignore storage errors
    }
  }
}

/**
 * Synthesizes an AvatarRevealView given the match points.
 * Ensures the UI can immediately display the correct blur, opacity,
 * and progress curve even before the network request completes.
 */
export function synthesizeAvatarReveal(
  matchPoints: number = 0,
  options?: {
    target?: number;
    previewUrl?: string | null;
    dominantColor?: string | null;
    partnerAvatar?: string | null;
  }
): AvatarRevealView {
  const target = options?.target ?? DEFAULT_TARGET;
  const pts = Math.max(0, matchPoints);
  const progress = Math.min(1, Math.max(0, pts / target));

  let tier = 0;
  for (let i = TIER_THRESHOLDS.length - 1; i >= 0; i--) {
    if (pts >= TIER_THRESHOLDS[i]) {
      tier = i;
      break;
    }
  }

  const tierStart = TIER_THRESHOLDS[tier] ?? 0;
  const tierEnd = TIER_THRESHOLDS[tier + 1] ?? target;
  const dominantColor =
    options?.dominantColor || avatarColorFor(options?.partnerAvatar);

  return {
    previewUrl: options?.previewUrl || null,
    dominantColor: dominantColor || null,
    tier,
    maxTier: TIER_THRESHOLDS.length - 1,
    tierStart,
    tierEnd,
    target,
    matchPoints: pts,
    progress,
    hasPhoto: Boolean(options?.previewUrl),
    tierThresholds: TIER_THRESHOLDS,
  };
}

/**
 * Resolves the best available avatar reveal object:
 * 1. Authoritative server response if available (and updates cache)
 * 2. L1 in-memory / localStorage cache
 * 3. Synthesized reveal computed from matchPoints if known
 */
export function getEffectiveAvatarReveal(
  matchId?: string | null,
  matchPoints?: number,
  rawReveal?: AvatarRevealView | null,
  options?: {
    previewUrl?: string | null;
    dominantColor?: string | null;
    partnerAvatar?: string | null;
    target?: number;
  }
): AvatarRevealView | null {
  if (rawReveal && typeof rawReveal.tier === 'number') {
    if (matchId) {
      setCachedAvatarReveal(matchId, rawReveal);
    }
    return rawReveal;
  }

  const cached = getCachedAvatarReveal(matchId);
  if (cached) {
    // If passed matchPoints is higher than cached, update points & progress
    if (typeof matchPoints === 'number' && matchPoints > cached.matchPoints) {
      const updated = synthesizeAvatarReveal(matchPoints, {
        target: cached.target,
        previewUrl: cached.previewUrl || options?.previewUrl,
        dominantColor: cached.dominantColor || options?.dominantColor,
        partnerAvatar: options?.partnerAvatar,
      });
      if (matchId) setCachedAvatarReveal(matchId, updated);
      return updated;
    }
    return cached;
  }

  if (typeof matchPoints === 'number') {
    const synthesized = synthesizeAvatarReveal(matchPoints, options);
    if (matchId) setCachedAvatarReveal(matchId, synthesized);
    return synthesized;
  }

  return null;
}
