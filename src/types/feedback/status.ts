import { BinaryEvalLevel, DetailedEvalLevel } from './levels';

/**
 * Score thresholds for different feedback statuses
 */
export const SCORE_THRESHOLDS = {
  SUCCESS: 80,
  PARTIAL: 70,
  MINIMUM_PASS: 55
} as const;

/**
 * Overall feedback status that maps evaluation levels to a simpler traffic light system.
 * Used for UI indicators and quick filtering.
 * 
 * Mapping rules:
 * - SUCCESS (Green ✅): Score >= 80%
 * - PARTIAL (Yellow ⚠️): Score 70-79%
 * - FAILURE (Red ❌): Score < 70%
 */
export enum FeedbackStatus {
  SUCCESS = 'SUCCESS',    // Green  (✅) - 80-100%
  PARTIAL = 'PARTIAL',    // Yellow (⚠️) - 70-79%
  FAILURE = 'FAILURE'     // Red    (❌) - <70%
}

/**
 * Get feedback status based on score or evaluation level
 */
export function getFeedbackStatus(score: number): FeedbackStatus;
export function getFeedbackStatus(evalLevel: BinaryEvalLevel | DetailedEvalLevel): FeedbackStatus;
export function getFeedbackStatus(scoreOrLevel: number | BinaryEvalLevel | DetailedEvalLevel): FeedbackStatus {
  // If it's a number, use score thresholds
  if (typeof scoreOrLevel === 'number') {
    if (scoreOrLevel >= SCORE_THRESHOLDS.SUCCESS) return FeedbackStatus.SUCCESS;
    if (scoreOrLevel >= SCORE_THRESHOLDS.PARTIAL) return FeedbackStatus.PARTIAL;
    return FeedbackStatus.FAILURE;
  }

  // If it's an evaluation level
  if (scoreOrLevel === BinaryEvalLevel.CORRECT) return FeedbackStatus.SUCCESS;
  if (scoreOrLevel === BinaryEvalLevel.INCORRECT) return FeedbackStatus.FAILURE;

  // For detailed levels
  switch (scoreOrLevel) {
    case DetailedEvalLevel.PERFECT:    // 100%
    case DetailedEvalLevel.EXCELLENT:  // 90-99%
    case DetailedEvalLevel.VERY_GOOD:  // 80-89%
      return FeedbackStatus.SUCCESS;
      
    case DetailedEvalLevel.GOOD:       // 70-79%
    case DetailedEvalLevel.FAIR:       // 55-69%
      return FeedbackStatus.PARTIAL;
      
    case DetailedEvalLevel.POOR:       // <55%
    case DetailedEvalLevel.IRRELEVANT: // 0%
      return FeedbackStatus.FAILURE;
      
    default:
      return FeedbackStatus.FAILURE;
  }
}

/**
 * Helper to check if answer meets success criteria
 */
export function isSuccessfulAnswer(scoreOrLevel: number | BinaryEvalLevel | DetailedEvalLevel): boolean {
  if (typeof scoreOrLevel === 'number') {
    return scoreOrLevel >= SCORE_THRESHOLDS.SUCCESS;
  }
  return scoreOrLevel === BinaryEvalLevel.CORRECT;
}

/**
 * Get color for feedback status (for UI)
 */
export function getFeedbackStatusColor(status: FeedbackStatus): string {
  switch (status) {
    case FeedbackStatus.SUCCESS:
      return '#52c41a';  // Green
    case FeedbackStatus.PARTIAL:
      return '#faad14';  // Yellow
    case FeedbackStatus.FAILURE:
      return '#f5222d';  // Red
  }
}

/**
 * Get icon for feedback status (for UI)
 */
export function getFeedbackStatusIcon(status: FeedbackStatus): string {
  switch (status) {
    case FeedbackStatus.SUCCESS:
      return '✅';
    case FeedbackStatus.PARTIAL:
      return '⚠️';
    case FeedbackStatus.FAILURE:
      return '❌';
  }
} 