import { Question } from './question';

export interface QuestionRepository {
  saveQuestion(question: Question): Promise<void>;
  getQuestion(id: string): Promise<Question | null>;
  getQuestions(): Promise<Question[]>;
  deleteQuestion(id: string): Promise<void>;
  // Add other methods as needed
} 