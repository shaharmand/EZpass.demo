ouldnt import { QuestionType, DifficultyLevel } from './common';

/**
 * Common interface for answer format requirements
 */
export interface AnswerFormat {
  hasFinalAnswer: boolean;
  finalAnswerType: FinalAnswerType;
  requiresSolution: boolean;
}

/**
 * Requirements for the format/structure of an answer
 */
export interface AnswerFormatRequirements extends AnswerFormat {}

/**
 * Requirements for the content of an answer
 */
export interface AnswerContentGuidelines {
  /** 
   * Core criteria that must be met for basic correctness.
   * These are evaluated first and must all be present to get any points.
   * Total weight of required criteria should sum to 100%.
   */
  requiredCriteria: Array<{
    name: string;
    description: string;
    weight: number;
  }>;
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
 * Type of final answer expected for a question
 */
export type FinalAnswerType = 
  | 'multiple_choice'
  | 'numerical'
  | 'none';

/**
 * Multiple choice answer structure
 */
export interface MultipleChoiceAnswer {
  type: 'multiple_choice';
  value: 1 | 2 | 3 | 4;
}

/**
 * Numerical answer structure
 */
export interface NumericalAnswer {
  type: 'numerical';
  value: number;
  tolerance: number;
  unit?: string;
}

/**
 * Complete answer structure with both final answer and solution
 */
export interface FullAnswer {
  /** 
   * The concrete final answer for validation.
   * Required for multiple choice and numerical questions.
   * Not allowed for open questions.
   */
  finalAnswer?: MultipleChoiceAnswer | NumericalAnswer;
  
