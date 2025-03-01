import { 
  Question, 
  QuestionStatus, 
  DatabaseQuestion as IDBQuestion, 
  QuestionListItem as IQuestionListItem,
  SaveQuestion as ISaveQuestion,
  ValidationStatus
} from '../../types/question';
import { DatabaseOperation, QuestionRepository } from '../../types/storage';
import { getSupabase } from '../supabaseClient';
import { logger } from '../../utils/logger';
import { validateQuestion } from '../../utils/questionValidator';
import { getSubjectCode, getDomainCode } from '../../utils/idGenerator';
import { universalTopicsV2 } from '../universalTopics';

interface DomainIndex {
  questionIds: string[];
}

interface DomainQuestions {
  domain: string;
  questions: Question[];
}

// For filtering, we allow multiple statuses (OR condition)
interface QuestionFilters {
  subject?: string;
  domain?: string;
  topic?: string;
  type?: string;
  difficulty?: number;
  searchText?: string;
  dateRange?: {
    start?: Date;
    end?: Date;
  };
  sortBy?: 'created_at' | 'updated_at';
  sortOrder?: 'asc' | 'desc';
  validationStatus?: ValidationStatus | null;
  subtopic?: string;
  status?: QuestionStatus | null;
}

interface DatabaseRow {
  id: string;
  data: Question;
  status: QuestionStatus;
  validation_status: ValidationStatus;  // Single status in DB
  created_at: string;
  updated_at: string;
}

// Update QuestionListItem to match schema
interface QuestionListItem {
    id: string;
    type: string;
    content: string;
    metadata: {
        difficulty: string;
        topicId: string;
        estimatedTime?: number;
    };
    status: QuestionStatus;
    validation_status: ValidationStatus;  // Changed from validationStatus
    created_at: string;    // Changed from createdAt
}

// Update DatabaseQuestion to match schema
interface DatabaseQuestion extends Question {
    status: QuestionStatus;
    validation_status: ValidationStatus;  // Changed from validationStatus
    created_at: string;    // Changed from createdAt
    updated_at: string;    // Changed from updatedAt
    import_info?: {
        system?: string;
        originalId?: string | number;
        importedAt?: string;
        [key: string]: any;
    };
}

// Update SaveQuestion to include validationStatus
interface SaveQuestion extends Question {
  status: QuestionStatus;
  validationStatus?: ValidationStatus;  // Optional since computed internally, but always single status
}

export class QuestionStorage implements QuestionRepository {
  private questionsCache: Map<string, DatabaseQuestion> = new Map();
  private initialized: boolean = false;

  /**
   * Initialize storage by loading all questions from database
   */
  private async initializeStorage(): Promise<void> {
    if (this.initialized) return;

    try {
      const supabaseClient = getSupabase();
      if (!supabaseClient) throw new Error('Supabase client not initialized');

      const { data: questions, error } = await supabaseClient
        .from('questions')
        .select('*') as { data: DatabaseRow[] | null, error: any };

      if (error) {
        console.error('Failed to load questions from database:', error);
        throw error;
      }

      if (!questions) {
        console.warn('No questions found in database');
        this.questionsCache.clear();
        this.initialized = true;
        return;
      }

      // Clear existing cache and update with questions from database
      this.questionsCache.clear();
      questions.forEach(row => {
        const question: DatabaseQuestion = {
          // Question fields from data
          content: row.data.content,
          correctOption: row.data.correctOption,
          id: row.data.id,
          metadata: row.data.metadata,
          options: row.data.options,
          solution: row.data.solution,
          type: row.data.type,
          // Database specific fields
          status: row.status,
          validation_status: row.validation_status,
          created_at: row.created_at,
          updated_at: row.updated_at
        };
        this.questionsCache.set(question.id, question);
      });

      console.log(`Loaded ${questions.length} questions from database`);
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize question storage:', error);
      throw new Error('Failed to initialize question storage from database');
    }
  }

  /**
   * Ensure storage is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initializeStorage();
    }
  }

  /**
   * Get all questions from database
   */
  async getAllQuestions(): Promise<DatabaseQuestion[]> {
    await this.ensureInitialized();
    return Array.from(this.questionsCache.values());
  }

