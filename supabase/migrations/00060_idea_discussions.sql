-- Migration: Idea Discussions — titled planning threads per idea
--
-- Two new tables: idea_discussions and idea_discussion_replies
-- Adds discussion_id FK to board_tasks for "Convert to Task" backlink
-- Adds discussion_count denormalized column to ideas
-- New notification types: discussion, discussion_reply

-- ============================================================================
-- 1. Tables
-- ============================================================================

CREATE TABLE idea_discussions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id uuid NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title varchar(200) NOT NULL CHECK (char_length(title) >= 1),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 10000),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'converted')),
  pinned boolean NOT NULL DEFAULT false,
  reply_count integer NOT NULL DEFAULT 0,
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idea_discussions_idea_id_idx ON idea_discussions(idea_id);
CREATE INDEX idea_discussions_author_id_idx ON idea_discussions(author_id);
CREATE INDEX idea_discussions_last_activity_idx ON idea_discussions(idea_id, last_activity_at DESC);

CREATE TABLE idea_discussion_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id uuid NOT NULL REFERENCES idea_discussions(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 5000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idea_discussion_replies_discussion_id_idx ON idea_discussion_replies(discussion_id);

-- ============================================================================
-- 2. Board tasks backlink
-- ============================================================================

ALTER TABLE board_tasks
  ADD COLUMN IF NOT EXISTS discussion_id uuid REFERENCES idea_discussions(id) ON DELETE SET NULL;

-- ============================================================================
-- 3. Denormalized discussion_count on ideas
-- ============================================================================

ALTER TABLE ideas
  ADD COLUMN IF NOT EXISTS discussion_count integer NOT NULL DEFAULT 0;

-- ============================================================================
-- 4. Enable RLS
-- ============================================================================

ALTER TABLE idea_discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE idea_discussion_replies ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5. RLS Policies — idea_discussions
-- ============================================================================

-- Read: team members OR any authenticated user for public ideas
CREATE POLICY "Users can view discussions for public ideas or as team members"
  ON idea_discussions FOR SELECT TO authenticated
  USING (
    is_idea_team_member(idea_id, auth.uid())
    OR is_idea_public(idea_id)
  );

-- Insert: team members only
CREATE POLICY "Team members can create discussions"
  ON idea_discussions FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = author_id
    AND is_idea_team_member(idea_id, auth.uid())
  );

-- Update: author can edit own title/body, idea author can pin/change status
CREATE POLICY "Author or idea owner can update discussions"
  ON idea_discussions FOR UPDATE TO authenticated
  USING (
    auth.uid() = author_id
    OR auth.uid() = (SELECT author_id FROM ideas WHERE id = idea_id)
  );

-- Delete: author, idea owner, or admins
CREATE POLICY "Author, idea owner, or admins can delete discussions"
  ON idea_discussions FOR DELETE TO authenticated
  USING (
    auth.uid() = author_id
    OR auth.uid() = (SELECT author_id FROM ideas WHERE id = idea_id)
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  );

-- ============================================================================
-- 6. RLS Policies — idea_discussion_replies
-- ============================================================================

-- Read: same as parent discussion (via idea_id lookup)
CREATE POLICY "Users can view replies for accessible discussions"
  ON idea_discussion_replies FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM idea_discussions d
      WHERE d.id = discussion_id
      AND (
        is_idea_team_member(d.idea_id, auth.uid())
        OR is_idea_public(d.idea_id)
      )
    )
  );

-- Insert: team members for the parent idea
CREATE POLICY "Team members can reply to discussions"
  ON idea_discussion_replies FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = author_id
    AND EXISTS (
      SELECT 1 FROM idea_discussions d
      WHERE d.id = discussion_id
      AND is_idea_team_member(d.idea_id, auth.uid())
    )
  );

-- Update: reply author only
CREATE POLICY "Authors can update own replies"
  ON idea_discussion_replies FOR UPDATE TO authenticated
  USING (auth.uid() = author_id);

-- Delete: reply author, discussion author, idea owner, or admins
CREATE POLICY "Author, discussion owner, idea owner, or admins can delete replies"
  ON idea_discussion_replies FOR DELETE TO authenticated
  USING (
    auth.uid() = author_id
    OR EXISTS (
      SELECT 1 FROM idea_discussions d
      WHERE d.id = discussion_id
      AND (
        auth.uid() = d.author_id
        OR auth.uid() = (SELECT author_id FROM ideas WHERE id = d.idea_id)
      )
    )
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  );

