-- Update the review status trigger to use user's full name
CREATE OR REPLACE FUNCTION handle_review_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id uuid;
  v_user_name text;
BEGIN
  -- Get the current user's ID
  v_user_id := auth.uid();
  
  -- Get the user's full name from profiles
  SELECT full_name INTO v_user_name
  FROM profiles
  WHERE id = v_user_id;

  -- When approving a question
  IF NEW.review_status = 'approved' AND OLD.review_status = 'pending_review' THEN
    -- Set review metadata with current time and user's full name
    NEW.review_metadata = jsonb_build_object(
      'reviewedAt', timezone('utc'::text, now())::text,
      'reviewedBy', COALESCE(v_user_name, v_user_id::text)
    );
    
    -- Clear AI-generated fields as they're now approved
    NEW.ai_generated_fields = '{"fields": [], "confidence": {}, "generatedAt": null}'::jsonb;
  END IF;

  -- When moving back to pending review - do nothing, keep existing review metadata
  -- as information about who last reviewed it

  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER; it wa 