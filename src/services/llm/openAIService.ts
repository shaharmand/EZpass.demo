import OpenAI from 'openai';
import { logger } from '../../utils/logger';

interface CompletionOptions {
  model?: string;
  temperature?: number;
  response_format?: { type: 'text' | 'json_object' };
  messages?: Array<OpenAI.Chat.ChatCompletionMessageParam>;
}

export class OpenAIService {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ 
      apiKey,
      dangerouslyAllowBrowser: true // Allow browser usage
    });
  }

  async complete(prompt: string, options: CompletionOptions = {}): Promise<string> {
    try {
      // Format messages for logging
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = options.messages 
        ? [...options.messages, { role: 'user' as const, content: prompt }]
        : [{ role: 'user' as const, content: prompt }];
      
      // Log formatted request
      logger.info('OpenAI request details', {
        messages: messages.map(m => ({
          role: m.role,
          content: typeof m.content === 'string' ? m.content.substring(0, 100) + '...' : '[Content not string]'
        })),
        model: options.model || 'gpt-4-turbo-preview',
        temperature: options.temperature ?? 0.2,
        response_format: options.response_format
      });

      const response = await this.client.chat.completions.create({
        model: options.model || 'gpt-4-turbo-preview',
        messages,
        temperature: options.temperature ?? 0.2,
        response_format: options.response_format,
      });

      // Log formatted response
      logger.info('OpenAI response details', {
        content: response.choices[0].message.content,
        usage: response.usage,
        model: response.model,
        finishReason: response.choices[0].finish_reason
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      logger.error('OpenAI completion failed', { error });
      throw error;
    }
  }
} 