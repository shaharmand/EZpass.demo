import { Question, QuestionType, DifficultyLevel } from '../../../types/question';
import { QuestionGenerationRequirements, GenerationResult } from '../../../types/questionGeneration';

export interface DomainConfig {
  id: string;
  name: string;
  supportedTypes: QuestionType[];
  defaultRubricWeights: Record<QuestionType, Record<string, number>>;
  languageRequirements: string[];
}

export interface QuestionTypeConfig {
  type: QuestionType;
  requiredElements: string[];
  rubricCriteria: Array<{
    name: string;
    description: string;
    defaultWeight: number;
  }>;
  formatInstructions: string[];
}

/**
 * Abstract base class for domain-specific question generators
 */
export abstract class BaseQuestionGenerator {
  protected domainConfig: DomainConfig;
  protected typeConfigs: Map<QuestionType, QuestionTypeConfig>;

  constructor(domainConfig: DomainConfig) {
    this.domainConfig = domainConfig;
    this.typeConfigs = new Map();
  }

  /**
   * Generate a question based on the provided requirements
   */
  abstract generateQuestion(requirements: QuestionGenerationRequirements): Promise<GenerationResult>;

  /**
   * Build the prompt for question generation
   */
  protected abstract buildPrompt(requirements: QuestionGenerationRequirements): Promise<string>;

  /**
   * Get domain-specific instructions that apply to all question types
   */
  protected abstract getDomainInstructions(): string[];

  /**
   * Get type-specific instructions for this domain
   */
  protected abstract getTypeInstructions(type: QuestionType): string[];

  /**
   * Validate that the generated question meets domain-specific requirements
   */
  protected abstract validateDomainRequirements(question: Question): boolean;

  /**
   * Common validation shared across all domains
   */
  protected validateCommonRequirements(question: Question): boolean {
    // Basic structure validation
    if (!question.content?.text || !question.answer?.solution?.text) {
      return false;
    }

    // Metadata validation
    if (!question.metadata?.difficulty || 
        !question.metadata?.topicId ||
        !question.metadata?.estimatedTime) {
      return false;
    }

    // Type-specific validation
    const typeConfig = this.typeConfigs.get(question.metadata.type);
    if (!typeConfig) {
      return false;
    }

    // Validate rubric weights sum to 100%
    const rubricWeights = Object.values(question.evaluation?.rubricAssessment?.criteria || [])
      .reduce((sum, criterion) => sum + (criterion.weight || 0), 0);
    if (Math.abs(rubricWeights - 100) > 0.01) {
      return false;
    }

    return true;
  }

  /**
   * Get the combined instructions for question generation
   */
  protected getCombinedInstructions(type: QuestionType): string[] {
    return [
      ...this.getCommonInstructions(),
      ...this.getDomainInstructions(),
      ...this.getTypeInstructions(type)
    ];
  }

  /**
   * Get common instructions that apply to all domains and types
   */
  private getCommonInstructions(): string[] {
    return [
      "1. Question must be clear and unambiguous",
      "2. Difficulty level must match the specified level",
      "3. Include all necessary context in the question",
      "4. Provide complete solution and explanation",
      "5. Include proper metadata and tags"
    ];
  }
} 