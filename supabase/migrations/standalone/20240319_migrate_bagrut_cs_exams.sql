-- Import Bagrut Computer Science exams
DO $$
DECLARE
    v_subject_id UUID;
    v_domain_id UUID;
    v_exam_id UUID;
    v_topic_id UUID;
    v_subtopic_id UUID;
BEGIN
    -- Get High School Computer Science subject ID
    SELECT id INTO v_subject_id 
    FROM subjects 
    WHERE code = 'CSC';
    
    IF v_subject_id IS NULL THEN
        RAISE EXCEPTION 'Subject with code CSC not found';
    END IF;

    ----------------------------------------------
    -- 1. Bagrut Java Basic Programming Exam
    ----------------------------------------------
    
    -- Get programming fundamentals domain ID
    SELECT id INTO v_domain_id 
    FROM domains 
    WHERE code = 'PRG' AND subject_id = v_subject_id;
    
    IF v_domain_id IS NULL THEN
        RAISE EXCEPTION 'Domain with code PRG not found in Computer Science subject';
    END IF;
    
    -- Insert Bagrut Basic Java Exam
    INSERT INTO exams (
        external_id, 
        code, 
        subject_id, 
        domain_id, 
        name_short, 
        name_medium, 
        name_full, 
        exam_type, 
        difficulty, 
        max_difficulty, 
        duration, 
        total_questions, 
        allowed_question_types,
        programming_language
    )
    VALUES (
        'bagrut_cs_basic_java', 
        '899', 
        v_subject_id, 
        v_domain_id, 
        'יסודות מדמ"ח Java', 
        'יסודות מדעי המחשב Java - בגרות', 
        'בחינת בגרות - יסודות מדעי המחשב ותכנות בסיסי בשפת Java', 
        'bagrut_exam', 
        3, 
        4, 
        180, 
        5, 
        '["multiple_choice", "open"]'::jsonb,
        'java'
    )
    ON CONFLICT (external_id) DO UPDATE
    SET 
        code = EXCLUDED.code,
        subject_id = EXCLUDED.subject_id,
        domain_id = EXCLUDED.domain_id,
        name_short = EXCLUDED.name_short,
        name_medium = EXCLUDED.name_medium,
        name_full = EXCLUDED.name_full,
        exam_type = EXCLUDED.exam_type,
        difficulty = EXCLUDED.difficulty,
        max_difficulty = EXCLUDED.max_difficulty,
        duration = EXCLUDED.duration,
        total_questions = EXCLUDED.total_questions,
        allowed_question_types = EXCLUDED.allowed_question_types,
        programming_language = EXCLUDED.programming_language
    RETURNING id INTO v_exam_id;
    
    -- Link topic: basic_programming_hsp
    SELECT id INTO v_topic_id 
    FROM topics 
    WHERE code = 'basic_programming_hsp' AND domain_id = v_domain_id;
    
    IF v_topic_id IS NOT NULL THEN
        INSERT INTO exam_topics (exam_id, topic_id)
        VALUES (v_exam_id, v_topic_id)
        ON CONFLICT (exam_id, topic_id) DO NOTHING;
        
        -- Link subtopics for basic_programming_hsp
        FOR v_subtopic_id IN 
            SELECT id FROM subtopics 
            WHERE topic_id = v_topic_id 
            AND code IN ('basic_io_hsp', 'variables_and_types_hsp', 'control_structures_hsp', 
                        'functions_hsp', 'arrays_1d_hsp', 'arrays_2d_hsp', 'strings_hsp')
        LOOP
            INSERT INTO exam_subtopics (exam_id, subtopic_id)
            VALUES (v_exam_id, v_subtopic_id)
            ON CONFLICT (exam_id, subtopic_id) DO NOTHING;
        END LOOP;
    END IF;
    
    ----------------------------------------------
    -- 2. Bagrut C# Basic Programming Exam
    ----------------------------------------------
    
    -- Insert Bagrut Basic C# Exam
    INSERT INTO exams (
        external_id, 
        code, 
        subject_id, 
        domain_id, 
        name_short, 
        name_medium, 
        name_full, 
        exam_type, 
        difficulty, 
        max_difficulty, 
        duration, 
        total_questions, 
        allowed_question_types,
        programming_language
    )
    VALUES (
        'bagrut_cs_basic_csharp', 
        '899', 
        v_subject_id, 
        v_domain_id, 
        'יסודות מדמ"ח #C', 
        'יסודות מדעי המחשב #C - בגרות', 
        'בחינת בגרות - יסודות מדעי המחשב ותכנות בסיסי בשפת #C', 
        'bagrut_exam', 
        3, 
        4, 
        180, 
        5, 
        '["multiple_choice", "open"]'::jsonb,
        'c#'
    )
    ON CONFLICT (external_id) DO UPDATE
    SET 
        code = EXCLUDED.code,
        subject_id = EXCLUDED.subject_id,
        domain_id = EXCLUDED.domain_id,
        name_short = EXCLUDED.name_short,
        name_medium = EXCLUDED.name_medium,
        name_full = EXCLUDED.name_full,
        exam_type = EXCLUDED.exam_type,
        difficulty = EXCLUDED.difficulty,
        max_difficulty = EXCLUDED.max_difficulty,
        duration = EXCLUDED.duration,
        total_questions = EXCLUDED.total_questions,
        allowed_question_types = EXCLUDED.allowed_question_types,
        programming_language = EXCLUDED.programming_language
    RETURNING id INTO v_exam_id;
    
    -- Link topic: basic_programming_hsp (same subtopics as Java)
    IF v_topic_id IS NOT NULL THEN
        INSERT INTO exam_topics (exam_id, topic_id)
        VALUES (v_exam_id, v_topic_id)
        ON CONFLICT (exam_id, topic_id) DO NOTHING;
        
        -- Link subtopics for basic_programming_hsp
        FOR v_subtopic_id IN 
            SELECT id FROM subtopics 
            WHERE topic_id = v_topic_id 
            AND code IN ('basic_io_hsp', 'variables_and_types_hsp', 'control_structures_hsp', 
                        'functions_hsp', 'arrays_1d_hsp', 'arrays_2d_hsp', 'strings_hsp')
        LOOP
            INSERT INTO exam_subtopics (exam_id, subtopic_id)
            VALUES (v_exam_id, v_subtopic_id)
            ON CONFLICT (exam_id, subtopic_id) DO NOTHING;
        END LOOP;
    END IF;
    
    ----------------------------------------------
    -- 3. Bagrut Data Structures Exams (Java, C#)
    ----------------------------------------------
    
    -- Get data structures domain ID
    SELECT id INTO v_domain_id 
    FROM domains 
    WHERE code = 'DST' AND subject_id = v_subject_id;
    
    IF v_domain_id IS NULL THEN
        RAISE EXCEPTION 'Domain with code DST not found in Computer Science subject';
    END IF;
    
    -- Insert Bagrut Java Data Structures Exam
    INSERT INTO exams (
        external_id, 
        code, 
        subject_id, 
        domain_id, 
        name_short, 
        name_medium, 
        name_full, 
        exam_type, 
        difficulty, 
        max_difficulty, 
        duration, 
        total_questions, 
        allowed_question_types,
        programming_language
    )
    VALUES (
        'bagrut_cs_data_structures_java', 
        '902', 
        v_subject_id, 
        v_domain_id, 
        'מבני נתונים Java', 
        'מבני נתונים ואלגוריתמים Java - בגרות', 
        'בחינת בגרות - מבני נתונים ואלגוריתמיקה מתקדמת בשפת Java', 
        'bagrut_exam', 
        3, 
        5, 
        180, 
        5, 
        '["multiple_choice", "open"]'::jsonb,
        'java'
    )
    ON CONFLICT (external_id) DO UPDATE
    SET 
        code = EXCLUDED.code,
        subject_id = EXCLUDED.subject_id,
        domain_id = EXCLUDED.domain_id,
        name_short = EXCLUDED.name_short,
        name_medium = EXCLUDED.name_medium,
        name_full = EXCLUDED.name_full,
        exam_type = EXCLUDED.exam_type,
        difficulty = EXCLUDED.difficulty,
        max_difficulty = EXCLUDED.max_difficulty,
        duration = EXCLUDED.duration,
        total_questions = EXCLUDED.total_questions,
        allowed_question_types = EXCLUDED.allowed_question_types,
        programming_language = EXCLUDED.programming_language
    RETURNING id INTO v_exam_id;
    
    -- Link topic: complexity_analysis_hsp
    SELECT id INTO v_topic_id 
    FROM topics 
    WHERE code = 'complexity_analysis_hsp' AND domain_id = v_domain_id;
    
    IF v_topic_id IS NOT NULL THEN
        INSERT INTO exam_topics (exam_id, topic_id)
        VALUES (v_exam_id, v_topic_id)
        ON CONFLICT (exam_id, topic_id) DO NOTHING;
        
        -- Link subtopics for complexity_analysis_hsp
        FOR v_subtopic_id IN 
            SELECT id FROM subtopics 
            WHERE topic_id = v_topic_id 
            AND code IN ('time_complexity_hsp', 'space_complexity_hsp', 
                        'asymptotic_notation_hsp', 'algorithm_comparison_hsp')
        LOOP
            INSERT INTO exam_subtopics (exam_id, subtopic_id)
            VALUES (v_exam_id, v_subtopic_id)
            ON CONFLICT (exam_id, subtopic_id) DO NOTHING;
        END LOOP;
    END IF;
    
    -- Link topic: linear_structures_hsp
    SELECT id INTO v_topic_id 
    FROM topics 
    WHERE code = 'linear_structures_hsp' AND domain_id = v_domain_id;
    
    IF v_topic_id IS NOT NULL THEN
        INSERT INTO exam_topics (exam_id, topic_id)
        VALUES (v_exam_id, v_topic_id)
        ON CONFLICT (exam_id, topic_id) DO NOTHING;
        
        -- Link subtopics for linear_structures_hsp
        FOR v_subtopic_id IN 
            SELECT id FROM subtopics 
            WHERE topic_id = v_topic_id 
            AND code IN ('linked_lists_hsp', 'stacks_hsp', 'queues_hsp')
        LOOP
            INSERT INTO exam_subtopics (exam_id, subtopic_id)
            VALUES (v_exam_id, v_subtopic_id)
            ON CONFLICT (exam_id, subtopic_id) DO NOTHING;
        END LOOP;
    END IF;
    
    -- Link topic: tree_structures_hsp
    SELECT id INTO v_topic_id 
    FROM topics 
    WHERE code = 'tree_structures_hsp' AND domain_id = v_domain_id;
    
    IF v_topic_id IS NOT NULL THEN
        INSERT INTO exam_topics (exam_id, topic_id)
        VALUES (v_exam_id, v_topic_id)
        ON CONFLICT (exam_id, topic_id) DO NOTHING;
        
        -- Link subtopics for tree_structures_hsp (Java only uses binary_trees_hsp)
        FOR v_subtopic_id IN 
            SELECT id FROM subtopics 
            WHERE topic_id = v_topic_id 
            AND code IN ('binary_trees_hsp')
        LOOP
            INSERT INTO exam_subtopics (exam_id, subtopic_id)
            VALUES (v_exam_id, v_subtopic_id)
            ON CONFLICT (exam_id, subtopic_id) DO NOTHING;
        END LOOP;
    END IF;
    
    -- Insert Bagrut C# Data Structures Exam
    INSERT INTO exams (
        external_id, 
        code, 
        subject_id, 
        domain_id, 
        name_short, 
        name_medium, 
        name_full, 
        exam_type, 
        difficulty, 
        max_difficulty, 
        duration, 
        total_questions, 
        allowed_question_types,
        programming_language
    )
    VALUES (
        'bagrut_cs_data_structures_csharp', 
        '902', 
        v_subject_id, 
        v_domain_id, 
        'מבני נתונים #C', 
        'מבני נתונים ואלגוריתמים #C - בגרות', 
        'בחינת בגרות - מבני נתונים ואלגוריתמיקה מתקדמת בשפת #C', 
        'bagrut_exam', 
        3, 
        5, 
        180, 
        5, 
        '["multiple_choice", "open"]'::jsonb,
        'c#'
    )
    ON CONFLICT (external_id) DO UPDATE
    SET 
        code = EXCLUDED.code,
        subject_id = EXCLUDED.subject_id,
        domain_id = EXCLUDED.domain_id,
        name_short = EXCLUDED.name_short,
        name_medium = EXCLUDED.name_medium,
        name_full = EXCLUDED.name_full,
        exam_type = EXCLUDED.exam_type,
        difficulty = EXCLUDED.difficulty,
        max_difficulty = EXCLUDED.max_difficulty,
        duration = EXCLUDED.duration,
        total_questions = EXCLUDED.total_questions,
        allowed_question_types = EXCLUDED.allowed_question_types,
        programming_language = EXCLUDED.programming_language
    RETURNING id INTO v_exam_id;
    
    -- Link topics and subtopics for C# Data Structures (same as Java)
    -- Complexity Analysis
    SELECT id INTO v_topic_id 
    FROM topics 
    WHERE code = 'complexity_analysis_hsp' AND domain_id = v_domain_id;
    
    IF v_topic_id IS NOT NULL THEN
        INSERT INTO exam_topics (exam_id, topic_id)
        VALUES (v_exam_id, v_topic_id)
        ON CONFLICT (exam_id, topic_id) DO NOTHING;
        
        -- Link subtopics for complexity_analysis_hsp
        FOR v_subtopic_id IN 
            SELECT id FROM subtopics 
            WHERE topic_id = v_topic_id 
            AND code IN ('time_complexity_hsp', 'space_complexity_hsp', 
                        'asymptotic_notation_hsp', 'algorithm_comparison_hsp')
        LOOP
            INSERT INTO exam_subtopics (exam_id, subtopic_id)
            VALUES (v_exam_id, v_subtopic_id)
            ON CONFLICT (exam_id, subtopic_id) DO NOTHING;
        END LOOP;
    END IF;
    
    -- Linear Structures
    SELECT id INTO v_topic_id 
    FROM topics 
    WHERE code = 'linear_structures_hsp' AND domain_id = v_domain_id;
    
    IF v_topic_id IS NOT NULL THEN
        INSERT INTO exam_topics (exam_id, topic_id)
        VALUES (v_exam_id, v_topic_id)
        ON CONFLICT (exam_id, topic_id) DO NOTHING;
        
        FOR v_subtopic_id IN 
            SELECT id FROM subtopics 
            WHERE topic_id = v_topic_id 
            AND code IN ('linked_lists_hsp', 'stacks_hsp', 'queues_hsp')
        LOOP
            INSERT INTO exam_subtopics (exam_id, subtopic_id)
            VALUES (v_exam_id, v_subtopic_id)
            ON CONFLICT (exam_id, subtopic_id) DO NOTHING;
        END LOOP;
    END IF;
    
    -- Tree Structures
    SELECT id INTO v_topic_id 
    FROM topics 
    WHERE code = 'tree_structures_hsp' AND domain_id = v_domain_id;
    
    IF v_topic_id IS NOT NULL THEN
        INSERT INTO exam_topics (exam_id, topic_id)
        VALUES (v_exam_id, v_topic_id)
        ON CONFLICT (exam_id, topic_id) DO NOTHING;
        
        FOR v_subtopic_id IN 
            SELECT id FROM subtopics 
            WHERE topic_id = v_topic_id 
            AND code IN ('binary_trees_hsp')
        LOOP
            INSERT INTO exam_subtopics (exam_id, subtopic_id)
            VALUES (v_exam_id, v_subtopic_id)
            ON CONFLICT (exam_id, subtopic_id) DO NOTHING;
        END LOOP;
    END IF;
    
    RAISE NOTICE 'Bagrut CS exams migration completed successfully';
    
END $$; 