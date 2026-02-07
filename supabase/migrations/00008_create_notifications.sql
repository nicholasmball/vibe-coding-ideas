-- Create notification type enum
create type notification_type as enum ('comment', 'vote', 'collaborator');

-- Create notifications table
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  actor_id uuid not null references public.users(id) on delete cascade,
  type notification_type not null,
  idea_id uuid not null references public.ideas(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.notifications enable row level security;

-- Indexes
create index notifications_user_id_idx on public.notifications(user_id);
create index notifications_read_idx on public.notifications(user_id, read);
create index notifications_created_at_idx on public.notifications(created_at desc);

-- RLS Policies
create policy "Users can view their own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users can update their own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

-- System can insert notifications (via triggers)
create policy "System can insert notifications"
  on public.notifications for insert
  with check (true);

-- Trigger: notify idea author on new comment
create or replace function public.notify_on_comment()
returns trigger as $$
declare
  idea_author_id uuid;
begin
  select author_id into idea_author_id from public.ideas where id = new.idea_id;
  -- Don't notify if commenting on own idea
  if idea_author_id != new.author_id then
    insert into public.notifications (user_id, actor_id, type, idea_id, comment_id)
    values (idea_author_id, new.author_id, 'comment', new.idea_id, new.id);
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_new_comment
  after insert on public.comments
  for each row execute function public.notify_on_comment();

-- Trigger: notify idea author on new vote
create or replace function public.notify_on_vote()
returns trigger as $$
declare
  idea_author_id uuid;
begin
  select author_id into idea_author_id from public.ideas where id = new.idea_id;
  -- Don't notify if voting on own idea
  if idea_author_id != new.user_id then
    insert into public.notifications (user_id, actor_id, type, idea_id)
    values (idea_author_id, new.user_id, 'vote', new.idea_id);
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_new_vote
  after insert on public.votes
  for each row execute function public.notify_on_vote();

-- Trigger: notify idea author on new collaborator
create or replace function public.notify_on_collaborator()
returns trigger as $$
declare
  idea_author_id uuid;
begin
  select author_id into idea_author_id from public.ideas where id = new.idea_id;
  -- Don't notify if joining own idea
  if idea_author_id != new.user_id then
    insert into public.notifications (user_id, actor_id, type, idea_id)
    values (idea_author_id, new.user_id, 'collaborator', new.idea_id);
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_new_collaborator
  after insert on public.collaborators
  for each row execute function public.notify_on_collaborator();

-- Enable realtime
alter publication supabase_realtime add table public.notifications;
