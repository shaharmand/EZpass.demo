import { QuestionWithMetadata, QuestionType } from '../../types/question';
import { 
  LimitedQuestionFeedback, 
  BasicQuestionFeedback,
  createBasicFeedback 
} from '../../types/feedback/types';
import { getBinaryEvalLevel } from '../../types/feedback/levels';
import { logger } from '../../utils/logger';
import { BasicFeedbackService } from './services/basic/BasicFeedbackService';
import { AIFeedbackService } from './AIFeedbackService';
import { ExamContext } from './types';

/**
 * Service for generating limited feedback when user has exceeded usage limits
 */
export class LimitedFeedbackService {
  constructor(
    private basicFeedbackService: BasicFeedbackService,
    private aiFeedbackService: AIFeedbackService
  ) {}

  /**
   * Generate limited feedback response
   */
  async generate(
    question: QuestionWithMetadata,
    userAnswer: string,
    examContext: ExamContext
  ): Promise<LimitedQuestionFeedback> {
    logger.info('Generating limited feedback', { 
      questionId: question.id,
      questionType: question.metadata.type 
    });

    // For multiple choice, use basic feedback but with limited fields
    if (question.metadata.type === QuestionType.MULTIPLE_CHOICE) {
      const basicFeedback = await this.basicFeedbackService.generate(question, userAnswer);
      return {
        type: 'limited',
        score: basicFeedback.score,
        evalLevel: basicFeedback.evalLevel,
        message: basicFeedback.message,
        reason: 'usage_limit_exceeded'
      };
    }

    // For numerical/open-ended, get detailed feedback but convert to limited format
    if (question.metadata.type === QuestionType.NUMERICAL || question.metadata.type === QuestionType.OPEN) {
      const detailedFeedback = await this.aiFeedbackService.generateFeedback(question, userAnswer, examContext, true);
      return {
        type: 'limited',
        score: detailedFeedback.score,
        evalLevel: getBinaryEvalLevel(detailedFeedback.score),
        message: detailedFeedback.message,
        reason: 'usage_limit_exceeded'
      };
    }

    // Default case - return limited feedback with 0 score
    return {
      type: 'limited',
      score: 0,
      evalLevel: getBinaryEvalLevel(0),
      message: 'תשובה שגויה',
      reason: 'usage_limit_exceeded'
    };
  }
} 