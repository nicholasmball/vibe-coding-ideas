-- Fix security issues from PR #5 code review

-- Fix #3: Restrict UPDATE on collaboration_requests to idea author only.
-- Previously the requester could also update, allowing self-approval via direct
-- Supabase client call (setting status = 'accepted' without author consent).
-- The requester uses DELETE (not UPDATE) to withdraw pending requests.
DROP POLICY "Requester or idea author can update requests" ON collaboration_requests;

CREATE POLICY "Idea author can update requests"
  ON collaboration_requests FOR UPDATE TO authenticated
  USING (
    auth.uid() = (SELECT author_id FROM ideas WHERE id = idea_id)
  )
  WITH CHECK (
    auth.uid() = (SELECT author_id FROM ideas WHERE id = idea_id)
  );

-- Fix #4: Replace SECURITY DEFINER with SECURITY INVOKER on is_idea_public.
-- SECURITY DEFINER bypasses RLS on the ideas table, which is unnecessary here
-- since the function only checks the visibility column. SECURITY INVOKER is safer
-- and sufficient because the board read policies call this function in a context
-- where the user already has SELECT access to the ideas table via RLS.
CREATE OR REPLACE FUNCTION is_idea_public(p_idea_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (SELECT 1 FROM ideas WHERE id = p_idea_id AND visibility = 'public');
$$ LANGUAGE sql STABLE;

-- Fix #5: Add index for "fetch all pending requests for an idea" queries.
-- The idea detail page queries: WHERE idea_id = ? AND status = 'pending'
CREATE INDEX IF NOT EXISTS idx_collaboration_requests_idea_status
  ON collaboration_requests (idea_id, status);
