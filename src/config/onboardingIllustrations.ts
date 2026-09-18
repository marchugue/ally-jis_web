/**
 * onboardingIllustrations.ts (Web)
 * Central plug-in configuration for web onboarding illustrations.
 *
 * HOW TO USE:
 * 1. Place your custom illustration image in `public/` (e.g. `public/illustrations/step-1.png`)
 *    or import it (e.g. `import basicInfoImg from '@/assets/step-1.png'`).
 * 2. Assign the path or imported URL to the corresponding key below.
 * 3. FALLBACK GUARANTEE: If any key is set to null/undefined or if the image fails to load,
 *    the app will automatically and seamlessly fall back to the built-in hardcoded vector SVG.
 */

export interface OnboardingIllustrationAssets {
  /** Email type selection screen illustration */
  emailSelect: string | null;
  /** Step 1: Basic Info (username, email, password) */
  basicInfo: string | null;
  /** Step 2: Academic details (course, year, department, orgs) */
  academic: string | null;
  /** Step 3: Campus passions and interests */
  interests: string | null;
  /** Step 4: Avatar picker and student bio */
  avatar: string | null;
  /** External student ID or COR document upload */
  idUpload: string | null;
  /** OTP verification screen */
  otp: string | null;
}

export const ONBOARDING_ILLUSTRATION_ASSETS: OnboardingIllustrationAssets = {
  emailSelect: '/illustrations/email-select.jpg',
  basicInfo: '/illustrations/step-1-basic-info.jpg',
  academic: '/illustrations/step-2-academic.jpg',
  interests: '/illustrations/step-3-interests.jpg',
  avatar: null, // Fallback to SVG until custom avatar image is added (/illustrations/step-4-avatar.jpg)
  idUpload: '/illustrations/step-id-upload.jpg',
  otp: '/illustrations/step-otp.jpg',
};

/**
 * Helper to update illustrations at runtime or from a dynamic theme loader.
 */
export function setOnboardingIllustrations(config: Partial<OnboardingIllustrationAssets>) {
  Object.assign(ONBOARDING_ILLUSTRATION_ASSETS, config);
}

export function setOnboardingIllustration(key: keyof OnboardingIllustrationAssets, src: string | null) {
  ONBOARDING_ILLUSTRATION_ASSETS[key] = src;
}
