-- First, get the domain ID for the data structures domain
DO $$
DECLARE
    v_domain_id UUID;
    v_topic_id UUID;
BEGIN
    -- Get the domain ID
    SELECT id INTO v_domain_id FROM domains WHERE code = 'DST';
    
    IF v_domain_id IS NULL THEN
        RAISE EXCEPTION 'Domain with code DST not found';
    END IF;
    
    -- Topic 1: Complexity Analysis
    INSERT INTO topics (domain_id, code, name, description, "order")
    VALUES (v_domain_id, 'complexity_analysis_hsp', 'ניתוח סיבוכיות', 'ניתוח סיבוכיות זמן ומקום של אלגוריתמים', 0)
    ON CONFLICT (domain_id, code) DO UPDATE 
    SET name = EXCLUDED.name, description = EXCLUDED.description
    RETURNING id INTO v_topic_id;
    
    -- Insert subtopics for Complexity Analysis
    INSERT INTO subtopics (topic_id, code, name, description, "order", question_template)
    VALUES (v_topic_id, 'time_complexity_hsp', 'סיבוכיות זמן', 'ניתוח זמן ריצה, סימון O גדול, מקרה גרוע וממוצע', 0, '{"template": "ניתוח סיבוכיות זמן של אלגוריתמים"}'::jsonb)
    ON CONFLICT (topic_id, code) DO UPDATE 
    SET name = EXCLUDED.name, description = EXCLUDED.description, question_template = EXCLUDED.question_template;
    
    INSERT INTO subtopics (topic_id, code, name, description, "order", question_template)
    VALUES (v_topic_id, 'space_complexity_hsp', 'סיבוכיות מקום', 'ניתוח צריכת זיכרון, מקום נוסף, רקורסיה', 1, '{"template": "ניתוח סיבוכיות מקום של אלגוריתמים"}'::jsonb)
    ON CONFLICT (topic_id, code) DO UPDATE 
    SET name = EXCLUDED.name, description = EXCLUDED.description, question_template = EXCLUDED.question_template;
    
    INSERT INTO subtopics (topic_id, code, name, description, "order", question_template)
    VALUES (v_topic_id, 'asymptotic_notation_hsp', 'סימונים אסימפטוטיים', 'O, Ω, Θ, סדרי גודל, השוואת פונקציות', 2, '{"template": "שימוש בסימונים אסימפטוטיים"}'::jsonb)
    ON CONFLICT (topic_id, code) DO UPDATE 
    SET name = EXCLUDED.name, description = EXCLUDED.description, question_template = EXCLUDED.question_template;
    
    INSERT INTO subtopics (topic_id, code, name, description, "order", question_template)
    VALUES (v_topic_id, 'algorithm_comparison_hsp', 'השוואת אלגוריתמים', 'השוואת יעילות, מקרי קיצון, אופטימיזציה', 3, '{"template": "השוואת יעילות אלגוריתמים"}'::jsonb)
    ON CONFLICT (topic_id, code) DO UPDATE 
    SET name = EXCLUDED.name, description = EXCLUDED.description, question_template = EXCLUDED.question_template;
    
    -- Topic 2: Linear Structures
    INSERT INTO topics (domain_id, code, name, description, "order")
    VALUES (v_domain_id, 'linear_structures_hsp', 'מבנים לינאריים', 'מבני נתונים לינאריים והמימוש שלהם', 1)
    ON CONFLICT (domain_id, code) DO UPDATE 
    SET name = EXCLUDED.name, description = EXCLUDED.description
    RETURNING id INTO v_topic_id;
    
    -- Insert subtopics for Linear Structures
    INSERT INTO subtopics (topic_id, code, name, description, "order", question_template)
    VALUES (v_topic_id, 'linked_lists_hsp', 'רשימות מקושרות', 'רשימה מקושרת חד-כיוונית, דו-כיוונית, מעגלית', 0, '{"template": "מימוש פעולות, מעבר על רשימה, אלגוריתמים על רשימות"}'::jsonb)
    ON CONFLICT (topic_id, code) DO UPDATE 
    SET name = EXCLUDED.name, description = EXCLUDED.description, question_template = EXCLUDED.question_template;
    
    INSERT INTO subtopics (topic_id, code, name, description, "order", question_template)
    VALUES (v_topic_id, 'stacks_hsp', 'מחסניות', 'מחסנית ושימושיה, מימוש במערך וברשימה', 1, '{"template": "מימוש מחסנית, שימושים, אלגוריתמים עם מחסניות"}'::jsonb)
    ON CONFLICT (topic_id, code) DO UPDATE 
    SET name = EXCLUDED.name, description = EXCLUDED.description, question_template = EXCLUDED.question_template;
    
    INSERT INTO subtopics (topic_id, code, name, description, "order", question_template)
    VALUES (v_topic_id, 'queues_hsp', 'תורים', 'תור רגיל, תור מעגלי, תור עדיפויות', 2, '{"template": "מימוש תור, שימושים, אלגוריתמים עם תורים"}'::jsonb)
    ON CONFLICT (topic_id, code) DO UPDATE 
    SET name = EXCLUDED.name, description = EXCLUDED.description, question_template = EXCLUDED.question_template;
    
    -- Topic 3: Tree Structures
    INSERT INTO topics (domain_id, code, name, description, "order")
    VALUES (v_domain_id, 'tree_structures_hsp', 'עצים', 'מבני עץ שונים ואלגוריתמים', 2)
    ON CONFLICT (domain_id, code) DO UPDATE 
    SET name = EXCLUDED.name, description = EXCLUDED.description
    RETURNING id INTO v_topic_id;
    
    -- Insert subtopics for Tree Structures
    INSERT INTO subtopics (topic_id, code, name, description, "order", question_template)
    VALUES (v_topic_id, 'binary_trees_hsp', 'עצים בינאריים', 'עץ בינארי, עץ חיפוש בינארי, איזון', 0, '{"template": "מימוש עץ, חיפוש, הוספה ומחיקה, מעבר על עץ"}'::jsonb)
    ON CONFLICT (topic_id, code) DO UPDATE 
    SET name = EXCLUDED.name, description = EXCLUDED.description, question_template = EXCLUDED.question_template;
    
    INSERT INTO subtopics (topic_id, code, name, description, "order", question_template)
    VALUES (v_topic_id, 'balanced_trees_hsp', 'עצים מאוזנים', 'עצי AVL, עצי אדום-שחור', 1, '{"template": "איזון עצים, ניתוח יעילות, מימוש פעולות"}'::jsonb)
    ON CONFLICT (topic_id, code) DO UPDATE 
    SET name = EXCLUDED.name, description = EXCLUDED.description, question_template = EXCLUDED.question_template;
    
    INSERT INTO subtopics (topic_id, code, name, description, "order", question_template)
    VALUES (v_topic_id, 'heap_hsp', 'ערימה', 'ערימת מקסימום, ערימת מינימום, בניית ערימה', 2, '{"template": "מימוש ערימה, heapify, heap sort"}'::jsonb)
    ON CONFLICT (topic_id, code) DO UPDATE 
    SET name = EXCLUDED.name, description = EXCLUDED.description, question_template = EXCLUDED.question_template;
    
    -- Topic 4: Hash Tables
    INSERT INTO topics (domain_id, code, name, description, "order")
    VALUES (v_domain_id, 'hash_tables_hsp', 'טבלאות גיבוב', 'מבני גיבוב ופתרון התנגשויות', 3)
    ON CONFLICT (domain_id, code) DO UPDATE 
    SET name = EXCLUDED.name, description = EXCLUDED.description
    RETURNING id INTO v_topic_id;
    
    -- Insert subtopics for Hash Tables
    INSERT INTO subtopics (topic_id, code, name, description, "order", question_template)
    VALUES (v_topic_id, 'hashing_hsp', 'פונקציות גיבוב', 'פונקציות גיבוב, התנגשויות, פקטור העמסה', 0, '{"template": "תכנון פונקציות גיבוב, ניתוח יעילות"}'::jsonb)
    ON CONFLICT (topic_id, code) DO UPDATE 
    SET name = EXCLUDED.name, description = EXCLUDED.description, question_template = EXCLUDED.question_template;
    
    INSERT INTO subtopics (topic_id, code, name, description, "order", question_template)
    VALUES (v_topic_id, 'collision_resolution_hsp', 'טיפול בהתנגשויות', 'שרשור, כתובת פתוחה, גיבוב כפול', 1, '{"template": "מימוש שיטות שונות, השוואת יעילות"}'::jsonb)
    ON CONFLICT (topic_id, code) DO UPDATE 
    SET name = EXCLUDED.name, description = EXCLUDED.description, question_template = EXCLUDED.question_template;
    
    -- Topic 5: Graphs
    INSERT INTO topics (domain_id, code, name, description, "order")
    VALUES (v_domain_id, 'graphs_hsp', 'גרפים', 'ייצוג גרפים ואלגוריתמים בסיסיים', 4)
    ON CONFLICT (domain_id, code) DO UPDATE 
    SET name = EXCLUDED.name, description = EXCLUDED.description
    RETURNING id INTO v_topic_id;
    
    -- Insert subtopics for Graphs
    INSERT INTO subtopics (topic_id, code, name, description, "order", question_template)
    VALUES (v_topic_id, 'graph_representation_hsp', 'ייצוג גרפים', 'מטריצת סמיכויות, רשימת שכנויות', 0, '{"template": "מימוש ייצוגים שונים, המרה בין ייצוגים"}'::jsonb)
    ON CONFLICT (topic_id, code) DO UPDATE 
    SET name = EXCLUDED.name, description = EXCLUDED.description, question_template = EXCLUDED.question_template;
    
    INSERT INTO subtopics (topic_id, code, name, description, "order", question_template)
    VALUES (v_topic_id, 'graph_traversal_hsp', 'מעבר על גרף', 'חיפוש לרוחב, חיפוש לעומק, קישוריות', 1, '{"template": "מימוש אלגוריתמי חיפוש, ניתוח תוצאות"}'::jsonb)
    ON CONFLICT (topic_id, code) DO UPDATE 
    SET name = EXCLUDED.name, description = EXCLUDED.description, question_template = EXCLUDED.question_template;
    
    INSERT INTO subtopics (topic_id, code, name, description, "order", question_template)
    VALUES (v_topic_id, 'shortest_paths_hsp', 'מסלולים קצרים ביותר', 'אלגוריתם דייקסטרה, פלויד-וורשל', 2, '{"template": "מציאת מסלול קצר ביותר, ניתוח יעילות"}'::jsonb)
    ON CONFLICT (topic_id, code) DO UPDATE 
    SET name = EXCLUDED.name, description = EXCLUDED.description, question_template = EXCLUDED.question_template;
    
END $$; 