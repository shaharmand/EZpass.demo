-- Fix the unique constraint on user_preparations table
-- The current constraint prevents users from having multiple preparations for the same exam

-- Drop the existing constraint
ALTER TABLE user_preparations 
DROP CONSTRAINT IF EXISTS unique_active_prep_per_user;

-- Add a status enum type for preparation states
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'prep_status') THEN
        CREATE TYPE prep_status AS ENUM (
            'active',    -- User is currently working on this preparation
            'paused',    -- User has paused or closed the app but intends to continue
            'completed'  -- User has finished with this preparation
        );
    END IF;
END$$;

-- Add the status field to user_preparations
ALTER TABLE user_preparations
ADD COLUMN IF NOT EXISTS status prep_status NOT NULL DEFAULT 'active';

-- Create an index on the status column
CREATE INDEX IF NOT EXISTS idx_user_preparations_status ON user_preparations(status);

-- Add a new partial unique index
-- This ensures only one active or paused preparation per exam per user
DROP INDEX IF EXISTS unique_ongoing_prep_per_user_and_exam;
CREATE UNIQUE INDEX unique_ongoing_prep_per_user_and_exam 
ON user_preparations (user_id, exam_id) 
WHERE status IN ('active', 'paused');

-- Create a function to handle creating new preparations that maintains the constraint
CREATE OR REPLACE FUNCTION handle_prep_state_change()
RETURNS TRIGGER AS $$
BEGIN
    -- If this is a non-completed preparation being inserted/updated
    IF NEW.status IN ('active', 'paused') THEN
        -- Set other preparations for the same exam to completed
        UPDATE user_preparations
        SET status = 'completed'
        WHERE user_id = NEW.user_id 
          AND exam_id = NEW.exam_id
          AND id != NEW.id
          AND status IN ('active', 'paused');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to run this function before insert/update
DROP TRIGGER IF EXISTS prep_status_trigger ON user_preparations;
CREATE TRIGGER prep_status_trigger
BEFORE INSERT OR UPDATE OF status ON user_preparations
FOR EACH ROW
EXECUTE FUNCTION handle_prep_state_change();

-- Create a function to find an existing preparation by exam ID
CREATE OR REPLACE FUNCTION find_preparation_by_exam_id(
  p_exam_text_id TEXT,
  p_user_id UUID
) RETURNS TABLE (
  id UUID,
  status prep_status,
  prep_state JSONB
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.id,
    up.status,
    up.prep_state
  FROM user_preparations up
  WHERE up.user_id = p_user_id
    AND up.exam_id_text = p_exam_text_id
    AND up.status IN ('active', 'paused')
  ORDER BY up.last_active_at DESC
  LIMIT 1;
END;
$$; 