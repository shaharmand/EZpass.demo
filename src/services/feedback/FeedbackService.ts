import { Question, QuestionType } from '../../types/question';
import { QuestionFeedback } from '../../types/feedback/types';
import { logger } from '../../utils/logger';
import { DetailedFeedbackService } from './DetailedFeedbackService';
import { BasicFeedbackService } from './services/basic/BasicFeedbackService';
import { LimitedFeedbackService } from './LimitedFeedbackService';
import { ExamContext } from './types';

/**
 * Main feedback service that routes to appropriate feedback generator
 * based on question type and usage limits
 */
export class FeedbackService {
  constructor(
    private detailedFeedbackService: DetailedFeedbackService,
    private basicFeedbackService: BasicFeedbackService,
    private limitedFeedbackService: LimitedFeedbackService
  ) {}

  async generateFeedback(
    question: Question, 
    userAnswer: string, 
    isLimited: boolean = false,
    examContext: ExamContext
  ): Promise<QuestionFeedback> {
    logger.info('Generating feedback', {
      questionId: question.id,
      type: question.metadata.type,
      isLimited
    });

    // Return limited feedback if user has exceeded usage
    if (isLimited) {
      return this.limitedFeedbackService.generate(question, userAnswer, examContext);
    }

    // Route to appropriate service based on question type
    switch (question.metadata.type) {
      case QuestionType.MULTIPLE_CHOICE:
        return this.basicFeedbackService.generate(question, userAnswer);
      case QuestionType.NUMERICAL:
      case QuestionType.OPEN:
        return this.detailedFeedbackService.generate(question, userAnswer, examContext);
      default:
        throw new Error(`Unsupported question type: ${question.metadata.type}`);
    }
  }
} 