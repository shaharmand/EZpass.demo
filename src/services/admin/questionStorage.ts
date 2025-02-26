import { 
  Question, 
  QuestionStatus, 
  DatabaseQuestion, 
  QuestionListItem 
} from '../../types/question';
import { supabase } from '../../lib/supabase';
import { QuestionIdGenerator } from '../../utils/questionIdGenerator';
import { logger } from '../../utils/logger';

interface DomainIndex {
  questionIds: string[];
}

interface DomainQuestions {
  domain: string;
  questions: Question[];
}

interface QuestionFilters {
  subject?: string;
  domain?: string;
  topic?: string;
  type?: string;
  difficulty?: number;
  searchText?: string;
}

class QuestionStorageService {
  private questionsCache: Map<string, DatabaseQuestion> = new Map();
  private initialized: boolean = false;

  /**
   * Initialize storage by loading all questions from database
   */
  private async initializeStorage(): Promise<void> {
    if (this.initialized) return;

    try {
      const { data: questions, error } = await supabase
        .from('questions')
        .select('*');

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
          ...row.data as Question,
          status: row.status,
          createdAt: row.created_at,
          updatedAt: row.updated_at
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
      createdAt: q.createdAt
    }));
  }

  /**
   * Get a single question by ID from database
   */
  async getQuestion(questionId: string): Promise<DatabaseQuestion | null> {
    await this.ensureInitialized();
    return this.questionsCache.get(questionId) || null;
  }

  /**
   * Save a single question to database
   */
  async saveQuestion(question: Question, status: QuestionStatus = 'draft'): Promise<void> {
    await this.ensureInitialized();
    
    // Validate question
    this.validateQuestion(question);

    try {
      logger.info('Saving question to database:', {
        id: question.id,
        type: question.type,
        status,
        metadata: {
          subjectId: question.metadata.subjectId,
          domainId: question.metadata.domainId,
          topicId: question.metadata.topicId,
          difficulty: question.metadata.difficulty
        }
      });

      // First validate the status is one of the allowed enum values
      if (!['imported', 'generated', 'draft', 'approved'].includes(status)) {
        throw new Error(`Invalid status: ${status}. Must be one of: imported, generated, draft, approved`);
      }

      // Prepare the data to be saved
      const questionData = {
        id: question.id,
        data: question,
        status: status
      };

      logger.info('Prepared question data for save:', {
        id: questionData.id,
        status: questionData.status,
        dataSize: JSON.stringify(questionData.data).length
      });

      const { data, error } = await supabase
        .from('questions')
        .upsert(questionData)
        .select('*, created_at, updated_at')
        .single();

      if (error) {
        logger.error('Supabase error while saving question:', {
          error: {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          },
          questionData: {
            id: question.id,
            status: status
          }
        });
        throw error;
      }

      // Update cache
      const dbQuestion: DatabaseQuestion = {
        ...question,
        status: data.status,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
      this.questionsCache.set(question.id, dbQuestion);

      logger.info('Successfully saved question:', {
        id: question.id,
        status: data.status,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        cacheSize: this.questionsCache.size
      });
    } catch (error) {
      // Log the full error details
      logger.error('Failed to save question:', {
        id: question.id,
        error: error instanceof Error ? {
          message: error.message,
          name: error.name,
          stack: error.stack,
          cause: error.cause
        } : error,
        questionData: {
          id: question.id,
          type: question.type,
          status: status,
          hasContent: Boolean(question.content),
          hasMetadata: Boolean(question.metadata),
          hasSolution: Boolean(question.solution)
        }
      });
      
      // Throw a more descriptive error
      if (error instanceof Error) {
        throw new Error(`Failed to save question to database: ${error.message}`);
      } else {
        throw new Error('Failed to save question to database: Unknown error');
      }
    }
  }

  /**
   * Update question status
   */
  async updateQuestionStatus(questionId: string, newStatus: QuestionStatus): Promise<void> {
    await this.ensureInitialized();

    try {
      const { error } = await supabase
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
      const { error } = await supabase
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
   * Validate question structure
   */
  private validateQuestion(question: Question): void {
    if (!question.id || !question.type || !question.content || !question.metadata || !question.solution) {
      throw new Error('Invalid question format');
    }
  }

  /**
   * Get questions with filters applied at the database level
   */
  async getFilteredQuestions(filters: QuestionFilters): Promise<DatabaseQuestion[]> {
    try {
      let query = supabase
        .from('questions')
        .select('*');

      // Apply filters using Postgres JSON operators
      if (filters.topic) {
        query = query.eq('data->>metadata->topicId', filters.topic);
      }
      
      if (filters.type) {
        query = query.eq('data->type', filters.type);
      }

      if (filters.difficulty) {
        query = query.eq('data->metadata->difficulty', filters.difficulty);
      }

      if (filters.searchText) {
        query = query.or(`data->content->text.ilike.%${filters.searchText}%,id.ilike.%${filters.searchText}%`);
      }

      const { data: questions, error } = await query;

      if (error) {
        console.error('Failed to fetch filtered questions:', error);
        throw error;
      }

      // Transform to DatabaseQuestion format
      return questions.map(row => ({
        ...row.data as Question,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));

    } catch (error) {
      console.error('Error in getFilteredQuestions:', error);
      throw new Error('Failed to fetch filtered questions');
    }
  }
}

export const questionStorage = new QuestionStorageService(); 