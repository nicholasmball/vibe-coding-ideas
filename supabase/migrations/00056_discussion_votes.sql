-- Add upvotes column to idea_discussions
alter table public.idea_discussions
  add column upvotes integer not null default 0;

-- Create discussion_votes table
create table public.discussion_votes (
  id uuid primary key default gen_random_uuid(),
  discussion_id uuid not null references public.idea_discussions(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (discussion_id, user_id)
);

-- Enable RLS
alter table public.discussion_votes enable row level security;

-- Indexes
create index discussion_votes_discussion_id_idx on public.discussion_votes(discussion_id);
create index discussion_votes_user_id_idx on public.discussion_votes(user_id);

-- RLS policies: team members can vote on discussions for ideas they belong to
create policy "Team members can view discussion votes"
  on public.discussion_votes for select
  using (
    exists (
      select 1 from public.idea_discussions d
      join public.ideas i on i.id = d.idea_id
      where d.id = discussion_votes.discussion_id
      and (
        i.author_id = auth.uid()
        or exists (
          select 1 from public.collaborators c
          where c.idea_id = i.id and c.user_id = auth.uid()
        )
        or i.visibility = 'public'
      )
    )
  );

create policy "Authenticated users can insert own discussion votes"
  on public.discussion_votes for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own discussion votes"
  on public.discussion_votes for delete
  using (auth.uid() = user_id);

-- Trigger to maintain denormalized upvotes count on idea_discussions
create or replace function public.update_discussion_upvotes()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    update public.idea_discussions set upvotes = upvotes + 1 where id = new.discussion_id;
  elsif tg_op = 'DELETE' then
    update public.idea_discussions set upvotes = upvotes - 1 where id = old.discussion_id;
  end if;
  return coalesce(new, old);
end;
$$ language plpgsql security definer;

create trigger update_discussion_upvotes
  after insert or delete on public.discussion_votes
  for each row execute function public.update_discussion_upvotes();

-- Enable Realtime for discussion_votes
alter publication supabase_realtime add table public.discussion_votes;
