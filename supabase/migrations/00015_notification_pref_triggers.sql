-- Update notification triggers to respect user preferences

create or replace function public.notify_on_comment()
returns trigger as $$
declare
  idea_author_id uuid;
  prefs jsonb;
begin
  select author_id into idea_author_id from public.ideas where id = new.idea_id;
  if idea_author_id != new.author_id then
    select notification_preferences into prefs from public.users where id = idea_author_id;
    if coalesce((prefs->>'comments')::boolean, true) then
      insert into public.notifications (user_id, actor_id, type, idea_id, comment_id)
      values (idea_author_id, new.author_id, 'comment', new.idea_id, new.id);
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create or replace function public.notify_on_vote()
returns trigger as $$
declare
  idea_author_id uuid;
  prefs jsonb;
begin
  select author_id into idea_author_id from public.ideas where id = new.idea_id;
  if idea_author_id != new.user_id then
    select notification_preferences into prefs from public.users where id = idea_author_id;
    if coalesce((prefs->>'votes')::boolean, true) then
      insert into public.notifications (user_id, actor_id, type, idea_id)
      values (idea_author_id, new.user_id, 'vote', new.idea_id);
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create or replace function public.notify_on_collaborator()
returns trigger as $$
declare
  idea_author_id uuid;
  prefs jsonb;
begin
  select author_id into idea_author_id from public.ideas where id = new.idea_id;
  if idea_author_id != new.user_id then
    select notification_preferences into prefs from public.users where id = idea_author_id;
    if coalesce((prefs->>'collaborators')::boolean, true) then
      insert into public.notifications (user_id, actor_id, type, idea_id)
      values (idea_author_id, new.user_id, 'collaborator', new.idea_id);
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;
