import { CreateContentInput, CreateMetadataInput, CreateSolutionInput, CreateEvaluationInput } from './types';

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