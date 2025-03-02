import { Question } from '../../../types/question';
import { QuestionGenerationRequirements } from '../../../types/questionGeneration';

export interface IQuestionGenerator {
  generate(params: QuestionGenerationRequirements): Promise<Partial<Question>>;
} 