-- Allow admins to update any user's profile (for AI toggle, daily limit, etc.)
-- The existing policy only allows auth.uid() = id, so admin updates to other
-- users silently fail (RLS filters out non-matching rows with no error).
CREATE POLICY "Admins can update any user"
  ON public.users FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.is_admin = true
    )
  );
