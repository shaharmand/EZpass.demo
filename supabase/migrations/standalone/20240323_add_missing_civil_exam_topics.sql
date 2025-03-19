-- Create the function first
CREATE OR REPLACE FUNCTION add_topic_to_exam(
    p_exam_id UUID,
    p_topic_code TEXT,
    p_topic_name TEXT,
    p_topic_description TEXT,
    p_topic_order INTEGER,
    p_subtopics JSONB,
    p_domain_id UUID
) RETURNS VOID AS $$
DECLARE
    v_topic_id UUID;
    v_subtopic JSONB;
    v_subtopic_id UUID;
BEGIN
    -- Insert or get topic
    SELECT id INTO v_topic_id 
    FROM topics 
    WHERE code = p_topic_code AND domain_id = p_domain_id;
    
    IF v_topic_id IS NULL THEN
        INSERT INTO topics (domain_id, code, name, description, "order")
        VALUES (p_domain_id, p_topic_code, p_topic_name, p_topic_description, p_topic_order)
        RETURNING id INTO v_topic_id;
    END IF;
    
    -- Link topic to exam
    INSERT INTO exam_topics (exam_id, topic_id, weight, is_required)
    VALUES (p_exam_id, v_topic_id, 1.0, true)
    ON CONFLICT (exam_id, topic_id) DO NOTHING;
    
    -- Add subtopics
    FOR v_subtopic IN SELECT * FROM jsonb_array_elements(p_subtopics)
    LOOP
        -- Insert or get subtopic
        SELECT id INTO v_subtopic_id 
        FROM subtopics 
        WHERE code = v_subtopic->>'code' AND topic_id = v_topic_id;
        
        IF v_subtopic_id IS NULL THEN
            INSERT INTO subtopics (topic_id, code, name, description, "order")
            VALUES (v_topic_id, v_subtopic->>'code', v_subtopic->>'name', v_subtopic->>'description', (v_subtopic->>'order')::INTEGER)
            RETURNING id INTO v_subtopic_id;
        END IF;
        
        -- Link subtopic to exam
        INSERT INTO exam_subtopics (exam_id, subtopic_id, weight, is_required)
        VALUES (p_exam_id, v_subtopic_id, 1.0, true)
        ON CONFLICT (exam_id, subtopic_id) DO NOTHING;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Now use the function in a DO block
DO $$
DECLARE
    v_domain_id UUID;
    v_subject_id UUID;
    v_exam_id UUID;
    v_topic_id UUID;
