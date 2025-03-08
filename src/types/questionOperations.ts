import { DifficultyLevel, QuestionType, Question, ValidationStatus, PublicationStatusEnum } from './question';
import { TopicReference } from './questionGeneration';

/**
 * Parameters for fetching existing questions from storage
 */
export interface QuestionFetchParams {
  // Core filters
  topicId?: string;
  subtopicId?: string;
  type?: QuestionType;
  difficulty?: DifficultyLevel;
  
  // Time range filter
  estimatedTimeRange?: {
    min: number;
    max: number;
  };
  
  // Status filters
  status?: PublicationStatusEnum;
  validationStatus?: ValidationStatus;
  
  // Pagination
  page?: number;
  limit?: number;
  
  // Sorting
  sortBy?: 'createdAt' | 'updatedAt' | 'difficulty' | 'estimatedTime';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Parameters for searching questions in storage
 */
export interface QuestionSearchParams {
  // Text search
  searchText?: string;
  
  // Filters same as fetch
  filters?: Partial<QuestionFetchParams>;
  
  // Search specific options
  matchAll?: boolean;  // Whether all search terms must match
  includeContent?: boolean;  // Whether to search in question content
  includeSolution?: boolean; // Whether to search in solutions
}

/**
 * Result of a question search operation
 */
export interface QuestionSearchResult {
  questions: Question[];
  total: number;
  page: number;
  hasMore: boolean;
  searchMetadata?: {
    matchedTerms: string[];
    searchScore: number;
  };
} 