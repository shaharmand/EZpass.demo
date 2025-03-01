import { LLMService } from '../../../../llm/llmService';
import { Question, QuestionType, SourceType } from '../../../../../types/question';
import { Topic, SubTopic } from '../../../../../types/subject';
import { logger } from '../../../../../utils/logger';
import { 
  BaseQuestionGenerationParams, 
  BaseOpenAIQuestionResponse,
  IQuestionGenerator,
  QuestionGenerationRequirements 
} from '../../../../../types/questionGeneration';
import { OPENAI_MODELS } from '../../../../../utils/llmUtils';

export class CoreConstructionQuestionGenerator implements IQuestionGenerator {
  private llm: LLMService;

  constructor() {
    this.llm = new LLMService();
  }

  async generate(params: QuestionGenerationRequirements): Promise<Partial<Question>> {
    try {
      const topicContext = this.getTopicContext(params.hierarchy.topic, params.hierarchy.subtopic);
      const prompt = this.buildPrompt(params, topicContext);
      
      logger.info('Generating construction safety question', {
        type: params.type,
        topic: params.hierarchy.topic.name,
        subtopic: params.hierarchy.subtopic.name,
        estimatedTime: params.estimatedTime
      });

      const response = await this.llm.complete(prompt, {
        ...OPENAI_MODELS.analysis,
        temperature: 0.7 // More creative for question generation
      });

      const openAIResponse = JSON.parse(response) as BaseOpenAIQuestionResponse;
      
      const question: Partial<Question> = {
        content: openAIResponse.content,
        type: params.type,
        metadata: {
          difficulty: params.difficulty,
          subjectId: params.hierarchy.subject.id,
          domainId: params.hierarchy.domain.id,
          topicId: params.hierarchy.topic.id,
          subtopicId: params.hierarchy.subtopic.id,
          estimatedTime: params.estimatedTime,
          source: {
            sourceType: SourceType.EZPASS
          }
        },
        options: openAIResponse.options
      };

      this.validateQuestion(question, params);
      return question;

    } catch (error) {
      logger.error('Error generating construction safety question', { error });
      throw error;
    }
  }

  private getTopicContext(topic: Topic, subtopic: SubTopic): string {
    return `
    הקשר נושאי:
    
    נושא: ${topic.name}
    ${topic.description ? `תיאור: ${topic.description}` : ''}
    
    תת-נושא: ${subtopic.name}
    ${subtopic.description ? `תיאור: ${subtopic.description}` : ''}
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
      ${params.type === 'multiple_choice' ? `
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
      case 'multiple_choice':
        return 'שאלת רב-ברירה';
      case 'open':
        return 'שאלה פתוחה';
      case 'step_by_step':
        return 'שאלת שלב-אחר-שלב';
      default:
        throw new Error(`סוג שאלה לא נתמך: ${type}`);
    }
  }

  private getTypeSpecificInstructions(type: QuestionType): string[] {
    switch (type) {
      case 'multiple_choice':
        return [
          'צור תרחיש בטיחותי מעשי באתר בנייה',
          'כלול 4 אפשרויות תשובה הגיוניות',
          'כל האפשרויות צריכות להיות קשורות לבטיחות',
          'כלול לפחות אפשרות אחת שנראית נכונה אך מכילה פגם בטיחותי',
          'בסס את התשובות על תקנות בטיחות ספציפיות'
        ];

      case 'open':
        return [
          'צור תרחיש מורכב באתר בנייה הדורש ניתוח בטיחותי',
          'דרוש התייחסות לתקנות בטיחות ספציפיות',
          'כלול מספר היבטי בטיחות שיש להתייחס אליהם',
          'דרוש תכנון של אמצעי בטיחות',
          'הגדר בבירור מה נדרש בתשובה'
        ];

      case 'step_by_step':
        return [
          'צור תרחיש הדורש תכנון בטיחות בשלבים',
          'כלול נתונים מספריים (מידות, משקלים, מרחקים)',
          'דרוש חישובים הקשורים לבטיחות',
          'הגדר בבירור את השלבים הנדרשים',
          'כלול מגבלות בטיחות ותנאי סף'
        ];

      default:
        throw new Error(`סוג שאלה לא נתמך: ${type}`);
    }
  }

  private validateQuestion(question: Partial<Question>, params: QuestionGenerationRequirements): void {
    if (!question.content?.text) {
      throw new Error('חסר תוכן השאלה');
    }

    // Validate time constraints
    if (params.estimatedTime <= 0) {
      throw new Error('זמן מוערך חייב להיות חיובי');
    }

    if (question.type === 'multiple_choice') {
      if (!question.options || question.options.length !== 4) {
        throw new Error('שאלת רב-ברירה חייבת לכלול בדיוק 4 אפשרויות');
      }
    }

    // Validate construction safety specific content
    const content = question.content.text.toLowerCase();
    if (!content.includes('תקנ') && !content.includes('בטיחות')) {
      throw new Error('שאלה חייבת להתייחס לתקנות בטיחות');
    }
  }
} 