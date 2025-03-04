/**
 * Binary evaluation for multiple choice only
 */
export enum BinaryEvalLevel {
  CORRECT = 'CORRECT',
  INCORRECT = 'INCORRECT'
}

/**
 * Detailed evaluation levels for questions requiring solution path
 * Used for:
 * - Numerical (with solution steps)
 * - Open-ended (essays, proofs)
 * 
 * Success thresholds:
 * - Green (✅): 80-100% (PERFECT, EXCELLENT, VERY_GOOD)
 * - Yellow (⚠️): 70-79% (GOOD)
 * - Red (❌): <70% (FAIR, POOR, IRRELEVANT)
 */
export enum DetailedEvalLevel {
  PERFECT = 'PERFECT',         // 100%    - Perfect solution
  EXCELLENT = 'EXCELLENT',     // 90-99%  - Near perfect solution
  VERY_GOOD = 'VERY_GOOD',     // 80-89%  - Strong solution with minor issues
  GOOD = 'GOOD',               // 70-79%  - Good solution with some gaps
  FAIR = 'FAIR',               // 55-69%  - Basic understanding, significant gaps
  POOR = 'POOR',               // <55%    - Major gaps or incorrect solution
  IRRELEVANT = 'IRRELEVANT'    // 0%      - Off-topic or unrelated
}

// Combined type for all evaluation levels
export type EvalLevel = BinaryEvalLevel | DetailedEvalLevel;

/**
 * Get evaluation level based on overall score
 */
export function getEvalLevelFromScore(score: number): DetailedEvalLevel {
  if (score === 100) return DetailedEvalLevel.PERFECT;
  if (score >= 90) return DetailedEvalLevel.EXCELLENT;
  if (score >= 80) return DetailedEvalLevel.VERY_GOOD;
  if (score >= 70) return DetailedEvalLevel.GOOD;
  if (score >= 55) return DetailedEvalLevel.FAIR;
  if (score > 0) return DetailedEvalLevel.POOR;
  return DetailedEvalLevel.IRRELEVANT;
}

/**
 * Get binary evaluation level based on score
 */
export function getBinaryEvalLevel(score: number): BinaryEvalLevel {
  return score >= 80 ? BinaryEvalLevel.CORRECT : BinaryEvalLevel.INCORRECT;
} 