-- Create enum type for question status
CREATE TYPE question_status AS ENUM ('imported', 'generated', 'draft', 'approved');

-- Create the questions table
CREATE TABLE questions (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  status question_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create an index on the data field for better JSON querying performance
CREATE INDEX questions_data_gin ON questions USING gin (data);

-- Create an index on the status field
CREATE INDEX questions_status_idx ON questions (status);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_questions_updated_at
  BEFORE UPDATE ON questions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 