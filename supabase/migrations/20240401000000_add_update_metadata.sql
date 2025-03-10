-- Add update_metadata column
ALTER TABLE questions 
ADD COLUMN update_metadata JSONB NOT NULL DEFAULT '{"lastUpdatedAt": null, "lastUpdatedBy": null}'::jsonb;

-- Create function to handle updates
CREATE OR REPLACE FUNCTION handle_question_update()
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

  -- Set update metadata with current time and user's name
  NEW.update_metadata = jsonb_build_object(
    'lastUpdatedAt', timezone('utc'::text, now())::text,
    'lastUpdatedBy', v_user_name
  );

  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Create trigger for update tracking
DROP TRIGGER IF EXISTS handle_question_update_trigger ON questions;
CREATE TRIGGER handle_question_update_trigger
  BEFORE UPDATE ON questions
  FOR EACH ROW
  WHEN (
    OLD.data IS DISTINCT FROM NEW.data OR
    OLD.publication_status IS DISTINCT FROM NEW.publication_status OR
    OLD.review_status IS DISTINCT FROM NEW.review_status
  )
  EXECUTE FUNCTION handle_question_update();

-- Add comment explaining the trigger
COMMENT ON FUNCTION handle_question_update() IS 'Automatically updates update_metadata when question content or status changes'; 