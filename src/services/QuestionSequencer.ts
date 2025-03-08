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
        console.error('❌ Prep not found', { prepId });
        return null;
      }

      console.log('🔍 SEQUENCER: Initializing with details:', { 
        params,
        prepState: {
          focusedSubTopic: prep.focusedSubTopic,
          focusedType: prep.focusedType
        },
        timestamp: new Date().toISOString()
      });

      // Build filters for questionStorage
      const filters = {
        subject: params.subject,
        domain: params.domain,
        publication_status: 'published',
        ...(prep.focusedSubTopic ? { subtopic: prep.focusedSubTopic } : {}),
        ...(prep.focusedType ? { type: prep.focusedType } : {})
      };

      console.log('🔍 SEQUENCER: Fetching with filters:', {
        filters,
        prepId,
        timestamp: new Date().toISOString()
      });

      // Get filtered questions from storage
      const questions = await questionStorage.getFilteredQuestions(filters);

      console.log('📊 SEQUENCER: Questions fetched:', {
        totalQuestions: questions?.length || 0,
        uniqueSubtopics: questions ? Array.from(new Set(questions.map(q => q.data.metadata.subtopicId))).length : 0,
        focusedSubtopic: prep.focusedSubTopic,
        subtopicsInResults: questions ? Array.from(new Set(questions.map(q => q.data.metadata.subtopicId))) : [],
        hasExpectedFocus: questions?.every(q => !prep.focusedSubTopic || q.data.metadata.subtopicId === prep.focusedSubTopic),
        timestamp: new Date().toISOString()
      });

      if (!questions || questions.length === 0) {
        console.error('❌ SEQUENCER: No questions available:', {
          filters,
          prepId,
          focusState: {
            hasFocusedSubtopic: !!prep.focusedSubTopic,
            focusedSubtopic: prep.focusedSubTopic
          }
        });
        return null;
      }

      // Verify questions match focus criteria
      const unfocusedQuestions = questions.filter(q => 
        prep.focusedSubTopic && q.data.metadata.subtopicId !== prep.focusedSubTopic
      );
      
      if (unfocusedQuestions.length > 0) {
        console.warn('⚠️ SEQUENCER: Found questions not matching focus:', {
          focusedSubtopic: prep.focusedSubTopic,
          totalQuestions: questions.length,
          unfocusedCount: unfocusedQuestions.length,
          unfocusedSubtopics: Array.from(new Set(unfocusedQuestions.map(q => q.data.metadata.subtopicId))),
          timestamp: new Date().toISOString()
        });
      }

      // Map questions to QuestionMetadata format
      this.questions = questions.map(q => ({
        id: q.id,
        subject: q.data.metadata.subjectId,
        domain: q.data.metadata.domainId,
        subtopicId: q.data.metadata.subtopicId || '',
        type: q.data.metadata.type,
        metadata: {
          subtopicId: q.data.metadata.subtopicId || '',
          type: q.data.metadata.type
        }
      }));

      // Randomize question order using Fisher-Yates shuffle
      for (let i = this.questions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.questions[i], this.questions[j]] = [this.questions[j], this.questions[i]];
      }

      this.currentIndex = 0;
      
      console.log('✅ SEQUENCER: Started new sequence:', { 
        params,
        focusedSubTopic: prep.focusedSubTopic,
        focusedType: prep.focusedType,
        count: this.questions.length,
        firstQuestionId: this.questions[0].id,
        isRandomized: true
      });

      return this.questions[0].id;
    } catch (error) {
      console.error('❌ SEQUENCER: Error initializing:', error);
      return null;
    }
  }

  private async refreshQuestionsIfFocusChanged(): Promise<void> {
    if (!this.prepId) {
      console.log('⚠️ SEQUENCER: No prepId for refresh check');
      return;
    }

    const prep = PrepStateManager.getPrep(this.prepId);
    if (!prep) {
      console.log('⚠️ SEQUENCER: No prep state found for refresh check');
      return;
    }

    // Check if current questions match the focus
    const currentQuestion = this.questions[this.currentIndex];
    if (!currentQuestion) {
      console.log('⚠️ SEQUENCER: No current question for refresh check');
      return;
    }

    console.log('🔄 SEQUENCER: Checking focus change:', {
      currentSubtopic: currentQuestion.metadata.subtopicId,
      focusedSubtopic: prep.focusedSubTopic,
      currentType: currentQuestion.metadata.type,
      focusedType: prep.focusedType,
      timestamp: new Date().toISOString()
    });

    const focusChanged = (prep.focusedSubTopic && currentQuestion.metadata.subtopicId !== prep.focusedSubTopic) ||
                        (prep.focusedType && currentQuestion.metadata.type !== prep.focusedType);

    if (focusChanged) {
      console.log('🔄 SEQUENCER: Focus changed, reinitializing:', {
        subject: currentQuestion.subject,
        domain: currentQuestion.domain,
        prepId: this.prepId,
        timestamp: new Date().toISOString()
      });

      // Re-initialize with same base params but new focus
      await this.initialize({ 
        subject: currentQuestion.subject, 
        domain: currentQuestion.domain 
      }, this.prepId);
    } else {
      console.log('✅ SEQUENCER: Focus unchanged');
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
    console.log('➡️ SEQUENCER: Next called, checking focus...');
    await this.refreshQuestionsIfFocusChanged();

    if (this.questions.length === 0) {
      console.log('⚠️ SEQUENCER: No questions available for next');
      return null;
    }

    const oldIndex = this.currentIndex;
    this.currentIndex = (this.currentIndex + 1) % this.questions.length;
    const nextId = this.questions[this.currentIndex].id;
    
    console.log('➡️ SEQUENCER: Moving to next question:', { 
      oldIndex,
      newIndex: this.currentIndex,
      position: this.currentIndex + 1,
      total: this.questions.length,
      questionId: nextId,
      subtopicId: this.questions[this.currentIndex].metadata.subtopicId,
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

  public getCurrentIndex(): number {
    return this.currentIndex;
  }

  public getQuestions(): QuestionMetadata[] {
    return [...this.questions]; // Return a copy to prevent mutation
  }

  public restoreState(state: { currentIndex: number; questions: QuestionMetadata[] }): void {
    this.questions = state.questions;
    this.currentIndex = state.currentIndex;
    console.log('Restored sequencer state:', {
      questionCount: this.questions.length,
      currentIndex: this.currentIndex
    });
  }
} 