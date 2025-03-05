import { Question, QuestionType, FullAnswer } from '../../types/question';
import { QuestionFeedback } from '../../types/feedback/types';
import { QuestionSubmission } from '../../types/submissionTypes';
import { logger } from '../../utils/logger';
import { DetailedFeedbackService } from './DetailedFeedbackService';
import { BasicFeedbackService } from './services/basic/BasicFeedbackService';
import { LimitedFeedbackService } from './LimitedFeedbackService';
import { ExamContext } from './types';
import { PrepStateManager } from '../PrepStateManager';
import { OpenAIService } from '../llm/openAIService';
import { AIFeedbackService } from './AIFeedbackService';

/**
 * Main feedback service that routes to appropriate feedback generator
 * based on question type and usage limits
 */
export class FeedbackService {
  private detailedFeedbackService: DetailedFeedbackService;
  private basicFeedbackService: BasicFeedbackService;
  private limitedFeedbackService: LimitedFeedbackService;

  constructor(openAIService: OpenAIService) {
    const aiService = new AIFeedbackService(openAIService);
    this.detailedFeedbackService = new DetailedFeedbackService(aiService);
    this.basicFeedbackService = new BasicFeedbackService();
    this.limitedFeedbackService = new LimitedFeedbackService(this.basicFeedbackService, aiService);
  }

  async generateFeedback(
    question: Question, 
    answer: FullAnswer,
    isLimited: boolean = false,
    examContext: ExamContext
  ): Promise<QuestionFeedback> {
    logger.info('Generating feedback', {
      questionId: question.id,
      type: question.metadata.type,
      isLimited,
      answerType: answer.finalAnswer?.type
    });

    // Return limited feedback if user has exceeded usage
    if (isLimited) {
      return this.limitedFeedbackService.generate(question, answer, examContext);
    }

    // Route to appropriate service based on question type
    switch (question.metadata.type) {
      case QuestionType.MULTIPLE_CHOICE:
        if (answer.finalAnswer?.type !== 'multiple_choice') {
          throw new Error('Multiple choice question requires multiple_choice answer type');
        }
        return this.basicFeedbackService.generate(
          question, 
          answer.finalAnswer
        );

      case QuestionType.NUMERICAL:
      case QuestionType.OPEN:
        return this.detailedFeedbackService.generate(question, answer, examContext);

      default:
        throw new Error(`Unsupported question type: ${question.metadata.type}`);
    }
  }
} 