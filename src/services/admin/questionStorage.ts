import { 
  Question, 
  PublicationStatusEnum,
  PublicationMetadata,
  DatabaseQuestion as IDBQuestion, 
  QuestionListItem as IQuestionListItem,
  SaveQuestion as ISaveQuestion,
  ValidationStatus,
  QuestionType
} from '../../types/question';
import { DatabaseOperation, QuestionRepository } from '../../types/storage';
import { getSupabase } from '../supabaseClient';
import { logger } from '../../utils/logger';
import { validateQuestion } from '../../utils/questionValidator';
import { getSubjectCode, getDomainCode } from '../../utils/idGenerator';
import { universalTopicsV2 } from '../universalTopics';

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
  publicationStatus?: PublicationStatusEnum | null;
}

interface DatabaseRow {
  id: string;
  data: Question;
  publication_status: PublicationStatusEnum;
  publication_metadata: PublicationMetadata | null;
  validation_status: ValidationStatus;
  created_at: string;
  updated_at: string;
}

export class QuestionStorage implements QuestionRepository {
  private questionsCache: Map<string, IDBQuestion> = new Map();
  private initialized: boolean = false;

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
        const question: IDBQuestion = {
          ...row.data,
          id: row.id,
          publication_status: row.publication_status,
          publication_metadata: row.publication_metadata || undefined,
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

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initializeStorage();
    }
  }

  async getAllQuestions(): Promise<IDBQuestion[]> {
    await this.ensureInitialized();
    return Array.from(this.questionsCache.values());
  }

  async getQuestionsList(): Promise<IQuestionListItem[]> {
    await this.ensureInitialized();
    return Array.from(this.questionsCache.values()).map(q => ({
      id: q.id,
      type: q.metadata.type || QuestionType.MULTIPLE_CHOICE,
      content: q.content.text,
      metadata: {
        difficulty: q.metadata.difficulty,
        topicId: q.metadata.topicId,
        type: q.metadata.type || QuestionType.MULTIPLE_CHOICE,
        estimatedTime: q.metadata.estimatedTime
      },
      publication_status: q.publication_status,
      publication_metadata: q.publication_metadata,
      validation_status: q.validation_status || ValidationStatus.VALID,
      created_at: q.created_at as string
    }));
  }

  async getQuestion(id: string): Promise<IDBQuestion | null> {
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
      ...data.data,
      id: data.id,
      publication_status: data.publication_status,
      publication_metadata: data.publication_metadata || undefined,
      validation_status: data.validation_status,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  }

  async saveQuestion(question: ISaveQuestion): Promise<void> {
    try {
      // Prevent saving test questions
      if (question.id.startsWith('test_')) {
        logger.warn('Attempted to save test question - skipping', {
          questionId: question.id
        });
        return;
      }

      // Always validate the question and compute validation status
      const validationResult = validateQuestion(question);
      
      // Determine validation status based on errors and warnings
      const validationStatus: ValidationStatus = validationResult.errors.length > 0 
        ? ValidationStatus.ERROR 
        : validationResult.warnings.length > 0 
          ? ValidationStatus.WARNING 
          : ValidationStatus.VALID;

      // Save to database
      const supabaseClient = getSupabase();
      if (!supabaseClient) throw new Error('Supabase client not initialized');

      const { error } = await supabaseClient
        .from('questions')
        .upsert({
          id: question.id,
          data: question,
          publication_status: question.publication_status,
          publication_metadata: question.publication_metadata,
          validation_status: validationStatus,
          updated_at: new Date().toISOString(),
          import_info: {
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
        publication_status: question.publication_status,
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

  async saveQuestions(questions: ISaveQuestion[]): Promise<void> {
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
      return;
    }

    const operations = await Promise.all(filteredQuestions.map(async (question) => {
      const validationResult = await validateQuestion(question);
      
      let validationStatus: ValidationStatus;
      if (validationResult.errors.length > 0) {
        validationStatus = ValidationStatus.ERROR;
      } else if (validationResult.warnings.length > 0) {
        validationStatus = ValidationStatus.WARNING;
      } else {
        validationStatus = ValidationStatus.VALID;
      }

      return {
        id: question.id,
        data: question,
        publication_status: question.publication_status,
        publication_metadata: question.publication_metadata,
        validation_status: validationStatus,
        updated_at: new Date().toISOString()
      };
    }));

    // Bulk upsert
    const supabaseClient = getSupabase();
    if (!supabaseClient) throw new Error('Supabase client not initialized');

    const { error } = await supabaseClient
      .from('questions')
      .upsert(operations);

    if (error) {
      logger.error('Failed to bulk save questions:', error);
      throw error;
    }

    logger.debug('Successfully saved questions', {
      count: operations.length
    });
  }

  async updateQuestionStatus(questionId: string, newStatus: PublicationStatusEnum, metadata?: PublicationMetadata): Promise<void> {
    await this.ensureInitialized();

    try {
      const supabaseClient = getSupabase();
      if (!supabaseClient) throw new Error('Supabase client not initialized');

      const updateData: {
        publication_status: PublicationStatusEnum;
        publication_metadata?: PublicationMetadata | null;
      } = {
        publication_status: newStatus
      };

      // Add metadata for published/archived status
      if (newStatus === PublicationStatusEnum.PUBLISHED) {
        updateData.publication_metadata = {
          publishedAt: new Date().toISOString(),
          publishedBy: metadata?.publishedBy || 'admin' // TODO: Get actual user
        };
      } else if (newStatus === PublicationStatusEnum.ARCHIVED) {
        updateData.publication_metadata = {
          archivedAt: new Date().toISOString(),
          archivedBy: metadata?.archivedBy || 'admin', // TODO: Get actual user
          reason: metadata?.reason
        };
      } else {
        updateData.publication_metadata = null; // Clear metadata for draft
      }

      const { error } = await supabaseClient
        .from('questions')
        .update(updateData)
        .eq('id', questionId);

      if (error) throw error;

      // Update cache
      const question = this.questionsCache.get(questionId);
      if (question) {
        question.publication_status = newStatus;
        question.publication_metadata = updateData.publication_metadata || undefined;
        this.questionsCache.set(questionId, question);
      }

      console.log(`Updated status of question ${questionId} to ${newStatus}`);
    } catch (error) {
      console.error('Failed to update question status:', error);
      throw new Error('Failed to update question status');
    }
  }

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

  async getFilteredQuestions(filters: QuestionFilters): Promise<IDBQuestion[]> {
    try {
      const supabaseClient = getSupabase();
      if (!supabaseClient) throw new Error('Supabase client not initialized');

      let query = supabaseClient
        .from('questions')
        .select('*');

      // Apply filters
      if (filters.publicationStatus) {
        query = query.eq('publication_status', filters.publicationStatus);
      }

      if (filters.validationStatus) {
        query = query.eq('validation_status', filters.validationStatus);
      }

      // Handle topic hierarchy filtering
      if (filters.subject || filters.domain || filters.topic) {
        console.log('🔍 FILTER PARAMS:', {
          filters,
          timestamp: new Date().toISOString()
        });
        
        if (filters.subject) {
          query = query.eq('data->metadata->>subjectId', filters.subject);
        }
        
        if (filters.domain) {
          query = query.eq('data->metadata->>domainId', filters.domain);
        }
        
        if (filters.topic) {
          console.log('🔍 APPLYING TOPIC FILTER:', {
            topic: filters.topic,
            path: 'data->metadata->>topicId',
            timestamp: new Date().toISOString()
          });
          query = query.eq('data->metadata->>topicId', filters.topic);
        }

        if (filters.subtopic) {
          query = query.eq('data->metadata->>subtopicId', filters.subtopic);
        }
      }

      if (filters.type) {
        console.log('🔍 APPLYING TYPE FILTER:', {
          type: filters.type,
          path: 'data->metadata->>type',
          timestamp: new Date().toISOString()
        });
        query = query.eq('data->metadata->>type', filters.type);
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

      const { data: questions, error } = await query;

      if (error) throw error;

      if (!questions) return [];

      // Transform to DatabaseQuestion format
      return questions.map(row => ({
        ...row.data,
        id: row.id,
        publication_status: row.publication_status,
        publication_metadata: row.publication_metadata || undefined,
        validation_status: row.validation_status,
        created_at: row.created_at,
        updated_at: row.updated_at
      }));

    } catch (error) {
      console.error('Error in getFilteredQuestions:', error);
      throw new Error('Failed to fetch filtered questions');
    }
  }

  async getQuestionsNeedingAttention(): Promise<IDBQuestion[]> {
    const filters: QuestionFilters = {
      validationStatus: ValidationStatus.WARNING
    };
    return this.getFilteredQuestions(filters);
  }

  async getQuestions(): Promise<IDBQuestion[]> {
    return this.getAllQuestions();
  }

  async getNextQuestionId(subjectId: string, domainId: string): Promise<number> {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase client not initialized');

    // Get all questions for this subject and domain
    const { data: questions, error } = await supabase
      .from('questions')
      .select('id')
      .like('id', `${subjectId}-${domainId}-%`);

    if (error) {
      logger.error('Error getting next question ID:', error);
      throw error;
    }

    // If no questions exist, start from 1
    if (!questions || questions.length === 0) {
      return 1;
    }

    // Extract numbers from IDs and find max
    const numbers = questions.map(q => {
      const match = q.id.match(/-(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    });

    return Math.max(...numbers) + 1;
  }
}

export const questionStorage = new QuestionStorage(); 