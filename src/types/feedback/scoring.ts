/** 
 * Represents a criterion score and feedback.
 * The array position matches the position in evaluationGuidelines.requiredCriteria
 */
export interface CriterionFeedback {
  criterionName: string;
  score: number;
  feedback: string;
  weight: number;
}

/**
 * Validates a criterion feedback array against weights
 */
export function validateCriteriaFeedback(
  criteriaFeedback: CriterionFeedback[],
  weights: number[]
): boolean {
  if (!Array.isArray(criteriaFeedback) || criteriaFeedback.length !== weights.length) {
    return false;
  }

  // Check that weights sum to 100
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  if (Math.abs(totalWeight - 100) > 0.01) {
    return false;
  }

  return criteriaFeedback.every((feedback, index) => {
    return (
      typeof feedback.score === 'number' &&
      feedback.score >= 0 &&
      feedback.score <= 100 &&
      typeof feedback.feedback === 'string' &&
      feedback.feedback.length > 0 &&
      feedback.weight === weights[index]
    );
  });
}

/**
 * Calculate overall score from criterion feedback using weights
 * @throws Error if validation fails
 */
export function calculateOverallScore(criteriaFeedback: CriterionFeedback[]): number {
  const weightedSum = criteriaFeedback.reduce((sum, feedback) => {
    return sum + (feedback.score * feedback.weight / 100);
  }, 0);
  return Math.round(weightedSum);
}

/**
 * Creates an empty criterion feedback array matching the number of weights
 */
export function createEmptyCriteriaFeedback(weights: number[]): CriterionFeedback[] {
  return weights.map((weight, index) => ({
    criterionName: `Criterion ${index + 1}`,
    score: 0,
    feedback: '',
    weight
  }));
} 