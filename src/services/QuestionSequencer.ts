import { Question, QuestionType, PublicationStatusEnum } from '../types/question';
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
  private prepId: string | null = null;
  private seenQuestions: Set<string> = new Set();

  private constructor() {}

  public static getInstance(): QuestionSequencer {
    if (!QuestionSequencer.instance) {
      QuestionSequencer.instance = new QuestionSequencer();
    }
    return QuestionSequencer.instance;
  }

  public async initialize(params: QueryParams, prepId: string): Promise<string | null> {
    this.prepId = prepId;
    return this.next();
  }

  private async getRandomQuestion(): Promise<string | null> {
    if (!this.prepId) {
      console.error('❌ SEQUENCER: No prepId available');
      return null;
    }

    const prep = PrepStateManager.getPrep(this.prepId);
    if (!prep) {
      console.error('❌ SEQUENCER: Prep not found', { prepId: this.prepId });
      return null;
    }

    // Build filters for current state
    const filters = {
      subject: prep.exam.subjectId,
      domain: prep.exam.domainId,
      // NOTE: Publication status filter is temporarily disabled since test questions are not published yet
      // publicationStatus: PublicationStatusEnum.PUBLISHED,
      ...(prep.focusedSubTopic ? { subtopic: prep.focusedSubTopic } : {}),
      ...(prep.focusedType ? { type: prep.focusedType } : {})
    };

    console.log('🔍 SEQUENCER: Fetching with filters:', {
      filters,
      seenCount: this.seenQuestions.size,
      timestamp: new Date().toISOString()
    });

    // Get all matching questions
    const questions = await questionStorage.getFilteredQuestions(filters);
    
    if (!questions || questions.length === 0) {
      console.log('❌ SEQUENCER: No questions available for current filters');
      return null;
    }

    // Filter out seen questions if possible
    const unseenQuestions = questions.filter(q => !this.seenQuestions.has(q.id));
    const availableQuestions = unseenQuestions.length > 0 ? unseenQuestions : questions;

    // Pick a random question
    const randomIndex = Math.floor(Math.random() * availableQuestions.length);
    const selectedQuestion = availableQuestions[randomIndex];
    
    // Mark as seen
    this.seenQuestions.add(selectedQuestion.id);

    console.log('✅ SEQUENCER: Selected question:', {
      questionId: selectedQuestion.id,
      type: selectedQuestion.data.metadata.type,
      subtopic: selectedQuestion.data.metadata.subtopicId,
      totalAvailable: questions.length,
      unseenAvailable: unseenQuestions.length
    });

    return selectedQuestion.id;
  }

  public async next(): Promise<string | null> {
    return this.getRandomQuestion();
  }

  public reset(): void {
    this.prepId = null;
    this.seenQuestions.clear();
    console.log('Reset question sequence');
  }

  public getProgress(): { current: number; total: number } {
    return {
      current: this.seenQuestions.size,
      total: this.seenQuestions.size // We don't know real total since it depends on current filters
    };
  }

  // Minimal state management for PrepStateManager compatibility
  // Note: These methods are kept for backwards compatibility but don't maintain meaningful state
  public getCurrentIndex(): number {
    return 0; // Not meaningful in random selection
  }

  public getQuestions(): QuestionMetadata[] {
    return []; // Not meaningful to return cached questions
  }

  public restoreState(state: { currentIndex: number; questions: QuestionMetadata[] }): void {
    // Only restore seen questions if needed
    if (state.questions) {
      this.seenQuestions = new Set(state.questions.map(q => q.id));
    }
    console.log('Restored seen questions:', {
      seenCount: this.seenQuestions.size
    });
  }
} 