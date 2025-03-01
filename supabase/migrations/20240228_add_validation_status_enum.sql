-- Create the validation status enum type
DO $$ BEGIN
    CREATE TYPE validation_status_enum AS ENUM ('valid', 'warning', 'error');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- First add the validation_status column if it doesn't exist
DO $$ BEGIN
    ALTER TABLE questions ADD COLUMN validation_status TEXT;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Update the questions table to use the new enum type
ALTER TABLE questions 
  ALTER COLUMN validation_status TYPE validation_status_enum 
  USING CASE 
    WHEN validation_status IS NULL THEN 'valid'::validation_status_enum
    ELSE validation_status::text::validation_status_enum
  END;

-- Set default value and not null constraint
ALTER TABLE questions 
  ALTER COLUMN validation_status SET DEFAULT 'valid'::validation_status_enum,
  ALTER COLUMN validation_status SET NOT NULL;

-- Add an index on validation_status for better query performance
CREATE INDEX IF NOT EXISTS questions_validation_status_idx ON questions (validation_status);

-- Add a comment explaining the column
COMMENT ON COLUMN questions.validation_status IS 'Validation status of the question (valid, warning, error)';

-- Update existing records to have a validation status if they don't
UPDATE questions 
SET validation_status = 'valid' 
WHERE validation_status IS NULL; 