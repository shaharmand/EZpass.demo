import { Question, QuestionType } from '../types/question';
import { PrepStateManager } from '../services/PrepStateManager';
import { logger } from '../utils/logger';
import { questionStorage } from './admin/questionStorage';

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

      // Build filters for questionStorage
      const filters = {
        subject: params.subject,
        domain: params.domain,
        publication_status: 'published',
        ...(prep.focusedSubTopic ? { subtopic: prep.focusedSubTopic } : {}),
        ...(prep.focusedType ? { type: prep.focusedType } : {})
      };

      // Get filtered questions from storage
      const questions = await questionStorage.getFilteredQuestions(filters);

      if (!questions || questions.length === 0) {
        logger.error('No questions available for given criteria', {
          filters,
          prepId
        });
        return null;
      }

      // Map questions to QuestionMetadata format
      this.questions = questions.map(q => ({
        id: q.id,
        subject: q.metadata.subjectId,
        domain: q.metadata.domainId,
        subtopicId: q.metadata.subtopicId || '',
        type: q.metadata.type,
        metadata: {
          subtopicId: q.metadata.subtopicId || '',
          type: q.metadata.type
        }
      }));

      this.currentIndex = 0;
      
      logger.debug('Started new question sequence', { 
        params,
        focusedSubTopic: prep.focusedSubTopic,
        focusedType: prep.focusedType,
        count: this.questions.length,
        firstQuestionId: this.questions[0].id
      });

      return this.questions[0].id;
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