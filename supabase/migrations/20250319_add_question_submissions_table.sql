-- Migration: Add question_submissions table
-- Description: Stores QuestionSubmission data with full JSONB data

-- Create the table
CREATE TABLE IF NOT EXISTS question_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  question_id TEXT NOT NULL,
  submission_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Foreign key to auth.users if not in public schema
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_question_submissions_user_id 
ON question_submissions(user_id);

CREATE INDEX IF NOT EXISTS idx_question_submissions_question_id 
ON question_submissions(question_id);

CREATE INDEX IF NOT EXISTS idx_question_submissions_created_at 
ON question_submissions(created_at);

-- Create a compound index for common filtering patterns
CREATE INDEX IF NOT EXISTS idx_question_submissions_user_question 
ON question_submissions(user_id, question_id);

-- Add RLS (Row Level Security) policies
ALTER TABLE question_submissions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own submissions
CREATE POLICY "Users can view own submissions" 
ON question_submissions
FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own submissions
CREATE POLICY "Users can insert own submissions" 
ON question_submissions
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own submissions
CREATE POLICY "Users can update own submissions" 
ON question_submissions
FOR UPDATE USING (auth.uid() = user_id);

-- Policy: No deletion allowed (optional - remove if you want to allow deletion)
CREATE POLICY "No deletion allowed" 
ON question_submissions
FOR DELETE USING (false);

-- Give anon and authenticated roles access to the table
GRANT SELECT, INSERT, UPDATE ON question_submissions TO anon, authenticated; 