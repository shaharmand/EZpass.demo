import { Question, QuestionMetadata, QuestionType } from '../../../../types/question';
import { QuestionGenerationParams } from '../../../../types/questionGeneration';
import { AbstractTypeGenerator } from './AbstractTypeGenerator';
import { questionGenerationService } from '../../../llm/QuestionGenerationV2';
import { logger } from '../../../../utils/logger';

export class OpenQuestionGenerator extends AbstractTypeGenerator {
  async generateQuestion(metadata: QuestionMetadata): Promise<Question> {
    try {
      // Log entry point for type-specific generation
      logger.info('OpenQuestionGenerator: Starting question generation', {
        section: 'TYPE_GENERATOR_ENTRY',
        metadata: JSON.stringify(metadata, null, 2),
        timestamp: new Date().toISOString()
      });

      // Get the base prompt and add type-specific requirements
      const prompt = this.getBasePrompt(metadata);
      
      // Log the complete prompt before sending to AI
      logger.info('OpenQuestionGenerator: Generated prompt', {
        section: 'PROMPT',
        prompt: prompt,
        timestamp: new Date().toISOString()
      });

      const params: QuestionGenerationParams = {
        type: QuestionType.OPEN,
        prompt,
        subjectId: metadata.subjectId,
        domainId: metadata.domainId,
        topicId: metadata.topicId,
        subtopicId: metadata.subtopicId,
        difficulty: metadata.difficulty,
        estimatedTime: metadata.estimatedTime,
        answerFormat: {
          hasFinalAnswer: false,
          finalAnswerType: 'none',
          requiresSolution: true
        },
        source: {
          type: 'ezpass',
          creatorType: 'ai'
        }
      };

      // Generate the question
      const question = await questionGenerationService.generateQuestion(params);

      // Log the raw AI response
      logger.info('OpenQuestionGenerator: Received AI response', {
        section: 'AI_RESPONSE',
        response: JSON.stringify(question, null, 2),
        timestamp: new Date().toISOString()
      });

      return question;
    } catch (error) {
      // Log any errors in the type-specific generation
      logger.error('OpenQuestionGenerator: Generation failed', {
        section: 'TYPE_GENERATOR_ERROR',
        metadata: JSON.stringify(metadata, null, 2),
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack
        } : 'Unknown error',
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  getTypeSpecificPrompt(): string {
    return `
OPEN QUESTION REQUIREMENTS:

1. Question Structure:
   - Clear, focused problem statement in Hebrew
   - Specific deliverables or requirements listed
   - Clear scope and boundaries
   - Explicit evaluation criteria

2. Content Requirements:
   - Break into sub-questions if needed
   - Include any relevant context
   - Specify expected answer format/length
   - List required components

3. Solution Requirements:
   - Comprehensive model answer
   - Multiple valid approaches if applicable
   - Clear evaluation rubric
   - Common mistakes to avoid
   - References to relevant standards/regulations`;
  }

  getExampleQuestions(): string {
    return `
EXAMPLE 1:
{
  "content": {
    "text": "תכנן תוכנית בטיחות מקיפה לעבודה בגובה באתר בנייה. התייחס לנקודות הבאות:\\n\\n1. זיהוי סיכונים עיקריים\\n2. אמצעי בטיחות נדרשים\\n3. נהלי חירום\\n4. תוכנית הדרכה לעובדים\\n\\nיש לכלול:\\n- רשימת ציוד נדרש\\n- לוח זמנים להטמעה\\n- תקציב משוער\\n- מדדי הצלחה",
    "format": "markdown"
  },
  "schoolAnswer": {
    "solution": {
      "text": "תוכנית בטיחות לעבודה בגובה:\\n\\n## 1. זיהוי סיכונים עיקריים\\n\\n### סיכונים פיזיים:\\n- נפילה מגובה\\n- נפילת חפצים\\n- התחשמלות\\n- פגיעה ממכונות\\n\\n### סיכונים סביבתיים:\\n- תנאי מזג אוויר\\n- רוח חזקה\\n- ראות לקויה\\n\\n## 2. אמצעי בטיחות נדרשים\\n\\n### ציוד מגן אישי:\\n- רתמות בטיחות תקניות\\n- קסדות מגן\\n- נעלי בטיחות\\n- משקפי מגן\\n\\n### אמצעי בטיחות באתר:\\n- מעקות תקניים\\n- רשתות בטיחות\\n- נקודות עיגון\\n- תאורה מספקת\\n\\n## 3. נהלי חירום\\n\\n### תגובה מיידית:\\n- הפסקת עבודה\\n- הזעקת צוות חירום\\n- פינוי נפגעים\\n- דיווח לגורמים רלוונטיים\\n\\n### ציוד חירום:\\n- ערכת עזרה ראשונה\\n- ציוד חילוץ\\n- אמצעי תקשורת\\n\\n## 4. תוכנית הדרכה\\n\\n### נושאי הדרכה:\\n- שימוש בציוד מגן\\n- זיהוי סיכונים\\n- נהלי חירום\\n- תרגולים מעשיים\\n\\n### לוח זמנים:\\n- הדרכה בסיסית: שבוע\\n- תרגולים: חודש\\n- רענונים: כל רבעון\\n\\n## תקציב משוער\\n\\n### ציוד:\\n- ציוד מגן אישי: 50,000 ₪\\n- אמצעי בטיחות: 100,000 ₪\\n- ציוד חירום: 30,000 ₪\\n\\n### הדרכות:\\n- מדריכים: 20,000 ₪\\n- חומרים: 10,000 ₪\\n- תרגולים: 15,000 ₪\\n\\n**סה\"כ: 225,000 ₪**\\n\\n## מדדי הצלחה\\n\\n1. **כמותיים:**\\n   - 0 תאונות עבודה\\n   - 100% נוכחות בהדרכות\\n   - ביצוע 4 תרגולים בשנה\\n\\n2. **איכותיים:**\\n   - שיפור במודעות לבטיחות\\n   - יישום נהלים בשטח\\n   - משוב חיובי מעובדים",
      "format": "markdown"
    }
  }
}

EXAMPLE 2:
{
  "content": {
    "text": "נתח את הסיכונים הבטיחותיים בתהליך יציקת בטון באתר בנייה והצע פתרונות מעשיים להפחתתם.\\n\\nיש להתייחס ל:\\n1. סיכונים בשלבי ההכנה\\n2. סיכונים במהלך היציקה\\n3. סיכונים בשלב הייבוש והאשפרה\\n\\nעבור כל סיכון יש לפרט:\\n- דרגת חומרה\\n- הסתברות להתרחשות\\n- אמצעי מניעה\\n- נהלי עבודה נדרשים",
    "format": "markdown"
  },
  "schoolAnswer": {
    "solution": {
      "text": "# ניתוח סיכונים ביציקת בטון\\n\\n## 1. סיכונים בשלבי ההכנה\\n\\n### א. הרמת והובלת חומרים\\n- **חומרה:** גבוהה\\n- **הסתברות:** בינונית\\n- **אמצעי מניעה:**\\n  - שימוש בציוד הרמה תקני\\n  - בדיקת תקינות יומית\\n  - הדרכת עובדים\\n- **נהלים:**\\n  - אישור מנהל עבודה\\n  - בדיקת משקל מטען\\n  - סימון אזורי הרמה\\n\\n### ב. הכנת תערובת\\n- **חומרה:** בינונית\\n- **הסתברות:** גבוהה\\n- **אמצעי מניעה:**\\n  - ציוד מגן אישי\\n  - אוורור מתאים\\n  - תחזוקת ציוד\\n- **נהלים:**\\n  - בדיקת מינון חומרים\\n  - ניקיון סביבת עבודה\\n  - רישום ומעקב\\n\\n## 2. סיכונים במהלך היציקה\\n\\n### א. עבודה בגובה\\n- **חומרה:** גבוהה מאוד\\n- **הסתברות:** גבוהה\\n- **אמצעי מניעה:**\\n  - רתמות בטיחות\\n  - מעקות תקניים\\n  - רשתות הגנה\\n- **נהלים:**\\n  - אישור עבודה בגובה\\n  - בדיקת ציוד יומית\\n  - השגחת מנהל עבודה\\n\\n### ב. לחץ בצנרת\\n- **חומרה:** בינונית\\n- **הסתברות:** בינונית\\n- **אמצעי מניעה:**\\n  - בדיקת תקינות צנרת\\n  - שסתומי בטחון\\n  - ציוד מגן אישי\\n- **נהלים:**\\n  - בדיקה לפני הפעלה\\n  - תחזוקה שוטפת\\n  - נוהל חירום\\n\\n## 3. סיכונים בשלב הייבוש והאשפרה\\n\\n### א. חשיפה לחומרים כימיים\\n- **חומרה:** בינונית\\n- **הסתברות:** נמוכה\\n- **אמצעי מניעה:**\\n  - ציוד מגן מתאים\\n  - אוורור נאות\\n  - שילוט אזהרה\\n- **נהלים:**\\n  - הדרכת עובדים\\n  - בדיקות סביבתיות\\n  - תיעוד ומעקב\\n\\n### ב. החלקה ונפילה\\n- **חומרה:** בינונית\\n- **הסתברות:** גבוהה\\n- **אמצעי מניעה:**\\n  - משטחים מונעי החלקה\\n  - תאורה מספקת\\n  - ניקוז מתאים\\n- **נהלים:**\\n  - סימון אזורים רטובים\\n  - ניקיון שוטף\\n  - בדיקות תקופתיות\\n\\n## המלצות כלליות\\n\\n1. **הדרכה והסמכה:**\\n   - הדרכת בטיחות שבועית\\n   - רענון נהלים חודשי\\n   - תיעוד והערכה\\n\\n2. **פיקוח ובקרה:**\\n   - מינוי אחראי בטיחות\\n   - ביקורות יומיות\\n   - דוחות תקופתיים\\n\\n3. **ציוד ואמצעים:**\\n   - בדיקות תקופתיות\\n   - חידוש ציוד פגום\\n   - מלאי חירום\\n\\n4. **תקשורת ודיווח:**\\n   - נוהל דיווח תקריות\\n   - שיתוף לקחים\\n   - עדכון נהלים",
      "format": "markdown"
    }
  }
}`;
  }

  getTypeCriteria(): Array<{ name: string; description: string; weight: number }> {
    return [
      {
        name: 'completeness',
        description: 'כיסוי מלא של כל הנושאים והדרישות',
        weight: 30
      },
      {
        name: 'accuracy',
        description: 'דיוק מקצועי והתאמה לתקנים ונהלים',
        weight: 30
      },
      {
        name: 'organization',
        description: 'מבנה ברור, סדר לוגי והצגה מאורגנת',
        weight: 20
      },
      {
        name: 'practicality',
        description: 'ישימות מעשית והתאמה לתנאי השטח',
        weight: 20
      }
    ];
  }
} 