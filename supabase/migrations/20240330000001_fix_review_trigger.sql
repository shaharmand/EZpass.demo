-- Update the review status trigger to use first_name and last_name instead of full_name
CREATE OR REPLACE FUNCTION handle_review_status_change()
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

  -- When approving a question
  IF NEW.review_status = 'approved' AND OLD.review_status = 'pending_review' THEN
    -- Set review metadata with current time and user's name
    NEW.review_metadata = jsonb_build_object(
      'reviewedAt', timezone('utc'::text, now())::text,
      'reviewedBy', v_user_name
    );
    
    -- Clear AI-generated fields as they're now approved
    NEW.ai_generated_fields = '{"fields": [], "confidence": {}, "generatedAt": null}'::jsonb;
  END IF;

  -- When moving back to pending review - do nothing, keep existing review metadata
  -- as information about who last reviewed it

  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER; 