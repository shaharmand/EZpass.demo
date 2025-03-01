import { OpenAIService } from '../../../../llm/openai';
import { Question, QuestionType } from '../../../../../types/question';
import { logger } from '../../../../../utils/logger';
import { ISolutionGenerator } from '../../../../../types/questionGeneration';

export class ConstructionSolutionGenerator implements ISolutionGenerator {
  constructor(private openAI: OpenAIService) {}

  async generate(question: Partial<Question>): Promise<{ solution: Question['solution'] }> {
    try {
      if (!question.content) throw new Error('Question content is required');

      const prompt = this.buildSolutionPrompt(question);
      
      logger.info('Generating solution for construction safety question', {
        type: question.type,
        questionId: question.id
      });

      const response = await this.openAI.complete(prompt, {
        model: "gpt-4-turbo-preview",
        temperature: 0.7,
        response_format: { type: "json_object" }
      });

      const solution = JSON.parse(response);
      this.validateSolution(question, solution);
      
      return { solution };

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

    switch (question.type) {
      case 'multiple_choice':
        return `
        נתח את שאלת הבטיחות הבאה וספק את התשובה הנכונה:

        שאלה:
        ${question.content!.text}

        אפשרויות:
        ${question.options?.map((opt, i) => `${i + 1}. ${opt.text}`).join('\n')}

        ${commonInstructions}

        אנא ספק:
        1. מספר התשובה הנכונה (1-4)
        2. הסבר מפורט המתבסס על תקנות בטיחות
        3. ניתוח של כל אפשרות והסבר מדוע היא נכונה/שגויה

        החזר בפורמט JSON:
        {
          "solution": {
            "correctOption": number,  // מספר התשובה הנכונה
            "explanation": string,    // הסבר מפורט
            "regulations": string[],  // מספרי תקנות רלוונטיות
            "optionAnalysis": [{     // ניתוח כל האפשרויות
              "optionNumber": number,
              "explanation": string,
              "safetyIssues": string[]
            }]
          }
        }`;

      case 'open':
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

      case 'step_by_step':
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
            "steps": [{
              "stepNumber": number,
              "description": string,
              "calculation": string,
              "result": string,
              "safetyChecks": string[]
            }],
            "finalAnswer": string,
            "regulations": string[],
            "safetyEquipment": string[],
            "validation": string
          }
        }`;

      default:
        throw new Error(`סוג שאלה לא נתמך: ${question.type}`);
    }
  }

  private validateSolution(question: Partial<Question>, solution: any): void {
    if (!solution || !solution.solution) {
      throw new Error('חסר פתרון');
    }

    switch (question.type) {
      case 'multiple_choice':
        if (!solution.solution.correctOption || 
            solution.solution.correctOption < 1 || 
            solution.solution.correctOption > 4) {
          throw new Error('התשובה הנכונה חייבת להיות מספר בין 1 ל-4');
        }
        if (!solution.solution.explanation || !solution.solution.regulations) {
          throw new Error('חסר הסבר או תקנות רלוונטיות');
        }
        break;

      case 'open':
        if (!solution.solution.text || !solution.solution.keyPoints) {
          throw new Error('חסר תוכן הפתרון או נקודות מפתח');
        }
        if (!solution.solution.regulations || !solution.solution.safetyMeasures) {
          throw new Error('חסרות תקנות או אמצעי בטיחות');
        }
        break;

      case 'step_by_step':
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