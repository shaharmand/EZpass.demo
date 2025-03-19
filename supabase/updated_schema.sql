-- Create enum types
CREATE TYPE validation_status_enum AS ENUM ('valid', 'warning', 'error');
CREATE TYPE publication_status_enum AS ENUM ('draft', 'published', 'archived');
CREATE TYPE question_type_enum AS ENUM ('multiple_choice', 'open', 'numerical');
CREATE TYPE source_type_enum AS ENUM ('exam', 'ezpass');
CREATE TYPE creator_type_enum AS ENUM ('ai', 'human');
CREATE TYPE review_status_enum AS ENUM ('pending_review', 'approved');
CREATE TYPE exam_type AS ENUM ('mahat_exam', 'government_exam', 'practice_exam', 'custom_exam', 'bagrut_exam');

-- Enable the moddatetime extension for tracking updated_at timestamps
CREATE EXTENSION IF NOT EXISTS moddatetime SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS vector;

-- Create the subjects table
CREATE TABLE IF NOT EXISTS subjects (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create the domains table
CREATE TABLE IF NOT EXISTS domains (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    code text NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(subject_id, code)
);

-- Create the topics table
CREATE TABLE IF NOT EXISTS topics (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    domain_id uuid NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
    code text NOT NULL,
    name text NOT NULL,
    description text,
    "order" integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(domain_id, code)
);

-- Create the subtopics table
CREATE TABLE IF NOT EXISTS subtopics (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    topic_id uuid NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    code text NOT NULL,
    name text NOT NULL,
    description text,
    "order" integer DEFAULT 0,
    question_template jsonb,
    typical_questions jsonb,
    percentage_of_total float,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(topic_id, code)
);

-- Create exams table
CREATE TABLE IF NOT EXISTS exams (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    external_id text NOT NULL UNIQUE,
    code text NOT NULL,
    subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    domain_id uuid NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
    name_short text NOT NULL,
    name_medium text NOT NULL,
    name_full text NOT NULL,
    exam_type exam_type NOT NULL,
    difficulty integer NOT NULL CHECK (difficulty > 0),
    max_difficulty integer NOT NULL CHECK (max_difficulty >= difficulty),
    duration integer NOT NULL CHECK (duration > 0),
    total_questions integer NOT NULL CHECK (total_questions > 0),
    allowed_question_types jsonb NOT NULL,
    programming_language text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create exam_topics table for junction between exams and topics
CREATE TABLE IF NOT EXISTS exam_topics (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    exam_id uuid NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    topic_id uuid NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    weight float DEFAULT 1.0 CHECK (weight > 0),
    is_required boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(exam_id, topic_id)
);

-- Create exam_subtopics table for junction between exams and subtopics
CREATE TABLE IF NOT EXISTS exam_subtopics (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    exam_id uuid NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    subtopic_id uuid NOT NULL REFERENCES subtopics(id) ON DELETE CASCADE,
    weight float DEFAULT 1.0 CHECK (weight > 0),
    is_required boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(exam_id, subtopic_id)
);

-- Create course tables
CREATE TABLE IF NOT EXISTS courses (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    description text,
    subject_id uuid REFERENCES subjects(id) ON DELETE SET NULL,
    domain_id uuid REFERENCES domains(id) ON DELETE SET NULL,
    image_url text,
    status text DEFAULT 'draft',
    published_at timestamp with time zone,
    duration_minutes integer,
    difficulty integer CHECK (difficulty BETWEEN 1 AND 5),
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create lessons table
CREATE TABLE IF NOT EXISTS lessons (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    content jsonb,
    "order" integer,
    duration_minutes integer,
    status text DEFAULT 'draft',
    topic_id uuid REFERENCES topics(id) ON DELETE SET NULL,
    subtopic_id uuid REFERENCES subtopics(id) ON DELETE SET NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create the videos table
CREATE TABLE IF NOT EXISTS videos (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    description text,
    url text NOT NULL,
    duration_seconds integer,
    thumbnail_url text,
    source text,
    source_id text,
    subject_id uuid REFERENCES subjects(id) ON DELETE SET NULL,
    domain_id uuid REFERENCES domains(id) ON DELETE SET NULL,
    topic_id uuid REFERENCES topics(id) ON DELETE SET NULL,
    subtopic_id uuid REFERENCES subtopics(id) ON DELETE SET NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    embedding vector(1536),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create video content table to store time-segmented content
CREATE TABLE IF NOT EXISTS video_content (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    video_id uuid NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    start_time_seconds float NOT NULL,
    end_time_seconds float NOT NULL,
    content text NOT NULL,
    embedding vector(1536),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CHECK (start_time_seconds < end_time_seconds)
);

-- Create video-lesson junction table
CREATE TABLE IF NOT EXISTS lesson_videos (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    video_id uuid NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    "order" integer NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(lesson_id, video_id)
);

-- Create the questions table
CREATE TABLE questions (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  import_info JSONB NOT NULL DEFAULT '{}'::jsonb,
  publication_status publication_status_enum NOT NULL DEFAULT 'draft',
  publication_metadata JSONB NOT NULL DEFAULT '{"publishedAt": null, "publishedBy": null, "archivedAt": null, "archivedBy": null, "reason": null}'::jsonb,
  validation_status validation_status_enum NOT NULL DEFAULT 'valid',
  review_status review_status_enum NOT NULL DEFAULT 'pending_review',
  review_metadata JSONB NOT NULL DEFAULT '{"reviewedAt": null, "reviewedBy": "system", "comments": null}'::jsonb,
  update_metadata JSONB NOT NULL DEFAULT '{"lastUpdatedAt": null, "lastUpdatedBy": null}'::jsonb,
  creation_metadata JSONB NOT NULL DEFAULT jsonb_build_object('createdAt', CURRENT_TIMESTAMP, 'createdBy', 'system'),
  ai_generated_fields JSONB NOT NULL DEFAULT '{"fields": [], "confidence": {}, "generatedAt": null}'::jsonb,
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
      (data->'metadata'->'source'->>'type' = 'exam' AND
       data->'metadata'->'source'->>'examTemplateId' IS NOT NULL AND
       data->'metadata'->'source'->>'year' IS NOT NULL AND
       data->'metadata'->'source'->>'period' IN ('Spring', 'Summer', 'Winter', 'Fall'))
      OR
      (data->'metadata'->'source'->>'type' = 'ezpass' AND
       data->'metadata'->'source'->>'creatorType' IN ('ai', 'human'))
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
  ),

  -- Add constraint for creation metadata
  CONSTRAINT valid_creation_metadata CHECK (
    jsonb_typeof(creation_metadata) = 'object'
    AND creation_metadata->>'createdAt' IS NOT NULL
    AND creation_metadata->>'createdBy' IS NOT NULL
  )
);

-- Create a table to store question video matches
CREATE TABLE IF NOT EXISTS question_video_matches (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    question_id text NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    video_id uuid NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    match_score float NOT NULL,
    video_segment_id uuid REFERENCES video_content(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(question_id, video_id)
);

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  first_name text,
  last_name text,
  avatar_url text,
  email text UNIQUE,
  role text NOT NULL DEFAULT 'student',
  subscription_tier text NOT NULL DEFAULT 'free',
  preferences jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT profiles_role_check CHECK (role IN ('student', 'teacher', 'admin')),
  CONSTRAINT profiles_subscription_tier_check CHECK (subscription_tier IN ('free', 'plus', 'pro'))
);

-- Create a table to store the last used ID for each subject-domain combination
CREATE TABLE IF NOT EXISTS question_id_sequences (
    subject_code text NOT NULL,
    domain_code text NOT NULL,
    last_used_id integer NOT NULL DEFAULT 0,
    PRIMARY KEY (subject_code, domain_code)
);

-- Create the question_submissions table
CREATE TABLE IF NOT EXISTS question_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  question_id TEXT NOT NULL,
  submission_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Foreign key to auth.users if not in public schema
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes for better query performance

-- Indexes for subject hierarchy
CREATE INDEX domains_subject_id_idx ON domains(subject_id);
CREATE INDEX topics_domain_id_idx ON topics(domain_id);
CREATE INDEX subtopics_topic_id_idx ON subtopics(topic_id);

-- Indexes for exams
CREATE INDEX exams_domain_id_idx ON exams(domain_id);
CREATE INDEX exams_subject_id_idx ON exams(subject_id);
CREATE INDEX exams_programming_language_idx ON exams(programming_language);
CREATE INDEX exam_topics_exam_id_idx ON exam_topics(exam_id);
CREATE INDEX exam_topics_topic_id_idx ON exam_topics(topic_id);
CREATE INDEX exam_subtopics_exam_id_idx ON exam_subtopics(exam_id);
CREATE INDEX exam_subtopics_subtopic_id_idx ON exam_subtopics(subtopic_id);

-- Indexes for courses and lessons
CREATE INDEX courses_subject_id_idx ON courses(subject_id);
CREATE INDEX courses_domain_id_idx ON courses(domain_id);
CREATE INDEX lessons_course_id_idx ON lessons(course_id);
CREATE INDEX lessons_topic_id_idx ON lessons(topic_id);
CREATE INDEX lessons_subtopic_id_idx ON lessons(subtopic_id);

-- Indexes for videos
CREATE INDEX videos_subject_id_idx ON videos(subject_id);
CREATE INDEX videos_domain_id_idx ON videos(domain_id);
CREATE INDEX videos_topic_id_idx ON videos(topic_id);
CREATE INDEX videos_subtopic_id_idx ON videos(subtopic_id);
CREATE INDEX video_content_video_id_idx ON video_content(video_id);
CREATE INDEX lesson_videos_lesson_id_idx ON lesson_videos(lesson_id);
CREATE INDEX lesson_videos_video_id_idx ON lesson_videos(video_id);

-- Indexes for questions
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

-- Indexes for question-video matches
CREATE INDEX question_video_matches_question_id_idx ON question_video_matches(question_id);
CREATE INDEX question_video_matches_video_id_idx ON question_video_matches(video_id);
CREATE INDEX question_video_matches_score_idx ON question_video_matches(match_score);

-- Indexes for question submissions
CREATE INDEX idx_question_submissions_user_id ON question_submissions(user_id);
CREATE INDEX idx_question_submissions_question_id ON question_submissions(question_id);
CREATE INDEX idx_question_submissions_created_at ON question_submissions(created_at);
CREATE INDEX idx_question_submissions_user_question ON question_submissions(user_id, question_id);

-- Enable Row Level Security for all tables
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtopics ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_subtopics ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_video_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_submissions ENABLE ROW LEVEL SECURITY;

-- Create updated_at triggers using moddatetime for all tables
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON subjects
    FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON domains
    FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON topics
    FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON subtopics
    FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON exams
    FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON exam_topics
    FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON exam_subtopics
    FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON lessons
    FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON videos
    FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON video_content
    FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON lesson_videos
    FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON questions
    FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON question_video_matches
    FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON question_submissions
    FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);

-- Default RLS policies for all tables to enable read for all, modify for authenticated

-- Admin-specific policies
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 
            FROM profiles admin_profile 
            WHERE admin_profile.id = auth.uid() 
            AND admin_profile.role = 'admin'
        )
    );

CREATE POLICY "Admins can update roles and subscriptions" ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 
            FROM profiles admin_profile 
            WHERE admin_profile.id = auth.uid() 
            AND admin_profile.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 
            FROM profiles admin_profile 
            WHERE admin_profile.id = auth.uid() 
            AND admin_profile.role = 'admin'
        )
    );

