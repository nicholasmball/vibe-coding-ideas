-- Create idea status enum
create type idea_status as enum ('open', 'in_progress', 'completed', 'archived');

-- Create ideas table
create table public.ideas (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  author_id uuid not null references public.users(id) on delete cascade,
  status idea_status not null default 'open',
  tags text[] not null default '{}',
  github_url text,
  upvotes integer not null default 0,
  comment_count integer not null default 0,
  collaborator_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.ideas enable row level security;

-- Indexes
create index ideas_author_id_idx on public.ideas(author_id);
create index ideas_status_idx on public.ideas(status);
create index ideas_created_at_idx on public.ideas(created_at desc);
create index ideas_upvotes_idx on public.ideas(upvotes desc);

-- Auto-update updated_at
create trigger ideas_updated_at
  before update on public.ideas
  for each row execute function public.update_updated_at();
