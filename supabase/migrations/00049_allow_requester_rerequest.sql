-- Allow requesters to re-request after being declined.
-- The requester can ONLY update their own DECLINED requests back to PENDING.
-- This prevents self-approval (can't set to 'accepted') while enabling
-- the re-request flow without requiring a new INSERT.
CREATE POLICY "Requester can re-request after decline"
  ON collaboration_requests FOR UPDATE TO authenticated
  USING (
    auth.uid() = requester_id AND status = 'declined'
  )
  WITH CHECK (
    auth.uid() = requester_id AND status = 'pending'
  );
