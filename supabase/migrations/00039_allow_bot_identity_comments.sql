-- Allow bot owners to insert/update/delete comments as their bots.
-- Fixes: "new row violates row-level security policy for table comments"
-- when using set_bot_identity on the remote MCP server.

-- Helper: returns true if p_bot_id is an active bot owned by p_owner_id.
CREATE OR REPLACE FUNCTION public.is_bot_owner(p_bot_id uuid, p_owner_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM bot_profiles
    WHERE id = p_bot_id
      AND owner_id = p_owner_id
      AND is_active = true
  );
END;
$$;

-- ============================================
-- comments table — INSERT
-- ============================================
DROP POLICY "Authenticated users can create comments" ON public.comments;
CREATE POLICY "Authenticated users can create comments"
  ON public.comments FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = author_id
    OR is_bot_owner(author_id, auth.uid())
  );

-- ============================================
-- comments table — UPDATE (own comments)
-- ============================================
DROP POLICY "Authors can update their own comments" ON public.comments;
CREATE POLICY "Authors can update their own comments"
  ON public.comments FOR UPDATE
  USING (
    auth.uid() = author_id
    OR is_bot_owner(author_id, auth.uid())
  )
  WITH CHECK (
    auth.uid() = author_id
    OR is_bot_owner(author_id, auth.uid())
  );

-- ============================================
-- comments table — DELETE
-- ============================================
DROP POLICY "Authors can delete their own comments" ON public.comments;
CREATE POLICY "Authors can delete their own comments"
  ON public.comments FOR DELETE
  USING (
    auth.uid() = author_id
    OR is_bot_owner(author_id, auth.uid())
  );

-- ============================================
-- board_task_comments — DELETE
-- (INSERT already works — its policy only checks team membership, not author_id)
-- ============================================
DROP POLICY "Authors can delete own" ON public.board_task_comments;
CREATE POLICY "Authors can delete own" ON public.board_task_comments FOR DELETE
  USING (
    author_id = auth.uid()
    OR is_bot_owner(author_id, auth.uid())
  );
