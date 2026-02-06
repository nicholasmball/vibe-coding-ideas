-- Create vote type enum
create type vote_type as enum ('upvote', 'downvote');

-- Create votes table
create table public.votes (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.ideas(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  type vote_type not null default 'upvote',
  created_at timestamptz not null default now(),
  unique (idea_id, user_id)
);

-- Enable RLS
alter table public.votes enable row level security;

-- Indexes
create index votes_idea_id_idx on public.votes(idea_id);
create index votes_user_id_idx on public.votes(user_id);

-- Trigger to maintain denormalized upvotes count on ideas
create or replace function public.update_idea_upvotes()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    if new.type = 'upvote' then
      update public.ideas set upvotes = upvotes + 1 where id = new.idea_id;
    end if;
  elsif tg_op = 'DELETE' then
    if old.type = 'upvote' then
      update public.ideas set upvotes = upvotes - 1 where id = old.idea_id;
    end if;
  elsif tg_op = 'UPDATE' then
    if old.type = 'upvote' and new.type = 'downvote' then
      update public.ideas set upvotes = upvotes - 1 where id = new.idea_id;
    elsif old.type = 'downvote' and new.type = 'upvote' then
      update public.ideas set upvotes = upvotes + 1 where id = new.idea_id;
    end if;
  end if;
  return coalesce(new, old);
end;
$$ language plpgsql security definer;

create trigger update_idea_upvotes
  after insert or update or delete on public.votes
  for each row execute function public.update_idea_upvotes();
