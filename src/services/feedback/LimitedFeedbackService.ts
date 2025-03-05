import { QuestionWithMetadata, QuestionType } from '../../types/question';
import { 
  LimitedQuestionFeedback, 
  BasicQuestionFeedback,
  createBasicFeedback,
  createLimitedFeedback 
} from '../../types/feedback/types';
import { getBinaryEvalLevel } from '../../types/feedback/levels';
import { logger } from '../../utils/logger';
import { BasicFeedbackService } from './services/basic/BasicFeedbackService';
import { AIFeedbackService } from './AIFeedbackService';
import { ExamContext } from './types';
import { Question, FullAnswer } from '../../types/question';
import { QuestionFeedback } from '../../types/feedback/types';

/**
 * Service for generating limited feedback when user has exceeded usage limits
 */
export class LimitedFeedbackService {
  constructor(
    private basicFeedbackService: BasicFeedbackService,
    private aiService: AIFeedbackService
  ) {}

  /**
   * Generate limited feedback response
   */
  async generate(
    question: Question, 
    answer: FullAnswer,
    examContext: ExamContext
  ): Promise<QuestionFeedback> {
    switch (question.metadata.type) {
      case QuestionType.MULTIPLE_CHOICE:
        if (answer.finalAnswer?.type !== 'multiple_choice') {
          throw new Error('Multiple choice question requires multiple_choice answer type');
        }
        const basicFeedback = await this.basicFeedbackService.generate(
          question, 
          answer.finalAnswer
        );
        return createLimitedFeedback(
          basicFeedback.score,
          basicFeedback.message
        );
      
      case QuestionType.NUMERICAL:
      case QuestionType.OPEN:
        // Use AI service with quick=true for faster model






        
        return this.aiService.generateFeedback(
          question,
          answer.solution.text,
          examContext,
          true  // Use quick model for limited feedback
        );

      default:
        throw new Error(`Unsupported question type: ${question.metadata.type}`);
    }
  }
} 