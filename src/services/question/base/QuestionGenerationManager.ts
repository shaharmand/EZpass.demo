import { Question, QuestionType, SourceType, EzpassCreatorType } from '../../../types/question';
import { QuestionGenerationRequirements } from '../../../types/questionGeneration';
import { logger } from '../../../utils/logger';
import { IQuestionGenerator } from './IQuestionGenerator';

export class QuestionGenerationManager {
  private domainGenerators = new Map<string, IQuestionGenerator>();

  registerGenerator(domainId: string, generator: IQuestionGenerator) {
    this.domainGenerators.set(domainId, generator);
  }

  /**
   * Generates a question based on the provided parameters
   * @param params Question generation parameters
   * @returns Generated question
   */
  async generateQuestion(params: QuestionGenerationRequirements): Promise<Question> {
    const domainId = this.getDomainFromTopic(params.hierarchy.topic.id);
    const generator = this.domainGenerators.get(domainId);

    if (!generator) {
      throw new Error(`No generator registered for domain ${domainId}`);
    }

    try {
      logger.info('Starting question generation', {
        domain: domainId,
        topic: params.hierarchy.topic.name,
        type: params.type,
        difficulty: params.difficulty
      });

      const question = await generator.generate(params);

      // Initialize metadata with required fields
      if (!question.metadata) {
        question.metadata = {
          subjectId: params.hierarchy.subject.id,
          domainId,
          topicId: params.hierarchy.topic.id,
          type: params.type,
          difficulty: params.difficulty
        };
      }

      // Add standard metadata
      question.metadata = {
        ...question.metadata,
        subjectId: params.hierarchy.subject.id,
        domainId,
        topicId: params.hierarchy.topic.id,
        subtopicId: params.hierarchy.subtopic.id,
        difficulty: params.difficulty,
        type: params.type,
        source: {
          type: SourceType.EZPASS,
          creatorType: EzpassCreatorType.AI
        }
      };

      return question as Question;

    } catch (error) {
      logger.error('Question generation failed', {
        domain: domainId,
        topic: params.hierarchy.topic.name,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  private getDomainFromTopic(topicId: string): string {
    // TODO: Implement proper domain mapping
    return 'construction_safety';
  }
} 