-- Add ai_enabled flag to users for gating AI features
ALTER TABLE public.users ADD COLUMN ai_enabled boolean NOT NULL DEFAULT false;
