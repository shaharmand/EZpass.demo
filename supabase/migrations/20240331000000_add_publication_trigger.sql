-- Create or replace the publication status trigger function
CREATE OR REPLACE FUNCTION handle_publication_status_change()
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

  -- When publishing a question
  IF NEW.publication_status = 'published' AND OLD.publication_status = 'draft' THEN
    -- Set publication metadata with current time and user's name
    NEW.publication_metadata = jsonb_build_object(
      'publishedAt', timezone('utc'::text, now())::text,
      'publishedBy', v_user_name,
      'archivedAt', null,
      'archivedBy', null,
      'reason', null
    );
  -- When archiving a question
  ELSIF NEW.publication_status = 'archived' AND OLD.publication_status IN ('draft', 'published') THEN
    -- Keep existing publication info if it exists
    NEW.publication_metadata = COALESCE(OLD.publication_metadata, '{}'::jsonb) || jsonb_build_object(
      'archivedAt', timezone('utc'::text, now())::text,
      'archivedBy', v_user_name
    );
  -- When moving back to draft - keep existing metadata
  ELSIF NEW.publication_status = 'draft' THEN
    -- Keep the existing metadata to track history
    NEW.publication_metadata = OLD.publication_metadata;
  END IF;

  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS handle_publication_status_change_trigger ON questions;
CREATE TRIGGER handle_publication_status_change_trigger
  BEFORE UPDATE ON questions
  FOR EACH ROW
  WHEN (OLD.publication_status IS DISTINCT FROM NEW.publication_status)
  EXECUTE FUNCTION handle_publication_status_change();

-- Add comment explaining the trigger
COMMENT ON FUNCTION handle_publication_status_change() IS 'Automatically updates publication metadata when question status changes'; 