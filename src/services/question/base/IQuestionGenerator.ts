import { Question, QuestionType } from '../../../types/question';
import { QuestionGenerationRequirements } from '../../../types/questionGeneration';

/**
 * Base interface for all question generators
 */
export interface IQuestionGenerator {
  generate(requirements: QuestionGenerationRequirements): Promise<Question>;
}

/**
 * Common patterns for multiple choice questions across all domains
 */
export interface IMultipleChoiceGenerator {
  generateOptions(): Promise<string[]>;
  validateOptions(options: string[]): boolean;
  generateExplanation(correctOption: number, options: string[]): Promise<string>;
}

/**
 * Common patterns for numerical questions across all domains
 */
export interface INumericalGenerator {
  generateCalculationSteps(): Promise<string[]>;
  validateUnits(unit: string): boolean;
  generateSolutionExplanation(steps: string[]): Promise<string>;
}

/**
 * Common patterns for open questions across all domains
 */
export interface IOpenQuestionGenerator {
  generateRubric(): Promise<any>;
  validateAnswerStructure(answer: string): boolean;
  generateSampleAnswer(): Promise<string>;
}

/**
 * Domain-specific generator that implements common patterns
 * and adds domain-specific logic
 */
export interface IDomainQuestionGenerator extends IQuestionGenerator {
  // Domain-specific metadata
  readonly domain: string;
  readonly supportedTypes: QuestionType[];
  
  // Domain-specific validation
  validateDomainContent(content: string): boolean;
  
  // Domain-specific generation helpers
  enrichWithDomainContext(question: Question): Promise<Question>;
  addDomainSpecificEvaluation(question: Question): Promise<Question>;
}

/**
 * Factory for creating domain-specific generators
 */
export interface IQuestionGeneratorFactory {
  createGenerator(domain: string): IDomainQuestionGenerator;
} 