import { 
  Question, 
  PublicationStatusEnum,
  PublicationMetadata,
  DatabaseQuestion as IDBQuestion, 
  QuestionListItem as IQuestionListItem,
  SaveQuestion as ISaveQuestion,
  ValidationStatus,
  QuestionType,
  isValidQuestionType,
  DEFAULT_QUESTION_TYPE,
  isValidDifficultyLevel,
  DEFAULT_DIFFICULTY_LEVEL,
  isValidSourceType,
  DEFAULT_SOURCE_TYPE,
  isValidCreatorType,
  DEFAULT_CREATOR_TYPE,
  DatabaseQuestion,
  ReviewStatusEnum,
  ReviewMetadata,
  AIGeneratedFields
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
  review_status: ReviewStatusEnum;
  review_metadata: ReviewMetadata | null;
  ai_generated_fields: AIGeneratedFields | null;
  created_at: string;
  updated_at: string;
}

interface QuestionStatistics {
  publication: {
    published: number;
    draft: number;
  };
  review: {
    pending: number;
    total: number;
  };
  validation: {
    error: number;
    warning: number;
    valid: number;
  };
}

export class QuestionStorage implements QuestionRepository {
  private questionsCache: Map<string, IDBQuestion> = new Map();
  private initialized: boolean = false;

  /**
   * Validates and normalizes question data
   * Ensures all required fields are present and valid
   * Sets default values for invalid fields
   * @throws {Error} if question data is invalid
   */
  private validateQuestionData(questionData: any): asserts questionData is Question {
    const validationChanges: Array<{field: string, originalValue: any, newValue: any}> = [];

    if (!questionData?.metadata) {
      throw new Error('Question metadata is required');
    }

    // Validate question type
    if (!questionData.metadata.type) {
      throw new Error('Question type is required');
    }
    
    if (!isValidQuestionType(questionData.metadata.type)) {
      validationChanges.push({
        field: 'type',
        originalValue: questionData.metadata.type,
        newValue: DEFAULT_QUESTION_TYPE
      });
      logger.warn('Invalid question type detected', {
        questionId: questionData.id,
        originalType: questionData.metadata.type,
        defaultedTo: DEFAULT_QUESTION_TYPE,
        validTypes: Object.values(QuestionType)
      });
      questionData.metadata.type = DEFAULT_QUESTION_TYPE;
    }

    // Validate difficulty level
    if (!isValidDifficultyLevel(questionData.metadata.difficulty)) {
      validationChanges.push({
        field: 'difficulty',
        originalValue: questionData.metadata.difficulty,
        newValue: DEFAULT_DIFFICULTY_LEVEL
      });
      logger.warn('Invalid difficulty level detected', {
        questionId: questionData.id,
        originalDifficulty: questionData.metadata.difficulty,
        defaultedTo: DEFAULT_DIFFICULTY_LEVEL,
        validRange: '1-5'
      });
      questionData.metadata.difficulty = DEFAULT_DIFFICULTY_LEVEL;
    }

    // Validate source information
    if (!questionData.metadata.source) {
      validationChanges.push({
        field: 'source',
        originalValue: null,
        newValue: { type: DEFAULT_SOURCE_TYPE, creatorType: DEFAULT_CREATOR_TYPE }
      });
      logger.warn('Missing source information', {
        questionId: questionData.id,
        defaultedTo: { type: DEFAULT_SOURCE_TYPE, creatorType: DEFAULT_CREATOR_TYPE }
      });
      questionData.metadata.source = {
        type: DEFAULT_SOURCE_TYPE,
        creatorType: DEFAULT_CREATOR_TYPE
      };
    } else {
      // Validate source type
      if (!isValidSourceType(questionData.metadata.source.type)) {
        validationChanges.push({
          field: 'source.type',
          originalValue: questionData.metadata.source.type,
          newValue: DEFAULT_SOURCE_TYPE
        });
        logger.warn('Invalid source type detected', {
          questionId: questionData.id,
          originalSourceType: questionData.metadata.source.type,
          defaultedTo: DEFAULT_SOURCE_TYPE,
          validTypes: ['exam', 'ezpass']
        });
        questionData.metadata.source.type = DEFAULT_SOURCE_TYPE;
      }

      // Validate creator type for ezpass questions
      if (questionData.metadata.source.type === 'ezpass') {
        if (!isValidCreatorType(questionData.metadata.source.creatorType)) {
          validationChanges.push({
            field: 'source.creatorType',
            originalValue: questionData.metadata.source.creatorType,
            newValue: DEFAULT_CREATOR_TYPE
          });
          logger.warn('Invalid creator type detected for ezpass question', {
            questionId: questionData.id,
            originalCreatorType: questionData.metadata.source.creatorType,
            defaultedTo: DEFAULT_CREATOR_TYPE,
            validTypes: ['ai', 'human']
          });
          questionData.metadata.source.creatorType = DEFAULT_CREATOR_TYPE;
        }
      }
    }

    // Log all changes made during validation if any occurred
    if (validationChanges.length > 0) {
      logger.warn('Question data was modified during validation', {
        questionId: questionData.id,
        changes: validationChanges,
        timestamp: new Date().toISOString()
      });
    }

    // Validate required fields
    if (!questionData.metadata.topicId) {
      throw new Error('Topic ID is required');
    }

    if (!questionData.content?.text) {
      throw new Error('Question content is required');
    }

    // Validate answer structure based on question type
    if (!questionData.schoolAnswer) {
      throw new Error('Question schoolAnswer is required');
    }

    switch (questionData.metadata.type) {
      case QuestionType.MULTIPLE_CHOICE:
        if (!questionData.content.options?.length || questionData.content.options.length !== 4) {
          throw new Error('Multiple choice questions must have exactly 4 options');
        }
        if (!questionData.schoolAnswer.finalAnswer || questionData.schoolAnswer.finalAnswer.type !== 'multiple_choice') {
          throw new Error('Multiple choice questions must have a multiple choice answer');
        }
        break;

      case QuestionType.NUMERICAL:
        if (!questionData.schoolAnswer.finalAnswer || questionData.schoolAnswer.finalAnswer.type !== 'numerical') {
          throw new Error('Numerical questions must have a numerical answer');
        }
        break;

      case QuestionType.OPEN:
        if (!questionData.schoolAnswer.solution?.text) {
          logger.warn('Open question missing solution text', {
            questionId: questionData.id,
            impact: 'This may affect evaluation quality'
          });
        }
        break;
    }
  }

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
        // Validate and normalize the data
        this.validateQuestionData(row.data);

