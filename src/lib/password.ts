export interface PasswordRule {
  key: string;
  label: string;
  test: (p: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
  { key: 'length', label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { key: 'upper', label: 'One uppercase letter (A–Z)', test: (p) => /[A-Z]/.test(p) },
  { key: 'lower', label: 'One lowercase letter (a–z)', test: (p) => /[a-z]/.test(p) },
  { key: 'digit', label: 'One number (0–9)', test: (p) => /[0-9]/.test(p) },
  { key: 'special', label: 'One special character (!@#…)', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export function validatePassword(password: string): string | null {
  if (!password) return 'Password is required.';
  const failed = PASSWORD_RULES.filter((r) => !r.test(password));
  if (failed.length === 0) return null;
  return `Password must include ${failed.map((r) => r.label.toLowerCase()).join(', ')}.`;
}

export function passwordStrengthPercent(password: string): number {
  if (!password) return 0;
  const passed = PASSWORD_RULES.filter((r) => r.test(password)).length;
  return Math.round((passed / PASSWORD_RULES.length) * 100);
}

export function passwordStrengthLabel(pct: number): string {
  if (pct <= 20) return 'Very weak';
  if (pct <= 40) return 'Weak';
  if (pct <= 60) return 'Fair';
  if (pct <= 80) return 'Strong';
  return 'Very strong';
}

export function passwordStrengthColor(pct: number): string {
  if (pct <= 20) return '#EF4444';
  if (pct <= 40) return '#F97316';
  if (pct <= 60) return '#EAB308';
  if (pct <= 80) return '#84CC16';
  return '#22C55E';
}