  /** 
   * Complete solution explanation.
   * Required for open questions and numerical questions.
   * Optional for multiple choice.
   */
  solution: {
    text: string;
    format: 'markdown';
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
  id: string;  // Required for all questions
  name?: string;
  content: {
    text: string;
    format: 'markdown';
    options?: Array<{
      text: string;
      format: 'markdown'
    }>;
  };
  schoolAnswer: FullAnswer;  // Sample answer that follows the format requirements
  metadata: {
    subjectId: string;
    domainId: string;
    topicId: string;
    subtopicId?: string;
    type: QuestionType;
    difficulty: DifficultyLevel;
    estimatedTime?: number;
    
    /** Requirements for how answers should be structured */
    answerFormat: AnswerFormatRequirements;
    
    source?: 
      | { type: 'exam';
          examTemplateId: string;
          year: number;
          season: 'spring' | 'summer';
          moed: 'a' | 'b';
          order?: number;
        }
      | { type: 'ezpass';
          creatorType: EzpassCreatorType;
        };
  };
  
  /** Guidelines for evaluating answer content */
  evaluationGuidelines: AnswerContentGuidelines;
}

// Helper constant for empty evaluation guidelines
export const EMPTY_EVALUATION_GUIDELINES: AnswerContentGuidelines = {
  requiredCriteria: [{
    name: 'basic_correctness',
    description: 'תשובה נכונה ומלאה',
    weight: 100
  }]
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

/**
 * Question's review status in the system
 */
export enum ReviewStatusEnum {
  PENDING_REVIEW = 'pending_review',  // Needs human review
  APPROVED = 'approved'               // Ready for publication
}

/**
 * Metadata about the review process
 */
export interface ReviewMetadata {
  reviewedAt: string;
  reviewedBy: string;
  comments?: string;
}

/**
 * Information about AI-generated fields
 */
export interface AIGeneratedFields {
  fields: string[];  // Array of field paths that were AI-generated
  confidence: {
    [key: string]: number;  // Confidence score for each field (0-1)
  };
  generatedAt: string;      // When these fields were generated
}

// Question as stored in DB - includes server-managed fields
export interface DatabaseQuestion extends Question {
  id: string;
  publication_status: PublicationStatusEnum;
  publication_metadata?: PublicationMetadata;
  validation_status: ValidationStatus;
  review_status: ReviewStatusEnum;
  ai_generated_fields: AIGeneratedFields;
  review_metadata?: ReviewMetadata;
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

/**
 * Type guard to check if a string is a valid QuestionType
 */
export function isValidQuestionType(type: string): type is QuestionType {
  return Object.values(QuestionType).includes(type as QuestionType);
}

/**
 * Default question type to use when type is invalid or not specified
 */
export const DEFAULT_QUESTION_TYPE = QuestionType.OPEN;

/**
 * Type guard to check if a string is a valid SourceType
 */
export function isValidSourceType(type: string): type is SourceType {
  return Object.values(SourceType).includes(type as SourceType);
}

/**
 * Type guard to check if a string is a valid EzpassCreatorType
 */
export function isValidCreatorType(type: string): type is EzpassCreatorType {
  return Object.values(EzpassCreatorType).includes(type as EzpassCreatorType);
}

/**
 * Default source type to use when type is invalid or not specified
 */
export const DEFAULT_SOURCE_TYPE = SourceType.EZPASS;

/**
 * Default creator type to use when type is invalid or not specified
 */
export const DEFAULT_CREATOR_TYPE = EzpassCreatorType.HUMAN;

/**
 * Type guard to check if a number is a valid DifficultyLevel
 */
export function isValidDifficultyLevel(level: number): level is DifficultyLevel {
  return Number.isInteger(level) && level >= 1 && level <= 5;
}

/**
 * Default difficulty level to use when level is invalid or not specified
 */
export const DEFAULT_DIFFICULTY_LEVEL: DifficultyLevel = 3;

/**
 * Maps difficulty level to descriptive text
 */
export const DIFFICULTY_DESCRIPTIONS: Record<DifficultyLevel, string> = {
  1: 'קל מאוד',
  2: 'קל',
  3: 'בינוני',
  4: 'קשה',
  5: 'קשה מאוד'
};

/**
 * Type guard to check if a string is a valid PublicationStatusEnum
 */
export function isValidPublicationStatus(status: string): status is PublicationStatusEnum {
  return Object.values(PublicationStatusEnum).includes(status as PublicationStatusEnum);
}

/**
 * Default publication status to use when status is invalid or not specified
 */
export const DEFAULT_PUBLICATION_STATUS = PublicationStatusEnum.DRAFT;

/**
 * Maps publication status to descriptive text
 */
export const PUBLICATION_STATUS_DESCRIPTIONS: Record<PublicationStatusEnum, string> = {
  [PublicationStatusEnum.DRAFT]: 'טיוטה',
  [PublicationStatusEnum.PUBLISHED]: 'פורסם',
  [PublicationStatusEnum.ARCHIVED]: 'בארכיון'
};

/**
 * Type guard to check if a string is a valid ReviewStatusEnum
 */
export function isValidReviewStatus(status: string): status is ReviewStatusEnum {
  return Object.values(ReviewStatusEnum).includes(status as ReviewStatusEnum);
}

/**
 * Maps review status to descriptive text
 */
export const REVIEW_STATUS_DESCRIPTIONS: Record<ReviewStatusEnum, string> = {
  [ReviewStatusEnum.PENDING_REVIEW]: 'ממתין לבדיקה',
  [ReviewStatusEnum.APPROVED]: 'אושר'
};

export interface QuestionMetadata {
  subjectId: string;
  domainId: string;
  topicId: string;
  subtopicId: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
  estimatedTime?: number;
  answerFormat: AnswerFormat;  // Using the common interface
  source?: {
    name: string;
    year?: number;
    semester?: string;
  };
  correctAnswer?: number;
  numericalAnswer?: {
    value: number;
    tolerance: number;
  };
}

export type QuestionWithMetadata = Question;

/**
 * Feedback for a student's answer to a question
 */
export interface QuestionFeedback {
  evalLevel: 'correct' | 'partially_correct' | 'incorrect';
  score: number;
  feedback: string;
  format: 'markdown';
}

/**
 * Filter state for question search/filtering
 */
export interface FilterState {
  topics?: string[];
  subTopics?: string[];
  questionTypes?: QuestionType[];
  difficulty?: DifficultyLevel[];
  source?: {
    type: 'exam' | 'ezpass';
    year?: number;
    season?: 'spring' | 'summer';
    moed?: 'a' | 'b';
  };
}

export interface SaveQuestion {
  id: string;
  data?: Question;
  publication_status: PublicationStatusEnum;
  publication_metadata?: PublicationMetadata;
  review_status?: ReviewStatusEnum;
  review_metadata?: ReviewMetadata;
  validation_status?: ValidationStatus;
  ai_generated_fields?: AIGeneratedFields;
  import_info?: ImportInfo;
} 