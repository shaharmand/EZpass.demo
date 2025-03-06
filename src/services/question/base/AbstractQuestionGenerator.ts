import { Question, QuestionType, SourceType, EzpassCreatorType } from '../../../types/question';
import { QuestionGenerationRequirements } from '../../../types/questionGeneration';
import { IDomainQuestionGenerator, IMultipleChoiceGenerator, INumericalGenerator, IOpenQuestionGenerator } from './IQuestionGenerator';
import { logger } from '../../../utils/logger';

/**
 * Abstract base class implementing common question generation patterns
 * while allowing domain-specific overrides
 */
export abstract class AbstractQuestionGenerator implements IDomainQuestionGenerator {
  abstract readonly domain: string;
  abstract readonly supportedTypes: QuestionType[];

  /**
   * Main generation method that orchestrates the process
   */
  async generate(requirements: QuestionGenerationRequirements): Promise<Question> {
    try {
      // Validate requirements
      this.validateRequirements(requirements);

      // Generate base question structure
      let question = await this.generateBaseQuestion(requirements);

      // Add type-specific content
      question = await this.generateTypeSpecificContent(question, requirements);

      // Enrich with domain context
      question = await this.enrichWithDomainContext(question);

      // Add domain-specific evaluation
      question = await this.addDomainSpecificEvaluation(question);

      return question;
    } catch (error) {
      logger.error('Question generation failed in AbstractQuestionGenerator', {
        domain: this.domain,
        type: requirements.type,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Validate incoming requirements
   */
  protected validateRequirements(requirements: QuestionGenerationRequirements): void {
    if (!this.supportedTypes.includes(requirements.type)) {
      throw new Error(`Question type ${requirements.type} not supported for domain ${this.domain}`);
    }
  }

  /**
   * Generate base question structure common to all types
   */
  protected async generateBaseQuestion(requirements: QuestionGenerationRequirements): Promise<Question> {
    return {
      id: '', // Will be set by storage
      name: '',
      type: requirements.type,
      content: {
        text: '',
        format: 'markdown',
        options: []
      },
      metadata: {
        subjectId: requirements.hierarchy.subject.id,
        domainId: requirements.hierarchy.domain.id,
        topicId: requirements.hierarchy.topic.id,
        subtopicId: requirements.hierarchy.subtopic?.id || '',
        type: requirements.type,
        difficulty: requirements.difficulty,
        estimatedTime: requirements.estimatedTime,
        answerFormat: {
          hasFinalAnswer: requirements.type !== QuestionType.OPEN,
          finalAnswerType: this.getFinalAnswerType(requirements.type),
          requiresSolution: true
        },
        source: {
          type: SourceType.EZPASS,
          creatorType: EzpassCreatorType.AI
        }
      },
      schoolAnswer: {
        finalAnswer: null,
        solution: {
          text: '',
          format: 'markdown'
        }
      },
      evaluationGuidelines: {
        requiredCriteria: [],
        optionalCriteria: [],
        scoringMethod: 'sum',
        maxScore: 100
      }
    };
  }

  /**
   * Generate type-specific content
   */
  protected async generateTypeSpecificContent(
    question: Question,
    requirements: QuestionGenerationRequirements
  ): Promise<Question> {
    switch (requirements.type) {
      case QuestionType.MULTIPLE_CHOICE:
        return this.generateMultipleChoiceContent(question);
      case QuestionType.NUMERICAL:
        return this.generateNumericalContent(question);
      case QuestionType.OPEN:
        return this.generateOpenContent(question);
      default:
        return question;
    }
  }

  /**
   * Get final answer type based on question type
   */
  protected getFinalAnswerType(type: QuestionType): 'multiple_choice' | 'numerical' | 'none' {
    switch (type) {
      case QuestionType.MULTIPLE_CHOICE:
        return 'multiple_choice';
      case QuestionType.NUMERICAL:
        return 'numerical';
      default:
        return 'none';
    }
  }

  // Abstract methods that must be implemented by domain-specific generators
  abstract validateDomainContent(content: string): boolean;
  abstract enrichWithDomainContext(question: Question): Promise<Question>;
  abstract addDomainSpecificEvaluation(question: Question): Promise<Question>;

  // Protected methods for type-specific generation that can be overridden
  protected async generateMultipleChoiceContent(question: Question): Promise<Question> {
    return question;
  }

  protected async generateNumericalContent(question: Question): Promise<Question> {
    return question;
  }

  protected async generateOpenContent(question: Question): Promise<Question> {
    return question;
  }
} 