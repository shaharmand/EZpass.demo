-- Create exams tables and related association tables
DO $$
BEGIN
    -- Create exam types enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'exam_type') THEN
        CREATE TYPE exam_type AS ENUM ('mahat_exam', 'government_exam', 'practice_exam', 'custom_exam', 'bagrut_exam');
    END IF;

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

    -- Create index for faster domain/subject lookups
    CREATE INDEX IF NOT EXISTS exams_domain_id_idx ON exams(domain_id);
    CREATE INDEX IF NOT EXISTS exams_subject_id_idx ON exams(subject_id);
    CREATE INDEX IF NOT EXISTS exams_programming_language_idx ON exams(programming_language);
    
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

    -- Create index for faster lookups
    CREATE INDEX IF NOT EXISTS exam_topics_exam_id_idx ON exam_topics(exam_id);
    CREATE INDEX IF NOT EXISTS exam_topics_topic_id_idx ON exam_topics(topic_id);
    
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

    -- Create index for faster lookups
    CREATE INDEX IF NOT EXISTS exam_subtopics_exam_id_idx ON exam_subtopics(exam_id);
    CREATE INDEX IF NOT EXISTS exam_subtopics_subtopic_id_idx ON exam_subtopics(subtopic_id);
    
    -- Enable RLS for all tables
    ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
    ALTER TABLE exam_topics ENABLE ROW LEVEL SECURITY;
    ALTER TABLE exam_subtopics ENABLE ROW LEVEL SECURITY;
    
    -- Create RLS policies for exams
    CREATE POLICY "Enable read access for all users" ON exams
        FOR SELECT USING (true);
    
    CREATE POLICY "Enable insert for authenticated users only" ON exams
        FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    
    CREATE POLICY "Enable update for authenticated users only" ON exams
        FOR UPDATE USING (auth.role() = 'authenticated');
    
    CREATE POLICY "Enable delete for authenticated users only" ON exams
        FOR DELETE USING (auth.role() = 'authenticated');
    
    -- Create RLS policies for exam_topics
    CREATE POLICY "Enable read access for all users" ON exam_topics
        FOR SELECT USING (true);
    
    CREATE POLICY "Enable insert for authenticated users only" ON exam_topics
        FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    
    CREATE POLICY "Enable update for authenticated users only" ON exam_topics
        FOR UPDATE USING (auth.role() = 'authenticated');
    
    CREATE POLICY "Enable delete for authenticated users only" ON exam_topics
        FOR DELETE USING (auth.role() = 'authenticated');
    
    -- Create RLS policies for exam_subtopics
    CREATE POLICY "Enable read access for all users" ON exam_subtopics
        FOR SELECT USING (true);
    
    CREATE POLICY "Enable insert for authenticated users only" ON exam_subtopics
        FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    
    CREATE POLICY "Enable update for authenticated users only" ON exam_subtopics
        FOR UPDATE USING (auth.role() = 'authenticated');
    
    CREATE POLICY "Enable delete for authenticated users only" ON exam_subtopics
        FOR DELETE USING (auth.role() = 'authenticated');
    
    -- Create updated_at triggers
    CREATE TRIGGER handle_updated_at BEFORE UPDATE ON exams
        FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);
    
    CREATE TRIGGER handle_updated_at BEFORE UPDATE ON exam_topics
        FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);
    
    CREATE TRIGGER handle_updated_at BEFORE UPDATE ON exam_subtopics
        FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);

END $$; 