-- Add onboarding tracking to users table
ALTER TABLE public.users ADD COLUMN onboarding_completed_at timestamptz DEFAULT NULL;