CREATE POLICY "Admins can delete profiles" ON public.profiles
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 
            FROM profiles admin_profile 
            WHERE admin_profile.id = auth.uid() 
            AND admin_profile.role = 'admin'
        )
    );

-- Subjects
CREATE POLICY "Enable read access for all users" ON subjects
    FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON subjects
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON subjects
    FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users only" ON subjects
    FOR DELETE USING (auth.role() = 'authenticated');

-- Domains
CREATE POLICY "Enable read access for all users" ON domains
    FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON domains
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON domains
    FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users only" ON domains
    FOR DELETE USING (auth.role() = 'authenticated');

-- Topics
CREATE POLICY "Enable read access for all users" ON topics
    FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON topics
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON topics
    FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users only" ON topics
    FOR DELETE USING (auth.role() = 'authenticated');

-- Subtopics
CREATE POLICY "Enable read access for all users" ON subtopics
    FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON subtopics
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON subtopics
    FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users only" ON subtopics
    FOR DELETE USING (auth.role() = 'authenticated');

-- Add similar policies for other tables (exams, courses, lessons, videos, etc.)

-- Create helper functions

-- Function for partial question updates
CREATE OR REPLACE FUNCTION update_question_partial(
  p_id TEXT,
  p_data JSONB
)
RETURNS void AS $$
DECLARE
  v_current_review_status review_status_enum;
  v_current_publication_status publication_status_enum;
  v_current_validation_status validation_status_enum;
  v_new_review_status review_status_enum;
  v_new_publication_status publication_status_enum;
  v_new_validation_status validation_status_enum;
