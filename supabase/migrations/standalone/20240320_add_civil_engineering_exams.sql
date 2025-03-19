-- Add missing civil engineering exams and their associated topics/subtopics
DO $$
DECLARE
    v_subject_id uuid;
    v_domain_id uuid;
    v_exam_id uuid;
    v_topic_id uuid;
    v_subtopic_id uuid;
BEGIN
    -- Get subject ID for civil_engineering
    SELECT id INTO v_subject_id 
    FROM subjects 
    WHERE code = 'civil_engineering';

    -- If subject doesn't exist, create it
    IF v_subject_id IS NULL THEN
        INSERT INTO subjects (code, name, description)
        VALUES ('civil_engineering', 'הנדסה אזרחית', 'הנדסה אזרחית ובנייה')
        RETURNING id INTO v_subject_id;
    END IF;
    
    -- Get or create domain for construction_safety
    SELECT id INTO v_domain_id 
    FROM domains 
    WHERE code = 'construction_safety' AND subject_id = v_subject_id;
    
    -- If domain doesn't exist, create it
    IF v_domain_id IS NULL THEN
        INSERT INTO domains (subject_id, code, name, description)
        VALUES (v_subject_id, 'construction_safety', 'בטיחות בבנייה', 'בטיחות בעבודות בנייה ותשתיות')
        RETURNING id INTO v_domain_id;
    END IF;

    -- Add Exam 1: construction_manager_safety_full (M103)
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
        allowed_question_types
    )
    VALUES (
        'construction_manager_safety_full', 
        'M103', 
        v_subject_id, 
        v_domain_id, 
        'מבחן בטיחות למנהל עבודה', 
        'מבחן בטיחות למנהל עבודה - מסלול מלא', 
        'מבחן בטיחות למנהל עבודה - מסלול מלא', 
        'government_exam', 
        3, 
        4, 
        180, 
        50, 
        '["multiple_choice"]'::jsonb
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
        allowed_question_types = EXCLUDED.allowed_question_types
    RETURNING id INTO v_exam_id;
    
    -- Link topics for the construction_manager_safety_full exam
    -- Topic: safety_management_fundamentals
    SELECT id INTO v_topic_id 
    FROM topics 
    WHERE code = 'safety_management_fundamentals' AND domain_id = v_domain_id;
    
    IF v_topic_id IS NULL THEN
        INSERT INTO topics (domain_id, code, name, description, "order")
        VALUES (v_domain_id, 'safety_management_fundamentals', 'יסודות ניהול בטיחות', 'עקרונות וניהול בטיחות באתרי בנייה', 1)
        RETURNING id INTO v_topic_id;
    END IF;
    
    INSERT INTO exam_topics (exam_id, topic_id, weight, is_required)
    VALUES (v_exam_id, v_topic_id, 1.0, true)
    ON CONFLICT (exam_id, topic_id) DO NOTHING;
    
    -- Link subtopics for this topic
    -- basics_safety
    SELECT id INTO v_subtopic_id 
    FROM subtopics 
    WHERE code = 'basics_safety' AND topic_id = v_topic_id;
    
    IF v_subtopic_id IS NULL THEN
        INSERT INTO subtopics (topic_id, code, name, description, "order")
        VALUES (v_topic_id, 'basics_safety', 'יסודות הבטיחות', 'עקרונות יסוד בבטיחות בעבודה', 1)
        RETURNING id INTO v_subtopic_id;
    END IF;
    
    INSERT INTO exam_subtopics (exam_id, subtopic_id, weight, is_required)
    VALUES (v_exam_id, v_subtopic_id, 1.0, true)
    ON CONFLICT (exam_id, subtopic_id) DO NOTHING;
    
    -- Add more subtopics - using same pattern for brevity
    
    -- Topic: Construction_methods_and_Works
    SELECT id INTO v_topic_id 
    FROM topics 
    WHERE code = 'Construction_methods_and_Works' AND domain_id = v_domain_id;
    
    IF v_topic_id IS NULL THEN
        INSERT INTO topics (domain_id, code, name, description, "order")
        VALUES (v_domain_id, 'Construction_methods_and_Works', 'שיטות בנייה ועבודות', 'שיטות בנייה ובטיחות בעבודות שונות', 2)
        RETURNING id INTO v_topic_id;
    END IF;
    
    INSERT INTO exam_topics (exam_id, topic_id, weight, is_required)
    VALUES (v_exam_id, v_topic_id, 1.0, true)
    ON CONFLICT (exam_id, topic_id) DO NOTHING;
    
    -- Add other topics in a similar way
    -- height_work
    SELECT id INTO v_topic_id 
    FROM topics 
    WHERE code = 'height_work' AND domain_id = v_domain_id;
    
    IF v_topic_id IS NULL THEN
        INSERT INTO topics (domain_id, code, name, description, "order")
        VALUES (v_domain_id, 'height_work', 'עבודה בגובה', 'בטיחות בעבודה בגובה', 3)
        RETURNING id INTO v_topic_id;
    END IF;
    
    INSERT INTO exam_topics (exam_id, topic_id, weight, is_required)
    VALUES (v_exam_id, v_topic_id, 1.0, true)
    ON CONFLICT (exam_id, topic_id) DO NOTHING;
    
    -- Add Exam 2: renovation_contractor_131 (M104)
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
        allowed_question_types
    )
    VALUES (
        'renovation_contractor_131', 
        'M104', 
        v_subject_id, 
        v_domain_id, 
        'קבלן שיפוצים 131', 
        'מבחן בטיחות - קבלן שיפוצים 131', 
        'מבחן בטיחות בעבודה - קבלן שיפוצים סיווג 131', 
        'government_exam', 
        2, 
        3, 
        120, 
        30, 
        '["multiple_choice"]'::jsonb
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
        allowed_question_types = EXCLUDED.allowed_question_types
    RETURNING id INTO v_exam_id;
    
    -- Link the same topics for renovation_contractor_131 exam
    -- Topic: safety_management_fundamentals
    SELECT id INTO v_topic_id 
    FROM topics 
    WHERE code = 'safety_management_fundamentals' AND domain_id = v_domain_id;
    
    INSERT INTO exam_topics (exam_id, topic_id, weight, is_required)
    VALUES (v_exam_id, v_topic_id, 1.0, true)
    ON CONFLICT (exam_id, topic_id) DO NOTHING;
    
    -- Topic: Construction_methods_and_Works
    SELECT id INTO v_topic_id 
    FROM topics 
    WHERE code = 'Construction_methods_and_Works' AND domain_id = v_domain_id;
    
    INSERT INTO exam_topics (exam_id, topic_id, weight, is_required)
    VALUES (v_exam_id, v_topic_id, 1.0, true)
    ON CONFLICT (exam_id, topic_id) DO NOTHING;
    
    -- Topic: height_work
    SELECT id INTO v_topic_id 
    FROM topics 
    WHERE code = 'height_work' AND domain_id = v_domain_id;
    
    INSERT INTO exam_topics (exam_id, topic_id, weight, is_required)
    VALUES (v_exam_id, v_topic_id, 1.0, true)
    ON CONFLICT (exam_id, topic_id) DO NOTHING;
    
    -- Topic: lifting_and_cranes
    SELECT id INTO v_topic_id 
    FROM topics 
    WHERE code = 'lifting_and_cranes' AND domain_id = v_domain_id;
    
    IF v_topic_id IS NULL THEN
        INSERT INTO topics (domain_id, code, name, description, "order")
        VALUES (v_domain_id, 'lifting_and_cranes', 'הרמה ועגורנים', 'ציוד הרמה ועגורנים', 4)
        RETURNING id INTO v_topic_id;
    END IF;
    
    INSERT INTO exam_topics (exam_id, topic_id, weight, is_required)
    VALUES (v_exam_id, v_topic_id, 1.0, true)
    ON CONFLICT (exam_id, topic_id) DO NOTHING;
    
    -- Topic: specialized_safety
    SELECT id INTO v_topic_id 
    FROM topics 
    WHERE code = 'specialized_safety' AND domain_id = v_domain_id;
    
    IF v_topic_id IS NULL THEN
        INSERT INTO topics (domain_id, code, name, description, "order")
        VALUES (v_domain_id, 'specialized_safety', 'בטיחות מתמחה', 'נושאי בטיחות ייחודיים וממוקדים', 5)
        RETURNING id INTO v_topic_id;
    END IF;
    
    INSERT INTO exam_topics (exam_id, topic_id, weight, is_required)
    VALUES (v_exam_id, v_topic_id, 1.0, true)
    ON CONFLICT (exam_id, topic_id) DO NOTHING;
    
    -- Topic: equipment_and_health
    SELECT id INTO v_topic_id 
    FROM topics 
    WHERE code = 'equipment_and_health' AND domain_id = v_domain_id;
    
    IF v_topic_id IS NULL THEN
        INSERT INTO topics (domain_id, code, name, description, "order")
        VALUES (v_domain_id, 'equipment_and_health', 'ציוד ובריאות', 'ציוד בטיחות ובריאות תעסוקתית', 6)
        RETURNING id INTO v_topic_id;
    END IF;
    
    INSERT INTO exam_topics (exam_id, topic_id, weight, is_required)
    VALUES (v_exam_id, v_topic_id, 1.0, true)
    ON CONFLICT (exam_id, topic_id) DO NOTHING;

END $$; 