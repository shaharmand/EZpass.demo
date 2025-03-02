import { 
  DetailedEvalLevel,
  type DetailedQuestionFeedback,
  type CriterionFeedback
} from '../../types/question';

/**
 * Validates the basic structure and content of feedback from OpenAI
 */
export class FeedbackValidator {
  /**
   * Main validation method that checks all aspects of the feedback
   */
  static validate(feedback: any): feedback is DetailedQuestionFeedback {
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
    return Object.values(DetailedEvalLevel).includes(level as DetailedEvalLevel);
  }

  /**
   * Validates score matches the specified level's range
   */
  private static isValidScoreLevelMatch(score: number, level: DetailedEvalLevel): boolean {
    const scoreRanges: Record<DetailedEvalLevel, (score: number) => boolean> = {
      [DetailedEvalLevel.PERFECT]: (s: number) => s === 100,      // מושלם
      [DetailedEvalLevel.EXCELLENT]: (s: number) => s >= 95 && s <= 99,  // מצוין
      [DetailedEvalLevel.VERY_GOOD]: (s: number) => s >= 80 && s <= 94,  // טוב מאוד
      [DetailedEvalLevel.GOOD]: (s: number) => s >= 70 && s <= 79,  // טוב
      [DetailedEvalLevel.FAIR]: (s: number) => s >= 55 && s <= 69,  // מספיק
      [DetailedEvalLevel.POOR]: (s: number) => s < 55 && s > 0,  // חלש
      [DetailedEvalLevel.IRRELEVANT]: (s: number) => s === 0  // לא רלוונטי
    };

    return scoreRanges[level]?.(score) ?? false;
  }

  /**
   * Validates assessment format (1-2 sentences)
   */
  private static isValidAssessment(assessment: string): boolean {
    const sentences = assessment.split(/[.!?]+/).filter((s: string) => s.trim().length > 0);
    if (sentences.length < 2 || sentences.length > 3) {
      console.error('Assessment must be 2-3 sentences, found:', sentences.length);
      return false;
    }

    return true;
  }

  /**
   * Validates markdown formatting
   */
  private static hasMarkdown(text: string): boolean {
    return /[*_`]/.test(text);
  }

  /**
   * Validates rubric scores structure
   */
  private static isValidRubricScores(rubricScores: any): boolean {
    if (typeof rubricScores !== 'object' || rubricScores === null) {
      return false;
    }

    return Object.entries(rubricScores).every(([_, data]) => {
      const rubricData = data as CriterionFeedback;
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

  /**
   * Validates a detailed feedback object from AI or manual creation
   */
  static validateDetailedFeedback(feedback: any): feedback is DetailedQuestionFeedback {
    try {
      // Basic validation
      if (!feedback || typeof feedback !== 'object') {
        console.error('Invalid feedback object:', feedback);
        return false;
      }

      // Check required fields
      if (typeof feedback.score !== 'number' || feedback.score < 0 || feedback.score > 100) {
        console.error('Invalid score:', feedback.score);
        return false;
      }

      if (typeof feedback.assessment !== 'string' || !feedback.assessment) {
        console.error('Invalid assessment:', feedback.assessment);
        return false;
      }

      if (typeof feedback.coreFeedback !== 'string' || !feedback.coreFeedback) {
        console.error('Invalid coreFeedback:', feedback.coreFeedback);
        return false;
      }

      if (typeof feedback.detailedFeedback !== 'string' || !feedback.detailedFeedback) {
        console.error('Invalid detailedFeedback:', feedback.detailedFeedback);
        return false;
      }

      // Check level is valid
      if (!Object.values(DetailedEvalLevel).includes(feedback.level)) {
        console.error('Invalid answer level:', feedback.level);
        return false;
      }

      // Validate score matches level
      const score = feedback.score;
      const level = feedback.level;
      if (
        (level === DetailedEvalLevel.EXCELLENT && (score < 95 || score > 99)) ||
        (level === DetailedEvalLevel.VERY_GOOD && (score < 80 || score > 94)) ||
        (level === DetailedEvalLevel.GOOD && (score < 70 || score > 79)) ||
        (level === DetailedEvalLevel.FAIR && (score < 55 || score > 69)) ||
        (level === DetailedEvalLevel.POOR && (score <= 0 || score >= 55)) ||
        (level === DetailedEvalLevel.IRRELEVANT && score !== 0)
      ) {
        console.error('Score does not match level range:', { score, level });
        return false;
      }

      // Check core feedback contains all required symbols
      const requiredSymbols = ['✅', '❌', '⚠️', '🔹'];
      const missingSymbols = requiredSymbols.filter(symbol => !feedback.coreFeedback.includes(symbol));
      if (missingSymbols.length > 0) {
        console.error('Missing required symbols in coreFeedback:', missingSymbols);
        return false;
      }

      // Check assessment length (2-3 sentences)
      const sentences = feedback.assessment.split(/[.!?]+/).filter((s: string) => s.trim().length > 0);
      if (sentences.length < 2 || sentences.length > 3) {
        console.error('Assessment must be 2-3 sentences, found:', sentences.length);
        return false;
      }

      // Check markdown formatting
      const hasMarkdown = (text: string) => /[*_`]/.test(text);
      if (!hasMarkdown(feedback.assessment) || !hasMarkdown(feedback.coreFeedback)) {
        console.error('Missing markdown formatting in assessment or coreFeedback');
        return false;
      }

      // Validate rubric scores
      if (!feedback.rubricScores || typeof feedback.rubricScores !== 'object') {
        console.error('Missing or invalid rubricScores');
        return false;
      }

      // Check each rubric score entry
      for (const [criterion, data] of Object.entries(feedback.rubricScores)) {
        const rubricData = data as CriterionFeedback;
        if (
          typeof rubricData !== 'object' || 
          rubricData === null ||
          typeof rubricData.score !== 'number' || 
          typeof rubricData.feedback !== 'string' ||
          rubricData.score < 0 || 
          rubricData.score > 100
        ) {
          console.error('Invalid rubric score entry:', { criterion, data });
          return false;
        }
      }

      return true;

    } catch (error: unknown) {
      console.error('Error in validateDetailedFeedback:', error instanceof Error ? error.message : 'Unknown error occurred');
      return false;
    }
  }
} 