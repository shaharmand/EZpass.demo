import { OpenAIService } from '../../../../llm/openAIService';
import { Question, QuestionType, DifficultyLevel, SourceType, EzpassCreatorType } from '../../../../../types/question';
import { logger } from '../../../../../utils/logger';
import { QuestionGenerationRequirements } from '../../../../../types/questionGeneration';
import { AbstractQuestionGenerator } from '../../../base/AbstractQuestionGenerator';

export class CoreConstructionQuestionGenerator extends AbstractQuestionGenerator {
  public domain = 'construction_safety';
  public supportedTypes: QuestionType[] = [
    QuestionType.MULTIPLE_CHOICE,
    QuestionType.NUMERICAL,
    QuestionType.OPEN
  ];

  constructor(private llm: OpenAIService) {
    super();
  }

  public validateDomainContent(content: string): boolean {
    return content.length > 0;
  }

  public async enrichWithDomainContext(question: Question): Promise<Question> {
    // Add construction safety specific context if needed
    return question;
  }

  public async addDomainSpecificEvaluation(question: Question): Promise<Question> {
    // Add construction safety specific evaluation criteria
    if (!question.evaluationGuidelines) {
      question.evaluationGuidelines = {
        requiredCriteria: [
          {
            name: 'safety_understanding',
            description: 'הבנת עקרונות הבטיחות',
            weight: 40
          },
          {
            name: 'practical_application',
            description: 'יישום מעשי',
            weight: 30
          },
          {
            name: 'regulation_knowledge',
            description: 'ידע בתקנות',
            weight: 30
          }
        ]
      };
    }
    return question;
  }

  async generateQuestion(params: QuestionGenerationRequirements): Promise<Question> {
    try {
      // Log generation attempt
      logger.info('Generating core construction question', {
        type: params.type,
        topic: params.hierarchy.topic.name,
        subtopic: params.hierarchy.subtopic?.name,
        estimatedTime: params.estimatedTime
      });

      // Build the question
      const question: Question = {
        id: `construction-${Date.now()}`,
        name: this.generateQuestionName(params.hierarchy),
        content: {
          text: '',  // Will be populated by type-specific content generator
          format: 'markdown'
        },
        metadata: {
          subjectId: params.hierarchy.subject.id,
          domainId: params.hierarchy.domain.id,
          topicId: params.hierarchy.topic.id,
          subtopicId: params.hierarchy.subtopic?.id,
          difficulty: params.difficulty,
          estimatedTime: params.estimatedTime,
          type: params.type,
          answerFormat: {
            hasFinalAnswer: params.type !== QuestionType.OPEN,
            finalAnswerType: params.type === QuestionType.MULTIPLE_CHOICE ? 'multiple_choice' :
                           params.type === QuestionType.NUMERICAL ? 'numerical' : 'none',
            requiresSolution: true
          },
          source: {
            type: SourceType.EZPASS,
            creatorType: EzpassCreatorType.AI
          }
        },
        schoolAnswer: await this.generateSchoolAnswer(params),
        evaluationGuidelines: await this.generateEvaluationGuidelines(params)
      };

      // Generate content based on question type
      switch (params.type) {
        case QuestionType.MULTIPLE_CHOICE:
          return await this.generateMultipleChoiceContent(question);
        case QuestionType.NUMERICAL:
          return await this.generateNumericalContent(question);
        case QuestionType.OPEN:
          return await this.generateOpenContent(question);
        default:
          throw new Error(`Unsupported question type: ${params.type}`);
      }
    } catch (error) {
      logger.error('Failed to generate core construction question', { error });
      throw error;
    }
  }

  private generateQuestionName(hierarchy: QuestionGenerationRequirements['hierarchy']): string {
    return `${hierarchy.topic.name}${hierarchy.subtopic ? ` - ${hierarchy.subtopic.name}` : ''}`;
  }

  public async generateMultipleChoiceContent(question: Question): Promise<Question> {
    question.content.text = `שאלת רב-ברירה בנושא ${question.metadata.topicId}...`;
    return question;
  }

  public async generateNumericalContent(question: Question): Promise<Question> {
    question.content.text = `שאלה חישובית בנושא ${question.metadata.topicId}...`;
    return question;
  }

  public async generateOpenContent(question: Question): Promise<Question> {
    question.content.text = `שאלה פתוחה בנושא ${question.metadata.topicId}...`;
    return question;
  }

  protected async generateSchoolAnswer(params: QuestionGenerationRequirements): Promise<Question['schoolAnswer']> {
    return {
      finalAnswer: params.type === QuestionType.MULTIPLE_CHOICE ? 
        { type: 'multiple_choice', value: 1 } :
        params.type === QuestionType.NUMERICAL ?
        { type: 'numerical', value: 0, tolerance: 0 } :
        undefined,
      solution: {
        text: 'פתרון לדוגמה...',
        format: 'markdown'
      }
    };
  }

  protected async generateEvaluationGuidelines(params: QuestionGenerationRequirements): Promise<Question['evaluationGuidelines']> {
    return {
      requiredCriteria: [
        {
          name: 'understanding',
          description: 'הבנת הנושא',
          weight: 40
        },
        {
          name: 'application',
          description: 'יישום נכון',
          weight: 30
        },
        {
          name: 'explanation',
          description: 'הסבר מפורט',
          weight: 30
        }
      ]
    };
  }
} 