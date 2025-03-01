import { Question, QuestionFetchParams } from '../../../types/question';
import { BaseQuestionGenerator } from './BaseQuestionGenerator';
import { logger } from '../../../utils/logger';

export class QuestionGenerationManager {
  private domainGenerators: Map<string, BaseQuestionGenerator>;

  constructor() {
    this.domainGenerators = new Map();
  }

  /**
   * Register a domain-specific generator
   */
  registerDomainGenerator(domainId: string, generator: BaseQuestionGenerator) {
    this.domainGenerators.set(domainId, generator);
    logger.info(`Registered question generator for domain: ${domainId}`);
  }

  /**
   * Generate a question using the appropriate domain generator
   */
  async generateQuestion(params: QuestionFetchParams): Promise<Question> {
    const domainId = this.getDomainFromTopic(params.topic);
    const generator = this.domainGenerators.get(domainId);

    if (!generator) {
      throw new Error(`No question generator registered for domain: ${domainId}`);
    }

    logger.info('Starting question generation', {
      domain: domainId,
      topic: params.topic,
      type: params.type,
      difficulty: params.difficulty
    });

    try {
      // Generate the question
      const question = await generator.generateQuestion(params);

      // Log success
      logger.info('Question generated successfully', {
        domain: domainId,
        questionId: question.id,
        type: question.type
      });

      return question;

    } catch (error) {
      logger.error('Question generation failed', {
        domain: domainId,
        topic: params.topic,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Extract domain ID from topic ID
   */
  private getDomainFromTopic(topicId: string): string {
    // Assuming topic IDs are in format: DOMAIN-TOPIC-XXX
    const parts = topicId.split('-');
    if (parts.length < 2) {
      throw new Error(`Invalid topic ID format: ${topicId}`);
    }
    return parts[0];
  }
} 