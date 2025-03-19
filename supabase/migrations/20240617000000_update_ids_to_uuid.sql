-- Update schema for preparation-related tables to use UUID format

-- Update user_preparations table
ALTER TABLE user_preparations 
ALTER COLUMN id TYPE UUID USING (
  CASE
    WHEN id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN id::UUID
    ELSE gen_random_uuid() -- Generate a new UUID if not valid
  END
);

-- Update question_submissions table
ALTER TABLE question_submissions 
ALTER COLUMN prep_id TYPE UUID USING (
  CASE
    WHEN prep_id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN prep_id::UUID
    ELSE NULL -- Set to NULL if not valid, will need to be reassociated later
  END
);

-- Add comment explaining the change
COMMENT ON TABLE user_preparations IS 'User preparation records with UUID primary keys';
COMMENT ON TABLE question_submissions IS 'Question submissions with UUID prep_id foreign key'; 