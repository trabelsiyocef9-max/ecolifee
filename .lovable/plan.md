## Goal

Replace the Face++ selfie-based age gate with a self-declared date of birth captured at signup, stored on the profile, and used to compute a safety tier dynamically on every server request.

---

## 1. Clear existing accounts

Run a migration/data step that:
- Deletes all rows from `public.profiles`.
- Deletes all users from `auth.users` (cascades to `auth.identities`, sessions, etc.).

Schema is changing and existing accounts have no `date_of_birth`.

## 2. Database schema changes

Migration on `public.profiles`:
- Drop `age` column (the current stand-in for estimated age).
- Add `date_of_birth date` (nullable at first so the trigger can insert, then enforced via app-level validation on signup).
- Update `handle_new_user()` trigger to also read `raw_user_meta_data->>'date_of_birth'` and insert it into the profile.
- Keep existing RLS (user reads/writes own row only). No new grants needed.

Note on "encrypted at rest": Lovable Cloud's Postgres storage is already encrypted at rest by the platform. We will not add pgcrypto/column-level encryption because the value must be readable server-side on every request to compute the tier, and per-user key management is out of scope. The privacy copy will describe it as "stored securely" rather than "encrypted" to stay accurate — flagging this so you can confirm before build.

## 3. Remove Face++

- Delete `src/lib/age-check.functions.ts`.
- Delete `src/routes/age-check.tsx` and remove its route usage (auth signup currently redirects to `/age-check` — redirect to `/scanner` instead).
- Remove `FACE_API_KEY` / `FACE_API_SECRET` secret references from code (secrets themselves stay in the vault, unused — mention to user they can delete).
- Remove any imports/UI referencing the selfie age check.

## 4. Signup flow (`src/routes/auth.tsx` + `useAuth`)

- Add a Date of Birth input to the signup form (native `<input type="date">` for simplicity and accessibility, styled to match).
- Label: "Date of Birth — used only to set your safety preferences".
- Helper text below input: "We store your date of birth securely. It is never shared and is deleted when you close your account."
- Client validation:
  - Required.
  - Must be a real past date.
  - Age must be ≥ 4 years (reject implausible dates).
  - If declared age < 13, show inline notice: "This app is designed for users 13 and older. You can still use it, but some features will be limited." (Signup still allowed.)
- Disclosure line above submit button: "By signing up, you confirm that your date of birth is accurate. We use it only to personalize safety settings."
- Pass `date_of_birth` (ISO `YYYY-MM-DD`) into `supabase.auth.signUp` via `options.data` so the `handle_new_user` trigger persists it.
- Update `useAuth` `signUp` signature to accept `dateOfBirth: string`.
- Update `Profile` type and loader to include `date_of_birth`.
- After signup, navigate directly to `/scanner` (no more `/age-check`).

## 5. Safety tier utility

New file `src/lib/safety-tier.ts` (plain module, usable by server code):

```ts
export type SafetyTier = 1 | 2 | 3;
export function getAgeInYears(dob: Date, now = new Date()): number { ... }
export function getSafetyTier(dob: Date, now = new Date()): SafetyTier {
  const age = getAgeInYears(dob, now);
  if (age < 13) return 1;
  if (age < 16) return 2;
  return 3;
}
```

- Pure function, no caching, `now` defaults to `new Date()` so it's re-evaluated per call.
- Tier semantics documented in a comment (tier 1: scissors/tape/glue/hand-folding; tier 2: basic supervised tools; tier 3: standard household tools).

## 6. `recipe.functions.ts` integration

- Add `.middleware([requireSupabaseAuth])` if not already present (needed to read the user's DOB).
- Remove any `age` / `tier` field from the input validator — client no longer sends it.
- Inside the handler:
  1. Query `profiles.date_of_birth` for `context.userId` via `context.supabase`.
  2. If missing, fail with a clear error ("Complete your profile to generate recipes").
  3. Compute `tier = getSafetyTier(new Date(dob))` and `ageYears = getAgeInYears(...)`.
  4. Pass `ageYears` into the existing prompt logic exactly where the old `age` value was used.
- Leave Gemini calls, material identification, safety prompts, and fallback logic untouched.
- Remove any client-side code that was passing age/tier to `generateRecipe`.

## 7. Files touched

- `supabase/migrations/*` — new migration (delete users, drop `age`, add `date_of_birth`, update trigger).
- `src/hooks/useAuth.tsx` — signUp signature + profile shape.
- `src/routes/auth.tsx` — DOB field, validation, under-13 notice, disclosure line, redirect target.
- `src/routes/age-check.tsx` — delete.
- `src/lib/age-check.functions.ts` — delete.
- `src/lib/safety-tier.ts` — new.
- `src/lib/recipe.functions.ts` — server-side DOB lookup + tier calculation; drop client-supplied age.
- `src/routes/scanner.tsx` — remove any age/tier argument passed to `generateRecipe` (no other changes).
- `src/integrations/supabase/types.ts` — regenerated after migration.

## 8. Out of scope (explicitly untouched)

Scanner UI, hobby selector, tools selector, recipe rendering, camera modal, markdown styling.

---

## One decision to confirm before build

The prompt says "encrypted date_of_birth column (type: date, encrypted at rest)". Platform-level encryption at rest is already on; column-level encryption (pgcrypto) would make the DOB unusable for the per-request tier calculation without app-side key management. Plan is to rely on platform encryption + RLS (user can only read their own row) and phrase the UI copy as "stored securely". Say the word if you want true column-level encryption instead and I'll add a pgcrypto-based approach with a server-held key.