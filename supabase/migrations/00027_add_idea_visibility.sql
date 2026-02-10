-- Add visibility to ideas (public/private)
CREATE TYPE idea_visibility AS ENUM ('public', 'private');

ALTER TABLE public.ideas
  ADD COLUMN visibility idea_visibility NOT NULL DEFAULT 'public';

CREATE INDEX ideas_visibility_idx ON public.ideas(visibility);

-- Replace the old "everyone can read" policy with visibility-aware policy
DROP POLICY "Ideas are viewable by everyone" ON public.ideas;

CREATE POLICY "Ideas are viewable based on visibility"
  ON public.ideas FOR SELECT
  USING (
    visibility = 'public'
    OR auth.uid() = author_id
    OR EXISTS (SELECT 1 FROM collaborators WHERE idea_id = ideas.id AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  );
