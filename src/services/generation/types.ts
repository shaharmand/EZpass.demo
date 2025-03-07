// Types for question components
export interface QuestionContent {
  introduction: string;
  situation: string;
  question: string;
}

export interface QuestionMetadata {
  topic: string;
  subtopic: string;
  difficulty: string;
  timeAllocation?: string;
  prerequisites?: string[];
  tags?: string[];
}

export interface Solution {
  mainPoints: string[];
  regulations: string[];
  practicalSteps: string[];
  summary: string;
}

export interface Evaluation {
  criteria: {
    name: string;
    weight: number;
    description: string;
  }[];
  passingScore: number;
  commonMistakes: string[];
}

// Input interfaces
export interface CreateContentInput {
  referenceQuestion: QuestionContent;
  targetTopic: string;
  targetSubtopic: string;
  targetDifficulty: string;
}

export interface CreateMetadataInput {
  content: QuestionContent;
  existingMetadata?: Partial<QuestionMetadata>;
}

export interface CreateSolutionInput {
  content: QuestionContent;
  difficulty: string;
  referenceSolution?: Solution;
}

export interface CreateEvaluationInput {
  content: QuestionContent;
  solution: Solution;
  existingEvaluation?: Evaluation;
}

// Complete question interface
export interface CompleteQuestion {
  content: QuestionContent;
  metadata: QuestionMetadata;
  solution: Solution;
  evaluation: Evaluation;
} 