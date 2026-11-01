// src/constants/roadmap.ts
//
// Pure visual 2D layout configuration for the Ally Roadmap canvas.
// All progression rules, daily tasks, multiplied rewards, stage names,
// unlock targets, and streak milestones are supplied exclusively by the backend API.

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
 */
export const ROADMAP_PLATFORM_CONFIG: RoadmapPlatformConfig[] = [
  { stage: 1, top: 0.80, left: 0.58, scale: 0.70 }, // Stage 1 (foreground path)
  { stage: 2, top: 0.67, left: 0.50, scale: 0.60 }, // Stage 2 (mid-lower curve)
  { stage: 3, top: 0.58, left: 0.44, scale: 0.53 }, // Stage 3 (mid-upper curve)
  { stage: 4, top: 0.48, left: 0.64, scale: 0.45 }, // Stage 4 (crest of the hill)
];

export const ROADMAP_LANDSCAPE_PLATFORMS = ROADMAP_PLATFORM_CONFIG;
export const ROADMAP_MOBILE_PLATFORMS = ROADMAP_PLATFORM_CONFIG;
