/** 
 * Type of question that determines its structure and validation requirements.
 * 
 * Current supported types:
 * - multiple_choice: Exactly 4 options with one correct answer (1-4)
 * - numerical: Exact numeric answer with optional tolerance/units
 * - open: Free-form answer with evaluation criteria
 */
export enum QuestionType {
  MULTIPLE_CHOICE = 'multiple_choice',
  OPEN = 'open',
  NUMERICAL = 'numerical'
}

/** 
 * Difficulty level from 1 (easiest) to 5 (hardest)
 */
export type DifficultyLevel = 1 | 2 | 3 | 4 | 5; 