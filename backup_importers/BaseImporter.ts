import { Question } from '../../../types/question';
import { logger } from '../../../utils/logger';

export interface ImportResult {
  success: boolean;
  questionId?: string;
  errors?: string[];
  warnings?: string[];
}

export interface BatchImportResult {
  total: number;
  successful: number;
  failed: number;
  results: { [key: string]: ImportResult };
  importerName: string;
}

export abstract class BaseImporter {
  protected readonly importerName: string;

  constructor(importerName: string) {
    this.importerName = importerName;
  }

  /**
   * Import multiple questions
   */
  async importQuestions(questions: any[]): Promise<BatchImportResult> {
    const results: BatchImportResult = {
      total: questions.length,
      successful: 0,
      failed: 0,
      results: {},
      importerName: this.importerName
    };

    for (const question of questions) {
      const result = await this.importQuestion(question);
      
      if (result.success) {
        results.successful++;
      } else {
        results.failed++;
      }

      results.results[this.getQuestionIdentifier(question)] = result;
    }

    logger.info(`${this.importerName} batch import completed`, {
      total: results.total,
      successful: results.successful,
      failed: results.failed
    });

    return results;
  }

  /**
   * Import a single question
   */
  abstract importQuestion(sourceQuestion: any): Promise<ImportResult>;

  /**
   * Validate source question format
   */
  protected abstract validateQuestion(sourceQuestion: any): Promise<string[]>;

  /**
   * Transform source question to our format
   */
  protected abstract transformQuestion(sourceQuestion: any): Question;

  /**
   * Get unique identifier for the question in source format
   */
  protected abstract getQuestionIdentifier(sourceQuestion: any): string;
} 