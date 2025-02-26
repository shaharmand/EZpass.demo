import { Question } from '../../types/question';
import { supabase } from '../../lib/supabase';

interface QuestionWithTimestamps extends Question {
  createdAt: string;
  updatedAt: string;
}

interface DomainIndex {
  questionIds: string[];
}

interface DomainQuestions {
  domain: string;
  questions: Question[];
}

class QuestionStorageService {
  private domains = ['civil_engineering', 'computer_science']; // Add more domains as needed
  private questionsCache: Map<string, QuestionWithTimestamps> = new Map();
  private domainIndices: Map<string, string[]> = new Map();
  private initialized: boolean = false;
  
  constructor() {
    // Don't auto-initialize in constructor
    this.domainIndices = new Map(this.domains.map(domain => [domain, []]));
  }

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
        const questionWithTimestamps: QuestionWithTimestamps = {
          ...row.data as Question,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        };
        this.questionsCache.set(questionWithTimestamps.id, questionWithTimestamps);
      });

      console.log(`Loaded ${questions.length} questions from database`);
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize question storage:', error);
      // Don't set initialized=true on error, so it will retry next time
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
  async getAllQuestions(): Promise<QuestionWithTimestamps[]> {
    await this.ensureInitialized();
    return Array.from(this.questionsCache.values());
  }

  /**
   * Get a single question by ID from database
   */
  async getQuestion(questionId: string): Promise<QuestionWithTimestamps | null> {
    await this.ensureInitialized();
    return this.questionsCache.get(questionId) || null;
  }

  /**
   * Get questions by topic from database
   */
  async getQuestionsByTopic(topicId: string): Promise<QuestionWithTimestamps[]> {
    await this.ensureInitialized();
    return Array.from(this.questionsCache.values())
      .filter(q => q.metadata.topicId === topicId);
  }

  /**
   * Save a single question to database
   */
  async saveQuestion(question: Question): Promise<void> {
    await this.ensureInitialized();
    
    // Validate question
    this.validateQuestion(question);

    try {
      const { data, error } = await supabase
        .from('questions')
        .upsert({
          id: question.id,
          data: question
        })
        .select('*, created_at, updated_at')
        .single();

      if (error) throw error;

      // Update cache with timestamps
      const questionWithTimestamps: QuestionWithTimestamps = {
        ...question,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
      this.questionsCache.set(question.id, questionWithTimestamps);
      console.log(`Saved question ${question.id} to database`);
    } catch (error) {
      console.error('Failed to save question:', error);
      throw new Error('Failed to save question to database');
    }
  }

  /**
   * Import questions to database
   */
  async importQuestions(questions: Question[]): Promise<void> {
    await this.ensureInitialized();

    try {
      // Validate all questions first
      questions.forEach(this.validateQuestion);

      // Prepare data for bulk insert
      const rows = questions.map(question => ({
        id: question.id,
        data: question
      }));

      const { error } = await supabase
        .from('questions')
        .upsert(rows);

      if (error) throw error;

      // Update cache with new questions
      questions.forEach(question => {
        this.questionsCache.set(question.id, question as QuestionWithTimestamps);
      });
      console.log(`Imported ${questions.length} questions to database`);
    } catch (error) {
      console.error('Failed to import questions:', error);
      throw new Error('Failed to import questions to database');
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
}

export const questionStorage = new QuestionStorageService(); 