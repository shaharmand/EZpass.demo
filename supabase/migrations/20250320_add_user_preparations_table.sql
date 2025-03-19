-- Migration: Add user_preparations table
-- Description: Stores user preparation states and enables resuming practice sessions

-- Create the table
CREATE TABLE IF NOT EXISTS user_preparations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  exam_id UUID REFERENCES exams(id),
  custom_name TEXT,
  prep_state JSONB NOT NULL,
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Indexes for efficient querying
  CONSTRAINT unique_active_prep_per_user UNIQUE (user_id, exam_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_preparations_user_id ON user_preparations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preparations_last_active_at ON user_preparations(last_active_at);

-- RLS policies
ALTER TABLE user_preparations ENABLE ROW LEVEL SECURITY;

-- Users can only view their own preparations
DROP POLICY IF EXISTS "Users can view own preparations" ON user_preparations;
CREATE POLICY "Users can view own preparations" 
ON user_preparations FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own preparations
DROP POLICY IF EXISTS "Users can insert own preparations" ON user_preparations;
CREATE POLICY "Users can insert own preparations" 
ON user_preparations FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own preparations
DROP POLICY IF EXISTS "Users can update own preparations" ON user_preparations;
CREATE POLICY "Users can update own preparations" 
ON user_preparations FOR UPDATE USING (auth.uid() = user_id);

-- Give anon and authenticated roles access to the table
GRANT SELECT, INSERT, UPDATE ON user_preparations TO anon, authenticated;

-- Add updated_at trigger
DROP TRIGGER IF EXISTS set_updated_at_timestamp ON user_preparations;
CREATE TRIGGER set_updated_at_timestamp
BEFORE UPDATE ON user_preparations
FOR EACH ROW
EXECUTE FUNCTION moddatetime(updated_at);

-- Modify question_submissions to include preparation ID
ALTER TABLE question_submissions 
ADD COLUMN IF NOT EXISTS prep_id UUID REFERENCES user_preparations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_question_submissions_prep_id ON question_submissions(prep_id); 