BEGIN
  -- Prevent ID modification
  IF p_data->>'id' IS NOT NULL AND p_data->>'id' != p_id THEN
    RAISE EXCEPTION 'Cannot modify question ID';
  END IF;

  -- Get current status values
  SELECT 
    review_status,
    publication_status,
    validation_status
  INTO 
    v_current_review_status,
    v_current_publication_status,
    v_current_validation_status
  FROM questions
  WHERE id = p_id;

  -- Get new status values, fallback to current if not provided
  v_new_review_status := COALESCE(
    (p_data->>'review_status')::review_status_enum,
    v_current_review_status
  );
  v_new_publication_status := COALESCE(
    (p_data->>'publication_status')::publication_status_enum,
    v_current_publication_status
  );
  v_new_validation_status := COALESCE(
    (p_data->>'validation_status')::validation_status_enum,
    v_current_validation_status
  );

  -- Validate status relationships
  IF v_new_publication_status = 'published' AND v_new_review_status != 'approved' THEN
    RAISE EXCEPTION 'Cannot publish question that is not approved';
  END IF;

  IF v_new_review_status = 'approved' AND v_new_validation_status = 'error' THEN
    RAISE EXCEPTION 'Cannot approve question with validation errors';
  END IF;

  -- Update the question
  UPDATE questions
  SET
    data = CASE 
      WHEN p_data->'data' IS NOT NULL THEN p_data->'data'
      ELSE data
    END,
    publication_status = v_new_publication_status,
    validation_status = v_new_validation_status,
    review_status = v_new_review_status,
    updated_at = timezone('utc'::text, now())
  WHERE id = p_id;

  -- Verify the update
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Question with ID % not found', p_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get users with their emails (for admin purposes)
CREATE OR REPLACE FUNCTION get_users_with_emails()
RETURNS TABLE (
    id uuid,
    role varchar,
    created_at timestamptz,
    first_name varchar,
    last_name varchar,
    avatar_url varchar,
    updated_at timestamptz,
    subscription_tier varchar,
    email varchar(255)
)
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check if the user is authenticated
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    RETURN QUERY
    SELECT 
        p.id::uuid,
        p.role::varchar,
        p.created_at::timestamptz,
        p.first_name::varchar,
        p.last_name::varchar,
        p.avatar_url::varchar,
        p.updated_at::timestamptz,
        p.subscription_tier::varchar,
        u.email::varchar(255)
    FROM profiles p
    LEFT JOIN auth.users u ON u.id = p.id
    ORDER BY p.created_at DESC;
