import { QuestionWithMetadata } from '../../types/question';
import { DetailedQuestionFeedback } from '../../types/feedback/types';
import { logger } from '../../utils/logger';
import { AIFeedbackService } from './AIFeedbackService';
import { ExamContext } from './types';

/**
 * Service for generating detailed feedback using AI
 * This service can be extended to support different types of detailed feedback
 * or to combine multiple AI calls for more sophisticated feedback
 */
export class DetailedFeedbackService {
  constructor(private aiService: AIFeedbackService) {}

  async generate(
    question: QuestionWithMetadata,
    userAnswer: string,
    examContext: ExamContext
  ): Promise<DetailedQuestionFeedback> {
    logger.info('Generating detailed feedback', {
      questionId: question.id,
      type: question.metadata.type
    });

    // Currently just using AI feedback, but this could be extended
    // to include other types of detailed feedback or multiple AI calls
    return this.aiService.generateFeedback(question, userAnswer, examContext);
  }
} 