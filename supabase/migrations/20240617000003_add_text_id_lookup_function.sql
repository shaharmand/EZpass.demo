-- Create a function to look up exams by their text ID (external_id)
CREATE OR REPLACE FUNCTION public.get_exam_id_by_external_id(p_external_id TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_id UUID;
BEGIN
    -- Look up the exam by its external_id
    SELECT id INTO v_id
    FROM exams
    WHERE external_id = p_external_id;
    
    -- Return the UUID if found, or NULL if not found
    RETURN v_id;
END;
$$;

-- Update user_preparations to ensure exam_id is filled when exam_id_text exists
UPDATE user_preparations
SET exam_id = get_exam_id_by_external_id(exam_id_text)
WHERE exam_id_text IS NOT NULL AND exam_id IS NULL;

-- Add an RLS policy to allow access to the function
GRANT EXECUTE ON FUNCTION public.get_exam_id_by_external_id(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_exam_id_by_external_id(TEXT) TO anon; 