import { supabase } from '../lib/supabase';
import { Question, QuestionType } from '../types/question';
import { PrepStateManager } from '../services/PrepStateManager';
import { logger } from '../utils/logger';

interface QueryParams {
  subject: string;
  domain: string;
}

interface QuestionMetadata {
  id: string;
  subject: string;
  domain: string;
  subtopicId: string;
  type: QuestionType;
  metadata: {
    subtopicId: string;
    type: QuestionType;
  };
}

export class QuestionSequencer {
  private static instance: QuestionSequencer;
  private questions: QuestionMetadata[] = [];
  private currentIndex: number = -1;
  private prepId: string | null = null;

  private constructor() {}

  public static getInstance(): QuestionSequencer {
    if (!QuestionSequencer.instance) {
      QuestionSequencer.instance = new QuestionSequencer();
    }
    return QuestionSequencer.instance;
  }

  public async initialize(params: QueryParams, prepId: string): Promise<string | null> {
    try {
      if (!supabase) {
        logger.error('Supabase client not initialized');
        return null;
      }

      this.prepId = prepId;

      // Get current focus from PrepStateManager
      const prep = PrepStateManager.getPrep(prepId);
      if (!prep) {
        logger.error('Prep not found', { prepId });
        return null;
      }

      logger.debug('Initializing question sequence with params:', { 
        subject: params.subject,
        domain: params.domain,
        focusedSubTopic: prep.focusedSubTopic,
        focusedType: prep.focusedType
      });

      // Build query with required filters
      let query = supabase
        .from('questions')
        .select('*')
        .eq('publication_status', 'published')
        .eq('data->metadata->>subjectId', params.subject)
        .eq('data->metadata->>domainId', params.domain);

      // Add optional filters only if they have values
      if (prep.focusedSubTopic) {
        query = query.eq('data->metadata->>subtopicId', prep.focusedSubTopic);
      }
      if (prep.focusedType) {
        query = query.eq('data->metadata->>type', prep.focusedType);
      }

      // Get filtered sequence of questions
      const { data: questions, error } = await query.limit(10);

      if (error) {
        logger.error(`Failed to fetch questions: ${error.message}`, {
          queryParams: {
            subject: params.subject,
            domain: params.domain,
            focusedSubTopic: prep.focusedSubTopic,
            focusedType: prep.focusedType
          }
        });
        return null;
      }

      if (!questions || questions.length === 0) {
        logger.error('No questions available for given criteria', {
          queryParams: {
            subject: params.subject,
            domain: params.domain,
            focusedSubTopic: prep.focusedSubTopic,
            focusedType: prep.focusedType
          }
        });
        return null;
      }

      this.questions = questions;
      this.currentIndex = 0;
      
      logger.debug('Started new question sequence', { 
        params,
        focusedSubTopic: prep.focusedSubTopic,
        focusedType: prep.focusedType,
        count: questions.length,
        firstQuestionId: questions[0].id,
        firstQuestion: questions[0]
      });

      return questions[0].id;
    } catch (error) {
      logger.error('Error initializing question sequence:', error);
      return null;
    }
  }

  private async refreshQuestionsIfFocusChanged(): Promise<void> {
    if (!this.prepId) return;

    const prep = PrepStateManager.getPrep(this.prepId);
    if (!prep) return;

    // Check if current questions match the focus
    const currentQuestion = this.questions[this.currentIndex];
    if (!currentQuestion) return;

    const focusChanged = (prep.focusedSubTopic && currentQuestion.metadata.subtopicId !== prep.focusedSubTopic) ||
                        (prep.focusedType && currentQuestion.metadata.type !== prep.focusedType);

    if (focusChanged) {
      // Re-initialize with same base params but new focus
      await this.initialize({ 
        subject: currentQuestion.subject, 
        domain: currentQuestion.domain 
      }, this.prepId);
    }
  }

  public async getCurrentId(): Promise<string | null> {
    await this.refreshQuestionsIfFocusChanged();
    
    if (this.currentIndex === -1 || this.questions.length === 0) {
      return null;
    }
    return this.questions[this.currentIndex].id;
  }

  public async next(): Promise<string | null> {
    await this.refreshQuestionsIfFocusChanged();

    if (this.questions.length === 0) {
      return null;
    }

    const oldIndex = this.currentIndex;
    this.currentIndex = (this.currentIndex + 1) % this.questions.length;
    const nextId = this.questions[this.currentIndex].id;
    
    logger.debug('Advanced to next question', { 
      oldIndex,
      newIndex: this.currentIndex,
      position: this.currentIndex + 1,
      total: this.questions.length,
      questionId: nextId,
      questionIds: this.questions.map(q => q.id)
    });

    return nextId;
  }

  public async previous(): Promise<string | null> {
    await this.refreshQuestionsIfFocusChanged();

    if (this.questions.length === 0) {
      return null;
    }

    this.currentIndex = this.currentIndex <= 0 
      ? this.questions.length - 1 
      : this.currentIndex - 1;

    const prevId = this.questions[this.currentIndex].id;
    
    logger.debug('Moved to previous question', { 
      position: this.currentIndex + 1,
      total: this.questions.length,
      questionId: prevId
    });

    return prevId;
  }

  public reset(): void {
    this.questions = [];
    this.currentIndex = -1;
    this.prepId = null;
    logger.debug('Reset question sequence');
  }

  public getProgress(): { current: number; total: number } {
    return {
      current: this.currentIndex + 1,
      total: this.questions.length
    };
  }
} 