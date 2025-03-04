-- Create enum types
CREATE TYPE validation_status_enum AS ENUM ('valid', 'warning', 'error');
CREATE TYPE publication_status_enum AS ENUM ('draft', 'published', 'archived');
CREATE TYPE question_type_enum AS ENUM ('multiple_choice', 'open', 'numerical');
CREATE TYPE source_type_enum AS ENUM ('exam', 'ezpass');
CREATE TYPE creator_type_enum AS ENUM ('ai', 'human');
CREATE TYPE review_status_enum AS ENUM ('pending_review', 'approved');

-- Create the questions table
CREATE TABLE questions (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  import_info JSONB NOT NULL DEFAULT '{}'::jsonb,
  publication_status publication_status_enum NOT NULL DEFAULT 'draft',
  publication_metadata JSONB,
  validation_status validation_status_enum NOT NULL DEFAULT 'valid',
  review_status review_status_enum NOT NULL DEFAULT 'pending_review',
  review_metadata JSONB DEFAULT '{}'::jsonb,
  ai_generated_fields JSONB DEFAULT '{"fields": [], "confidence": {}, "generatedAt": null}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Add constraints for metadata validation
  CONSTRAINT valid_metadata_structure CHECK (
    jsonb_typeof(data->'metadata') = 'object'
    AND (data->'metadata'->>'type')::text IN ('multiple_choice', 'open', 'numerical')
    AND (data->'metadata'->>'difficulty')::int BETWEEN 1 AND 5
    AND (data->'metadata'->>'topicId') IS NOT NULL
    AND (data->'metadata'->>'subjectId') IS NOT NULL
    AND (data->'metadata'->>'domainId') IS NOT NULL
  ),

  -- Add constraints for source validation
  CONSTRAINT valid_source_structure CHECK (
    jsonb_typeof(data->'metadata'->'source') = 'object'
    AND (data->'metadata'->'source'->>'type')::text IN ('exam', 'ezpass')
  ),

  -- Add constraint for ezpass creator type
  CONSTRAINT valid_creator_type CHECK (
    (data->'metadata'->'source'->>'type') != 'ezpass'
    OR (data->'metadata'->'source'->>'creatorType')::text IN ('ai', 'human')
  ),

  -- Add constraint for exam source fields
  CONSTRAINT valid_exam_source CHECK (
    (data->'metadata'->'source'->>'type') != 'exam'
    OR (
      data->'metadata'->'source'->>'examTemplateId' IS NOT NULL
      AND (data->'metadata'->'source'->>'year')::int BETWEEN 1900 AND 2100
      AND data->'metadata'->'source'->>'season' IN ('spring', 'summer')
      AND data->'metadata'->'source'->>'moed' IN ('a', 'b')
    )
  ),

  -- Add constraint for multiple choice questions
  CONSTRAINT valid_multiple_choice CHECK (
    (data->'metadata'->>'type') != 'multiple_choice'
    OR (
      jsonb_array_length(data->'content'->'options') = 4
      AND data->'answer'->'finalAnswer'->>'type' = 'multiple_choice'
      AND (data->'answer'->'finalAnswer'->>'value')::int BETWEEN 1 AND 4
    )
  ),

  -- Add constraint for numerical questions
  CONSTRAINT valid_numerical CHECK (
    (data->'metadata'->>'type') != 'numerical'
    OR (
      data->'answer'->'finalAnswer'->>'type' = 'numerical'
      AND (data->'answer'->'finalAnswer'->>'value') IS NOT NULL
      AND (data->'answer'->'finalAnswer'->>'tolerance') IS NOT NULL
    )
  ),

  -- Add constraint to ensure review_metadata has required structure
  CONSTRAINT valid_review_metadata CHECK (
    jsonb_typeof(review_metadata) = 'object'
    AND (
      review_status = 'pending_review'
      OR (
        review_status = 'approved'
        AND review_metadata->>'reviewedAt' IS NOT NULL
        AND review_metadata->>'reviewedBy' IS NOT NULL
      )
    )
  ),

  -- Add constraint to ensure ai_generated_fields has valid structure
  CONSTRAINT valid_ai_generated_fields CHECK (
    jsonb_typeof(ai_generated_fields) = 'object'
    AND jsonb_typeof(ai_generated_fields->'fields') = 'array'
    AND jsonb_typeof(ai_generated_fields->'confidence') = 'object'
    AND (
      ai_generated_fields->>'generatedAt' IS NULL
      OR ai_generated_fields->>'generatedAt' ~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}'
    )
  ),

  -- Add constraint to ensure publication status is valid based on review status
  CONSTRAINT valid_publication_review_state CHECK (
    (publication_status = 'published' AND review_status = 'approved')
    OR (publication_status IN ('draft', 'archived'))
  )
);

-- Create indexes for better query performance
CREATE INDEX questions_data_gin ON questions USING gin (data);
CREATE INDEX questions_import_info_gin ON questions USING gin (import_info);
CREATE INDEX questions_publication_status_idx ON questions (publication_status);
CREATE INDEX questions_validation_status_idx ON questions (validation_status);
CREATE INDEX questions_review_status_idx ON questions (review_status);
CREATE INDEX idx_question_type ON questions ((data->'metadata'->>'type'));
CREATE INDEX idx_question_difficulty ON questions ((data->'metadata'->>'difficulty'));
CREATE INDEX idx_question_source_type ON questions ((data->'metadata'->'source'->>'type'));
CREATE INDEX idx_question_creator_type ON questions ((data->'metadata'->'source'->>'creatorType'));
CREATE INDEX idx_question_topic ON questions ((data->'metadata'->>'topicId'));
CREATE INDEX idx_question_subject ON questions ((data->'metadata'->>'subjectId'));
CREATE INDEX idx_question_domain ON questions ((data->'metadata'->>'domainId'));

-- Add comments explaining the columns
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
CREATE TRIGGER handle_review_status_change_trigger
  BEFORE UPDATE ON questions
  FOR EACH ROW
  WHEN (OLD.review_status IS DISTINCT FROM NEW.review_status)
  EXECUTE FUNCTION handle_review_status_change();

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update the updated_at timestamp
CREATE TRIGGER update_questions_updated_at
  BEFORE UPDATE ON questions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create profiles table if not exists
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  role text not null default 'student' check (role in ('student', 'teacher', 'admin')),
  subscription_tier text not null default 'free' check (subscription_tier in ('free', 'plus', 'pro')),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY IF NOT EXISTS "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Admins can update roles and subscriptions"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Create function for new user handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public.profiles (id, role, subscription_tier)
    VALUES (
        new.id,
        'student',  -- Default role
        'free'      -- Default subscription tier
    );
    RETURN new;
EXCEPTION
    WHEN unique_violation THEN
        -- Profile already exists, ignore
        RETURN new;
    WHEN OTHERS THEN
        RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
        RETURN new;
END;
$$;

-- Create trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Set up updated_at trigger for profiles
DROP TRIGGER IF EXISTS handle_updated_at ON profiles;
CREATE TRIGGER handle_updated_at 
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column(); 