-- RPC to return accurate platform stats for the landing page.
-- Uses SECURITY DEFINER so it can count ALL ideas (including private)
-- without exposing their content.
CREATE OR REPLACE FUNCTION get_public_stats()
RETURNS json
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT json_build_object(
    'idea_count', (SELECT count(*) FROM public.ideas),
    'user_count', (SELECT count(*) FROM public.users),
    'collab_count', (SELECT count(*) FROM public.collaborators)
  );
$$;

-- Allow anon and authenticated users to call this function
GRANT EXECUTE ON FUNCTION get_public_stats() TO anon, authenticated;
