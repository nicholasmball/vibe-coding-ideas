-- Update handle_new_user() to also populate github_username from OAuth metadata.
-- GitHub provides the username as "user_name" or "preferred_username" in raw_user_meta_data.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name, avatar_url, github_username)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture'),
    new.raw_user_meta_data ->> 'user_name'
  );
  return new;
end;
$$ language plpgsql security definer;