END;
$$;

-- Function for handling review status changes
CREATE OR REPLACE FUNCTION handle_review_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id uuid;
  v_user_name text;
BEGIN
  -- Get the current user's ID
  v_user_id := auth.uid();
  
  -- Get the user's first and last name from profiles
  SELECT 
    CASE 
      WHEN first_name IS NOT NULL AND last_name IS NOT NULL THEN first_name || ' ' || last_name
      WHEN first_name IS NOT NULL THEN first_name
      WHEN last_name IS NOT NULL THEN last_name
      ELSE v_user_id::text
    END INTO v_user_name
  FROM profiles
  WHERE id = v_user_id;

  -- When approving a question
  IF NEW.review_status = 'approved' AND OLD.review_status = 'pending_review' THEN
    -- Set review metadata with current time and user's name
    NEW.review_metadata = jsonb_build_object(
      'reviewedAt', timezone('utc'::text, now())::text,
      'reviewedBy', v_user_name
    );
    
    -- Clear AI-generated fields as they're now approved
    NEW.ai_generated_fields = '{"fields": [], "confidence": {}, "generatedAt": null}'::jsonb;
  END IF;

  -- When moving back to pending review - do nothing, keep existing review metadata
  -- as information about who last reviewed it

  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function for handling publication status changes
