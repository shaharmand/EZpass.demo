/** 
 * Type of question that determines its structure and validation requirements.
 * 
 * - multiple_choice: Exactly 4 options with one correct answer (1-4)
 * - open: Free-form answer with evaluation criteria
 * - code: Programming problem with input/output specs
 * - step_by_step: Progressive problem solving with intermediate steps
 */
export type QuestionType = 'multiple_choice' | 'open' | 'code' | 'step_by_step';

/** 
 * Difficulty level from 1 (easiest) to 5 (hardest)
 */
export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;
export type ProgrammingLanguage = 'java' | 'c#' | 'python';

/** 
 * Feedback for a submitted answer to a question.
 * Structure is consistent across all question types.
 */
export interface QuestionFeedback {
  /** Whether the answer was correct */
  isCorrect: boolean;

  /** Score from 0-100 */
  score: number;

  /** Short immediate feedback message (no markdown) */
  assessment: string;

  /** 
   * Core feedback that includes:
   * - What was correct
   * - What was wrong
   * - What to do next
   * (2-3 sentences, with markdown)
   */
  coreFeedback: string;

  /** 
   * Detailed analysis of mistakes and learning points.
   * Includes specific mistakes and detailed guidance for improvement.
   * (with markdown)
   */
  detailedFeedback?: string;

  /**
   * Individual scores and feedback for each rubric criterion
   */
  rubricScores?: {
    [criterionName: string]: {
      score: number;      // Score 0-100 for this criterion
      feedback: string;   // Specific feedback for this criterion
    };
  };
  };

/** 
 * Represents the evaluation criteria for a question.
 */
export interface Evaluation {
  /** 
   * Rubric assessment criteria for evaluating answers.
   * Defines how points are allocated across different aspects.
   */
  rubricAssessment: {
    criteria: Array<{
      /** The name of the criterion (e.g., Accuracy, Completeness, Clarity) */
      name: string;
      /** Description of what this criterion evaluates */
      description: string;
      /** Weight percentage of this criterion (should sum to 100 across all criteria) */
      weight: number;
    }>;
  };

  /**
   * Defines required key elements in the answer.
   * Ensures AI properly evaluates completeness.
   */
  answerRequirements: {
    requiredElements: string[];
  };
}

/** 
 * Represents a complete question with content, metadata, and solution.
 * Each type of question has specific requirements for its fields.
 */
export interface Question {
  /** Unique identifier for the question, generated at runtime */
  id: string;

  /** 
   * The type of question, determining its structure and presentation.
   * This affects validation requirements for other fields.
   */
  type: QuestionType;

  /** 
   * The actual question content and its format requirements.
   * Requirements vary by question type:
   * 
   * For multiple_choice:
   * - Clear, unambiguous question text
   * - All necessary information included
   * - No trick questions or misleading wording
   * 
   * For code:
   * - Clear problem specification
   * - Input/output requirements
   * - Constraints and edge cases
   * - Example inputs/outputs
   * 
   * For open:
   * - Clear, focused problem statement
   * - Specific deliverables required
   * - Clear evaluation criteria
   * 
   * For step_by_step:
   * - Complex problem broken into steps
   * - Clear progression of difficulty
   * - All necessary information upfront
   */
  content: {
    /** Question text in markdown format. Use LaTeX within $$ for math, code blocks with language for code */
    text: string;
    /** Format specification for content rendering */
    format: 'markdown';
  };
  
  /** 
   * Metadata about the question for categorization and filtering.
   * These fields help in organizing and selecting appropriate questions.
   */
  metadata: {
    /** Main topic identifier from the curriculum (e.g., 'linear_equations', 'data_structures') */
    topicId: string;
    /** Optional subtopic for more specific categorization */
    subtopicId?: string;
    /** 
     * Difficulty level from 1 (easiest) to 5 (hardest).
     * Should match the requested difficulty in generation parameters.
     */
    difficulty: DifficultyLevel;
    /** Estimated time to solve in minutes, appropriate for the education level */
    estimatedTime?: number;
    /** Source information for tracking question origin */
    source?: {
      /** Type of exam (e.g., 'bagrut', 'mahat', 'practice') */
      examType: string;
      /** Year the question was used or created */
      year?: number;
      /** Season or term (e.g., 'winter', 'summer') */
      season?: string;
      /** Specific exam instance (e.g., 'a', 'b') */
      moed?: string;
      /** Author or source of the question */
      author?: string;
    };
    /** Programming language for code questions */
    programmingLanguage?: string;
    /** Code template for the student to start with */
    codeTemplate?: string;
    /** Test cases for code validation */
    testCases?: Array<{
      input: string;
      expectedOutput: string;
    }>;
  };

  /** 
   * For multiple choice questions only.
   * Must include exactly 4 options where:
   * - All options are plausible
   * - Similar length and structure
   * - No obviously wrong answers
   * - Distractors based on common mistakes
   */
  options?: Array<{
    /** Option text in markdown format */
    text: string;
    /** Format specification for option rendering */
    format: 'markdown';
  }>;

  /** 
   * For multiple choice questions only.
   * The correct option number (1-4).
   * Must correspond to the index+1 of the correct option in the options array.
   */
  correctOption?: number;

  /** 
   * Evaluation structure that includes both rubric and answer requirements.
   * This field is now optional.
   */
  evaluation?: Evaluation;

