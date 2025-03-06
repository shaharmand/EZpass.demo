import { Question, QuestionMetadata } from '../../../types/question';
import { ExamContext } from '../../../types/examTemplate';

export interface GenerationMetadata {
  // Basic metadata for generation
  metadata: QuestionMetadata;
  // Optional exam context to follow specific style/requirements
  examContext?: ExamContext;
}

export interface IQuestionGenerationManager {
  /**
   * Generate a new question based on metadata and optional exam context
   */
  generateNewQuestion(params: GenerationMetadata): Promise<Question>;
} 