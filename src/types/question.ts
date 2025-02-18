export interface Question {
  id: string;
  content: {
    text: string;      // Markdown with LaTeX/code
    format: 'markdown';
  };
  
  metadata: {
    topicId: string;
    subtopicId?: string;
    type: 'multiple_choice' | 'essay';
    difficulty: number;
    source?: string;
  };

  // For multiple choice questions
  options?: string[];
  correctOption?: number;

  // Solution with detailed explanation
  solution: {
    text: string;
    format: "markdown";
    steps?: {
      text: string;
      key_point?: string;
    }[];
  };
}

// Parameters for fetching questions (from any source)
export type QuestionType = 'multiple_choice' | 'essay';

// Input parameters for question generation
export interface QuestionFetchParams {
  topic: string;
  subtopic?: string;
  difficulty: number | {
    min: number;
    max: number;
  };
  type: QuestionType;
  subject: string;
  educationType: string;
} 