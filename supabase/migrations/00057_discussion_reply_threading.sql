-- Add parent_reply_id for threaded replies (single level nesting)
alter table idea_discussion_replies
  add column parent_reply_id uuid references idea_discussion_replies(id) on delete cascade;

-- Index for efficient child reply lookups
create index idx_discussion_replies_parent on idea_discussion_replies(parent_reply_id)
  where parent_reply_id is not null;
