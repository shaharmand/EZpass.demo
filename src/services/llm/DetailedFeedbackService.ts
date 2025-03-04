import { type DetailedQuestionFeedback } from '../../types/feedback/types';
import { FeedbackValidator } from './feedbackValidation';
import { logger } from '../../utils/logger';

export class DetailedFeedbackService {
  /**
   * Generates detailed feedback for a question using AI
   */
  static async generateDetailedFeedback(
    questionId: string,
    answer: string,
    prompt: string
  ): Promise<DetailedQuestionFeedback> {
    try {
      logger.info('Generating detailed feedback', {
        questionId,
        answerLength: answer.length,
        promptLength: prompt.length
      });

      // TODO: Call AI service to generate feedback
      const feedback = await this.callAIService(questionId, answer, prompt);

      // Validate the feedback
      if (!FeedbackValidator.validateDetailedFeedback(feedback)) {
        throw new Error('Generated feedback failed validation');
      }

      logger.info('Successfully generated detailed feedback', {
        questionId,
        score: feedback.score,
        level: feedback.evalLevel
      });

      return feedback;

    } catch (error: unknown) {
      logger.error('Failed to generate detailed feedback', {
        questionId,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
      throw error;
    }
  }

  private static async callAIService(
    questionId: string,
    answer: string,
    prompt: string
  ): Promise<DetailedQuestionFeedback> {
    // TODO: Implement actual AI service call
    throw new Error('AI service not implemented');
  }
} 