BEGIN
    -- Get the domain and subject IDs
    SELECT id INTO v_domain_id FROM domains WHERE code = 'SAF';
    SELECT id INTO v_subject_id FROM subjects WHERE code = 'civil_engineering';
    
    IF v_domain_id IS NULL OR v_subject_id IS NULL THEN
        RAISE EXCEPTION 'Domain or subject not found';
    END IF;

    -- Create renovation contractor 131 exam if it doesn't exist
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

    -- Add topics and subtopics for renovation contractor 131 exam
    IF v_exam_id IS NOT NULL THEN
        -- Safety Management Fundamentals
        PERFORM add_topic_to_exam(
            v_exam_id,
            'safety_management_fundamentals',
            'יסודות ניהול בטיחות',
            'עקרונות וניהול בטיחות באתרי בנייה',
            1,
            '[{"code": "basics_safety"}, {"code": "work_inspection_service"}, {"code": "workplace_safety_roles"}, {"code": "employee_training"}, {"code": "safety_planning"}, {"code": "construction_site_safety_management"}]'::jsonb,
            v_domain_id
        );

        -- Construction Methods and Works
        PERFORM add_topic_to_exam(
            v_exam_id,
            'Construction_methods_and_Works',
            'שיטות בנייה ועבודות',
            'שיטות בנייה ובטיחות בעבודות שונות',
            2,
            '[{"code": "work_surfaces_walkways_and_openings"}, {"code": "scaffolding"}, {"code": "concrete_formwork"}, {"code": "precast_construction"}, {"code": "steel_construction"}, {"code": "excavation_and_earthworks"}, {"code": "demolition_and_explosives"}]'::jsonb,
            v_domain_id
        );

        -- Height Work
        PERFORM add_topic_to_exam(
            v_exam_id,
            'height_work',
            'עבודה בגובה',
            'בטיחות בעבודה בגובה',
            3,
            '[{"code": "fragile_or_steep_roofs"}, {"code": "work_at_height"}, {"code": "ladders"}]'::jsonb,
            v_domain_id
        );

        -- Lifting and Cranes
        PERFORM add_topic_to_exam(
            v_exam_id,
            'lifting_and_cranes',
            'הרמה ועגורנים',
            'ציוד הרמה ועגורנים',
            4,
            '[{"code": "lifting_equipment"}, {"code": "cranes"}]'::jsonb,
            v_domain_id
        );

        -- Specialized Safety
        PERFORM add_topic_to_exam(
            v_exam_id,
            'specialized_safety',
            'בטיחות מתמחה',
            'נושאי בטיחות ייחודיים וממוקדים',
            5,
            '[{"code": "hot_bitumen"}, {"code": "electrical"}, {"code": "confined_spaces"}, {"code": "welding_and_cutting"}]'::jsonb,
            v_domain_id
        );

        -- Equipment and Health
        PERFORM add_topic_to_exam(
            v_exam_id,
            'equipment_and_health',
            'ציוד ובריאות',
            'ציוד בטיחות ובריאות תעסוקתית',
            6,
            '[{"code": "mechanical_equipment"}, {"code": "hygiene"}, {"code": "personal_protective_equipment"}]'::jsonb,
            v_domain_id
        );
    END IF;

    -- Create construction manager safety full exam if it doesn't exist
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

    -- Add topics and subtopics for construction manager safety full exam
    IF v_exam_id IS NOT NULL THEN
        -- Safety Management Fundamentals
        PERFORM add_topic_to_exam(
            v_exam_id,
            'safety_management_fundamentals',
            'יסודות ניהול בטיחות',
            'עקרונות וניהול בטיחות באתרי בנייה',
            1,
            '[{"code": "basics_safety"}, {"code": "work_inspection_service"}, {"code": "workplace_safety_roles"}, {"code": "employee_training"}, {"code": "safety_planning"}, {"code": "construction_site_safety_management"}]'::jsonb,
            v_domain_id
        );

        -- Construction Methods and Works
        PERFORM add_topic_to_exam(
            v_exam_id,
            'Construction_methods_and_Works',
            'שיטות בנייה ועבודות',
            'שיטות בנייה ובטיחות בעבודות שונות',
            2,
            '[{"code": "work_surfaces_walkways_and_openings"}, {"code": "scaffolding"}, {"code": "concrete_formwork"}, {"code": "precast_construction"}, {"code": "steel_construction"}, {"code": "excavation_and_earthworks"}, {"code": "demolition_and_explosives"}]'::jsonb,
            v_domain_id
        );

        -- Height Work
        PERFORM add_topic_to_exam(
            v_exam_id,
            'height_work',
            'עבודה בגובה',
            'בטיחות בעבודה בגובה',
            3,
            '[{"code": "fragile_or_steep_roofs"}, {"code": "work_at_height"}, {"code": "ladders"}]'::jsonb,
            v_domain_id
        );

        -- Lifting and Cranes
        PERFORM add_topic_to_exam(
            v_exam_id,
            'lifting_and_cranes',
            'הרמה ועגורנים',
            'ציוד הרמה ועגורנים',
            4,
            '[{"code": "lifting_equipment"}, {"code": "cranes"}]'::jsonb,
            v_domain_id
        );

        -- Specialized Safety
        PERFORM add_topic_to_exam(
            v_exam_id,
            'specialized_safety',
            'בטיחות מתמחה',
            'נושאי בטיחות ייחודיים וממוקדים',
            5,
            '[{"code": "hot_bitumen"}, {"code": "electrical"}, {"code": "confined_spaces"}, {"code": "welding_and_cutting"}]'::jsonb,
            v_domain_id
        );

        -- Equipment and Health
        PERFORM add_topic_to_exam(
            v_exam_id,
            'equipment_and_health',
            'ציוד ובריאות',
            'ציוד בטיחות ובריאות תעסוקתית',
            6,
            '[{"code": "mechanical_equipment"}, {"code": "hygiene"}, {"code": "personal_protective_equipment"}]'::jsonb,
            v_domain_id
        );
    END IF;

    -- Add diagnostic queries to check exam data
    RAISE NOTICE 'Checking exam data:';
    RAISE NOTICE 'Looking for renovation_contractor_131 exam:';
    RAISE NOTICE '%', (
        SELECT json_build_object(
            'id', id,
            'external_id', external_id,
            'name_short', name_short,
            'name_medium', name_medium,
            'name_full', name_full,
            'subject_id', subject_id,
            'domain_id', domain_id
        )
        FROM exams 
        WHERE external_id = 'renovation_contractor_131'
    );

    RAISE NOTICE 'Looking for construction_manager_safety_full exam:';
    RAISE NOTICE '%', (
        SELECT json_build_object(
            'id', id,
            'external_id', external_id,
            'name_short', name_short,
            'name_medium', name_medium,
            'name_full', name_full,
            'subject_id', subject_id,
            'domain_id', domain_id
        )
        FROM exams 
        WHERE external_id = 'construction_manager_safety_full'
    );

    RAISE NOTICE 'Checking exam_topics for these exams:';
    RAISE NOTICE 'Topics for renovation_contractor_131:';
    RAISE NOTICE '%', (
        SELECT json_agg(json_build_object(
            'topic_id', et.topic_id,
            'topic_name', t.name,
            'topic_code', t.code,
            'domain_id', t.domain_id
        ))
        FROM exam_topics et
        JOIN topics t ON et.topic_id = t.id
        JOIN exams e ON et.exam_id = e.id
        WHERE e.external_id = 'renovation_contractor_131'
    );

    RAISE NOTICE 'Topics for construction_manager_safety_full:';
    RAISE NOTICE '%', (
        SELECT json_agg(json_build_object(
            'topic_id', et.topic_id,
            'topic_name', t.name,
            'topic_code', t.code,
            'domain_id', t.domain_id
        ))
        FROM exam_topics et
        JOIN topics t ON et.topic_id = t.id
        JOIN exams e ON et.exam_id = e.id
        WHERE e.external_id = 'construction_manager_safety_full'
    );

    -- Show topic relationships and references
    RAISE NOTICE 'Topic relationships and references:';
    RAISE NOTICE 'Exam -> Topic -> Domain relationships:';
    FOR v_exam_id IN 
        SELECT DISTINCT e.id
        FROM exams e
        JOIN exam_topics et ON e.id = et.exam_id
    LOOP
        RAISE NOTICE 'Exam: % (ID: %)', (
            SELECT e.name_full
            FROM exams e
            WHERE e.id = v_exam_id
        ), v_exam_id;
        
        RAISE NOTICE '  Topics:';
        FOR v_topic_id IN 
            SELECT et.topic_id
            FROM exam_topics et
            WHERE et.exam_id = v_exam_id
        LOOP
            RAISE NOTICE '    Topic: % (ID: %)', (
                SELECT t.name
                FROM topics t
                WHERE t.id = v_topic_id
            ), v_topic_id;
            
            RAISE NOTICE '      Domain: % (ID: %)', (
                SELECT d.name
                FROM topics t
                JOIN domains d ON t.domain_id = d.id
                WHERE t.id = v_topic_id
            ), (
                SELECT d.id
                FROM topics t
                JOIN domains d ON t.domain_id = d.id
                WHERE t.id = v_topic_id
            );
        END LOOP;
    END LOOP;
END $$; 