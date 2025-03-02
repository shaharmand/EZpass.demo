import { 
  Question, 
  SaveQuestion, 
  DatabaseQuestion, 
  PublicationStatusEnum,
  PublicationMetadata
} from './question';

/**
 * Type for the database insert/update operation
 * Matches the actual database schema structure
 */
export interface DatabaseOperation {
  id: string;
  data: Omit<Question, 'id'>;
  publication_status: PublicationStatusEnum;
  publication_metadata?: PublicationMetadata;
  created_at?: string;
  updated_at?: string;
}

/**
 * Repository interface for question storage operations
 */
export interface QuestionRepository {
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