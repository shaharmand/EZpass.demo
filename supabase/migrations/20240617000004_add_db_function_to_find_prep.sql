-- Create function to find a preparation by exam text ID
CREATE OR REPLACE FUNCTION public.find_preparation_by_exam_id(
  p_user_id uuid,
  p_exam_text_id text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_prep_id uuid;
BEGIN
  -- First try to find a preparation using the exam_id_text field
  SELECT id INTO v_prep_id
  FROM user_preparations
  WHERE user_id = p_user_id
    AND exam_id_text = p_exam_text_id
  ORDER BY last_active_at DESC
  LIMIT 1;
  
  -- If not found, try to find it via the prep_state JSON field
  IF v_prep_id IS NULL THEN
    SELECT id INTO v_prep_id
    FROM user_preparations
    WHERE user_id = p_user_id
      AND prep_state->'exam'->>'id' = p_exam_text_id
    ORDER BY last_active_at DESC
    LIMIT 1;
  END IF;
  
  RETURN v_prep_id;
END;
$$;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION public.find_preparation_by_exam_id(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.find_preparation_by_exam_id(uuid, text) TO anon; 