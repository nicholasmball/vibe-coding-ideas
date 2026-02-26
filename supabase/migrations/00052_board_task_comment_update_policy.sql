-- Allow comment authors (and bot owners) to update their own board task comments.
-- The idea comments table already has this policy via migration 00039;
-- board_task_comments was missing an UPDATE policy.

CREATE POLICY "Authors can update own"
  ON public.board_task_comments FOR UPDATE
  USING (
    author_id = auth.uid()
    OR is_bot_owner(author_id, auth.uid())
  )
  WITH CHECK (
    author_id = auth.uid()
    OR is_bot_owner(author_id, auth.uid())
  );
