-- Add is_done_column flag to board_columns
ALTER TABLE board_columns ADD COLUMN is_done_column boolean NOT NULL DEFAULT false;

-- Mark existing columns titled "Done" as done columns
UPDATE board_columns SET is_done_column = true WHERE lower(title) = 'done';
