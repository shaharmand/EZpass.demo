-- Add creation_metadata column
ALTER TABLE questions
ADD COLUMN creation_metadata JSONB NOT NULL DEFAULT jsonb_build_object(
  'createdAt', CURRENT_TIMESTAMP,
  'createdBy', 'system'
);

-- Populate creation_metadata for existing questions
UPDATE questions
SET creation_metadata = jsonb_build_object(
  'createdAt', created_at,
  'createdBy', 'system'
);

-- Add constraint to ensure creation_metadata has valid structure
ALTER TABLE questions
ADD CONSTRAINT valid_creation_metadata CHECK (
  jsonb_typeof(creation_metadata) = 'object'
  AND creation_metadata->>'createdAt' IS NOT NULL
  AND creation_metadata->>'createdBy' IS NOT NULL
);

-- Add comment explaining the column
COMMENT ON COLUMN questions.creation_metadata IS 'Metadata about question creation including who created it and when';

-- Update the trigger function to handle creation metadata
CREATE OR REPLACE FUNCTION handle_question_creation()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id uuid;
  v_user_name text;
BEGIN
  -- Get the current user's ID
  v_user_id := auth.uid();
  
  -- Get the user's first and last name from profiles
  SELECT 
    CASE 
      WHEN first_name IS NOT NULL AND last_name IS NOT NULL THEN first_name || ' ' || last_name
      WHEN first_name IS NOT NULL THEN first_name
      WHEN last_name IS NOT NULL THEN last_name
      ELSE v_user_id::text
    END INTO v_user_name
  FROM profiles
  WHERE id = v_user_id;

  -- Set creation metadata for new questions
  NEW.creation_metadata = jsonb_build_object(
    'createdAt', NEW.created_at,
    'createdBy', COALESCE(v_user_name, 'system')
  );

  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Create a trigger to handle question creation
DROP TRIGGER IF EXISTS handle_question_creation_trigger ON questions;
CREATE TRIGGER handle_question_creation_trigger
  BEFORE INSERT ON questions
  FOR EACH ROW
  EXECUTE FUNCTION handle_question_creation();

-- Add comment explaining the function
COMMENT ON FUNCTION handle_question_creation() IS 'Automatically sets creation metadata when a new question is created'; 