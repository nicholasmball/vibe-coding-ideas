-- Migration: Public board read access + Collaboration request/approval flow
--
-- Part 1: Allow authenticated users to read board data for public ideas
-- Previously, all board table reads required is_idea_team_member().
-- Now, non-team-members can view (but not modify) boards on public ideas.
--
-- Part 2: Users request to collaborate, authors approve or decline.

-- ============================================================================
-- PART 1: Public Board Read Access
-- ============================================================================

-- Helper function: check if an idea is public
CREATE OR REPLACE FUNCTION is_idea_public(p_idea_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (SELECT 1 FROM ideas WHERE id = p_idea_id AND visibility = 'public');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- board_columns
DROP POLICY "Team members can view board columns" ON board_columns;
CREATE POLICY "Authenticated users can view board columns for public ideas or team members" ON board_columns
  FOR SELECT USING (
    is_idea_team_member(idea_id, auth.uid())
    OR (auth.uid() IS NOT NULL AND is_idea_public(idea_id))
  );

-- board_tasks
DROP POLICY "Team members can view board tasks" ON board_tasks;
CREATE POLICY "Authenticated users can view board tasks for public ideas or team members" ON board_tasks
  FOR SELECT USING (
    is_idea_team_member(idea_id, auth.uid())
    OR (auth.uid() IS NOT NULL AND is_idea_public(idea_id))
  );

-- board_labels
DROP POLICY "Team members can view board labels" ON board_labels;
CREATE POLICY "Authenticated users can view board labels for public ideas or team members" ON board_labels
  FOR SELECT USING (
    is_idea_team_member(idea_id, auth.uid())
    OR (auth.uid() IS NOT NULL AND is_idea_public(idea_id))
  );

-- board_checklist_items
DROP POLICY "Team members can view checklist items" ON board_checklist_items;
CREATE POLICY "Authenticated users can view checklist items for public ideas or team members" ON board_checklist_items
  FOR SELECT USING (
    is_idea_team_member(idea_id, auth.uid())
    OR (auth.uid() IS NOT NULL AND is_idea_public(idea_id))
  );

-- board_task_activity
DROP POLICY "Team members can view" ON board_task_activity;
CREATE POLICY "Authenticated users can view board task activity for public ideas or team members" ON board_task_activity
  FOR SELECT USING (
    is_idea_team_member(idea_id, auth.uid())
    OR (auth.uid() IS NOT NULL AND is_idea_public(idea_id))
  );

-- board_task_comments
DROP POLICY "Team members can view" ON board_task_comments;
CREATE POLICY "Authenticated users can view board task comments for public ideas or team members" ON board_task_comments
  FOR SELECT USING (
    is_idea_team_member(idea_id, auth.uid())
    OR (auth.uid() IS NOT NULL AND is_idea_public(idea_id))
  );

-- board_task_attachments
DROP POLICY "Team members can view" ON board_task_attachments;
CREATE POLICY "Authenticated users can view board task attachments for public ideas or team members" ON board_task_attachments
  FOR SELECT USING (
    is_idea_team_member(idea_id, auth.uid())
    OR (auth.uid() IS NOT NULL AND is_idea_public(idea_id))
  );

-- board_task_labels (indirect — joins through board_tasks to get idea_id)
DROP POLICY "Team members can view board task labels" ON board_task_labels;
CREATE POLICY "Authenticated users can view board task labels for public ideas or team members" ON board_task_labels
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM board_tasks bt
      WHERE bt.id = board_task_labels.task_id
      AND (
        is_idea_team_member(bt.idea_id, auth.uid())
        OR (auth.uid() IS NOT NULL AND is_idea_public(bt.idea_id))
      )
    )
  );

-- ============================================================================
-- PART 2: Collaboration Requests
-- ============================================================================

-- 2a. Enum + Table
CREATE TYPE collaboration_request_status AS ENUM ('pending', 'accepted', 'declined');

CREATE TABLE collaboration_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id uuid NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status collaboration_request_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (idea_id, requester_id)
);

ALTER TABLE collaboration_requests ENABLE ROW LEVEL SECURITY;

-- 2b. RLS policies
CREATE POLICY "Users can create own requests"
  ON collaboration_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Requester and idea author can view requests"
  ON collaboration_requests FOR SELECT TO authenticated
  USING (
    auth.uid() = requester_id
    OR auth.uid() = (SELECT author_id FROM ideas WHERE id = idea_id)
  );

