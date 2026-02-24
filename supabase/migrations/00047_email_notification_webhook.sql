-- Enable pg_net extension for async HTTP requests from triggers
create extension if not exists pg_net with schema extensions;

-- Add email_notifications to the default notification preferences
-- (existing users keep their current prefs; new users get email_notifications: true)
alter table public.users
  alter column notification_preferences
  set default '{"comments": true, "votes": true, "collaborators": true, "status_changes": true, "task_mentions": true, "email_notifications": true}'::jsonb;

-- Backfill: add email_notifications = true to existing users who don't have it
update public.users
set notification_preferences = notification_preferences || '{"email_notifications": true}'::jsonb
where notification_preferences is not null
  and not (notification_preferences ? 'email_notifications');

-- Update the set_default_notification_preferences trigger function
create or replace function set_default_notification_preferences()
returns trigger as $$
begin
  if new.notification_preferences is null then
    new.notification_preferences = jsonb_build_object(
      'comments', true,
      'votes', true,
      'collaborators', true,
      'status_changes', true,
      'task_mentions', true,
      'email_notifications', true
    );
  end if;
  return new;
end;
$$ language plpgsql;

-- Trigger function: POST notification data to the email API route via pg_net
-- This fires asynchronously (non-blocking) after each notification INSERT
-- Secret is stored in Supabase Vault (vault.create_secret) — not in app.settings
create or replace function public.send_notification_email()
returns trigger as $$
declare
  webhook_url text;
  webhook_secret text;
begin
  webhook_url := 'https://vibecodes.co.uk/api/notifications/email';

  -- Read secret from Supabase Vault
  select decrypted_secret into webhook_secret
  from vault.decrypted_secrets
  where name = 'notification_webhook_secret'
  limit 1;

  -- Skip if no secret configured (prevents sending in local dev)
  if webhook_secret is null or webhook_secret = '' then
    return new;
  end if;

  -- Queue async HTTP POST via pg_net
  perform net.http_post(
    url := webhook_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || webhook_secret
    ),
    body := jsonb_build_object(
      'record', jsonb_build_object(
        'id', new.id,
        'user_id', new.user_id,
        'actor_id', new.actor_id,
        'type', new.type,
        'idea_id', new.idea_id,
        'comment_id', new.comment_id,
        'task_id', new.task_id
      )
    )
  );

  return new;
end;
$$ language plpgsql security definer;

-- Create the trigger (fires AFTER INSERT so the notification row is committed)
drop trigger if exists on_notification_send_email on public.notifications;
create trigger on_notification_send_email
  after insert on public.notifications
  for each row
  execute function public.send_notification_email();