CREATE OR REPLACE FUNCTION handle_publication_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id uuid;
  v_user_name text;
BEGIN
  -- Get the current user's ID
  v_user_id := auth.uid();
  
  -- Get the user's first and last name from profiles
  SELECT 
    CASE 
      WHEN first_name IS NOT NULL AND last_name IS NOT NULL THEN first_name || ' ' || last_name
      WHEN first_name IS NOT NULL THEN first_name
      WHEN last_name IS NOT NULL THEN last_name
      ELSE v_user_id::text
    END INTO v_user_name
  FROM profiles
  WHERE id = v_user_id;

  -- When publishing a question
  IF NEW.publication_status = 'published' AND OLD.publication_status = 'draft' THEN
    -- Set publication metadata with current time and user's name
    NEW.publication_metadata = jsonb_build_object(
      'publishedAt', timezone('utc'::text, now())::text,
      'publishedBy', v_user_name,
      'archivedAt', null,
      'archivedBy', null,
      'reason', null
    );
  -- When archiving a question
  ELSIF NEW.publication_status = 'archived' AND OLD.publication_status IN ('draft', 'published') THEN
    -- Keep existing publication info if it exists
    NEW.publication_metadata = COALESCE(OLD.publication_metadata, '{}'::jsonb) || jsonb_build_object(
      'archivedAt', timezone('utc'::text, now())::text,
      'archivedBy', v_user_name
    );
  -- When moving back to draft - keep existing metadata
  ELSIF NEW.publication_status = 'draft' THEN
    -- Keep the existing metadata to track history
    NEW.publication_metadata = OLD.publication_metadata;
  END IF;

  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to get next question number
CREATE OR REPLACE FUNCTION get_next_question_number(
    p_subject_code text,
    p_domain_code text
) RETURNS jsonb AS $$
DECLARE
    v_next_id integer;
BEGIN
    -- Insert or update the sequence row with advisory lock to prevent concurrent access
    -- The lock is based on the hash of subject_code and domain_code
    -- This ensures different subject-domain combinations can proceed in parallel
    IF pg_try_advisory_xact_lock(hashtext(p_subject_code || '-' || p_domain_code)) THEN
        INSERT INTO question_id_sequences (subject_code, domain_code, last_used_id)
        VALUES (p_subject_code, p_domain_code, 1)
        ON CONFLICT (subject_code, domain_code) DO UPDATE
        SET last_used_id = question_id_sequences.last_used_id + 1
        RETURNING last_used_id INTO v_next_id;

        -- Return the next ID as JSON
        RETURN jsonb_build_object('next_id', v_next_id);
    ELSE
        RAISE EXCEPTION 'Could not acquire lock for subject % domain %', p_subject_code, p_domain_code;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to match questions with relevant videos
CREATE OR REPLACE FUNCTION match_question_to_videos(
    question_id text,
    similarity_threshold float DEFAULT 0.75
) RETURNS void AS $$
DECLARE
    q_data jsonb;
    q_text text;
    vid_rec record;
BEGIN
    -- Get the question data
    SELECT data INTO q_data FROM questions WHERE id = question_id;
    
    -- Extract text from question
    q_text := COALESCE(q_data->'content'->>'text', '') || ' ' ||
              COALESCE(q_data->'answer'->>'explanation', '');
              
    -- Skip if no meaningful text
    IF LENGTH(TRIM(q_text)) < 10 THEN
        RETURN;
    END IF;
    
    -- Delete existing matches for this question
    DELETE FROM question_video_matches WHERE question_id = match_question_to_videos.question_id;
    
    -- Insert new matches
    FOR vid_rec IN (
        WITH question_embedding AS (
            SELECT embedding_vector(q_text) AS embedding
        ),
        video_matches AS (
            SELECT 
                v.id AS video_id,
                vc.id AS segment_id,
                1 - (v.embedding <=> (SELECT embedding FROM question_embedding)) AS score
            FROM videos v
            LEFT JOIN video_content vc ON v.id = vc.video_id
            WHERE v.embedding IS NOT NULL 
              AND 1 - (v.embedding <=> (SELECT embedding FROM question_embedding)) > similarity_threshold
            ORDER BY score DESC
            LIMIT 5
        )
        SELECT * FROM video_matches
    )
    LOOP
        INSERT INTO question_video_matches (
            question_id, 
            video_id, 
            video_segment_id,
            match_score
        ) VALUES (
            match_question_to_videos.question_id,
            vid_rec.video_id,
            vid_rec.segment_id,
            vid_rec.score
        )
        ON CONFLICT (question_id, video_id) DO UPDATE
        SET match_score = vid_rec.score,
            video_segment_id = vid_rec.segment_id,
            updated_at = NOW();
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to generate embeddings (placeholder for OpenAI integration)
CREATE OR REPLACE FUNCTION embedding_vector(text_input text)
RETURNS vector(1536)
LANGUAGE plpgsql
AS $$
BEGIN
    -- This is a placeholder function that should be implemented for your specific embedding service
    -- In production, this would call an external API like OpenAI to generate embeddings
    -- For schema purposes, we're just defining the interface
    RETURN NULL;
