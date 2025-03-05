import { BinaryEvalLevel, DetailedEvalLevel, getEvalLevelFromScore, getBinaryEvalLevel } from './levels';
import { CriterionFeedback, createEmptyCriteriaFeedback } from './scoring';
import { FeedbackStatus, getFeedbackStatus } from './status';

// Base feedback interface with minimal common fields
interface BaseFeedback {
  score: number;  // Overall score 0-100
  message: string;  // Short summary like "תשובה נכונה!" or "תשובה שגויה"
  isCorrect: boolean;
  status: FeedbackStatus;  // The overall status (SUCCESS/PARTIAL/FAILURE)
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
export function createLimitedFeedback(
  score: number,
  message: string
): LimitedQuestionFeedback {
  const evalLevel = getBinaryEvalLevel(score);
  return {
    type: 'limited',
    score,
    isCorrect: score >= 80,
    evalLevel,
    status: getFeedbackStatus(evalLevel),
    message,
    reason: 'usage_limit_exceeded'
  };
}

/**
 * Create a basic feedback object
 */
export function createBasicFeedback(
  score: number,
  basicExplanation: string,
  message: string,
  fullExplanation?: string
): BasicQuestionFeedback {
  const evalLevel = getBinaryEvalLevel(score);
  return {
    type: 'basic',
    score,
    isCorrect: score >= 80,
    evalLevel,
    status: getFeedbackStatus(evalLevel),
    message,
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
  criteriaFeedback: CriterionFeedback[],
  message: string
): DetailedQuestionFeedback {
  const evalLevel = getEvalLevelFromScore(score);
  return {
    type: 'detailed',
    score,
    isCorrect: score >= 80,
    evalLevel,
    status: getFeedbackStatus(evalLevel),
    message,
    coreFeedback,
    detailedFeedback,
    criteriaFeedback
  };
} 