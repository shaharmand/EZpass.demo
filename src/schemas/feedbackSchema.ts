import { z } from 'zod';
import { validateMarkdownFormat } from '../utils/formatValidation';
import type { QuestionFeedback } from '../types/question';


// Rubric scores schema
const rubricScoresSchema = z.record(z.object({
  score: z.number().min(0).max(100),
  feedback: z.string().min(1)
}));

/**
 * Zod schema for validating question feedback
 * Matches the QuestionFeedback interface from question.ts exactly
 */
export const feedbackSchema = z.object({
  isCorrect: z.boolean(),
  score: z.number().min(0).max(100),
  assessment: z.string()
    .min(1)
    .max(200)
    .describe('Short immediate feedback message (no markdown)'),
  coreFeedback: z.string()
    .min(1)
    .transform(validateMarkdownFormat)
    .describe('Core feedback including what was correct/incorrect and next steps'),
  detailedFeedback: z.string()
    .min(1)
    .transform(validateMarkdownFormat)
    .describe('Detailed analysis of mistakes and improvement guidance')
    .optional(),
  rubricScores: rubricScoresSchema
    .describe('Individual scores and feedback for each rubric criterion')
});

// Type assertion to ensure our schema matches our TypeScript type
type ValidatedFeedback = z.infer<typeof feedbackSchema>;
const _typeCheck: ValidatedFeedback extends QuestionFeedback ? true : false = true; 