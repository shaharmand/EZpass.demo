import { BinaryEvalLevel, DetailedEvalLevel, getEvalLevelFromScore } from './levels';
import { CriterionFeedback, createEmptyCriteriaFeedback } from './scoring';

// Base feedback interface with minimal common fields
interface BaseFeedback {
  score: number;  // Overall score 0-100
  message: string;  // Short summary like "תשובה נכונה!" or "תשובה שגויה"
}

/**
 * Limited feedback when user exceeds usage limits
 * Contains only essential evaluation data without detailed explanations
 */
export interface LimitedQuestionFeedback extends BaseFeedback {
  type: 'limited';
  evalLevel: BinaryEvalLevel;
  reason: 'usage_limit_exceeded';
}

/**
 * Basic feedback (multiple choice only)
 */
export interface BasicQuestionFeedback extends BaseFeedback {
  type: 'basic';
  evalLevel: BinaryEvalLevel;
  basicExplanation: string;  // Why the chosen option is correct/incorrect
  fullExplanation?: string;  // Optional in-depth discussion
}

/**
 * Detailed feedback (numerical and open-ended)
 */
export interface DetailedQuestionFeedback extends BaseFeedback {
  type: 'detailed';
  evalLevel: DetailedEvalLevel;
  coreFeedback: string;      // Main evaluation points
  detailedFeedback: string;  // Analysis of solution path and explanation
  criteriaFeedback: CriterionFeedback[];  // Array position matches requiredCriteria order
}

// Union type for all possible feedback types
export type QuestionFeedback = 
  | LimitedQuestionFeedback 
  | BasicQuestionFeedback 
  | DetailedQuestionFeedback;

/**
 * Type guards for feedback types
 */
export function isLimitedFeedback(feedback: QuestionFeedback): feedback is LimitedQuestionFeedback {
  return feedback.type === 'limited';
}

export function isBasicFeedback(feedback: QuestionFeedback): feedback is BasicQuestionFeedback {
  return feedback.type === 'basic';
}

export function isDetailedFeedback(feedback: QuestionFeedback): feedback is DetailedQuestionFeedback {
  return feedback.type === 'detailed';
}

/**
 * Create a limited feedback object
 */
export function createLimitedFeedback(score: number): LimitedQuestionFeedback {
  return {
    type: 'limited',
    score,
    evalLevel: BinaryEvalLevel.INCORRECT, // Limited feedback is always incorrect
    message: 'חרגת ממכסת השימוש היומית',
    reason: 'usage_limit_exceeded'
  };
}

/**
 * Create a basic feedback object
 */
export function createBasicFeedback(
  score: number,
  basicExplanation: string,
  fullExplanation?: string
): BasicQuestionFeedback {
  return {
    type: 'basic',
    score,
    evalLevel: score >= 80 ? BinaryEvalLevel.CORRECT : BinaryEvalLevel.INCORRECT,
    message: score >= 80 ? 'תשובה נכונה!' : 'תשובה שגויה',
    basicExplanation,
    fullExplanation
  };
}

/**
 * Create a detailed feedback object
 */
export function createDetailedFeedback(
  score: number,
  coreFeedback: string,
  detailedFeedback: string,
  criteriaFeedback: CriterionFeedback[]
): DetailedQuestionFeedback {
  return {
    type: 'detailed',
    score,
    evalLevel: getEvalLevelFromScore(score),
    message: 'ראה פירוט מטה',
    coreFeedback,
    detailedFeedback,
    criteriaFeedback
  };
} 