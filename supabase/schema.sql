-- Create enum types
CREATE TYPE validation_status_enum AS ENUM ('valid', 'warning', 'error');
CREATE TYPE publication_status_enum AS ENUM ('draft', 'published', 'archived');

-- Create the questions table
CREATE TABLE questions (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  import_info JSONB NOT NULL DEFAULT '{}'::jsonb,
  publication_status publication_status_enum NOT NULL DEFAULT 'draft',
  publication_metadata JSONB,
  validation_status validation_status_enum NOT NULL DEFAULT 'valid',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create an index on the data field for better JSON querying performance
CREATE INDEX questions_data_gin ON questions USING gin (data);

-- Create an index on the import_info field for better JSON querying performance
CREATE INDEX questions_import_info_gin ON questions USING gin (import_info);

-- Create an index on publication_status for efficient querying
CREATE INDEX questions_publication_status_idx ON questions (publication_status);

-- Create an index on validation_status field
CREATE INDEX questions_validation_status_idx ON questions (validation_status);

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

-- Create profiles table
CREATE TABLE profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile."
  ON profiles FOR SELECT
  USING ( auth.uid() = id );

CREATE POLICY "Users can update their own profile."
  ON profiles FOR UPDATE
  USING ( auth.uid() = id );

-- Create a trigger for new user profiles
CREATE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- Add the updated_at trigger for profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 