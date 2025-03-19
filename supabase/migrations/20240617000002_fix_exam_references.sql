-- Migration to fix exam reference issues

-- Add an index on exams table for faster lookup
CREATE INDEX IF NOT EXISTS idx_exams_id ON exams(id);

-- Make sure exam_id in user_preparations can be null (it already is, but being explicit)
ALTER TABLE user_preparations 
ALTER COLUMN exam_id DROP NOT NULL;

-- Add text version of exam ID to help with lookups
ALTER TABLE user_preparations 
ADD COLUMN IF NOT EXISTS exam_id_text TEXT;

-- Update any existing preparations to fill in the text version of exam ID from JSON
UPDATE user_preparations
SET exam_id_text = prep_state->'exam'->>'id'
WHERE exam_id_text IS NULL;

-- Add an index on the exam_id_text column
CREATE INDEX IF NOT EXISTS idx_user_preparations_exam_id_text ON user_preparations(exam_id_text);

-- Make sure the preparation's metadata field records the exam ID
UPDATE user_preparations
SET prep_state = jsonb_set(
    prep_state, 
    '{metadata}', 
    jsonb_build_object(
        'examId', COALESCE(prep_state->'exam'->>'id', 'unknown'),
        'createdAt', extract(epoch from created_at)::bigint * 1000,
        'migrated', true
    )
)
WHERE prep_state->>'metadata' IS NULL; 