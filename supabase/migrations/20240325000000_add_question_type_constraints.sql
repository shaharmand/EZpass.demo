-- Create function to fix invalid question types
CREATE OR REPLACE FUNCTION fix_invalid_question_types()
RETURNS void AS $$
BEGIN
  -- Update records with missing or invalid type to default 'open'
  UPDATE questions
  SET data = jsonb_set(
    COALESCE(data, '{}'::jsonb),
    '{metadata,type}',
    '"open"'::jsonb
  )
  WHERE data->>'metadata' IS NULL
     OR data->'metadata'->>'type' IS NULL
     OR data->'metadata'->>'type' NOT IN ('multiple_choice', 'open', 'numerical');

  -- Set default difficulty if missing
  UPDATE questions
  SET data = jsonb_set(
    COALESCE(data, '{}'::jsonb),
    '{metadata,difficulty}',
    '1'::jsonb
  )
  WHERE data->'metadata'->>'difficulty' IS NULL
     OR NOT (data->'metadata'->>'difficulty')::numeric BETWEEN 1 AND 5;

  -- Ensure metadata is an object
  UPDATE questions
  SET data = jsonb_set(
    '{"metadata": {}}'::jsonb,
    '{metadata}',
    COALESCE(data->'metadata', '{}'::jsonb)
  )
  WHERE data->>'metadata' IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Execute the fix function
SELECT fix_invalid_question_types();

-- Add constraints
ALTER TABLE questions
ADD CONSTRAINT valid_question_type
CHECK (
  data->'metadata'->>'type' IN ('multiple_choice', 'open', 'numerical')
);

ALTER TABLE questions
ADD CONSTRAINT valid_metadata_structure
CHECK (
  jsonb_typeof(data->'metadata') = 'object'
  AND data->'metadata'->>'type' IS NOT NULL
  AND (data->'metadata'->>'difficulty')::numeric BETWEEN 1 AND 5
  AND data->'metadata'->>'topicId' IS NOT NULL
);

-- Create index for efficient querying by type
CREATE INDEX idx_question_type ON questions ((data->'metadata'->>'type'));

-- Drop the fix function as it's no longer needed
DROP FUNCTION fix_invalid_question_types(); 