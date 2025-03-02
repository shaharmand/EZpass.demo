/** 
 * Type of question that determines its structure and validation requirements.
 * 
 * Current supported types:
 * - multiple_choice: Exactly 4 options with one correct answer (1-4)
 * - numerical: Exact numeric answer with optional tolerance/units
 * - open: Free-form answer with evaluation criteria
 */
export enum QuestionType {
  MULTIPLE_CHOICE = 'multiple_choice',
  NUMERICAL = 'numerical',
  OPEN = 'open'
}

/**
 * Binary evaluation for multiple choice only
 */
export enum BinaryEvalLevel {
  CORRECT = 'correct',      // Selected the correct option
  INCORRECT = 'incorrect'   // Selected wrong option
}

/**
 * Detailed evaluation levels for questions requiring solution path
 * Used for:
 * - Numerical (with solution steps)
 * - Open-ended (essays, proofs)
 * 
 * Success thresholds:
 * - Green (✅): 80-100% (PERFECT, EXCELLENT, VERY_GOOD)
 * - Yellow (⚠️): 70-79% (GOOD)
 * - Red (❌): <70% (FAIR, POOR, IRRELEVANT)
 */
export enum DetailedEvalLevel {
  PERFECT = 'מושלם',         // 100%    - Perfect solution
  EXCELLENT = 'מצוין',       // 90-99%  - Near perfect solution
  VERY_GOOD = 'טוב מאוד',    // 80-89%  - Strong solution with minor issues
  GOOD = 'טוב',              // 70-79%  - Good solution with some gaps
  FAIR = 'מספיק',            // 55-69%  - Basic understanding, significant gaps
  POOR = 'חלש',              // <55%    - Major gaps or incorrect solution
  IRRELEVANT = 'לא רלוונטי'  // 0%      - Off-topic or unrelated
}

// Combined type for all evaluation levels
export type EvalLevel = 
  | { type: 'binary'; level: BinaryEvalLevel }
  | { type: 'detailed'; level: DetailedEvalLevel };

// Base feedback interface with minimal common fields
interface BaseFeedback {
  score: number;
  evalLevel: EvalLevel;
  message: string;  // Short summary like "תשובה נכונה!" or "תשובה שגויה"
}

// Basic feedback (multiple choice only)
export interface BasicQuestionFeedback extends BaseFeedback {
  basicExplanation: string;  // Why the chosen option is correct/incorrect
  fullExplanation?: string;  // Optional in-depth discussion
}

// Detailed feedback (numerical and open-ended)
export interface DetailedQuestionFeedback extends BaseFeedback {
  coreFeedback: string;      // Main evaluation points
  detailedFeedback: string;  // Analysis of solution path and explanation
  rubricScores: Record<string, CriterionFeedback>;  // Scoring of different aspects (steps, clarity, etc)
}

// Union type for all possible feedback types
export type QuestionFeedback = BasicQuestionFeedback | DetailedQuestionFeedback;

/**
 * Determines if an answer evaluation level indicates a successful answer
 * Success means:
 * - For binary: CORRECT only
 * - For detailed: Score of 80% or higher (PERFECT, EXCELLENT, VERY_GOOD)
 */
export function isSuccessfulAnswer(evalLevel: EvalLevel): boolean {
  switch (evalLevel.type) {
    case 'binary':
      return evalLevel.level === BinaryEvalLevel.CORRECT;
    case 'detailed':
      return [
        DetailedEvalLevel.PERFECT,
        DetailedEvalLevel.EXCELLENT,
        DetailedEvalLevel.VERY_GOOD
      ].includes(evalLevel.level);
  }
}

/** 
 * Difficulty level from 1 (easiest) to 5 (hardest)
 */
export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;

/** 
 * Represents a criterion score and feedback
 */
export interface CriterionFeedback {
  /** Score from 0-100 for this criterion */
  score: number;
  /** Specific feedback for this criterion */
  feedback: string;
}

/**
 * Markdown-formatted feedback text with specific requirements
 */
