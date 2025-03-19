-- Add topics and subtopics for Programming Fundamentals domain
DO $$
DECLARE
    v_domain_id UUID;
    v_topic_id UUID;
BEGIN
    -- Get the domain ID
    SELECT id INTO v_domain_id FROM domains WHERE code = 'PRG';
    
    IF v_domain_id IS NULL THEN
        RAISE EXCEPTION 'Domain with code PRG not found';
    END IF;
    
    -- Topic 1: Basic Programming
    INSERT INTO topics (domain_id, code, name, description, "order")
    VALUES (v_domain_id, 'basic_programming_hsp', 'תכנות בסיסי', 'יסודות התכנות', 0)
    ON CONFLICT (domain_id, code) DO UPDATE 
    SET name = EXCLUDED.name, description = EXCLUDED.description
    RETURNING id INTO v_topic_id;
    
    -- Insert subtopics for Basic Programming
    INSERT INTO subtopics (topic_id, code, name, description, "order", question_template)
    VALUES (v_topic_id, 'basic_io_hsp', 'קלט ופלט', 'קלט ופלט בסיסי', 0, '{"template": "כתיבת תוכנית עם קלט ופלט"}'::jsonb)
    ON CONFLICT (topic_id, code) DO UPDATE 
    SET name = EXCLUDED.name, description = EXCLUDED.description, question_template = EXCLUDED.question_template;
    
    INSERT INTO subtopics (topic_id, code, name, description, "order", question_template)
    VALUES (v_topic_id, 'variables_and_types_hsp', 'משתנים וטיפוסים', 'הגדרת משתנים וטיפוסי נתונים', 1, '{"template": "שימוש במשתנים וטיפוסי נתונים"}'::jsonb)
    ON CONFLICT (topic_id, code) DO UPDATE 
    SET name = EXCLUDED.name, description = EXCLUDED.description, question_template = EXCLUDED.question_template;
    
    INSERT INTO subtopics (topic_id, code, name, description, "order", question_template)
    VALUES (v_topic_id, 'control_structures_hsp', 'מבני בקרה', 'תנאים (if-else), לולאות (for, while, do-while), מבני switch, תנאים מקוצרים', 2, '{"template": "כתיבת תנאים, לולאות, תרגילי מעקב"}'::jsonb)
    ON CONFLICT (topic_id, code) DO UPDATE 
    SET name = EXCLUDED.name, description = EXCLUDED.description, question_template = EXCLUDED.question_template;
    
    INSERT INTO subtopics (topic_id, code, name, description, "order", question_template)
    VALUES (v_topic_id, 'functions_hsp', 'פונקציות', 'הגדרת פונקציות, פרמטרים, החזרת ערכים, scope, העמסת פונקציות (overloading)', 3, '{"template": "כתיבת פונקציות, העברת פרמטרים, מעקב אחר קוד, תרגילי דיבוג"}'::jsonb)
    ON CONFLICT (topic_id, code) DO UPDATE 
    SET name = EXCLUDED.name, description = EXCLUDED.description, question_template = EXCLUDED.question_template;
    
    INSERT INTO subtopics (topic_id, code, name, description, "order", question_template)
    VALUES (v_topic_id, 'arrays_1d_hsp', 'מערכים חד-ממדיים', 'הגדרת מערכים חד-ממדיים, לולאות על מערכים, אלגוריתמים בסיסיים', 4, '{"template": "עבודה עם מערכים חד-ממדיים, חיפוש, מיון בסיסי"}'::jsonb)
    ON CONFLICT (topic_id, code) DO UPDATE 
    SET name = EXCLUDED.name, description = EXCLUDED.description, question_template = EXCLUDED.question_template;
    
    INSERT INTO subtopics (topic_id, code, name, description, "order", question_template)
    VALUES (v_topic_id, 'arrays_2d_hsp', 'מערכים דו-ממדיים', 'הגדרת מערכים דו-ממדיים, לולאות מקוננות, אלגוריתמים על מטריצות', 5, '{"template": "עבודה עם מערכים דו-ממדיים, אלכסונים, שורות ועמודות"}'::jsonb)
    ON CONFLICT (topic_id, code) DO UPDATE 
    SET name = EXCLUDED.name, description = EXCLUDED.description, question_template = EXCLUDED.question_template;
    
    INSERT INTO subtopics (topic_id, code, name, description, "order", question_template)
    VALUES (v_topic_id, 'strings_hsp', 'מחרוזות', 'עבודה עם מחרוזות, פעולות בסיסיות, מניפולציות', 6, '{"template": "עיבוד מחרוזות, חיפוש תווים, חיתוך והדבקה"}'::jsonb)
    ON CONFLICT (topic_id, code) DO UPDATE 
    SET name = EXCLUDED.name, description = EXCLUDED.description, question_template = EXCLUDED.question_template;
    
    -- Topic 2: Basic Algorithms
    INSERT INTO topics (domain_id, code, name, description, "order")
    VALUES (v_domain_id, 'basic_algorithms_hsp', 'אלגוריתמים בסיסיים', 'אלגוריתמים ומבני נתונים בסיסיים', 1)
    ON CONFLICT (domain_id, code) DO UPDATE 
    SET name = EXCLUDED.name, description = EXCLUDED.description
    RETURNING id INTO v_topic_id;
    
    -- Insert subtopics for Basic Algorithms
    INSERT INTO subtopics (topic_id, code, name, description, "order", question_template)
    VALUES (v_topic_id, 'searching_hsp', 'חיפוש', 'חיפוש לינארי, חיפוש בינארי', 0, '{"template": "יישום אלגוריתמי חיפוש, השוואת יעילות"}'::jsonb)
    ON CONFLICT (topic_id, code) DO UPDATE 
    SET name = EXCLUDED.name, description = EXCLUDED.description, question_template = EXCLUDED.question_template;
    
    INSERT INTO subtopics (topic_id, code, name, description, "order", question_template)
    VALUES (v_topic_id, 'sorting_hsp', 'מיון', 'מיון בועות, מיון הכנסה, מיון בחירה', 1, '{"template": "יישום אלגוריתמי מיון, מעקב אחר ביצוע"}'::jsonb)
    ON CONFLICT (topic_id, code) DO UPDATE 
    SET name = EXCLUDED.name, description = EXCLUDED.description, question_template = EXCLUDED.question_template;
    
    INSERT INTO subtopics (topic_id, code, name, description, "order", question_template)
    VALUES (v_topic_id, 'basic_complexity_hsp', 'סיבוכיות בסיסית', 'הבנת סיבוכיות זמן בסיסית, השוואת אלגוריתמים', 2, '{"template": "ניתוח סיבוכיות, השוואת אלגוריתמים פשוטים"}'::jsonb)
    ON CONFLICT (topic_id, code) DO UPDATE 
    SET name = EXCLUDED.name, description = EXCLUDED.description, question_template = EXCLUDED.question_template;
    
    INSERT INTO subtopics (topic_id, code, name, description, "order", question_template)
    VALUES (v_topic_id, 'recursion_hsp', 'רקורסיה', 'פתרון בעיות באופן רקורסיבי, עץ רקורסיה', 3, '{"template": "כתיבת פונקציות רקורסיביות, ניתוח רקורסיה"}'::jsonb)
    ON CONFLICT (topic_id, code) DO UPDATE 
    SET name = EXCLUDED.name, description = EXCLUDED.description, question_template = EXCLUDED.question_template;
    
    -- Topic 3: OOP Basics
    INSERT INTO topics (domain_id, code, name, description, "order")
    VALUES (v_domain_id, 'oop_basics_hsp', 'תכנות מונחה עצמים', 'עקרונות בסיסיים בתכנות מונחה עצמים', 2)
    ON CONFLICT (domain_id, code) DO UPDATE 
    SET name = EXCLUDED.name, description = EXCLUDED.description
    RETURNING id INTO v_topic_id;
    
    -- Insert subtopics for OOP Basics
    INSERT INTO subtopics (topic_id, code, name, description, "order", question_template)
    VALUES (v_topic_id, 'classes_objects_hsp', 'מחלקות ואובייקטים', 'הגדרת מחלקות, יצירת אובייקטים, תכונות ומתודות', 0, '{"template": "כתיבת מחלקות, שימוש באובייקטים"}'::jsonb)
    ON CONFLICT (topic_id, code) DO UPDATE 
    SET name = EXCLUDED.name, description = EXCLUDED.description, question_template = EXCLUDED.question_template;
    
    INSERT INTO subtopics (topic_id, code, name, description, "order", question_template)
    VALUES (v_topic_id, 'inheritance_hsp', 'ירושה', 'ירושה בסיסית, העמסת מתודות (overloading), דריסת מתודות (override)', 1, '{"template": "יצירת היררכיית מחלקות, שימוש בירושה"}'::jsonb)
    ON CONFLICT (topic_id, code) DO UPDATE 
    SET name = EXCLUDED.name, description = EXCLUDED.description, question_template = EXCLUDED.question_template;
    
    INSERT INTO subtopics (topic_id, code, name, description, "order", question_template)
    VALUES (v_topic_id, 'encapsulation_hsp', 'כימוס', 'הסתרת מידע, מודיפיקטורי גישה', 2, '{"template": "יישום כימוס, שימוש בגטרים וסטרים"}'::jsonb)
    ON CONFLICT (topic_id, code) DO UPDATE 
    SET name = EXCLUDED.name, description = EXCLUDED.description, question_template = EXCLUDED.question_template;
    
    INSERT INTO subtopics (topic_id, code, name, description, "order", question_template)
    VALUES (v_topic_id, 'polymorphism_hsp', 'פולימורפיזם', 'פולימורפיזם בזמן ריצה, ממשקים, מחלקות מופשטות', 3, '{"template": "יישום פולימורפיזם, שימוש בממשקים"}'::jsonb)
    ON CONFLICT (topic_id, code) DO UPDATE 
    SET name = EXCLUDED.name, description = EXCLUDED.description, question_template = EXCLUDED.question_template;
    
    -- Topic 4: Advanced Concepts
    INSERT INTO topics (domain_id, code, name, description, "order")
    VALUES (v_domain_id, 'advanced_concepts_hsp', 'נושאים מתקדמים', 'נושאים מתקדמים בתכנות', 3)
    ON CONFLICT (domain_id, code) DO UPDATE 
    SET name = EXCLUDED.name, description = EXCLUDED.description
    RETURNING id INTO v_topic_id;
    
    -- Insert subtopics for Advanced Concepts
    INSERT INTO subtopics (topic_id, code, name, description, "order", question_template)
    VALUES (v_topic_id, 'file_handling_hsp', 'טיפול בקבצים', 'קריאה וכתיבה לקבצים, עבודה עם זרמים', 0, '{"template": "קריאה וכתיבה לקבצים, עיבוד מידע מקבצים"}'::jsonb)
    ON CONFLICT (topic_id, code) DO UPDATE 
    SET name = EXCLUDED.name, description = EXCLUDED.description, question_template = EXCLUDED.question_template;
    
    INSERT INTO subtopics (topic_id, code, name, description, "order", question_template)
    VALUES (v_topic_id, 'error_handling_hsp', 'טיפול בשגיאות', 'תפיסת חריגים, זריקת חריגים, ניהול שגיאות', 1, '{"template": "כתיבת קוד לטיפול בשגיאות, שימוש בחריגים"}'::jsonb)
    ON CONFLICT (topic_id, code) DO UPDATE 
    SET name = EXCLUDED.name, description = EXCLUDED.description, question_template = EXCLUDED.question_template;
    
    INSERT INTO subtopics (topic_id, code, name, description, "order", question_template)
    VALUES (v_topic_id, 'concurrent_programming_hsp', 'תכנות מקבילי', 'תהליכים ותהליכונים, סנכרון, תקשורת בין תהליכים', 2, '{"template": "יצירת תהליכונים, סנכרון, פתרון בעיות מקביליות"}'::jsonb)
    ON CONFLICT (topic_id, code) DO UPDATE 
    SET name = EXCLUDED.name, description = EXCLUDED.description, question_template = EXCLUDED.question_template;
    
END $$; 