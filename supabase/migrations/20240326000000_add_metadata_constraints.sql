-- Create function to fix invalid metadata
CREATE OR REPLACE FUNCTION fix_invalid_metadata()
RETURNS void AS $$
BEGIN
  -- Fix invalid difficulty levels
  UPDATE questions
  SET data = jsonb_set(
    COALESCE(data, '{}'::jsonb),
    '{metadata,difficulty}',
    '3'::jsonb
  )
  WHERE data->'metadata'->>'difficulty' IS NULL
     OR NOT ((data->'metadata'->>'difficulty')::int BETWEEN 1 AND 5);

  -- Fix invalid source types
  UPDATE questions
  SET data = jsonb_set(
    COALESCE(data, '{}'::jsonb),
    '{metadata,source,type}',
    '"ezpass"'::jsonb
  )
  WHERE data->'metadata'->'source'->>'type' IS NULL
     OR data->'metadata'->'source'->>'type' NOT IN ('exam', 'ezpass');

  -- Fix invalid creator types
  UPDATE questions
  SET data = jsonb_set(
    COALESCE(data, '{}'::jsonb),
    '{metadata,source,creatorType}',
    '"human"'::jsonb
  )
  WHERE data->'metadata'->'source'->>'type' = 'ezpass'
    AND (
      data->'metadata'->'source'->>'creatorType' IS NULL
      OR data->'metadata'->'source'->>'creatorType' NOT IN ('ai', 'human')
    );
END;
$$ LANGUAGE plpgsql;

-- Execute the fix function
SELECT fix_invalid_metadata();

-- Add constraints for metadata fields
ALTER TABLE questions
ADD CONSTRAINT valid_difficulty_level
CHECK (
  (data->'metadata'->>'difficulty')::int BETWEEN 1 AND 5
);

ALTER TABLE questions
ADD CONSTRAINT valid_source_type
CHECK (
  data->'metadata'->'source'->>'type' IN ('exam', 'ezpass')
);

ALTER TABLE questions
ADD CONSTRAINT valid_creator_type
CHECK (
  data->'metadata'->'source'->>'type' != 'ezpass'
  OR data->'metadata'->'source'->>'creatorType' IN ('ai', 'human')
);

-- Create indexes for efficient querying
CREATE INDEX idx_question_difficulty ON questions ((data->'metadata'->>'difficulty'));
CREATE INDEX idx_question_source_type ON questions ((data->'metadata'->'source'->>'type'));
CREATE INDEX idx_question_creator_type ON questions ((data->'metadata'->'source'->>'creatorType'));

-- Drop the fix function as it's no longer needed
DROP FUNCTION fix_invalid_metadata(); 