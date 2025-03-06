import { Question, QuestionMetadata } from '../../../../types/question';

/**
 * Abstract base class for type-specific question generators
 * Each question type (multiple choice, numerical, open) will extend this
 */
export abstract class AbstractTypeGenerator {
  /**
   * Generate a complete question of this type
   */
  abstract generateQuestion(metadata: QuestionMetadata): Promise<Question>;

  /**
   * Get type-specific prompt additions
   */
  abstract getTypeSpecificPrompt(): string;

  /**
   * Get example questions of this type
   */
  abstract getExampleQuestions(): string;

  /**
   * Get evaluation criteria specific to this type
   */
  abstract getTypeCriteria(): Array<{
    name: string;
    description: string;
    weight: number;
  }>;

  /**
   * Base prompt that includes the example and type-specific instructions
   */
  protected getBasePrompt(metadata: QuestionMetadata): string {
    return `
Generate a ${metadata.type} question following these requirements:

${this.getTypeSpecificPrompt()}

Example questions:
${this.getExampleQuestions()}

The question must be about: ${metadata.topicId}
Domain: ${metadata.domainId}
Difficulty level: ${metadata.difficulty}

CRITICAL: Response must be in Hebrew and follow the exact format shown in the examples.
`;
  }
} 