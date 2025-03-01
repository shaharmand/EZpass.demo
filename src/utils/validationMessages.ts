import { getFieldTranslation, enumMappings } from './translations';

export const createValidationMessage = {
  required: (field: string) => 
    `שדה ${getFieldTranslation(field)}: השדה חסר וחובה`,
  invalidEnum: (field: string, received: string, validOptions: string[]) => 
    `שדה ${field}: ערך לא חוקי. התקבל '${received}'. הערכים החוקיים הם: ${validOptions.map(opt => `'${opt}'`).join(' | ')}`,
    
  multipleChoice: {
    optionsLength: 'שדה אפשרויות: חסרות אפשרויות - שאלת רב-ברירה חייבת לכלול 4 אפשרויות',
    similarOptions: (opt1: number, opt2: number) => 
      `שדה אפשרויות: אפשרויות דומות מדי - options ${opt1} and ${opt2} are too similar`,
    missingCorrectOption: 'שדה תשובה נכונה: חסר - שאלת רב-ברירה חייבת לכלול תשובה נכונה'
  },

  metadata: {
    estimatedTime: 'שדה זמן משוער: חסר - יש להגדיר זמן משוער לפתרון השאלה',
    invalidDifficulty: 'שדה רמת קושי: ערך לא תקין - יש לבחור רמת קושי בין 1 ל-5',
    missingSubject: 'שדה נושא ראשי: חסר - יש לבחור נושא ראשי',
    missingDomain: 'שדה תחום: חסר - יש לבחור תחום',
    missingTopic: 'שדה נושא: חסר - יש לבחור נושא',
    missingSubtopic: 'שדה תת-נושא: חסר - יש לבחור תת-נושא'
  },

  content: {
    tooShort: 'שדה תוכן: קצר מדי - יש להוסיף תוכן מפורט יותר',
    invalidFormat: 'שדה תוכן: פורמט לא תקין',
    codeBlock: {
      tooShort: 'שדה קוד: קצר מדי - code block is too short',
      invalidLanguage: 'שדה קוד: שפה לא נתמכת - unsupported programming language',
      invalidClosing: 'שדה קוד: סגירה לא תקינה - invalid code block closing'
    },
    mathExpressions: {
      hebrewInMath: 'שדה נוסחה: טקסט עברי בתוך נוסחה - Hebrew text found inside math expression',
      hebrewInText: 'שדה נוסחה: טקסט עברי ב-\\text{} - Hebrew text found in \\text{} command',
      hebrewInSubscript: 'שדה נוסחה: טקסט עברי במשתנה - use Latin characters for variables'
    }
  },

  solution: {
    missing: 'שדה פתרון: חסר - יש להוסיף פתרון',
    tooShort: 'שדה פתרון: קצר מדי - יש להוסיף הסבר מפורט יותר',
    requirementsMinimum: 'שדה דרישות: חסר - יש להגדיר לפחות דרישה אחת לפתרון מלא',
    missingComplexity: 'שדה פתרון: חסר ניתוח סיבוכיות - complexity analysis required'
  },

  rubric: {
    criterionNameTooShort: 'שדה קריטריון: שם קצר מדי - criterion name too short',
    criterionDescriptionTooShort: 'שדה קריטריון: תיאור קצר מדי - criterion description too short',
    weightTooLow: 'שדה משקל: נמוך מדי - minimum weight is 5%',
    weightTooHigh: 'שדה משקל: גבוה מדי - maximum weight is 60%',
    minCriteria: 'שדה קריטריונים: מעט מדי - minimum 3 criteria required',
    maxCriteria: 'שדה קריטריונים: יותר מדי - maximum 7 criteria allowed',
    totalWeight: 'שדה משקלים: סכום לא תקין - total weights must sum to 100%'
  },

  code: {
    missingLanguage: 'שדה שפת תכנות: חסר - programming language required',
    missingComplexity: 'שדה פתרון: חסר ניתוח סיבוכיות - complexity analysis required'
  },

  topics: {
    invalidSubject: (id: string) => `שדה נושא ראשי: ערך לא קיים - subject '${id}' not found`,
    invalidDomain: (id: string) => `שדה תחום: ערך לא קיים - domain '${id}' not found in subject`,
    invalidTopic: (id: string) => `שדה נושא: ערך לא קיים - topic '${id}' not found in domain`,
    invalidSubtopic: (id: string) => `שדה תת-נושא: ערך לא קיים - subtopic '${id}' not found in topic`,
    invalidHierarchy: 'שדה נושאים: מבנה לא תקין - invalid topic hierarchy'
  },

  source: {
    invalidType: (received: string, validOptions: string[]) => 
      `שדה סוג מקור: ערך לא חוקי. התקבל '${received}'. הערכים החוקיים הם: ${validOptions.map(opt => `'${opt}'`).join(' | ')}`,
    missingExamTemplate: 'שדה תבנית מבחן: חסר - exam template required',
    missingYear: 'שדה שנה: חסר - year required',
    missingSeason: 'שדה תקופה: חסר - season required',
    missingMoed: 'שדה מועד: חסר - moed required',
    missingBookName: 'שדה שם ספר: חסר - book name required',
    missingAuthorName: 'שדה שם מחבר: חסר - author name required'
  }
}; 