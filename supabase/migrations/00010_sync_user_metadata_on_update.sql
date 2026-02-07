-- Sync public.users when auth.users metadata is updated (e.g. OAuth profile populated after signup)
create or replace function public.handle_user_updated()
returns trigger as $$
begin
  update public.users
  set
    full_name = coalesce(
      public.users.full_name,
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name'
    ),
    avatar_url = coalesce(
      public.users.avatar_url,
      new.raw_user_meta_data ->> 'avatar_url',
      new.raw_user_meta_data ->> 'picture'
    )
  where id = new.id;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_updated
  after update on auth.users
  for each row execute function public.handle_user_updated();
