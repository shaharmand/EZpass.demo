import { Question, QuestionType, SourceType, EzpassCreatorType } from '../../../types/question';
import { QuestionGenerationRequirements } from '../../../types/questionGeneration';
import { logger } from '../../../utils/logger';
import { IQuestionGenerator } from './IQuestionGenerator';
import { EzpassQuestionGenerator } from './EzpassQuestionGenerator';
import { IQuestionGenerationManager, GenerationMetadata } from './IQuestionGenerationManager';
import { QuestionTypeFactory } from './types/QuestionTypeFactory';

export class QuestionGenerationManager implements IQuestionGenerationManager {
  private domainGenerators = new Map<string, IQuestionGenerator>();
  private defaultGenerator: IQuestionGenerator;
  private typeFactory: QuestionTypeFactory;

  constructor() {
    // Initialize the default generator
    this.defaultGenerator = new EzpassQuestionGenerator();
    this.typeFactory = QuestionTypeFactory.getInstance();
  }

  registerGenerator(domainId: string, generator: IQuestionGenerator) {
    this.domainGenerators.set(domainId, generator);
  }

  async generateNewQuestion(params: GenerationMetadata): Promise<Question> {
    try {
      // Log entry point with full parameters
      logger.info('QuestionGenerationManager: Starting new question generation', {
        section: 'ENTRY_POINT',
        params: JSON.stringify(params, null, 2),
        timestamp: new Date().toISOString()
      });

      // Get the appropriate type-specific generator
      const typeGenerator = this.typeFactory.getGenerator(params.metadata.type);

      // Generate the question using the type-specific generator
      const question = await typeGenerator.generateQuestion(params.metadata);

      // Log success with full generated question
      logger.info('QuestionGenerationManager: Question generation completed', {
        section: 'RESULT',
        questionId: question.id,
        type: params.metadata.type,
        question: JSON.stringify(question, null, 2),
        timestamp: new Date().toISOString()
      });

      return question;

    } catch (error) {
      // Log detailed error information
      logger.error('QuestionGenerationManager: Question generation failed', {
        section: 'ERROR',
        subject: params.metadata.subjectId,
        domain: params.metadata.domainId,
        type: params.metadata.type,
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack
        } : 'Unknown error',
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }
} 