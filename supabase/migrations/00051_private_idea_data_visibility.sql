-- Fix HIGH: Private idea data leakage via comments, votes, collaborators.
--
-- When private ideas were introduced (00027), only the ideas SELECT policy was
-- updated. The comments, votes, and collaborators tables still have USING (true)
-- SELECT policies from 00006, leaking private idea content through associated data.
--
-- Fix: Replace USING (true) with visibility-aware policies that check idea
-- visibility and team membership, matching the pattern from 00027.

-- Helper: check if the current user can view an idea (matches 00027 logic)
CREATE OR REPLACE FUNCTION public.can_view_idea(p_idea_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY INVOKER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.ideas
    WHERE id = p_idea_id
    AND (
      visibility = 'public'
      OR author_id = auth.uid()
      OR EXISTS (SELECT 1 FROM public.collaborators WHERE idea_id = p_idea_id AND user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
    )
  );
$$;

-- ============================================
-- Comments — restrict to viewable ideas
-- ============================================
DROP POLICY "Comments are viewable by everyone" ON public.comments;

CREATE POLICY "Comments are viewable based on idea visibility"
  ON public.comments FOR SELECT
  USING (
    can_view_idea(idea_id)
  );

-- ============================================
-- Votes — restrict to viewable ideas
-- ============================================
DROP POLICY "Votes are viewable by everyone" ON public.votes;

CREATE POLICY "Votes are viewable based on idea visibility"
  ON public.votes FOR SELECT
  USING (
    can_view_idea(idea_id)
  );

-- ============================================
-- Collaborators — restrict to viewable ideas
-- ============================================
DROP POLICY "Collaborators are viewable by everyone" ON public.collaborators;

CREATE POLICY "Collaborators are viewable based on idea visibility"
  ON public.collaborators FOR SELECT
  USING (
    can_view_idea(idea_id)
  );
