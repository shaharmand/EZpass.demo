-- Create function for partial question updates
CREATE OR REPLACE FUNCTION update_question_partial(
  p_id TEXT,
  p_data JSONB
)
RETURNS void AS $$
DECLARE
  v_current_review_status review_status_enum;
  v_current_publication_status publication_status_enum;
  v_current_validation_status validation_status_enum;
  v_new_review_status review_status_enum;
  v_new_publication_status publication_status_enum;
  v_new_validation_status validation_status_enum;
BEGIN
  -- Prevent ID modification
  IF p_data->>'id' IS NOT NULL AND p_data->>'id' != p_id THEN
    RAISE EXCEPTION 'Cannot modify question ID';
  END IF;

  -- Get current status values
  SELECT 
    review_status,
    publication_status,
    validation_status
  INTO 
    v_current_review_status,
    v_current_publication_status,
    v_current_validation_status
  FROM questions
  WHERE id = p_id;

  -- Get new status values, fallback to current if not provided
  v_new_review_status := COALESCE(
    (p_data->>'review_status')::review_status_enum,
    v_current_review_status
  );
  v_new_publication_status := COALESCE(
    (p_data->>'publication_status')::publication_status_enum,
    v_current_publication_status
  );
  v_new_validation_status := COALESCE(
    (p_data->>'validation_status')::validation_status_enum,
    v_current_validation_status
  );

  -- Validate status relationships
  IF v_new_publication_status = 'published' AND v_new_review_status != 'approved' THEN
    RAISE EXCEPTION 'Cannot publish question that is not approved';
  END IF;

  IF v_new_review_status = 'approved' AND v_new_validation_status = 'error' THEN
    RAISE EXCEPTION 'Cannot approve question with validation errors';
  END IF;

  -- Update the question
  UPDATE questions
  SET
    data = CASE 
      WHEN p_data->'data' IS NOT NULL THEN p_data->'data'
      ELSE data
    END,
    publication_status = v_new_publication_status,
    validation_status = v_new_validation_status,
    review_status = v_new_review_status,
    updated_at = timezone('utc'::text, now())
  WHERE id = p_id;

  -- Verify the update
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Question with ID % not found', p_id;
  END IF;
END;
$$ LANGUAGE plpgsql; 