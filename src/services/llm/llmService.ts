import { OpenAIService } from './openAIService';
import { logger } from '../../utils/logger';

/**
 * Base service for LLM operations
 */
export class LLMService {
  private openAI: OpenAIService;

  constructor(openAI?: OpenAIService) {
    this.openAI = openAI || new OpenAIService(process.env.REACT_APP_OPENAI_API_KEY || '');
    logger.info('LLMService initialized');
  }

  /**
   * Sends a completion request to the LLM
   */
  async complete(prompt: string, options: any = {}): Promise<string> {
    try {
      return await this.openAI.complete(prompt, options);
    } catch (error) {
      logger.error('Error in LLM completion', { error });
      throw error;
    }
  }
} 