  /**
   * Get questions in list view format
   */
  async getQuestionsList(): Promise<QuestionListItem[]> {
    await this.ensureInitialized();
    return Array.from(this.questionsCache.values()).map(q => ({
      id: q.id,
      type: q.type,
      content: q.content.text,
      metadata: {
        difficulty: q.metadata.difficulty.toString(),
        topicId: q.metadata.topicId,
        estimatedTime: q.metadata.estimatedTime || 0
      },
      status: q.status,
      validation_status: q.validation_status || ValidationStatus.Valid,
      created_at: q.created_at as string
    }));
  }

  /**
   * Get a single question by ID from database
   */
  async getQuestion(id: string): Promise<DatabaseQuestion | null> {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase client not initialized');

    const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching question:', error);
        return null;
    }

    if (!data) return null;

    // Ensure we return a properly typed DatabaseQuestion
    return {
        ...data.data,  // spread the question data
        id: data.id,
        status: data.status as QuestionStatus,
        validation_status: data.validation_status,
        import_info: data.import_info,
        created_at: data.created_at,
        updated_at: data.updated_at
    };
  }

  /**
   * Save a single question to database
   */
  async saveQuestion(question: SaveQuestion, isDryRun: boolean = false): Promise<void> {
    try {
      // Prevent saving test questions
      if (question.id.startsWith('test_')) {
        logger.warn('Attempted to save test question - skipping', {
          questionId: question.id
        });
        return;
      }

      // If in dry run mode, skip all database operations
      if (isDryRun) {
        logger.debug('Dry run mode - skipping database save', {
          questionId: question.id
        });
        return;
      }

      // Always validate the question and compute validation status, regardless of what was passed in
      const validationResult = validateQuestion(question);
      
      // Determine validation status based on errors and warnings
      const validationStatus: ValidationStatus = validationResult.errors.length > 0 
        ? ValidationStatus.Error 
        : validationResult.warnings.length > 0 
          ? ValidationStatus.Warning 
          : ValidationStatus.Valid;

      // In live mode, just try to upsert directly without checking existence first
      const supabaseClient = getSupabase();
      if (!supabaseClient) throw new Error('Supabase client not initialized');

      const { error } = await supabaseClient
        .from('questions')
        .upsert({
          id: question.id,
          data: question,
          status: question.status || 'draft',
          validation_status: validationStatus, // Always use computed validation status
          updated_at: new Date().toISOString(),
          import_info: question.importInfo || {
            system: 'ezpass',
            originalId: question.id,
            importedAt: new Date().toISOString(),
            importedBy: 'admin-ui'
          }
        });

      if (error) {
        logger.error('Failed to save question to database', {
          questionId: question.id,
          error: error.message
        });
        throw error;
      }

      logger.debug('Successfully saved question', {
        questionId: question.id,
        status: question.status,
        validationStatus
      });

    } catch (error) {
      logger.error('Failed to save question', {
        questionId: question.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Save multiple questions (for imports)
   */
  async saveQuestions(questions: SaveQuestion[]): Promise<void> {
    await Promise.all(questions.map(q => this.saveQuestion(q)));
  }

  /**
   * Update question status
   */
  async updateQuestionStatus(questionId: string, newStatus: QuestionStatus): Promise<void> {
    await this.ensureInitialized();

    try {
      const supabaseClient = getSupabase();
      if (!supabaseClient) throw new Error('Supabase client not initialized');

      const { error } = await supabaseClient
        .from('questions')
        .update({ status: newStatus })
        .eq('id', questionId);

      if (error) throw error;

      // Update cache
      const question = this.questionsCache.get(questionId);
      if (question) {
        question.status = newStatus;
        this.questionsCache.set(questionId, question);
      }

      console.log(`Updated status of question ${questionId} to ${newStatus}`);
    } catch (error) {
      console.error('Failed to update question status:', error);
      throw new Error('Failed to update question status');
    }
  }

  /**
   * Delete a question from database
   */
  async deleteQuestion(questionId: string): Promise<void> {
    await this.ensureInitialized();

    try {
      const supabaseClient = getSupabase();
      if (!supabaseClient) throw new Error('Supabase client not initialized');

      const { error } = await supabaseClient
        .from('questions')
        .delete()
        .eq('id', questionId);

      if (error) throw error;

      // Remove from cache
      this.questionsCache.delete(questionId);
      console.log(`Deleted question ${questionId} from database`);
    } catch (error) {
      console.error('Failed to delete question:', error);
      throw new Error('Failed to delete question from database');
    }
  }

  /**
   * Get questions with filters applied at the database level
   */
  async getFilteredQuestions(filters: QuestionFilters): Promise<DatabaseQuestion[]> {
    try {
      const supabaseClient = getSupabase();
      if (!supabaseClient) throw new Error('Supabase client not initialized');

      console.log('Starting getFilteredQuestions with filters:', filters);

      let query = supabaseClient
        .from('questions')
        .select('*');

      // Log the initial query
      console.log('Initial query:', query);

      // Apply filters using Postgres JSON operators
      if (filters.type) {
        query = query.eq('data->>type', filters.type);
      }
      
      // Add status filtering
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      
      // Handle topic hierarchy filtering
      if (filters.subject || filters.domain || filters.topic) {
        console.log('Filtering by hierarchy:', {
          subject: filters.subject,
          domain: filters.domain,
          topic: filters.topic,
          subtopic: filters.subtopic
        });

        // Build filters for each level of the hierarchy
        if (filters.subject) {
          query = query.eq('data->metadata->>subjectId', filters.subject);
        }
        
        if (filters.domain) {
          query = query.eq('data->metadata->>domainId', filters.domain);
        }
        
        if (filters.topic) {
          query = query.eq('data->metadata->>topicId', filters.topic);
        }

        if (filters.subtopic) {
          query = query.eq('data->metadata->>subtopicId', filters.subtopic);
        }
      }

      if (filters.difficulty) {
        query = query.eq('data->metadata->>difficulty', filters.difficulty);
      }

      if (filters.searchText) {
        query = query.or(`data->content->>text.ilike.%${filters.searchText}%,id.ilike.%${filters.searchText}%`);
      }

      // Add date range filtering if provided
      if (filters.dateRange?.start) {
        query = query.gte('created_at', filters.dateRange.start.toISOString());
      }
      if (filters.dateRange?.end) {
        query = query.lte('created_at', filters.dateRange.end.toISOString());
      }

      // Add sorting
      if (filters.sortBy) {
        query = query.order(filters.sortBy, { 
          ascending: filters.sortOrder === 'asc'
        });
      } else {
        // Default sort by created_at desc
        query = query.order('created_at', { ascending: false });
      }

      // Add validation status filter
      if (filters.validationStatus) {
        query = query.eq('validation_status', filters.validationStatus);
      }

      console.log('Final query:', query);

      // Execute query and get results
      const { data: questions, error } = await query;

      console.log('Query results:', {
        success: !error,
        error: error,
        questionCount: questions?.length || 0,
        firstQuestion: questions?.[0]
      });

      if (error) {
        console.error('Failed to fetch filtered questions:', {
          error,
          filters
        });
        throw error;
      }

      if (!questions) {
        console.log('No questions found for filters:', filters);
        return [];
      }

      // Transform to DatabaseQuestion format with proper type assertions
      const transformedQuestions = questions.map(row => ({
        content: row.data.content,
        correctOption: row.data.correctOption,
        id: row.data.id,
        metadata: row.data.metadata,
        options: row.data.options,
        solution: row.data.solution,
        type: row.data.type,
        status: row.status as QuestionStatus,
        validation_status: row.validation_status as ValidationStatus,
        created_at: row.created_at as string,
        updated_at: row.updated_at as string
      }));

      console.log('Transformed questions:', {
        count: transformedQuestions.length,
        firstQuestion: transformedQuestions[0]
      });

      return transformedQuestions;

    } catch (error) {
      console.error('Error in getFilteredQuestions:', {
        error,
        filters,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error('Failed to fetch filtered questions');
    }
  }

  /**
   * Get next available sequential ID for a question
   * Always returns a 6-digit number
   */
  async getNextQuestionId(subjectCode: string, domainCode: string): Promise<number> {
    try {
      const supabaseClient = getSupabase();
      if (!supabaseClient) throw new Error('Supabase client not initialized');

      // Create the prefix with both subject and domain codes
      const prefix = `${subjectCode}-${domainCode}-`;

      // Get the highest existing ID for this format
      const { data, error } = await supabaseClient
        .from('questions')
        .select('id')
        .ilike('id', `${prefix}%`)
        .order('id', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // Ignore "no rows returned" error
        throw new Error(`Failed to get next question ID: ${error.message}`);
      }

      // If no questions exist or no data returned, start from 1
      if (!data) {
        return 1;
      }

      // Extract the numeric part from the last ID (format: XXX-YYY-NNNNNN)
      const lastId = data.id;
      const match = lastId.match(/^.*-(\d+)$/);
      
      if (!match) {
        throw new Error(`Invalid ID format in database: ${lastId}`);
      }

      const lastNumber = parseInt(match[1]);
      const nextNumber = lastNumber + 1;

      // Ensure we always return a 6-digit number
      if (nextNumber >= 1000000) {
        throw new Error('Question ID sequence exceeded 6 digits');
      }

      return nextNumber;
    } catch (error) {
      if (error instanceof Error && error.message.includes('no rows')) {
        return 1; // Start from 1 if no questions exist
      }
      
      logger.error('Failed to generate next question ID', {
        error: error instanceof Error ? error.message : 'Unknown error',
        subjectCode,
        domainCode
      });
      throw error;
    }
  }

  /**
   * Update question validation status
   */
  async updateValidationStatus(questionId: string, validationStatus: ValidationStatus): Promise<void> {
    await this.ensureInitialized();

    try {
      const supabaseClient = getSupabase();
      if (!supabaseClient) throw new Error('Supabase client not initialized');

      const { error } = await supabaseClient
        .from('questions')
        .update({ validation_status: validationStatus })
        .eq('id', questionId);

      if (error) throw error;

      // Update cache
      const question = this.questionsCache.get(questionId);
      if (question) {
        question.validation_status = validationStatus;
        this.questionsCache.set(questionId, question);
      }

      logger.info(`Updated validation status of question ${questionId} to ${validationStatus}`);
    } catch (error) {
      logger.error('Failed to update question validation status:', error);
      throw new Error('Failed to update question validation status');
    }
  }

  /**
   * Get questions that need attention (have warnings or errors)
   */
  async getQuestionsNeedingAttention(): Promise<DatabaseQuestion[]> {
    const filters: QuestionFilters = {
      validationStatus: ValidationStatus.Warning
    };
    return this.getFilteredQuestions(filters);
  }

  // Update getQuestions to use our local interface
  async getQuestions(): Promise<DatabaseQuestion[]> {
    return this.getAllQuestions();
  }
}

// Fix the export to use the correct class name
export const questionStorage = new QuestionStorage();

export async function saveQuestion(question: Question): Promise<Question> {
  const supabaseClient = getSupabase();
  if (!supabaseClient) {
    throw new Error('Supabase client not initialized');
  }
  
  // First validate the question
  const validationResult = await validateQuestion(question);
  
  // Determine validation status based on errors and warnings
  const validationStatus: ValidationStatus = validationResult.errors.length > 0 
    ? ValidationStatus.Error 
    : validationResult.warnings.length > 0 
      ? ValidationStatus.Warning 
      : ValidationStatus.Valid;

  // Log validation results
  if (validationResult.warnings.length > 0 || validationResult.errors.length > 0) {
    logger.info('Question validation results:', {
      questionId: question.id,
      validationStatus,
      warnings: validationResult.warnings,
      errors: validationResult.errors
    });
  }

  // Save to database with validation status
  const { data, error } = await supabaseClient
    .from('questions')
    .upsert({
      id: question.id,
      data: question,
      validation_status: validationStatus,
      updated_at: new Date().toISOString()
    });

  if (error) {
    logger.error('Failed to save question:', error);
    throw error;
  }

  return question;
}

// Also update the bulk save for imports
export async function saveQuestions(questions: Question[]): Promise<Question[]> {
  // Filter out test questions
  const filteredQuestions = questions.filter(q => !q.id.startsWith('test_'));
  
  if (filteredQuestions.length < questions.length) {
    logger.warn('Filtered out test questions from bulk save', {
      originalCount: questions.length,
      filteredCount: filteredQuestions.length,
      skippedCount: questions.length - filteredQuestions.length
    });
  }

  if (filteredQuestions.length === 0) {
    return [];
  }

  const results = await Promise.all(filteredQuestions.map(async (question) => {
    const validationResult = await validateQuestion(question);
    
    let validationStatus: 'valid' | 'warning' | 'error' = 'valid';
    if (validationResult.errors.length > 0) {
      validationStatus = 'error';
    } else if (validationResult.warnings.length > 0) {
      validationStatus = 'warning';
    }

    return {
      id: question.id,
      data: question,
      validation_status: validationStatus,
      updated_at: new Date().toISOString()
    };
  }));

  // Bulk insert with validation status
  const { data, error } = await getSupabase()
    .from('questions')
    .upsert(results);

  if (error) {
    logger.error('Failed to save questions:', error);
    throw error;
  }

  return filteredQuestions;
} 