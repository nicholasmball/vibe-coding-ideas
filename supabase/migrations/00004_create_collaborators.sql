-- Create collaborators table
create table public.collaborators (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.ideas(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (idea_id, user_id)
);

-- Enable RLS
alter table public.collaborators enable row level security;

-- Indexes
create index collaborators_idea_id_idx on public.collaborators(idea_id);
create index collaborators_user_id_idx on public.collaborators(user_id);

-- Trigger to maintain denormalized collaborator_count on ideas
create or replace function public.update_idea_collaborator_count()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    update public.ideas set collaborator_count = collaborator_count + 1 where id = new.idea_id;
  elsif tg_op = 'DELETE' then
    update public.ideas set collaborator_count = collaborator_count - 1 where id = old.idea_id;
  end if;
  return coalesce(new, old);
end;
$$ language plpgsql security definer;

create trigger update_idea_collaborator_count
  after insert or delete on public.collaborators
  for each row execute function public.update_idea_collaborator_count();
