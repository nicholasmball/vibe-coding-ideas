-- Fix CRITICAL: Prevent privilege escalation via direct PostgREST updates.
--
-- The users UPDATE RLS policy from 00006 allows any user to update ALL columns
-- on their own row, including is_admin, is_bot, ai_enabled, ai_daily_limit.
-- A malicious user can bypass the application layer and call PostgREST directly
-- to set is_admin = true, gaining full admin access.
--
-- Fix: BEFORE UPDATE trigger that resets sensitive columns for non-admin users.
-- This is safer than modifying the RLS policy because it works regardless of
-- which policy grants the UPDATE (self-update or admin-update).

CREATE OR REPLACE FUNCTION public.prevent_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_is_admin boolean;
BEGIN
  -- Check if the caller (real auth user) is an admin
  SELECT COALESCE(u.is_admin, false) INTO caller_is_admin
  FROM public.users u
  WHERE u.id = auth.uid();

  -- Non-admins cannot modify sensitive columns
  IF NOT caller_is_admin THEN
    NEW.is_admin := OLD.is_admin;
    NEW.is_bot := OLD.is_bot;
    NEW.ai_enabled := OLD.ai_enabled;
    NEW.ai_daily_limit := OLD.ai_daily_limit;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER prevent_privilege_escalation
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_privilege_escalation();
