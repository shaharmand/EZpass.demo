-- Create function to migrate answer format
CREATE OR REPLACE FUNCTION migrate_answer_format()
RETURNS void AS $$
BEGIN
  -- Step 1: Move answer to schoolAnswer if needed
  UPDATE questions
  SET data = jsonb_set(
    data,
    '{schoolAnswer}',
    COALESCE(data->'answer', '{"solution": {"text": "", "format": "markdown"}}'::jsonb)
  )
  WHERE data->'schoolAnswer' IS NULL 
    AND data->'answer' IS NOT NULL;

  -- Step 2: Add answerFormat to metadata based on question type
  UPDATE questions
  SET data = jsonb_set(
    data,
    '{metadata,answerFormat}',
    jsonb_build_object(
      'hasFinalAnswer', 
      CASE 
        WHEN data->'metadata'->>'type' IN ('multiple_choice', 'numerical') THEN true
        ELSE false
      END,
      'finalAnswerType',
      CASE 
        WHEN data->'metadata'->>'type' = 'multiple_choice' THEN 'multiple_choice'
        WHEN data->'metadata'->>'type' = 'numerical' THEN 'numerical'
        ELSE 'none'
      END,
      'requiresSolution', true
    )
  )
  WHERE data->'metadata'->'answerFormat' IS NULL;

  -- Step 3: Clean up old answer field
  UPDATE questions
  SET data = data - 'answer'
  WHERE data->'answer' IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Execute the migration function
SELECT migrate_answer_format();

-- Drop old constraints that reference the answer field
ALTER TABLE questions DROP CONSTRAINT IF EXISTS valid_multiple_choice;
ALTER TABLE questions DROP CONSTRAINT IF EXISTS valid_numerical;

-- Add new constraints for the updated structure
ALTER TABLE questions
ADD CONSTRAINT valid_answer_format CHECK (
  jsonb_typeof(data->'metadata'->'answerFormat') = 'object'
  AND (data->'metadata'->'answerFormat'->>'hasFinalAnswer')::boolean IS NOT NULL
  AND data->'metadata'->'answerFormat'->>'finalAnswerType' IN ('multiple_choice', 'numerical', 'none')
  AND (data->'metadata'->'answerFormat'->>'requiresSolution')::boolean IS NOT NULL
);

ALTER TABLE questions
ADD CONSTRAINT valid_multiple_choice_answer CHECK (
  (data->'metadata'->>'type') != 'multiple_choice'
  OR (
    jsonb_array_length(data->'content'->'options') = 4
    AND data->'schoolAnswer'->'finalAnswer'->>'type' = 'multiple_choice'
    AND (data->'schoolAnswer'->'finalAnswer'->>'value')::int BETWEEN 1 AND 4
  )
);

ALTER TABLE questions
ADD CONSTRAINT valid_numerical_answer CHECK (
  (data->'metadata'->>'type') != 'numerical'
  OR (
    data->'schoolAnswer'->'finalAnswer'->>'type' = 'numerical'
    AND (data->'schoolAnswer'->'finalAnswer'->>'value') IS NOT NULL
    AND (data->'schoolAnswer'->'finalAnswer'->>'tolerance') IS NOT NULL
  )
);

-- Add constraint to ensure answerFormat matches question type
ALTER TABLE questions
ADD CONSTRAINT valid_answer_format_type CHECK (
  (data->'metadata'->>'type' = 'multiple_choice' AND data->'metadata'->'answerFormat'->>'finalAnswerType' = 'multiple_choice')
  OR (data->'metadata'->>'type' = 'numerical' AND data->'metadata'->'answerFormat'->>'finalAnswerType' = 'numerical')
  OR (data->'metadata'->>'type' = 'open' AND data->'metadata'->'answerFormat'->>'finalAnswerType' = 'none')
);

-- Drop the migration function as it's no longer needed
DROP FUNCTION migrate_answer_format();

-- Add comment explaining the changes
COMMENT ON CONSTRAINT valid_answer_format ON questions IS 'Ensures answer format requirements are properly structured';
COMMENT ON CONSTRAINT valid_multiple_choice_answer ON questions IS 'Validates multiple choice answer structure';
COMMENT ON CONSTRAINT valid_numerical_answer ON questions IS 'Validates numerical answer structure';
COMMENT ON CONSTRAINT valid_answer_format_type ON questions IS 'Ensures answer format type matches question type'; 