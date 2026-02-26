-- Storage policies for the idea-attachments bucket
-- Path convention: {ideaId}/{uuid}.{ext}

-- Team members can upload attachments to their ideas
CREATE POLICY "Team members can upload idea attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'idea-attachments'
  AND auth.uid() IS NOT NULL
  AND is_idea_team_member((storage.foldername(name))[1]::uuid, auth.uid())
);

-- Authenticated users can read attachments (needed for signed URL generation)
CREATE POLICY "Authenticated users can read idea attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'idea-attachments'
  AND auth.uid() IS NOT NULL
);

-- Team members can delete attachments from their ideas
CREATE POLICY "Team members can delete idea attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'idea-attachments'
  AND auth.uid() IS NOT NULL
  AND is_idea_team_member((storage.foldername(name))[1]::uuid, auth.uid())
);
