import { Question, FullAnswer } from '../../types/question';
import { DetailedQuestionFeedback } from '../../types/feedback/types';
import { logger } from '../../utils/logger';
import { AIFeedbackService } from './AIFeedbackService';
import { ExamContext } from './types';
import { QuestionFeedback } from '../../types/feedback/types';

/**
 * Service for generating detailed feedback using AI
 * This service can be extended to support different types of detailed feedback
 * or to combine multiple AI calls for more sophisticated feedback
 */
export class DetailedFeedbackService {
  constructor(private aiService: AIFeedbackService) {}

  async generate(
    question: Question, 
    answer: FullAnswer,
    examContext: ExamContext
  ): Promise<QuestionFeedback> {
    logger.info('Generating detailed feedback', {
      questionId: question.id,
      type: question.metadata.type
    });

    // Currently just using AI feedback, but this could be extended
    // to include other types of detailed feedback or multiple AI calls
    return this.aiService.generateFeedback(question, answer.solution.text, examContext);
  }
} 