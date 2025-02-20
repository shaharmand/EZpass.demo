import type { Question as BaseQuestion } from './question';
import { DifficultyLevel } from './question';

export interface Topic {
  id: string;
  name: string;
  subtopics?: Topic[];
}

export type Question = BaseQuestion;

export interface Exam {
  id: string;
  name: string;
  description: string;
  topics: Topic[];
  duration: number;
  totalQuestions: number;
  passingScore: number;
}

export interface PrepContent {
  selectedTopics: string[];
  difficulty: DifficultyLevel;
  progress: number;
}

export interface Prep {
  id: string;
  userId: string;
  formalExam: Exam;
  content: PrepContent;
  createdAt: Date;
  updatedAt: Date;
} 