// src/lib/matchOptions.ts
//
// Static option lists for the matchmaking feature. The avatar map's keys
// must match the `avatar` values the backend hands out (see backend:
// src/app/constants/anonymousIdentity.ts) — emoji rather than an icon
// library so there's no dependency on any particular icon set having
// these exact animals.

export const AVATAR_EMOJI: Record<string, string> = {
  fox: '🦊',
  wolf: '🐺',
  whale: '🐋',
  owl: '🦉',
  panda: '🐼',
  otter: '🦦',
  falcon: '🦅',
  koala: '🐨',
  lynx: '🐱',
  dolphin: '🐬',
  raven: '🐦‍⬛',
  badger: '🦡',
};

export const DEFAULT_AVATAR_EMOJI = '🎭';

// Background color rotates by avatar key so the same alias always renders
// with the same color for a given viewer, without needing a color stored
// server-side.
export const AVATAR_COLORS = ['#1A6B3C', '#3B8C7E', '#B8860B', '#6B5B95', '#C0654B', '#3B6E8C'];

export function avatarColorFor(avatarKey: string | null | undefined): string {
  if (!avatarKey) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < avatarKey.length; i++) hash = (hash * 31 + avatarKey.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[hash];
}

export const ZODIAC_OPTIONS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

export const PERSONALITY_TYPE_OPTIONS = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP',
  'Not sure',
];

export const AGE_RANGE_OPTIONS = ['18–20', '21–23', '24–26', '27+'];

export const MATCH_GENDER_PREFERENCE_OPTIONS = [
  'Anyone',
  'Men',
  'Women',
  'Non-binary people',
  'Prefer not to say',
];

export const MUSIC_TASTE_OPTIONS = [
  'OPM', 'Pop', 'R&B', 'Hip-Hop', 'K-Pop', 'Rock', 'Indie', 'Acoustic',
  'EDM', 'Jazz', 'Classical', 'Lo-fi',
];

export const MOVIE_INTEREST_OPTIONS = [
  'Action', 'Romance', 'Horror', 'Comedy', 'Anime', 'Drama',
  'Sci-Fi', 'Thriller', 'Documentary', 'Fantasy', 'K-Drama', 'Musicals',
];

// Mirrors backend src/app/constants/progression.ts — display-only here,
// the backend is the source of truth for what's actually unlocked.
export const STAGE_LABELS = ['Stranger', 'Comfortable', 'Trust Building', 'Familiar', 'Close Connection'];
export const STAGE_DAY_THRESHOLDS = [0, 3, 5, 7, 10];