export interface StructuredFeedback {
  /** Must include:
   * - ✅ for correct parts
   * - ❌ for critical mistakes
   * - ⚠️ for partially correct parts
   * - 🔹 for important insights
   */
  text: string;
}

/**
 * Represents the evaluation criteria for a question.
 */
export interface RubricAssessment {
  criteria: Array<{
    /** The name of the criterion (e.g., Accuracy, Completeness, Clarity) */
    name: string;
    /** Description of what this criterion evaluates */
    description: string;
    /** Weight percentage of this criterion (should sum to 100 across all criteria) */
    weight: number;
  }>;
}

export interface AnswerRequirements {
  requiredElements: string[];
  optionalElements?: string[];
  scoringGuidelines?: {
    [key: string]: {
      points: number;
      description: string;
    };
  };
}

export interface Evaluation {
  /** 
   * Rubric assessment criteria for evaluating answers.
   * Defines how points are allocated across different aspects.
   */
  rubricAssessment: RubricAssessment;

  /**
   * Defines required key elements in the answer.
   * Ensures AI properly evaluates completeness.
   */
  answerRequirements: AnswerRequirements;
}

export enum EzpassCreatorType {
  AI = 'ai',
  HUMAN = 'human'
}

/**
 * Source type for questions - where they originated from
 */
export enum SourceType {
  EXAM = 'exam',
  EZPASS = 'ezpass'
}

/** 
 * Multiple choice option - just content, no answer information
 */
export interface MultipleChoiceOption {
  id: number;  // 1-4 for standard
  text: string;
  format: 'markdown';
}

/**
 * Complete answer structure with both validation and solution
 */
export interface FullAnswer {
  /** 
   * The concrete final answer for validation, if applicable.
   * 'none' type for questions without concrete answer (e.g. essay)
   */
  finalAnswer: 
    | { type: 'multiple_choice'; value: 1 | 2 | 3 | 4 }
    | { type: 'numerical'; value: number; tolerance: number; unit?: string }
    | { type: 'none' };
  
  /** 
   * Complete solution explanation.
   * Primary answer format for essay/proof type questions.
   */
  solution: {
    text: string;
    format: 'markdown';
    requiredSolution: boolean;
  };
}

/** 
 * Information about where a question was imported from.
 * This is stored in the DB's import_info field, separate from the question itself.
 */
export interface ImportInfo {
  /** The system the question was imported from */
  system: 'ezpass';  // Simplified to just ezpass since we're focusing on construction safety
  /** Original ID in the source system */
  originalId: string | number;
  /** When this question was imported */
  importedAt?: string;
  /** Any additional system-specific data */
  additionalData?: Record<string, any>;
}

/**
 * Question's validation status - simple result of automated validation
 */
export enum ValidationStatus {
  VALID = 'valid',        // Question structure and content are valid
  WARNING = 'warning',    // Has issues but can still be used
  ERROR = 'error'         // Has critical issues, needs fixing
}

/**
 * Question's publication status in the system
 */
export enum PublicationStatusEnum {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}

/**
 * Metadata for published/archived questions
 */
export interface PublicationMetadata {
  publishedAt?: string;   // ISO date when published
  publishedBy?: string;   // User who published
  archivedAt?: string;    // ISO date when archived
  archivedBy?: string;    // User who archived
  reason?: string;        // Optional reason for archiving
}

// Track who published and when
export interface PublishInfo {
  status: PublicationStatusEnum;
  publishedBy?: string; // user id who published
  publishedAt?: string; // ISO date string
}

/** 
 * Represents a complete question
 */
export interface Question {
  id: string;
  name?: string;
  content: {
    text: string;
    format: 'markdown';
    options?: Array<{
      text: string;
      format: 'markdown'
    }>;
  };
  answer: FullAnswer;
  metadata: {
    subjectId: string;
    domainId: string;
    topicId: string;
    subtopicId?: string;
    type: QuestionType;
    difficulty: DifficultyLevel;
    estimatedTime?: number;
    source?: 
      | { type: 'exam';
          examTemplateId: string;
          year: number;
          season: 'spring' | 'summer';
          moed: 'a' | 'b';
        }
      | { type: 'ezpass';
          creatorType: EzpassCreatorType;
        };
  };
  evaluation: {
    rubricAssessment: {
      criteria: Array<{
        name: string;
        description: string;
        weight: number;
      }>;
    };
    answerRequirements: {
      requiredElements: string[];
    };
  };
}

