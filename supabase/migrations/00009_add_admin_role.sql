-- Add admin role to users table
alter table public.users
  add column is_admin boolean not null default false;

-- Drop existing ideas delete policy and replace with one that allows admins
drop policy if exists "Authors can delete their own ideas" on public.ideas;

create policy "Authors and admins can delete ideas"
  on public.ideas for delete
  using (
    auth.uid() = author_id
    or exists (
      select 1 from public.users
      where users.id = auth.uid()
      and users.is_admin = true
    )
  );