-- ============================================================================
-- 7. Triggers
-- ============================================================================

-- Auto-update updated_at
CREATE TRIGGER idea_discussions_updated_at
  BEFORE UPDATE ON idea_discussions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER idea_discussion_replies_updated_at
  BEFORE UPDATE ON idea_discussion_replies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Maintain reply_count + last_activity_at on idea_discussions
CREATE OR REPLACE FUNCTION update_discussion_reply_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE idea_discussions
    SET reply_count = reply_count + 1,
        last_activity_at = now()
    WHERE id = NEW.discussion_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE idea_discussions
    SET reply_count = GREATEST(reply_count - 1, 0)
    WHERE id = OLD.discussion_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_discussion_reply_change
  AFTER INSERT OR DELETE ON idea_discussion_replies
  FOR EACH ROW EXECUTE FUNCTION update_discussion_reply_count();

-- Maintain discussion_count on ideas
CREATE OR REPLACE FUNCTION update_idea_discussion_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE ideas SET discussion_count = discussion_count + 1 WHERE id = NEW.idea_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE ideas SET discussion_count = GREATEST(discussion_count - 1, 0) WHERE id = OLD.idea_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_discussion_count_change
  AFTER INSERT OR DELETE ON idea_discussions
  FOR EACH ROW EXECUTE FUNCTION update_idea_discussion_count();

-- ============================================================================
-- 8. Notification types
-- ============================================================================

ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'discussion';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'discussion_reply';

-- Add discussion_id FK to notifications
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS discussion_id uuid REFERENCES idea_discussions(id) ON DELETE SET NULL;

-- Notify team on new discussion (excluding author)
CREATE OR REPLACE FUNCTION notify_on_new_discussion()
RETURNS trigger AS $$
DECLARE
  team_member RECORD;
  prefs jsonb;
BEGIN
  -- Notify idea author (if not the discussion author)
  FOR team_member IN
    SELECT u.id, u.notification_preferences
    FROM users u
    WHERE (
      u.id = (SELECT author_id FROM ideas WHERE id = NEW.idea_id)
      OR u.id IN (SELECT user_id FROM collaborators WHERE idea_id = NEW.idea_id)
    )
    AND u.id != NEW.author_id
  LOOP
    prefs := team_member.notification_preferences;
    IF coalesce((prefs->>'comments')::boolean, true) THEN
      INSERT INTO notifications (user_id, actor_id, type, idea_id, discussion_id)
      VALUES (team_member.id, NEW.author_id, 'discussion', NEW.idea_id, NEW.id);
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_new_discussion
  AFTER INSERT ON idea_discussions
  FOR EACH ROW EXECUTE FUNCTION notify_on_new_discussion();

-- Notify discussion author + participants on new reply
CREATE OR REPLACE FUNCTION notify_on_discussion_reply()
RETURNS trigger AS $$
DECLARE
  disc RECORD;
  participant RECORD;
  prefs jsonb;
BEGIN
  SELECT id, idea_id, author_id INTO disc
  FROM idea_discussions WHERE id = NEW.discussion_id;

  -- Notify discussion author + all previous repliers (excluding the reply author)
  FOR participant IN
    SELECT DISTINCT u.id, u.notification_preferences
    FROM users u
    WHERE (
      u.id = disc.author_id
      OR u.id IN (
        SELECT author_id FROM idea_discussion_replies
        WHERE discussion_id = NEW.discussion_id
      )
    )
    AND u.id != NEW.author_id
  LOOP
    prefs := participant.notification_preferences;
    IF coalesce((prefs->>'comments')::boolean, true) THEN
      INSERT INTO notifications (user_id, actor_id, type, idea_id, discussion_id)
      VALUES (participant.id, NEW.author_id, 'discussion_reply', disc.idea_id, disc.id);
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_new_discussion_reply
  AFTER INSERT ON idea_discussion_replies
  FOR EACH ROW EXECUTE FUNCTION notify_on_discussion_reply();

-- ============================================================================
-- 9. Realtime
-- ============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE idea_discussions;
ALTER PUBLICATION supabase_realtime ADD TABLE idea_discussion_replies;

-- ============================================================================
-- 10. Backfill discussion_count for existing ideas
-- ============================================================================

UPDATE ideas SET discussion_count = 0 WHERE discussion_count IS NULL;