        const question: DatabaseQuestion = {
          ...row.data,
          id: row.id,
          publication_status: row.publication_status,
          publication_metadata: row.publication_metadata || undefined,
          validation_status: row.validation_status,
          review_status: row.review_status,
          review_metadata: row.review_metadata ? {
            reviewedAt: row.review_metadata.reviewedAt,
            reviewedBy: row.review_metadata.reviewedBy,
            comments: row.review_metadata.comments
          } : undefined,
          ai_generated_fields: row.ai_generated_fields || {
            fields: [],
            confidence: {},
            generatedAt: new Date().toISOString()
          },
          created_at: row.created_at,
          updated_at: row.updated_at
        };
        this.questionsCache.set(question.id, question);
      });

      console.log(`Loaded ${questions.length} questions from database`);
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize storage:', error);
      throw error;
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initializeStorage();
    }
  }

  async getAllQuestions(): Promise<IDBQuestion[]> {
    await this.ensureInitialized();
    return Array.from(this.questionsCache.values()).map(question => {
      // Ensure question type is properly cast to QuestionType enum
      const questionData = { ...question };
      questionData.metadata.type = questionData.metadata.type as QuestionType;
      return questionData;
    });
  }

  async getQuestionsList(): Promise<IQuestionListItem[]> {
    await this.ensureInitialized();
    return Array.from(this.questionsCache.values()).map(q => {
      // Ensure question type is properly cast to QuestionType enum
      const type = q.metadata.type as QuestionType;
      return {
        id: q.id,
        type,
        content: q.content.text,
        metadata: {
          difficulty: q.metadata.difficulty,
          topicId: q.metadata.topicId,
          type,
          estimatedTime: q.metadata.estimatedTime
        },
        publication_status: q.publication_status,
        publication_metadata: q.publication_metadata,
        validation_status: q.validation_status || ValidationStatus.VALID,
        created_at: q.created_at as string
      };
    });
  }

  async getQuestion(id: string, bypassCache: boolean = false): Promise<IDBQuestion | null> {
    try {
      // If not bypassing cache and question exists in cache, return it
      if (!bypassCache && this.questionsCache.has(id)) {
        return this.questionsCache.get(id) || null;
      }

      const supabase = getSupabase();
      if (!supabase) throw new Error('Supabase client not initialized');

      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        logger.error('Error fetching question:', { id, error });
        return null;
      }

      if (!data) return null;

      // Validate and normalize the data
      this.validateQuestionData(data.data);

      // Create base question without review_metadata
      const baseQuestion = {
        ...data.data,
        id: data.id,
        publication_status: data.publication_status,
        publication_metadata: data.publication_metadata || undefined,
        validation_status: data.validation_status,
        review_status: data.review_status,
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      // Add review_metadata only if it exists with required fields
      const question: IDBQuestion = {
        ...baseQuestion,
        review_metadata: data.review_metadata?.reviewedAt && data.review_metadata?.reviewedBy ? {
          reviewedAt: data.review_metadata.reviewedAt,
          reviewedBy: data.review_metadata.reviewedBy,
          comments: data.review_metadata.comments
        } : undefined
      };

      // Update cache with fresh data
      this.questionsCache.set(id, question);

      return question;
    } catch (error) {
      logger.error('Error fetching question:', { id, error });
      throw error;
    }
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

      const supabaseClient = getSupabase();
      if (!supabaseClient) throw new Error('Supabase client not initialized');

      // Build update object with only provided fields
      const updateData: Record<string, any> = { id: question.id };
      
      // Only include fields that were provided
      if ('data' in question && question.data) updateData.data = question.data;
      if ('publication_status' in question) updateData.publication_status = question.publication_status;
      if ('publication_metadata' in question) updateData.publication_metadata = question.publication_metadata;
      if ('validation_status' in question) updateData.validation_status = question.validation_status;
      if ('review_status' in question) updateData.review_status = question.review_status;
      if ('review_metadata' in question) updateData.review_metadata = question.review_metadata;
      
      // Use COALESCE to preserve existing values for fields not provided
      const { error } = await supabaseClient.rpc('update_question_partial', {
        p_id: question.id,
        p_data: updateData
      });

      if (error) {
        logger.error('Failed to save question to database:', {
          questionId: question.id,
          error: error.message
        });
        throw error;
      }
    } catch (error) {
      logger.error('Failed to save question:', error);
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

  async getQuestionStatistics(): Promise<QuestionStatistics> {
    const supabaseClient = getSupabase();
    if (!supabaseClient) throw new Error('Supabase client not initialized');

    const { data: questions, error } = await supabaseClient
      .from('questions')
      .select('publication_status, review_status, validation_status');

    if (error) {
      console.error('Failed to load question statistics:', error);
      throw error;
    }

    const stats: QuestionStatistics = {
      publication: {
        published: 0,
        draft: 0
      },
      review: {
        pending: 0,
        total: 0
      },
      validation: {
        error: 0,
        warning: 0,
        valid: 0
      }
    };

    questions?.forEach(q => {
      // Publication stats
      if (q.publication_status === PublicationStatusEnum.PUBLISHED) {
        stats.publication.published++;
      } else {
        stats.publication.draft++;
      }

      // Review stats
      if (q.review_status === 'PENDING_REVIEW') {
        stats.review.pending++;
      }
      stats.review.total++;

      // Validation stats
      switch (q.validation_status) {
        case ValidationStatus.ERROR:
          stats.validation.error++;
          break;
        case ValidationStatus.WARNING:
          stats.validation.warning++;
          break;
        case ValidationStatus.VALID:
          stats.validation.valid++;
          break;
      }
    });

    return stats;
  }
}

export const questionStorage = new QuestionStorage(); 