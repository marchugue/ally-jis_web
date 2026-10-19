export interface PasswordRule {
  key: string;
  label: string;
  hint: string;
  test: (p: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
  { key: 'length',  label: 'At least 8 characters',        hint: 'Need at least 8 characters',        test: (p) => p.length >= 8 },
  { key: 'upper',   label: 'One uppercase letter (A–Z)',    hint: 'Need an uppercase letter (A–Z)',    test: (p) => /[A-Z]/.test(p) },
  { key: 'lower',   label: 'One lowercase letter (a–z)',    hint: 'Need a lowercase letter (a–z)',    test: (p) => /[a-z]/.test(p) },
  { key: 'digit',   label: 'One number (0–9)',              hint: 'Need a number (0–9)',              test: (p) => /[0-9]/.test(p) },
  { key: 'special', label: 'One special character (!@#…)',   hint: 'Need a special character (!@#…)',  test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export function validatePassword(password: string): string | null {
  if (!password) return 'Password is required.';
  const failed = PASSWORD_RULES.filter((r) => !r.test(password));
  if (failed.length === 0) return null;
  return `Password must include ${failed.map((r) => r.label.toLowerCase()).join(', ')}.`;
}

/** Returns the number of satisfied rules (0 to 5) */
export function passwordStrengthScore(password: string): number {
  if (!password) return 0;
  return PASSWORD_RULES.filter((r) => r.test(password)).length;
}

/** Returns the next missing requirement to guide the user dynamically, or null if all satisfied */
export function getNextPasswordRequirement(password: string): PasswordRule | null {
  if (!password) return PASSWORD_RULES[0];
  const missing = PASSWORD_RULES.find((r) => !r.test(password));
  return missing || null;
}

export function passwordStrengthPercent(password: string): number {
  if (!password) return 0;
  const passed = passwordStrengthScore(password);
  return Math.round((passed / PASSWORD_RULES.length) * 100);
}

/** Returns strength tier matching Dropbox reference (supports score 0..5 or pct 0..100) */
export function passwordStrengthLabel(scoreOrPct: number): string {
  const score = scoreOrPct > 5 ? Math.round((scoreOrPct / 100) * 5) : scoreOrPct;
  if (score <= 1) return 'Very weak';
  if (score === 2) return 'Weak';
  if (score === 3) return 'So-so';
  if (score === 4) return 'Good';
  return 'Great!';
}

/** Returns color matching Dropbox reference (supports score 0..5 or pct 0..100) */
export function passwordStrengthColor(scoreOrPct: number): string {
  const score = scoreOrPct > 5 ? Math.round((scoreOrPct / 100) * 5) : scoreOrPct;
  if (score <= 1) return '#EF4444'; // Red
  if (score === 2) return '#F97316'; // Orange
  if (score === 3) return '#EAB308'; // Amber / So-so
  if (score === 4) return '#84CC16'; // Lime / Good
  return '#22C55E'; // Green / Great!
}

