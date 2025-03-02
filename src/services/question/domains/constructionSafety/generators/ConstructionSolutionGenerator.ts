import { OpenAIService } from '../../../../llm/openAIService';
import { Question, QuestionType } from '../../../../../types/question';
import { logger } from '../../../../../utils/logger';
import { ISolutionGenerator } from '../../../../../types/questionGeneration';

export class ConstructionSolutionGenerator implements ISolutionGenerator {
  constructor(private openAI: OpenAIService) {}

  async generate(question: Partial<Question>): Promise<{ solution: Question['answer']['solution'] }> {
    try {
      if (!question.content) throw new Error('Question content is required');

      const prompt = this.buildSolutionPrompt(question);
      
      logger.info('Generating solution for construction safety question', {
        type: question.metadata?.type,
        questionId: question.id
      });

      const response = await this.openAI.complete(prompt, {
        temperature: 0.7
      });

      const solution = JSON.parse(response);
      this.validateSolution(question, solution);
      
      return { 
        solution: {
          text: solution.solution.text || '',
          format: 'markdown',
          requiredSolution: true
        }
      };

    } catch (error) {
      logger.error('Error generating construction safety solution', { error });
      throw error;
    }
  }

  private buildSolutionPrompt(question: Partial<Question>): string {
    const commonInstructions = `
    הנחיות כלליות לפתרון בבטיחות בבנייה:
    - התבסס על תקנות הבטיחות בעבודה
    - ציין מספרי תקנות ספציפיים
    - התייחס לבעלי תפקידים רלוונטיים
    - פרט אמצעי בטיחות נדרשים
    - הסבר את הרציונל הבטיחותי
    `;

    switch (question.metadata?.type) {
      case QuestionType.MULTIPLE_CHOICE:
        return `
        נתח את שאלת הבטיחות הבאה וספק את התשובה הנכונה:

        שאלה:
        ${question.content!.text}

        אפשרויות:
        ${question.content?.options?.map((opt, i) => `${i + 1}. ${opt.text}`).join('\n')}

        ${commonInstructions}

        אנא ספק:
        1. מספר התשובה הנכונה (1-4)
        2. הסבר מפורט המתבסס על תקנות בטיחות
        3. ניתוח של כל אפשרות והסבר מדוע היא נכונה/שגויה

        החזר בפורמט JSON:
        {
          "solution": {
            "text": string,           // הסבר מפורט
            "format": "markdown",
            "correctOption": number,  // מספר התשובה הנכונה
            "regulations": string[],  // מספרי תקנות רלוונטיות
            "optionAnalysis": [{     // ניתוח כל האפשרויות
              "optionNumber": number,
              "explanation": string,
              "safetyIssues": string[]
            }]
          }
        }`;

      case QuestionType.OPEN:
        return `
        נתח את שאלת הבטיחות הפתוחה וספק פתרון מקיף:

        שאלה:
        ${question.content!.text}

        ${commonInstructions}

        אנא ספק:
        1. פתרון מלא ומפורט
        2. תקנות בטיחות רלוונטיות
        3. אמצעי בטיחות נדרשים
        4. בעלי תפקידים מעורבים
        5. נהלי עבודה בטוחה

        החזר בפורמט JSON:
        {
          "solution": {
            "text": string,           // פתרון מלא
            "format": "markdown",
            "keyPoints": string[],    // נקודות מפתח
            "regulations": string[],   // תקנות רלוונטיות
            "safetyMeasures": string[], // אמצעי בטיחות
            "responsibilities": [{     // אחריות בעלי תפקידים
              "role": string,
              "duties": string[]
            }]
          }
        }`;

      case QuestionType.NUMERICAL:
        return `
        פתור את שאלת הבטיחות בשלבים:

        שאלה:
        ${question.content!.text}

        ${commonInstructions}

        אנא ספק:
        1. פתרון מפורט בשלבים
        2. חישובים נדרשים
        3. בדיקות בטיחות בכל שלב
        4. אמצעי בטיחות נדרשים

        החזר בפורמט JSON:
        {
          "solution": {
            "text": string,           // פתרון מלא
            "format": "markdown",
            "steps": [{
              "stepNumber": number,
              "description": string,
              "calculation": string,
              "result": string,
              "safetyChecks": string[]
            }],
            "regulations": string[],
            "safetyEquipment": string[],
            "validation": string
          }
        }`;

      default:
        throw new Error(`סוג שאלה לא נתמך: ${question.metadata?.type}`);
    }
  }

  private validateSolution(question: Partial<Question>, solution: any): void {
    if (!solution || !solution.solution) {
      throw new Error('חסר פתרון');
    }

    if (!solution.solution.text || !solution.solution.format) {
      throw new Error('חסר תוכן הפתרון או פורמט');
    }

    switch (question.metadata?.type) {
      case QuestionType.MULTIPLE_CHOICE:
        if (!solution.solution.correctOption || 
            solution.solution.correctOption < 1 || 
            solution.solution.correctOption > 4) {
          throw new Error('התשובה הנכונה חייבת להיות מספר בין 1 ל-4');
        }
        if (!solution.solution.regulations) {
          throw new Error('חסרות תקנות רלוונטיות');
        }
        break;

      case QuestionType.OPEN:
        if (!solution.solution.keyPoints) {
          throw new Error('חסרות נקודות מפתח');
        }
        if (!solution.solution.regulations || !solution.solution.safetyMeasures) {
          throw new Error('חסרות תקנות או אמצעי בטיחות');
        }
        break;

      case QuestionType.NUMERICAL:
        if (!solution.solution.steps || !solution.solution.steps.length) {
          throw new Error('חסרים שלבי הפתרון');
        }
        if (!solution.solution.regulations || !solution.solution.safetyEquipment) {
          throw new Error('חסרות תקנות או ציוד בטיחות');
        }
        break;
    }

    // Validate that solution references safety regulations
    const solutionText = JSON.stringify(solution);
    if (!solutionText.includes('תקנ')) {
      throw new Error('הפתרון חייב להתייחס לתקנות בטיחות');
    }
  }
} 