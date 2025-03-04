import { supabase } from '../lib/supabase';
import { Question } from '../types/question';
import { logger } from '../utils/logger';

export class QuestionSetManager {
  private static instance: QuestionSetManager;
  private currentSet: Question[] = [];
  private currentIndex: number = -1;

  private constructor() {}

  public static getInstance(): QuestionSetManager {
    if (!QuestionSetManager.instance) {
      QuestionSetManager.instance = new QuestionSetManager();
    }
    return QuestionSetManager.instance;
  }

  public async initializeSet(): Promise<string | null> {
    try {
      if (!supabase) {
        logger.error('Supabase client not initialized');
        return null;
      }

      // Get initial set of questions
      const { data: questions, error } = await supabase
        .from('questions')
        .select('*')
        .eq('publication_status', 'published')
        .limit(10);

      if (error) {
        logger.error('Failed to fetch question set:', error);
        return null;
      }

      if (!questions || questions.length === 0) {
        logger.error('No questions available for set');
        return null;
      }

      this.currentSet = questions;
      this.currentIndex = 0;
      
      logger.debug('Initialized question set', { 
        setSize: questions.length,
        firstQuestionId: questions[0].id
      });

      return questions[0].id;
    } catch (error) {
      logger.error('Error initializing question set:', error);
      return null;
    }
  }

  public getCurrentQuestion(): string | null {
    if (this.currentIndex === -1 || this.currentSet.length === 0) {
      return null;
    }
    return this.currentSet[this.currentIndex].id;
  }

  public async moveToNext(): Promise<string | null> {
    if (this.currentSet.length === 0) {
      return null;
    }

    this.currentIndex = (this.currentIndex + 1) % this.currentSet.length;
    const nextId = this.currentSet[this.currentIndex].id;
    
    logger.debug('Moved to next question in set', { 
      index: this.currentIndex,
      questionId: nextId
    });

    return nextId;
  }

  public async moveToPrevious(): Promise<string | null> {
    if (this.currentSet.length === 0) {
      return null;
    }

    this.currentIndex = this.currentIndex <= 0 
      ? this.currentSet.length - 1 
      : this.currentIndex - 1;

    const prevId = this.currentSet[this.currentIndex].id;
    
    logger.debug('Moved to previous question in set', { 
      index: this.currentIndex,
      questionId: prevId
    });

    return prevId;
  }

  public clearSet(): void {
    this.currentSet = [];
    this.currentIndex = -1;
    logger.debug('Cleared question set');
  }

  public getSetSize(): number {
    return this.currentSet.length;
  }

  public getCurrentIndex(): number {
    return this.currentIndex;
  }
} 