END;
$$;

-- Functions for vector similarity search
CREATE OR REPLACE FUNCTION match_videos_pure(
    query_embedding vector(1536),
    similarity_threshold float default 0.6,
    max_results int default 3
)
RETURNS TABLE (
    id uuid,
    title text,
    description text,
    source_id text,
    subtopic_id uuid,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        videos.id,
        videos.title,
        videos.description,
        videos.source_id,
        videos.subtopic_id,
        1 - (videos.embedding <=> query_embedding) as similarity
    FROM videos
    WHERE 1 - (videos.embedding <=> query_embedding) > similarity_threshold
    ORDER BY videos.embedding <=> query_embedding
    LIMIT max_results;
END;
$$;

-- Create triggers on the questions table
DROP TRIGGER IF EXISTS handle_review_status_change_trigger ON questions;
CREATE TRIGGER handle_review_status_change_trigger
  BEFORE UPDATE ON questions
  FOR EACH ROW
  WHEN (OLD.review_status IS DISTINCT FROM NEW.review_status)
  EXECUTE FUNCTION handle_review_status_change();

DROP TRIGGER IF EXISTS handle_publication_status_change_trigger ON questions;
CREATE TRIGGER handle_publication_status_change_trigger
  BEFORE UPDATE ON questions
  FOR EACH ROW
  WHEN (OLD.publication_status IS DISTINCT FROM NEW.publication_status)
  EXECUTE FUNCTION handle_publication_status_change();

-- Add RLS policies for question submissions
CREATE POLICY "Users can view own submissions" 
ON question_submissions
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own submissions" 
ON question_submissions
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own submissions" 
ON question_submissions
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "No deletion allowed" 
ON question_submissions
FOR DELETE USING (false);

-- Create updated_at trigger for question_submissions
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON question_submissions
    FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);

-- Grant permissions for question_submissions
GRANT SELECT, INSERT, UPDATE ON question_submissions TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_users_with_emails() TO authenticated;

-- Create index for vector similarity search on videos and video_content
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE tablename = 'videos'
        AND indexname = 'videos_embedding_idx'
    ) THEN
        CREATE INDEX videos_embedding_idx ON videos 
        USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE tablename = 'video_content'
        AND indexname = 'video_content_embedding_idx'
    ) THEN
        CREATE INDEX video_content_embedding_idx ON video_content 
        USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100);
    END IF;
END $$;

-- Add comments on functions
COMMENT ON FUNCTION handle_publication_status_change() IS 'Automatically updates publication metadata when question status changes';
COMMENT ON FUNCTION handle_review_status_change() IS 'Automatically updates review metadata when question review status changes';
COMMENT ON FUNCTION update_question_partial IS 'Updates a question partially without replacing the entire record';
COMMENT ON FUNCTION get_users_with_emails IS 'Gets all users with their profile information and emails';
COMMENT ON FUNCTION get_next_question_number IS 'Generates the next sequential question number for a subject-domain combination';
COMMENT ON FUNCTION match_question_to_videos IS 'Matches a question with relevant videos based on embedding similarity';
COMMENT ON FUNCTION embedding_vector IS 'Generates a vector embedding for a text input';
COMMENT ON FUNCTION match_videos_pure IS 'Finds videos similar to a given embedding vector based on cosine similarity'; 