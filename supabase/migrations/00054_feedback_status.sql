-- Add status column to feedback table for admin review workflow
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'new'
  CHECK (status IN ('new', 'reviewed', 'archived'));

-- Allow admins to update feedback (e.g. change status)
CREATE POLICY "Admins can update feedback"
  ON public.feedback FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  );

-- Allow admins to delete feedback
CREATE POLICY "Admins can delete feedback"
  ON public.feedback FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  );
