import { Question, QuestionType, MultipleChoiceAnswer } from '../../../../types/question';
import { IMultipleChoiceGenerator } from '../IQuestionGenerator';

/**
 * Base class for multiple choice questions implementing common patterns
 */
export abstract class BaseMultipleChoiceGenerator implements IMultipleChoiceGenerator {
  /**
   * Core prompt template for multiple choice questions
   */
  protected getBasePrompt(): string {
    return `
Generate a multiple choice question following these guidelines:

1. Question Structure:
   - Clear, focused question text
   - Exactly 4 options
   - One definitively correct answer
   - Plausible distractors

2. Option Requirements:
   - All options similar length
   - No obviously wrong answers
   - No "all/none of the above"
   - Consistent grammar/structure

3. Format:
   - Question text in markdown
   - Each option in markdown
   - Clear solution explanation
`;
  }

  /**
   * Generate the options for the question
   * Domains should override this with specific examples
   */
  abstract generateOptions(): Promise<string[]>;

  /**
   * Validate the generated options
   */
  validateOptions(options: string[]): boolean {
    if (!options || options.length !== 4) {
      return false;
    }

    // Check for empty options
    if (options.some(opt => !opt.trim())) {
      return false;
    }

    // Check for duplicate options
    const uniqueOptions = new Set(options);
    if (uniqueOptions.size !== options.length) {
      return false;
    }

    return true;
  }

  /**
   * Generate explanation for the correct answer and why others are wrong
   */
  async generateExplanation(correctOption: number, options: string[]): Promise<string> {
    return `
### הסבר התשובה הנכונה

התשובה הנכונה היא ${correctOption + 1}:
${options[correctOption]}

### למה התשובות האחרות שגויות:

${options
  .map((opt, idx) => idx !== correctOption ? 
    `תשובה ${idx + 1}: ${this.explainWrongOption(opt)}` : '')
  .filter(Boolean)
  .join('\n\n')}
`;
  }

  /**
   * Helper method to format multiple choice answer
   */
  protected createMultipleChoiceAnswer(correctOption: number): MultipleChoiceAnswer {
    // Ensure the value is between 1 and 4
    const value = (correctOption + 1) as 1 | 2 | 3 | 4;
    if (value < 1 || value > 4) {
      throw new Error('Multiple choice answer must be between 1 and 4');
    }
    
    return {
      type: 'multiple_choice',
      value
    };
  }

  /**
   * Template method for generating wrong option explanations
   * Domains can override this for more specific explanations
   */
  protected explainWrongOption(option: string): string {
    return `שגויה כי...`;
  }

  /**
   * Helper method to validate option format
   */
  protected formatOption(text: string): { text: string; format: 'markdown' } {
    return {
      text,
      format: 'markdown'
    };
  }
} 