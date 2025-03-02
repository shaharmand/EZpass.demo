-- Create new publication status enum
CREATE TYPE publication_status_enum AS ENUM ('draft', 'published', 'archived');

-- Add new columns
ALTER TABLE questions 
ADD COLUMN publication_status publication_status_enum NOT NULL DEFAULT 'draft',
ADD COLUMN publication_metadata JSONB;

-- Migrate existing data
UPDATE questions 
SET 
  publication_status = 
    CASE 
      WHEN status = 'approved' THEN 'published'::publication_status_enum
      ELSE 'draft'::publication_status_enum
    END,
  publication_metadata = 
    CASE 
      WHEN status = 'approved' THEN 
        jsonb_build_object(
          'publishedAt', updated_at,
          'publishedBy', 'system_migration'
        )
      ELSE NULL
    END;

-- Create index on publication_status for efficient querying
CREATE INDEX questions_publication_status_idx ON questions (publication_status);

-- Drop old status column and type
ALTER TABLE questions DROP COLUMN status;
DROP TYPE question_status; 