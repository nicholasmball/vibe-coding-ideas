-- Enable Supabase Realtime on key tables
alter publication supabase_realtime add table public.ideas;
alter publication supabase_realtime add table public.comments;
alter publication supabase_realtime add table public.votes;
alter publication supabase_realtime add table public.collaborators;
