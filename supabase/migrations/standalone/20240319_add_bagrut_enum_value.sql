-- Add 'bagrut_exam' to the exam_type enum
DO $$
BEGIN
    -- Check if the exam_type enum exists
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'exam_type') THEN
        -- Check if 'bagrut_exam' is not yet in the enum
        PERFORM 1 FROM pg_enum
        WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'exam_type')
        AND enumlabel = 'bagrut_exam';
        
        -- If not found, add the value
        IF NOT FOUND THEN
            RAISE NOTICE 'Adding bagrut_exam value to exam_type enum...';
            ALTER TYPE exam_type ADD VALUE 'bagrut_exam';
        ELSE
            RAISE NOTICE 'bagrut_exam value already exists in exam_type enum';
        END IF;
    ELSE
        RAISE EXCEPTION 'exam_type enum does not exist - run the create_exams_tables.sql script first';
    END IF;
END $$; 