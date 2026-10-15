import { Style, Avatar } from '@dicebear/core';
import critters from '@dicebear/styles/critters.json';
import { avatarColorFor } from './matchOptions';

const crittersStyle = new Style(critters);

// In-memory cache for fast, synchronous lookups
const dataUriCache = new Map<string, string>();
const svgCache = new Map<string, string>();

const WARMUP_ANIMALS = [
  'fox', 'wolf', 'whale', 'owl', 'panda', 'otter',
  'falcon', 'koala', 'lynx', 'dolphin', 'raven', 'badger',
];

export function warmCrittersCache() {
  for (const animal of WARMUP_ANIMALS) {
    getCrittersAvatarDataUri(animal, null, 84);
    getCrittersAvatarDataUri(animal, null, 64);
    getCrittersAvatarDataUri(animal, null, 48);
  }
}

// Auto pre-warm on module evaluation in browser so matchmaking click is 100% instant
if (typeof window !== 'undefined') {
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(warmCrittersCache);
  } else {
    setTimeout(warmCrittersCache, 50);
  }
}

/**
 * Returns a normalized seed string from an avatar key or name.
 */
export function normalizeCrittersSeed(seed?: string | null): string {
  if (!seed || typeof seed !== 'string') return 'ally';
  const clean = seed.trim().toLowerCase();
  return clean || 'ally';
}

/**
 * Normalizes background color to hex without '#' for DiceBear options.
 */
export function normalizeCrittersBg(seed?: string | null, customBg?: string | null): string {
  const color = customBg || avatarColorFor(seed);
  return color.replace(/^#/, '');
}

/**
 * Returns a DiceBear Critters SVG as a Data URI.
 * Cached in memory for maximum performance.
 */
export function getCrittersAvatarDataUri(
  seed?: string | null,
  customBg?: string | null,
  size?: number
): string {
  const safeSeed = normalizeCrittersSeed(seed);
  const bgHex = normalizeCrittersBg(seed, customBg);
  const cacheKey = `${safeSeed}:${bgHex}:${size || 'auto'}`;

  const cached = dataUriCache.get(cacheKey);
  if (cached) return cached;

  try {
    const avatar = new Avatar(crittersStyle, {
      seed: safeSeed,
      backgroundColor: [bgHex],
      borderRadius: 50,
      ...(size ? { size } : {}),
    });
    const uri = avatar.toDataUri();
    dataUriCache.set(cacheKey, uri);
    return uri;
  } catch (err) {
    console.warn('[DiceBear] Failed to render local critters avatar, using fallback:', err);
    const fallback = `https://api.dicebear.com/10.x/critters/svg?seed=${encodeURIComponent(
      safeSeed
    )}&backgroundColor=${bgHex}&radius=50`;
    return fallback;
  }
}

/**
 * Returns the raw SVG string for the DiceBear Critters avatar.
 */
export function getCrittersAvatarSvg(
  seed?: string | null,
  customBg?: string | null,
  size?: number
): string {
  const safeSeed = normalizeCrittersSeed(seed);
  const bgHex = normalizeCrittersBg(seed, customBg);
  const cacheKey = `${safeSeed}:${bgHex}:${size || 'auto'}`;

  const cached = svgCache.get(cacheKey);
  if (cached) return cached;

  try {
    const avatar = new Avatar(crittersStyle, {
      seed: safeSeed,
      backgroundColor: [bgHex],
      borderRadius: 50,
      ...(size ? { size } : {}),
    });
    const svg = avatar.toString();
    svgCache.set(cacheKey, svg);
    return svg;
  } catch (err) {
    console.warn('[DiceBear] Failed to render critters SVG:', err);
    return '';
  }
}

/**
 * Fallback / direct HTTP API URL for the Critters style.
 */
export function getCrittersHttpUrl(
  seed?: string | null,
  customBg?: string | null,
  format: 'svg' | 'png' = 'svg'
): string {
  const safeSeed = normalizeCrittersSeed(seed);
  const bgHex = normalizeCrittersBg(seed, customBg);
  return `https://api.dicebear.com/10.x/critters/${format}?seed=${encodeURIComponent(
    safeSeed
  )}&backgroundColor=${bgHex}&radius=50`;
}
