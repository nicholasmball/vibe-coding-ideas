-- Add is_sample flag to ideas table
-- Used to identify auto-created sample ideas from onboarding
ALTER TABLE ideas ADD COLUMN is_sample boolean NOT NULL DEFAULT false;
