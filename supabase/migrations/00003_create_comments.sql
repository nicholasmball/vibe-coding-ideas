-- Create comment type enum
create type comment_type as enum ('comment', 'suggestion', 'question');

-- Create comments table with threading support
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.ideas(id) on delete cascade,
  author_id uuid not null references public.users(id) on delete cascade,
  parent_comment_id uuid references public.comments(id) on delete cascade,
  content text not null,
  type comment_type not null default 'comment',
  is_incorporated boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.comments enable row level security;

-- Indexes
create index comments_idea_id_idx on public.comments(idea_id);
create index comments_author_id_idx on public.comments(author_id);
create index comments_parent_id_idx on public.comments(parent_comment_id);

-- Auto-update updated_at
create trigger comments_updated_at
  before update on public.comments
  for each row execute function public.update_updated_at();

-- Trigger to maintain denormalized comment_count on ideas
create or replace function public.update_idea_comment_count()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    update public.ideas set comment_count = comment_count + 1 where id = new.idea_id;
  elsif tg_op = 'DELETE' then
    update public.ideas set comment_count = comment_count - 1 where id = old.idea_id;
  end if;
  return coalesce(new, old);
end;
$$ language plpgsql security definer;

create trigger update_idea_comment_count
  after insert or delete on public.comments
  for each row execute function public.update_idea_comment_count();
