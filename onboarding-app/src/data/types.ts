// Source of truth for the onboarding domain type, shared by the frontend and the
// edge functions. Mirrors the `onboarding_steps` table columns exactly.
export interface OnboardingStep {
  id: string;
  position: number;
  title: string;
  body: string;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

// Field length limits — mirror the DB check constraints so the API rejects oversized
// input with a 400 before it ever reaches Postgres.
export const TITLE_MAX_LENGTH = 200;
export const BODY_MAX_LENGTH = 10000;
