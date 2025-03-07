// Functions for generating different parts of a construction safety question

// Types for question components
interface QuestionContent {
  introduction: string;
  situation: string;
  question: string;
}

interface QuestionMetadata {
  topic: string;
  subtopic: string;
  difficulty: string;
  timeAllocation?: string;
  prerequisites?: string[];
  tags?: string[];
}

interface Solution {
  mainPoints: string[];
  regulations: string[];
  practicalSteps: string[];
  summary: string;
}

interface Evaluation {
  criteria: {
    name: string;
    weight: number;
    description: string;
  }[];
  passingScore: number;
  commonMistakes: string[];
}

// Input interfaces
export interface CreateContentInput {
  referenceQuestion: QuestionContent;
  targetTopic: string;
  targetSubtopic: string;
  targetDifficulty: string;
}

export interface CreateMetadataInput {
  content: QuestionContent;
  existingMetadata?: Partial<QuestionMetadata>;
}

export interface CreateSolutionInput {
  content: QuestionContent;
  difficulty: string;
  referenceSolution?: Solution;
}

export interface CreateEvaluationInput {
  content: QuestionContent;
  solution: Solution;
  existingEvaluation?: Evaluation;
}

// Prompt generation functions
export function createContentPrompt(input: CreateContentInput): string {
  return `יצירת שאלה חדשה בבטיחות בבנייה:

שאלת מקור:
${JSON.stringify(input.referenceQuestion, null, 2)}

דרישות:
- נושא: ${input.targetTopic}
- תת-נושא: ${input.targetSubtopic}
- רמת קושי: ${input.targetDifficulty}

הנחיות:
- שמור על מבנה השאלה המקורית
- התאם את התוכן לנושא החדש
- אל תוסיף דרישות או תקנות חדשות

צור שאלה חדשה בפורמט:
{
  "introduction": "הקדמה חדשה",
  "situation": "תיאור מצב חדש",
  "question": "שאלה מותאמת"
}`;
}

export function createMetadataPrompt(input: CreateMetadataInput): string {
  return `יצירת מטא-דאטה לשאלה:

תוכן השאלה:
${JSON.stringify(input.content, null, 2)}

${input.existingMetadata ? `מטא-דאטה קיים:
${JSON.stringify(input.existingMetadata, null, 2)}` : ''}

צור מטא-דאטה בפורמט:
{
  "topic": "נושא ראשי",
  "subtopic": "תת-נושא",
  "difficulty": "רמת קושי",
  "timeAllocation": "זמן מוערך",
  "prerequisites": ["דרישה 1", "דרישה 2"],
  "tags": ["תגית 1", "תגית 2"]
}`;
}

export function createSolutionPrompt(input: CreateSolutionInput): string {
  return `יצירת פתרון מודל לשאלה:

תוכן השאלה:
${JSON.stringify(input.content, null, 2)}

רמת קושי: ${input.difficulty}

${input.referenceSolution ? `פתרון מקור:
${JSON.stringify(input.referenceSolution, null, 2)}` : ''}

צור פתרון בפורמט:
{
  "mainPoints": ["נקודה 1", "נקודה 2"],
  "regulations": ["תקנה 1", "תקנה 2"],
  "practicalSteps": ["צעד 1", "צעד 2"],
  "summary": "סיכום הפתרון"
}`;
}

export function createEvaluationPrompt(input: CreateEvaluationInput): string {
  return `יצירת הנחיות הערכה:

תוכן השאלה:
${JSON.stringify(input.content, null, 2)}

פתרון מודל:
${JSON.stringify(input.solution, null, 2)}

${input.existingEvaluation ? `הערכה קיימת:
${JSON.stringify(input.existingEvaluation, null, 2)}` : ''}

צור הנחיות הערכה בפורמט:
{
  "criteria": [
    {
      "name": "שם הקריטריון",
      "weight": 25,
      "description": "תיאור הקריטריון"
    }
  ],
  "passingScore": 60,
  "commonMistakes": ["טעות 1", "טעות 2"]
}`;
}

// Example of a complete question in the system
export interface CompleteQuestion {
  content: QuestionContent;
  metadata: QuestionMetadata;
  solution: Solution;
  evaluation: Evaluation;
}

export const CREATE_CONTENT = `יצירת תוכן שאלה בבטיחות בבנייה:

קלט חובה:
- שאלת מקור: {
    introduction: string; // הקדמה
    situation: string;   // תיאור המצב
    question: string;    // שאלה
  }
- נושא: [נושא]
- תת-נושא: [תת-נושא]
- רמת קושי: [רמת קושי]

הנחיות:
1. שמירה על מבנה:
   - שמור על אותו אורך פסקאות
   - שמור על אותו סגנון ניסוח
   - שמור על אותה רמת פירוט

2. שינויים מותרים:
   - החלפת סוג האתר (למשל: מבנה משרדים במקום מגורים)
   - שינוי סוג העבודה (למשל: חפירה במקום יציקה)
   - התאמת הסיכונים לסוג העבודה החדש

3. אסור לשנות:
   - רמת המורכבות של השאלה
   - סוג הפתרון הנדרש
   - מבנה הדרישות מהנבחן

פלט נדרש:
{
  introduction: string; // הקדמה חדשה
  situation: string;   // תיאור מצב חדש
  question: string;    // שאלה מותאמת
}

דגשים:
- אין להמציא תקנות או דרישות חדשות
- יש לשמור על קשר הגיוני בין כל חלקי השאלה
- התאמה לנושא ותת-הנושא שהוגדרו` as const;

export const CREATE_METADATA = `יצירת מטא-דאטה לשאלה בבטיחות בבנייה:

קלט חובה:
- תוכן השאלה: {
    introduction: string; // הקדמה
    situation: string;   // תיאור המצב
    question: string;    // שאלה
  }

הנחיות:
1. שמירה על מטא-דאטה קיים:
   - אם קיים נושא, שמור עליו
   - אם קיים תת-נושא, שמור עליו
   - אם קיימת רמת קושי, שמור עליה

2. השלמת מטא-דאטה חסר:
   - השלם נושא ותת-נושא אם חסרים
   - השלם רמת קושי אם חסרה
   - הוסף זמן מוערך אם חסר
   - הוסף דרישות קדם אם רלוונטי
   - הוסף תגיות רלוונטיות

פלט נדרש:
{
  topic: string;        // נושא ראשי
  subtopic: string;     // תת-נושא
  difficulty: string;   // רמת קושי
  timeAllocation?: string;  // זמן מוערך
  prerequisites?: string[]; // דרישות קדם
  tags?: string[];      // תגיות
}` as const;
