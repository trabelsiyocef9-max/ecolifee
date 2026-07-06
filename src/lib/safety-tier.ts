// Dynamic safety tier calculation from date of birth.
// Tier 1 (<13): scissors, tape, glue, hand-folding only.
// Tier 2 (13–15): basic supervised tools allowed.
// Tier 3 (16+): standard household tools allowed.
// Computed fresh on every call — never cached.

export type SafetyTier = 1 | 2 | 3;

export function getAgeInYears(dob: Date, now: Date = new Date()): number {
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age;
}

export function getSafetyTier(dob: Date, now: Date = new Date()): SafetyTier {
  const age = getAgeInYears(dob, now);
  if (age < 13) return 1;
  if (age < 16) return 2;
  return 3;
}
