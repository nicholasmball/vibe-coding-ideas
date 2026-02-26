-- Idea attachments: file attachments on ideas (download-only)

CREATE TABLE idea_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id uuid NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_size integer NOT NULL,
  content_type text NOT NULL,
  storage_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_idea_attachments_idea ON idea_attachments(idea_id);

-- Denormalized attachment count on ideas
ALTER TABLE ideas ADD COLUMN attachment_count integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION update_idea_attachment_count() RETURNS trigger AS $$
BEGIN
  UPDATE ideas SET attachment_count = (
    SELECT count(*) FROM idea_attachments
    WHERE idea_id = COALESCE(NEW.idea_id, OLD.idea_id)
  ) WHERE id = COALESCE(NEW.idea_id, OLD.idea_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER idea_attachment_count_trigger
  AFTER INSERT OR DELETE ON idea_attachments
  FOR EACH ROW EXECUTE FUNCTION update_idea_attachment_count();

-- RLS
ALTER TABLE idea_attachments ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view attachments on public ideas; team members can view on private ideas
CREATE POLICY "Authenticated users can view idea attachments for public ideas or team members"
  ON idea_attachments FOR SELECT USING (
    is_idea_team_member(idea_id, auth.uid())
    OR (auth.uid() IS NOT NULL AND is_idea_public(idea_id))
  );

-- Only team members can upload
CREATE POLICY "Team members can insert idea attachments"
  ON idea_attachments FOR INSERT
  WITH CHECK (is_idea_team_member(idea_id, auth.uid()));

-- Uploader or idea author can delete
CREATE POLICY "Uploader or idea author can delete idea attachments"
  ON idea_attachments FOR DELETE USING (
    uploaded_by = auth.uid()
    OR EXISTS (SELECT 1 FROM ideas WHERE id = idea_id AND author_id = auth.uid())
  );

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE idea_attachments;
ALTER TABLE idea_attachments REPLICA IDENTITY FULL;

-- Storage bucket (private — use signed URLs for access)
INSERT INTO storage.buckets (id, name, public)
VALUES ('idea-attachments', 'idea-attachments', false)
ON CONFLICT (id) DO NOTHING;
