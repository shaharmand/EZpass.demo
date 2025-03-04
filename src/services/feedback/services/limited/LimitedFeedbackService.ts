import { LimitedQuestionFeedback, createLimitedFeedback } from '../../../../types/feedback/types';
import { logger } from '../../../../utils/logger';

/**
 * Service for generating limited feedback when user has exceeded usage limits
 */
export class LimitedFeedbackService {
  /**
   * Generate limited feedback response
   */
  generate(): LimitedQuestionFeedback {
    logger.info('Generating limited feedback due to usage limits');
    return createLimitedFeedback(0);
  }
} 