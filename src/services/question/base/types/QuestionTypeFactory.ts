import { QuestionType } from '../../../../types/question';
import { AbstractTypeGenerator } from './AbstractTypeGenerator';
import { MultipleChoiceGenerator } from './MultipleChoiceGenerator';
import { OpenQuestionGenerator } from './OpenQuestionGenerator';

/**
 * Factory for creating appropriate question type generators
 */
export class QuestionTypeFactory {
  private static instance: QuestionTypeFactory;
  private generators: Map<QuestionType, AbstractTypeGenerator>;

  private constructor() {
    this.generators = new Map();
    this.initializeGenerators();
  }

  static getInstance(): QuestionTypeFactory {
    if (!QuestionTypeFactory.instance) {
      QuestionTypeFactory.instance = new QuestionTypeFactory();
    }
    return QuestionTypeFactory.instance;
  }

  private initializeGenerators() {
    this.generators.set(QuestionType.MULTIPLE_CHOICE, new MultipleChoiceGenerator());
    this.generators.set(QuestionType.OPEN, new OpenQuestionGenerator());
    // TODO: Add numerical generator when implemented
  }

  getGenerator(type: QuestionType): AbstractTypeGenerator {
    const generator = this.generators.get(type);
    if (!generator) {
      throw new Error(`No generator found for question type: ${type}`);
    }
    return generator;
  }
} 