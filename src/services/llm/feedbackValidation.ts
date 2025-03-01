import { AnswerLevel, QuestionFeedback } from '../../types/question';

/**
 * Validates the basic structure and content of feedback from OpenAI
 */
export class FeedbackValidator {
  /**
   * Main validation method that checks all aspects of the feedback
   */
  static validate(feedback: any): feedback is QuestionFeedback {
    try {
      // Basic structure validation
      if (!FeedbackValidator.hasRequiredFields(feedback)) {
        console.error('Missing or invalid required fields');
        return false;
      }

      // Score validation
      if (!FeedbackValidator.isValidScore(feedback.score)) {
        console.error('Invalid score:', feedback.score);
        return false;
      }

      // Level validation
      if (!FeedbackValidator.isValidLevel(feedback.level)) {
        console.error('Invalid level:', feedback.level);
        return false;
      }

      // Score-Level match validation
      if (!FeedbackValidator.isValidScoreLevelMatch(feedback.score, feedback.level)) {
        console.error('Score-level mismatch:', { score: feedback.score, level: feedback.level });
        return false;
      }

      // Assessment validation
      if (!FeedbackValidator.isValidAssessment(feedback.assessment)) {
        console.error('Invalid assessment format');
        return false;
      }

      // Rubric scores validation
      if (!FeedbackValidator.isValidRubricScores(feedback.rubricScores)) {
        console.error('Invalid rubric scores');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Validation error:', error);
      return false;
    }
  }

  /**
   * Checks if all required fields are present and have correct types
   */
  private static hasRequiredFields(feedback: any): boolean {
    return (
      typeof feedback === 'object' &&
      feedback !== null &&
      typeof feedback.score === 'number' &&
      typeof feedback.level === 'string' &&
      typeof feedback.assessment === 'string' &&
      typeof feedback.coreFeedback === 'string' &&
      typeof feedback.detailedFeedback === 'string' &&
      typeof feedback.rubricScores === 'object' &&
      feedback.rubricScores !== null
    );
  }

  /**
   * Validates score is within acceptable range
   */
  private static isValidScore(score: number): boolean {
    return !isNaN(score) && score >= 0 && score <= 100;
  }

  /**
   * Validates level is a valid enum value
   */
  private static isValidLevel(level: string): boolean {
    return Object.values(AnswerLevel).includes(level as AnswerLevel);
  }

  /**
   * Validates score matches the specified level's range
   */
  private static isValidScoreLevelMatch(score: number, level: AnswerLevel): boolean {
    const scoreRanges: Record<AnswerLevel, (score: number) => boolean> = {
      [AnswerLevel.PERFECT]: (s) => s === 100,
      [AnswerLevel.EXCELLENT]: (s) => s >= 95 && s <= 99,
      [AnswerLevel.GOOD]: (s) => s >= 80 && s <= 94,
      [AnswerLevel.PARTIAL]: (s) => s >= 60 && s <= 79,
      [AnswerLevel.WEAK]: (s) => s >= 30 && s <= 59,
      [AnswerLevel.INSUFFICIENT]: (s) => s >= 1 && s <= 29,
      [AnswerLevel.NO_UNDERSTANDING]: (s) => s === 0,
      [AnswerLevel.IRRELEVANT]: (s) => s === 0
    };

    return scoreRanges[level]?.(score) ?? false;
  }

  /**
   * Validates assessment format (1-2 sentences)
   */
  private static isValidAssessment(assessment: string): boolean {
    const sentences = assessment.split(/[.!?]+/).filter(s => s.trim().length > 0);
    return sentences.length >= 1 && sentences.length <= 2;
  }

  /**
   * Validates rubric scores structure
   */
  private static isValidRubricScores(rubricScores: any): boolean {
    if (typeof rubricScores !== 'object' || rubricScores === null) {
      return false;
    }

    return Object.entries(rubricScores).every(([_, data]) => {
      const rubricData = data as { score?: number; feedback?: string };
      return (
        typeof rubricData === 'object' &&
        rubricData !== null &&
        typeof rubricData.score === 'number' &&
        typeof rubricData.feedback === 'string' &&
        rubricData.score >= 0 &&
        rubricData.score <= 100
      );
    });
  }
} 