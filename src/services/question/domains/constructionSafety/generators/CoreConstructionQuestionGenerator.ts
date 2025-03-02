import { OpenAIService } from '../../../../llm/openAIService';
import { Question, QuestionType, DifficultyLevel, SourceType, EzpassCreatorType } from '../../../../../types/question';
import { logger } from '../../../../../utils/logger';
import { QuestionGenerationRequirements } from '../../../../../types/questionGeneration';

export class CoreConstructionQuestionGenerator {
  constructor(private llm: OpenAIService) {}

  async generate(params: QuestionGenerationRequirements): Promise<Partial<Question>> {
    try {
      const topicContext = this.buildTopicContext(params.hierarchy);
      const prompt = this.buildPrompt(params, topicContext);
      
      logger.info('Generating construction safety question', {
        type: params.type,
        topic: params.hierarchy.topic.name,
        subtopic: params.hierarchy.subtopic.name,
        estimatedTime: params.estimatedTime
      });

      const response = await this.llm.complete(prompt, {
        temperature: 0.7
      });

      const parsed = JSON.parse(response);
      this.validateQuestion(parsed, params);

      return {
        id: crypto.randomUUID(),
        metadata: {
          difficulty: params.difficulty,
          subjectId: params.hierarchy.subject.id,
          domainId: params.hierarchy.domain.id,
          topicId: params.hierarchy.topic.id,
          subtopicId: params.hierarchy.subtopic.id,
          estimatedTime: params.estimatedTime,
          type: params.type,
          source: {
            type: SourceType.EZPASS,
            creatorType: EzpassCreatorType.AI
          }
        },
        content: parsed.content
      };

    } catch (error) {
      logger.error('Error generating construction safety question', { error });
      throw error;
    }
  }

  private buildTopicContext(hierarchy: QuestionGenerationRequirements['hierarchy']): string {
    return `
    הקשר נושאי:
    
    נושא: ${hierarchy.topic.name}
    תת-נושא: ${hierarchy.subtopic.name}
    תחום: ${hierarchy.domain.name}
    מקצוע: ${hierarchy.subject.name}
    `;
  }

  private buildPrompt(params: QuestionGenerationRequirements, topicContext: string): string {
    const typeInstructions = this.getTypeSpecificInstructions(params.type);
    
    return `
    צור שאלה בנושא בטיחות בבנייה על פי ההנחיות הבאות:

    ${topicContext}

    זמן מוערך לפתרון: ${params.estimatedTime} דקות

    סוג שאלה: ${this.getHebrewType(params.type)}
    רמת קושי: ${params.difficulty} (1-5)

    דרישות ספציפיות לסוג השאלה:
    ${typeInstructions.join('\n')}

    הנחיות לבטיחות בבנייה:
    - התייחס לתקנות הבטיחות בעבודה (עבודות בנייה)
    - השתמש במספרי תקנות ספציפיים
    - כלול התייחסות לבעלי תפקידים באתר הבנייה
    - התייחס לציוד מגן אישי כשרלוונטי
    - השתמש בדוגמאות מעשיות מאתר בנייה
    - כלול מספרים ומידות כשרלוונטי
    - התייחס לשיטות עבודה בטוחות
    - התאם את מורכבות השאלה לזמן המוקצב

    החזר את השאלה בפורמט JSON הבא:
    {
      "content": {
        "text": string,  // תוכן השאלה
        "format": "markdown"
      },
      ${params.type === QuestionType.MULTIPLE_CHOICE ? `
      "options": [
        {
          "text": string,  // תוכן התשובה
          "format": "markdown"
        }
      ]
      ` : ''}
    }`;
  }

  private getHebrewType(type: QuestionType): string {
    switch (type) {
      case QuestionType.MULTIPLE_CHOICE:
        return 'שאלת רב-ברירה';
      case QuestionType.OPEN:
        return 'שאלה פתוחה';
      case QuestionType.NUMERICAL:
        return 'שאלה מספרית';
      default:
        throw new Error(`סוג שאלה לא נתמך: ${type}`);
    }
  }

  private getTypeSpecificInstructions(type: QuestionType): string[] {
    switch (type) {
      case QuestionType.MULTIPLE_CHOICE:
        return [
          'צור 4 אפשרויות תשובה',
          'כלול טעויות נפוצות כמסיחים',
          'ודא שכל האפשרויות הגיוניות אך רק אחת נכונה',
          'התבסס על טעויות בטיחות נפוצות',
          'ודא שהאפשרויות מוציאות זו את זו'
        ];
      case QuestionType.OPEN:
        return [
          'דרוש ניתוח בטיחותי מפורט',
          'בקש אמצעי בטיחות ספציפיים',
          'כלול קריטריוני הערכה',
          'דרוש הצדקה על בסיס תקנות',
          'בקש אסטרטגיות להפחתת סיכונים'
        ];
      case QuestionType.NUMERICAL:
        return [
          'כלול חישובי בטיחות רלוונטיים',
          'ציין יחידות מידה נדרשות',
          'התייחס למרווחי בטיחות',
          'כלול מדידות מעשיות',
          'התייחס לתקני בטיחות ספציפיים'
        ];
      default:
        return [];
    }
  }

  private validateQuestion(question: any, params: QuestionGenerationRequirements): void {
    if (!question.content?.text) {
      throw new Error('חסר תוכן השאלה');
    }

    if (params.type === QuestionType.MULTIPLE_CHOICE && (!question.options || question.options.length !== 4)) {
      throw new Error('שאלת רב-ברירה חייבת לכלול 4 אפשרויות');
    }

    // Validate safety content
    const content = question.content.text.toLowerCase();
    if (!content.includes('בטיחות') && !content.includes('תקנ')) {
      throw new Error('השאלה חייבת להתייחס לבטיחות ותקנות');
    }
  }
} 