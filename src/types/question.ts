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
    difficulty: number;
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
    };
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
    /** Complete solution explanation in markdown format */
    text: string;
    /** Format specification for solution rendering */
    format: 'markdown';
  };
}

/** 
 * Parameters for generating a new question.
 * Used when requesting a question from OpenAI.
 */
export interface QuestionFetchParams {
  /** Main topic to generate question about (e.g., 'linear_equations') */
  topic: string;
  /** Optional subtopic for more specific questions */
  subtopic?: string;
  /** Target difficulty level from 1 (easiest) to 5 (hardest) */
  difficulty: number;
  /** Type of question to generate */
  type: QuestionType;
  /** Subject area (e.g., 'Mathematics', 'Computer Science') */
  subject: string;
  /** Target education level (e.g., 'high_school', 'technical_college') */
  educationType: string;
} 