import { 
  Question, 
  SaveQuestion, 
  DatabaseQuestion, 
  PublicationStatusEnum,
  PublicationMetadata,
  ValidationStatus,
  ReviewStatusEnum,
  ReviewMetadata,
  UpdateMetadata,
  AIGeneratedFields,
  QuestionType,
  DifficultyLevel,
  SourceType,
  EzpassCreatorType,
  MoedType
} from './question';
import { ImportInfo } from '../scripts/import/types/importTypes';

/**
 * Type for the database insert/update operation
 * Matches the actual database schema structure
 */
export interface DatabaseOperation {
  id: string;
  data: Omit<Question, 'id'>;
  publication_status: PublicationStatusEnum;
  publication_metadata?: PublicationMetadata;
  validation_status: ValidationStatus;
  review_status: ReviewStatusEnum;
  review_metadata?: ReviewMetadata;
  update_metadata?: UpdateMetadata;
  ai_generated_fields?: AIGeneratedFields;
  import_info?: ImportInfo;
  created_at?: string;
  updated_at?: string;
}

/**
 * Type for creating a new question
 * Contains only the essential fields needed for question creation
 */
export interface CreateQuestion {
  // The question data itself (can include an id if pre-generated)
  question: Partial<Pick<Question, 'id'>> & Omit<Question, 'id'>;
  
  // Source information - optional to track where the question came from
  import_info?: ImportInfo;
}

/**
 * Repository interface for question storage operations
 */
export interface QuestionRepository {
  /**
   * Creates a new question in the database.
   * @throws {Error} If question validation fails
   * @returns {Promise<DatabaseQuestion>} The created question with all database fields
   */
  createQuestion(question: CreateQuestion): Promise<DatabaseQuestion>;
  
  /**
   * Saves a question to the database.
   * If timestamps exist in the input, they will be used.
   * Otherwise, DB defaults will apply.
   * @throws {Error} If question validation fails
   */
  saveQuestion(question: SaveQuestion): Promise<void>;
  
  /**
   * Retrieves a single question by ID with full database information
   */
  getQuestion(id: string): Promise<DatabaseQuestion | null>;
  
  /**
   * Retrieves all questions with full database information
   */
  getQuestions(): Promise<DatabaseQuestion[]>;
  
  /**
   * Deletes a question by ID
   */
  deleteQuestion(id: string): Promise<void>;
}

export interface IQuestionListItem {
  id: string;
  title: string;
  content: string;
  metadata: {
    subjectId: string;
    domainId: string;
    topicId: string;
    subtopicId: string;
    type: QuestionType;
    difficulty: DifficultyLevel;
    estimatedTime?: number;
    source: 
      | { 
          type: SourceType.EXAM;
          examTemplateId: string;
          year: number;
          period?: string;
          moed?: MoedType;
          order?: number;
        }
      | {
          type: SourceType.EZPASS;
          creatorType: EzpassCreatorType;
        };
  };
  publication_status: PublicationStatusEnum;
  validation_status: ValidationStatus;
  created_at: string;
  updated_at: string;
} 