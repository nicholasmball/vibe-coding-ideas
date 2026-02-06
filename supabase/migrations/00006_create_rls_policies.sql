-- ============================================
-- Users policies
-- ============================================
create policy "Users are viewable by everyone"
  on public.users for select
  using (true);

create policy "Users can update their own profile"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ============================================
-- Ideas policies
-- ============================================
create policy "Ideas are viewable by everyone"
  on public.ideas for select
  using (true);

create policy "Authenticated users can create ideas"
  on public.ideas for insert
  to authenticated
  with check (auth.uid() = author_id);

create policy "Authors can update their own ideas"
  on public.ideas for update
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

create policy "Authors can delete their own ideas"
  on public.ideas for delete
  using (auth.uid() = author_id);

-- ============================================
-- Comments policies
-- ============================================
create policy "Comments are viewable by everyone"
  on public.comments for select
  using (true);

create policy "Authenticated users can create comments"
  on public.comments for insert
  to authenticated
  with check (auth.uid() = author_id);

create policy "Authors can update their own comments"
  on public.comments for update
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

-- Allow idea authors to mark comments as incorporated
create policy "Idea authors can incorporate suggestions"
  on public.comments for update
  using (
    exists (
      select 1 from public.ideas
      where ideas.id = comments.idea_id
      and ideas.author_id = auth.uid()
    )
  );

create policy "Authors can delete their own comments"
  on public.comments for delete
  using (auth.uid() = author_id);

-- ============================================
-- Collaborators policies
-- ============================================
create policy "Collaborators are viewable by everyone"
  on public.collaborators for select
  using (true);

create policy "Authenticated users can join as collaborators"
  on public.collaborators for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can remove themselves as collaborators"
  on public.collaborators for delete
  using (auth.uid() = user_id);

-- ============================================
-- Votes policies
-- ============================================
create policy "Votes are viewable by everyone"
  on public.votes for select
  using (true);

create policy "Authenticated users can vote"
  on public.votes for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own votes"
  on public.votes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can remove their own votes"
  on public.votes for delete
  using (auth.uid() = user_id);
