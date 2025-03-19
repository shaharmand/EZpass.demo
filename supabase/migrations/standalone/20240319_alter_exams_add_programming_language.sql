-- Add programming_language column to exams table if it doesn't exist
DO $$
BEGIN
    -- Check if the column already exists
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'exams'
        AND column_name = 'programming_language'
    ) THEN
        -- Add the column
        ALTER TABLE exams ADD COLUMN programming_language text;
        
        -- Create an index on the column
        CREATE INDEX IF NOT EXISTS exams_programming_language_idx ON exams(programming_language);
        
        RAISE NOTICE 'Added programming_language column to exams table';
    ELSE
        RAISE NOTICE 'programming_language column already exists in exams table';
    END IF;
END $$; 