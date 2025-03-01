-- Migration to add import_info column
ALTER TABLE questions 
ADD COLUMN import_info JSONB;

-- Create an index for better query performance on import_info
CREATE INDEX questions_import_info_gin ON questions USING gin (import_info);

-- Backfill null values with empty JSON object
UPDATE questions 
SET import_info = '{}'::jsonb 
WHERE import_info IS NULL;

-- Make the column not null after backfill
ALTER TABLE questions 
ALTER COLUMN import_info SET NOT NULL; 