CREATE POLICY "Requester or idea author can update requests"
  ON collaboration_requests FOR UPDATE TO authenticated
  USING (
    auth.uid() = requester_id
    OR auth.uid() = (SELECT author_id FROM ideas WHERE id = idea_id)
  )
  WITH CHECK (
    auth.uid() = requester_id
    OR auth.uid() = (SELECT author_id FROM ideas WHERE id = idea_id)
  );

CREATE POLICY "Requester can withdraw pending requests"
  ON collaboration_requests FOR DELETE TO authenticated
  USING (auth.uid() = requester_id AND status = 'pending');

-- 2c. New notification types + FK
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'collaboration_request';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'collaboration_response';

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS collaboration_request_id uuid REFERENCES collaboration_requests(id) ON DELETE SET NULL;

-- 2d. Notification on new request is handled by the requestCollaboration server action
-- (supports both INSERT and upsert-as-UPDATE for re-requests after decline)

-- 2e. Update notify_on_collaborator to skip request-driven inserts
-- When author accepts a request, inserting into collaborators fires this trigger.
-- We skip the notification here because respondToRequest handles it via collaboration_response.
CREATE OR REPLACE FUNCTION public.notify_on_collaborator()
RETURNS trigger AS $$
DECLARE
  idea_author_id uuid;
  prefs jsonb;
  has_accepted_request boolean;
BEGIN
  SELECT author_id INTO idea_author_id FROM public.ideas WHERE id = NEW.idea_id;

  -- Check if this collaborator insert is driven by an accepted collaboration request
  SELECT EXISTS (
    SELECT 1 FROM public.collaboration_requests
    WHERE idea_id = NEW.idea_id
      AND requester_id = NEW.user_id
      AND status = 'accepted'
  ) INTO has_accepted_request;

  -- Skip notification if this was a request-driven accept (respondToRequest handles it)
  IF has_accepted_request THEN
    RETURN NEW;
  END IF;

  IF auth.uid() = idea_author_id THEN
    -- Author is adding someone: notify the added user
    IF NEW.user_id != idea_author_id THEN
      SELECT notification_preferences INTO prefs FROM public.users WHERE id = NEW.user_id;
      IF coalesce((prefs->>'collaborators')::boolean, true) THEN
        INSERT INTO public.notifications (user_id, actor_id, type, idea_id)
        VALUES (NEW.user_id, idea_author_id, 'collaborator', NEW.idea_id);
      END IF;
    END IF;
  ELSE
    -- Self-join: notify the idea author
    IF idea_author_id != NEW.user_id THEN
      SELECT notification_preferences INTO prefs FROM public.users WHERE id = idea_author_id;
      IF coalesce((prefs->>'collaborators')::boolean, true) THEN
        INSERT INTO public.notifications (user_id, actor_id, type, idea_id)
        VALUES (idea_author_id, NEW.user_id, 'collaborator', NEW.idea_id);
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2f. Lock down collaborator self-join RLS
-- Only idea authors can INSERT into collaborators (direct-add flow).
-- Users must go through the request/approval flow to become collaborators.
DROP POLICY IF EXISTS "Users or idea authors can add collaborators" ON collaborators;

CREATE POLICY "Idea authors can add collaborators"
  ON collaborators FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = (SELECT author_id FROM ideas WHERE id = idea_id)
  );

-- DELETE policy stays unchanged — users can still remove themselves ("Leave Project")

-- 2g. Notification preferences backfill
ALTER TABLE users ALTER COLUMN notification_preferences
  SET DEFAULT '{"comments": true, "votes": true, "collaborators": true, "status_changes": true, "task_mentions": true, "email_notifications": true, "collaboration_requests": true, "collaboration_responses": true}'::jsonb;

UPDATE users
SET notification_preferences = notification_preferences
  || '{"collaboration_requests": true, "collaboration_responses": true}'::jsonb
WHERE NOT (notification_preferences ? 'collaboration_requests')
   OR NOT (notification_preferences ? 'collaboration_responses');

-- Update the set_default_notification_preferences trigger function
CREATE OR REPLACE FUNCTION set_default_notification_preferences()
RETURNS trigger AS $$
BEGIN
  IF NEW.notification_preferences IS NULL THEN
    NEW.notification_preferences := '{"comments": true, "votes": true, "collaborators": true, "status_changes": true, "task_mentions": true, "collaboration_requests": true, "collaboration_responses": true}'::jsonb;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2h. Auto-update updated_at on collaboration_requests
CREATE TRIGGER collaboration_requests_updated_at
  BEFORE UPDATE ON public.collaboration_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 2i. Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.collaboration_requests;
