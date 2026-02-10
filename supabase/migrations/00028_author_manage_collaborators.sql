-- Allow idea authors to add/remove collaborators directly
-- (Previously only users could add/remove themselves)

-- Drop existing INSERT and DELETE policies
drop policy if exists "Authenticated users can join as collaborators" on public.collaborators;
drop policy if exists "Users can remove themselves as collaborators" on public.collaborators;

-- Recreate INSERT policy: user can add self OR idea author can add anyone
create policy "Users or idea authors can add collaborators"
  on public.collaborators for insert
  to authenticated
  with check (
    auth.uid() = user_id
    or auth.uid() = (select author_id from public.ideas where id = idea_id)
  );

-- Recreate DELETE policy: user can remove self OR idea author can remove anyone
create policy "Users or idea authors can remove collaborators"
  on public.collaborators for delete
  using (
    auth.uid() = user_id
    or auth.uid() = (select author_id from public.ideas where id = idea_id)
  );

-- Update notification trigger: bidirectional notifications
-- If author adds someone → notify the added user
-- If someone self-joins → notify the author (existing behavior)
create or replace function public.notify_on_collaborator()
returns trigger as $$
declare
  idea_author_id uuid;
  prefs jsonb;
begin
  select author_id into idea_author_id from public.ideas where id = new.idea_id;

  if auth.uid() = idea_author_id then
    -- Author is adding someone: notify the added user
    if new.user_id != idea_author_id then
      select notification_preferences into prefs from public.users where id = new.user_id;
      if coalesce((prefs->>'collaborators')::boolean, true) then
        insert into public.notifications (user_id, actor_id, type, idea_id)
        values (new.user_id, idea_author_id, 'collaborator', new.idea_id);
      end if;
    end if;
  else
    -- Self-join: notify the idea author
    if idea_author_id != new.user_id then
      select notification_preferences into prefs from public.users where id = idea_author_id;
      if coalesce((prefs->>'collaborators')::boolean, true) then
        insert into public.notifications (user_id, actor_id, type, idea_id)
        values (idea_author_id, new.user_id, 'collaborator', new.idea_id);
      end if;
    end if;
  end if;

  return new;
end;
$$ language plpgsql security definer;