  /** 
   * Solution and explanation for the question.
   * Requirements vary by question type:
   * 
   * For multiple_choice:
   * - Explain why the correct answer is right
   * - Point out why other options are incorrect
   * - Include step-by-step solution process
   * - Highlight common misconceptions
   * 
   * For code:
   * - Complete working code solution
   * - Step-by-step explanation
   * - Time/space complexity analysis
   * - Alternative approaches
   * - Common pitfalls to avoid
   * 
   * For open:
   * - Comprehensive model answer
   * - Multiple valid approaches if applicable
   * - Evaluation rubric/criteria
   * - Common mistakes to avoid
   * 
   * For step_by_step:
   * - Detailed solution for each step
   * - Explanation of progression
   * - Alternative approaches
   * - Common pitfalls at each step
   */
  solution: {
    /** Complete solution explanation in markdown format. Contains either:
     * - For questions requiring only final answer: The answer explanation
     * - For questions requiring solution steps: The detailed solution process
     */
    text: string;
    /** Format specification for solution rendering */
    format: 'markdown';
    /** Optional final answer in markdown format.
     * Present only when there's a distinct "final answer" separate from the solution steps.
     * Not needed for questions where:
     * - The answer is simple (e.g., multiple choice)
     * - The solution steps ARE the answer
     */
    answer?: string;
  };
}

/** 
 * Filter state for the UI that allows multiple values per field
 */
export interface FilterState {
  topics?: string[];
  subTopics?: string[];
  questionTypes?: string[];
  timeLimit?: [number, number];
  difficulty?: DifficultyLevel[];
  programmingLanguages?: string[];
  hasTestCases?: boolean;
  source?: {
    examType: 'bagrut' | 'mahat';
    year?: number;
    season?: 'winter' | 'summer';
    moed?: 'a' | 'b' | 'c';
  };
}

/** 
 * Parameters for generating a new question.
 * Used when requesting a question from OpenAI.
 * This is a specific instance of parameters that must match
 * the FilterState constraints.
 */
export interface QuestionFetchParams {
  /** Main topic to generate question about (e.g., 'linear_equations') */
  topic: string;
  /** Optional subtopic for more specific questions */
  subtopic?: string;
  /** Target difficulty level from 1 (easiest) to 5 (hardest) */
  difficulty: DifficultyLevel;
  /** Type of question to generate */
  type: QuestionType;
  /** Subject area (e.g., 'Mathematics', 'Computer Science') */
  subject: string;
  /** Target education level (e.g., 'high_school', 'technical_college') */
  educationType: string;
  /** Programming language for code questions */
  programmingLanguage?: string;
  /** Whether to include test cases for code questions */
  includeTestCases?: boolean;
  /** Optional source information */
  source?: {
    examType: 'bagrut' | 'mahat';
    year?: number;
    season?: 'winter' | 'summer' | 'a' | 'b';
  };
}

/**
 * Validates if a set of question parameters satisfies the filter constraints
 */
export function satisfiesFilter(params: QuestionFetchParams, filter: FilterState): boolean {
  // If no filter is set, everything is valid
  if (Object.keys(filter).length === 0) return true;

  // Check each filter constraint
  if (filter.topics?.length && !filter.topics.includes(params.topic)) {
    console.log('Failed topic filter:', { filterTopics: filter.topics, paramTopic: params.topic });
    return false;
  }
  
  // Check subtopics filter
  if (filter.subTopics?.length && !filter.subTopics.includes(params.subtopic || '')) {
    console.log('Failed subtopic filter:', { filterSubtopics: filter.subTopics, paramSubtopic: params.subtopic });
    return false;
  }

  // Empty questionTypes array means no filter - accept all types
  if (filter.questionTypes?.length && !filter.questionTypes.includes(params.type)) {
    console.log('Failed question type filter:', { filterTypes: filter.questionTypes, paramType: params.type });
    return false;
  }

  // For code questions, check programming language
  if (params.type === 'code' && filter.programmingLanguages?.length) {
    if (!params.programmingLanguage || !filter.programmingLanguages.includes(params.programmingLanguage)) {
      console.log('Failed programming language filter');
      return false;
    }
  }

  // Check test cases requirement
  if (filter.hasTestCases && !params.includeTestCases) {
    console.log('Failed test cases filter');
    return false;
  }

  // Check difficulty levels
  if (filter.difficulty?.length && !filter.difficulty.includes(params.difficulty)) {
    console.log('Failed difficulty filter:', { filterDifficulty: filter.difficulty, paramDifficulty: params.difficulty });
    return false;
  }

  if (filter.source && params.source) {
    if (params.source.examType !== filter.source.examType) {
      console.log('Failed exam type filter');
      return false;
    }
    if (filter.source.year && params.source.year !== filter.source.year) {
      console.log('Failed year filter');
      return false;
    }
    if (filter.source.season && params.source.season !== filter.source.season) {
      console.log('Failed season filter');
      return false;
    }
  }

  return true;
}

/**
 * Standard feedback messages and grade translations
 * Used across the application to ensure consistent messaging
 */
export const FeedbackMessages = {
  correct: 'תשובה נכונה!',
  incorrect: 'תשובה שגויה',
  
  // Grade translations
  getGradeText(score: number): string {
    if (score >= 95) return 'מצוין';
    if (score >= 85) return 'טוב מאוד';
    if (score >= 75) return 'טוב';
    if (score >= 60) return 'מספיק';
    return 'חלש';
  },

  // Assessment messages
  getAssessmentText(score: number): string {
    if (score >= 95) return 'מצוין! המשך כך!';
    if (score >= 85) return 'כל הכבוד! תשובה טובה מאוד';
    if (score >= 75) return 'טוב! יש עוד מקום קטן לשיפור';
    if (score >= 60) return 'מספיק, אבל יש מקום לשיפור';
    return 'כדאי לחזור על החומר ולנסות שוב';
  }
} as const; 