// Helper constant for empty evaluation
export const EMPTY_EVALUATION: Question['evaluation'] = {
  rubricAssessment: {
    criteria: [{
      name: 'basic_correctness',
      description: 'תשובה נכונה ומלאה',
      weight: 100
    }]
  },
  answerRequirements: {
    requiredElements: []
  }
};

/**
 * Complete status information for a question in the system
 */
export interface QuestionStatus {
  /** Publishing lifecycle status */
  publish: PublicationStatusEnum;
  /** Review/approval status */
  updatedAt: string;
  /** User who last updated the status */
  updatedBy?: string;
}

// Question being saved to DB - only fields that client should set
export interface SaveQuestion extends Omit<Question, 'createdAt' | 'updatedAt'> {
  id: string;
  publication_status: PublicationStatusEnum;
  publication_metadata?: PublicationMetadata;
}

// Question as stored in DB - includes server-managed fields
export interface DatabaseQuestion extends Question {
  id: string;
  publication_status: PublicationStatusEnum;
  publication_metadata?: PublicationMetadata;
  validation_status: ValidationStatus;
  import_info?: ImportInfo;
  created_at?: string;
  updated_at?: string;
}

// Minimal data for list view
export interface QuestionListItem {
  id: string;
  name?: string;
  content: string;
  metadata: {
    difficulty: DifficultyLevel;
    topicId: string;
    type: QuestionType;
    estimatedTime?: number;
  };

  publication_status: PublicationStatusEnum;
  created_at: string;
}

/** 
 * Filter state for the UI that allows multiple values per field
 */
export interface FilterState {
  subject?: string;
  domain?: string;
  topics?: string[];
  subTopics?: string[];
  questionTypes?: string[];
  timeLimit?: [number, number];
  difficulty?: DifficultyLevel[];
  source?: 
    | { type: 'exam';
        examTemplateId?: string;
        year?: number;
        season?: 'spring' | 'summer';
        moed?: 'a' | 'b';
      }
    | { type: 'ezpass';
        creatorType?: EzpassCreatorType;
      };
}

/** 
 * Parameters for generating a new question.
 * Used when requesting a question from OpenAI.
 * This is a specific instance of parameters that must match
 * the FilterState constraints.
 */
export interface QuestionFetchParams {
  /** Main topic to generate question about */
  topic: string;
  /** Optional subtopic for more specific questions */
  subtopic?: string;
  /** Target difficulty level from 1 (easiest) to 5 (hardest) */
  difficulty: DifficultyLevel;
  /** Type of question to generate */
  type: QuestionType;
  /** Subject area */
  subject: string;
  /** Target education level */
  educationType: string;
  /** Optional source information */
  source?: 
    | { type: 'exam';
        examTemplateId: string;
        year: number;
        season: 'spring' | 'summer';
        moed: 'a' | 'b';
      }
    | { type: 'ezpass';
        creatorType: EzpassCreatorType;
      };
}

/**
 * Question System Architecture
 * --------------------------
 * @see documentation at top of file for full architecture overview
 */

// Remove unused interfaces:
// export interface Solution { ... }
// export interface QuestionController { ... } 

export enum BasicAnswerLevel {
  CORRECT = 'correct',
  INCORRECT = 'incorrect'
}

/**
 * Type guard to check if feedback is basic feedback
 */
export function isBasicFeedback(feedback: QuestionFeedback): feedback is BasicQuestionFeedback {
  return 'basicExplanation' in feedback;
}

/**
 * Type guard to check if feedback is detailed feedback
 */
export function isDetailedFeedback(feedback: QuestionFeedback): feedback is DetailedQuestionFeedback {
  return 'detailedFeedback' in feedback;
}

export type Feedback = {
  evalLevel: BasicAnswerLevel | string;
  basicExplanation?: string;
  detailedFeedback?: string;
}; 