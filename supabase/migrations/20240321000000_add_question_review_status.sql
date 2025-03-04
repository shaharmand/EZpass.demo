-- Create new review status enum
DO $$ BEGIN
    CREATE TYPE review_status_enum AS ENUM ('pending_review', 'approved');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add new columns to track review process and AI-generated fields
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS review_status review_status_enum NOT NULL DEFAULT 'pending_review',
ADD COLUMN IF NOT EXISTS review_metadata JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS ai_generated_fields JSONB DEFAULT '{"fields": [], "confidence": {}, "generatedAt": null}'::jsonb;

-- Add constraint to ensure review_metadata has required structure
DO $$ BEGIN
    ALTER TABLE questions
    ADD CONSTRAINT valid_review_metadata CHECK (
      jsonb_typeof(review_metadata) = 'object'
      AND (
        review_status = 'pending_review'
        OR (
          review_status = 'approved'
          AND review_metadata->>'reviewedAt' IS NOT NULL
          AND review_metadata->>'reviewedBy' IS NOT NULL
        )
      )
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add constraint to ensure ai_generated_fields has valid structure
DO $$ BEGIN
    ALTER TABLE questions
    ADD CONSTRAINT valid_ai_generated_fields CHECK (
      jsonb_typeof(ai_generated_fields) = 'object'
      AND jsonb_typeof(ai_generated_fields->'fields') = 'array'
      AND jsonb_typeof(ai_generated_fields->'confidence') = 'object'
      AND (
        ai_generated_fields->>'generatedAt' IS NULL
        OR ai_generated_fields->>'generatedAt' ~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}'
      )
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create index for efficient querying of review status
CREATE INDEX IF NOT EXISTS questions_review_status_idx ON questions (review_status);

-- Add comment explaining the columns
COMMENT ON COLUMN questions.review_status IS 'Status of the question review process (pending_review or approved)';
COMMENT ON COLUMN questions.review_metadata IS 'Metadata about the review process including who reviewed and when';
COMMENT ON COLUMN questions.ai_generated_fields IS 'Tracks which fields were AI-generated, with confidence scores and generation time';

-- Create a function to handle review status changes
CREATE OR REPLACE FUNCTION handle_review_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- When approving a question
  IF NEW.review_status = 'approved' AND OLD.review_status = 'pending_review' THEN
    -- Set review metadata with current time and user
    NEW.review_metadata = jsonb_build_object(
      'reviewedAt', timezone('utc'::text, now())::text,
      'reviewedBy', current_user
    );
    
    -- Clear AI-generated fields as they're now approved
    NEW.ai_generated_fields = '{"fields": [], "confidence": {}, "generatedAt": null}'::jsonb;
  END IF;

  -- When moving back to pending review - do nothing, keep existing review metadata
  -- as information about who last reviewed it

  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to handle review status changes
DROP TRIGGER IF EXISTS handle_review_status_change_trigger ON questions;
CREATE TRIGGER handle_review_status_change_trigger
  BEFORE UPDATE ON questions
  FOR EACH ROW
  WHEN (OLD.review_status IS DISTINCT FROM NEW.review_status)
  EXECUTE FUNCTION handle_review_status_change();

-- Update existing records - mark all existing questions as approved
UPDATE questions 
SET 
  review_status = 'approved',
  review_metadata = jsonb_build_object(
    'reviewedAt', timezone('utc'::text, now())::text,
    'reviewedBy', 'system_migration'
  ),
  ai_generated_fields = '{"fields": [], "confidence": {}, "generatedAt": null}'::jsonb
WHERE review_status IS NULL; 