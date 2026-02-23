-- User feedback table
create table if not exists public.feedback (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  category text not null check (category in ('bug', 'suggestion', 'question', 'other')),
  content text not null check (char_length(content) between 1 and 5000),
  page_url text,
  created_at timestamptz default now() not null
);

-- RLS
alter table public.feedback enable row level security;

-- Users can insert their own feedback
create policy "Users can submit feedback"
  on public.feedback for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Admins can read all feedback
create policy "Admins can read all feedback"
  on public.feedback for select
  to authenticated
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid() and users.is_admin = true
    )
  );

-- Users can read their own feedback
create policy "Users can read own feedback"
  on public.feedback for select
  to authenticated
  using (auth.uid() = user_id);
