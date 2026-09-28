// src/constants/roadmap.ts
//
// Central configuration for Ally Roadmap progression, platform positions,
// daily tasks, streak milestones, and stage rules.
// Mirrors the mobile app (ally-app/app/pages/roadmap.tsx) while providing
// responsive layout configs for desktop web.

export const STAGES = [1, 2, 3, 4] as const;
export type RoadmapStageNumber = (typeof STAGES)[number];

/** Days of consecutive chat streak needed to unlock each stage */
export const STAGE_STREAK_REQS = [0, 0, 3, 7, 10]; // index = stage (0: unused, 1: 0d, 2: 3d, 3: 7d, 4: 10d)

/** Points required to unlock real profile / mutual identity */
export const TOTAL_POINTS_FOR_PROFILE_UNLOCK = 500;

export const STAGE_NAMES = [
  'Stranger',
  'Anonymous Chat',
  'Play Games Together',
  'Media Sharing',
  'Campus Allies',
] as const;

export function stageName(stage: number): string {
  return STAGE_NAMES[stage] ?? 'Campus Allies';
}

export function stageMultiplier(stage: number): number {
  if (stage <= 1) return 1;
  if (stage === 2) return 2;
  if (stage === 3) return 3;
  return 4;
}

export interface RoadmapTaskDef {
  taskId: string;
  label: string;
  description: string;
  basePoints: number;
  unlockedAtStage: number;
}

export const MASTER_DAILY_TASKS: RoadmapTaskDef[] = [
  {
    taskId: 'send_message',
    label: 'Send a message',
    description: 'Both of you send at least 1 message today',
    basePoints: 1,
    unlockedAtStage: 1,
  },
  {
    taskId: 'play_game',
    label: 'Play a game together',
    description: 'Play a campus mini-game together (5+ min)',
    basePoints: 2,
    unlockedAtStage: 2,
  },
  {
    taskId: 'send_photo',
    label: 'Share a photo',
    description: 'Each of you share at least 1 photo in chat',
    basePoints: 3,
    unlockedAtStage: 3,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 🎮 PLATFORM LAYOUT CONFIG
//
//  top   → 0.0 (image top) … 1.0 (image bottom) — vertical placement
//  left  → 0.0 (image left) … 1.0 (image right) — horizontal placement
//  scale → platform scale multiplier (1.0 = default 104px base)
// ─────────────────────────────────────────────────────────────────────────────
export interface RoadmapPlatformConfig {
  stage: number;
  top: number;
  left: number;
  scale: number;
}

export const PLATFORM_BASE_SIZE = 104; // base width/height in px before scaling

/**
 * Unified platform coordinates for the landscape roadmap image (1024 x 512, 2:1 aspect ratio).
 * Positioned along the central winding dirt path from the foreground to the distant crest.
 * Shared across Desktop Web, Web Mobile, and Native Mobile App.
 *
 * Coordinates are normalized to the 1024 x 512 image:
 *   top   → 0.0 (image top) … 1.0 (image bottom)
 *   left  → 0.0 (image left) … 1.0 (image right)
 *   scale → platform size scale factor relative to PLATFORM_BASE_SIZE
 */
export const ROADMAP_PLATFORM_CONFIG: RoadmapPlatformConfig[] = [
  { stage: 1, top: 0.80, left: 0.58, scale: 0.70 }, // Stage 1 (foreground path)
  { stage: 2, top: 0.67, left: 0.50, scale: 0.60 }, // Stage 2 (mid-lower curve)
  { stage: 3, top: 0.58, left: 0.44, scale: 0.53 }, // Stage 3 (mid-upper curve)
  { stage: 4, top: 0.48, left: 0.64, scale: 0.45 }, // Stage 4 (crest of the hill)
];

// Aliases for compatibility
export const ROADMAP_LANDSCAPE_PLATFORMS = ROADMAP_PLATFORM_CONFIG;
export const ROADMAP_MOBILE_PLATFORMS = ROADMAP_PLATFORM_CONFIG;
