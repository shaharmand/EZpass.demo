import { questionStorage } from './admin/questionStorage';
import type { 
  Question, 
  QuestionType, 
  ValidationStatus, 
  PublicationStatusEnum,
  ReviewStatusEnum,
  DatabaseQuestion 
} from '../types/question';

export interface QuestionFilters {
  subject?: string;
  domain?: string;
  topic?: string;
  subtopic?: string;
  type?: QuestionType;
  difficulty?: number;
  searchText?: string;
  dateRange?: {
    start?: Date;
    end?: Date;
  };
  sortBy?: 'created_at' | 'updated_at';
  sortOrder?: 'asc' | 'desc';
  validation_status?: ValidationStatus;
  publication_status?: PublicationStatusEnum;
  review_status?: ReviewStatusEnum;
}

class QuestionLibrary {
  private currentFilters: QuestionFilters = {};
  private currentList: string[] = [];
  private currentPosition: number = 0;

  async getFilteredList(filters?: QuestionFilters): Promise<string[]> {
    // Get filtered questions and extract their IDs
    const questions = await questionStorage.getFilteredQuestions(filters || {});
    return questions.map(q => q.id);
  }

  async updateCurrentList(filters: QuestionFilters) {
    this.currentFilters = filters;
    const questions = await questionStorage.getFilteredQuestions(filters);
    this.currentList = questions.map(q => q.id);
    this.currentPosition = 0;
  }

  async getNextQuestion(currentId: string): Promise<DatabaseQuestion | null> {
    // Make sure we have the latest list
    if (this.currentList.length === 0) {
      await this.updateCurrentList(this.currentFilters);
    }

    const currentIndex = this.currentList.indexOf(currentId);
    if (currentIndex === -1 || currentIndex === this.currentList.length - 1) {
      return null;
    }

    const nextId = this.currentList[currentIndex + 1];
    return await questionStorage.getQuestion(nextId);
  }

  async getPreviousQuestion(currentId: string): Promise<DatabaseQuestion | null> {
    // Make sure we have the latest list
    if (this.currentList.length === 0) {
      await this.updateCurrentList(this.currentFilters);
    }

    const currentIndex = this.currentList.indexOf(currentId);
    if (currentIndex <= 0) {
      return null;
    }

    const prevId = this.currentList[currentIndex - 1];
    return await questionStorage.getQuestion(prevId);
  }

  async getCurrentPosition(currentId: string): Promise<{ index: number; total: number } | null> {
    // Make sure we have the latest list
    if (this.currentList.length === 0) {
      await this.updateCurrentList(this.currentFilters);
    }

    const currentIndex = this.currentList.indexOf(currentId);
    if (currentIndex === -1) {
      return null;
    }

    return {
      index: currentIndex + 1, // 1-based index for display
      total: this.currentList.length
    };
  }
}

export const questionLibrary = new QuestionLibrary(); 