import { z } from 'zod';
import { validateMarkdownFormat } from '../utils/formatValidation';
import { AnswerLevel } from '../types/question';
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
  level: z.nativeEnum(AnswerLevel)
    .describe('The level of correctness for this answer'),
  
  score: z.number()
    .min(0)
    .max(100)
    .refine((score) => {
      // Score must match the level ranges
      return (
        (score === 100 && level === AnswerLevel.PERFECT) ||
        (score >= 95 && score <= 99 && level === AnswerLevel.EXCELLENT) ||
        (score >= 80 && score <= 94 && level === AnswerLevel.GOOD) ||
        (score >= 60 && score <= 79 && level === AnswerLevel.PARTIAL) ||
        (score >= 30 && score <= 59 && level === AnswerLevel.WEAK) ||
        (score >= 1 && score <= 29 && level === AnswerLevel.INSUFFICIENT) ||
        (score === 0 && (level === AnswerLevel.NO_UNDERSTANDING || level === AnswerLevel.IRRELEVANT))
      );
    }, {
      message: "Score must match the level's range requirements"
    }),

  assessment: z.string()
    .min(1)
    .max(200)
    .transform(validateMarkdownFormat)
    .describe('Short evaluation summary (2-3 sentences, with markdown)'),

  coreFeedback: z.string()
    .min(1)
    .refine(
      (text) => {
        // Must include all required symbols
        const hasCheckmark = text.includes('✅');
        const hasX = text.includes('❌');
        const hasWarning = text.includes('⚠️');
        const hasBullet = text.includes('🔹');
        
        return hasCheckmark && hasX && hasWarning && hasBullet;
      },
      {
        message: "Core feedback must include all required symbols: ✅, ❌, ⚠️, 🔹"
      }
    )
    .transform(validateMarkdownFormat)
    .describe('Core feedback with required symbols and markdown formatting'),

  detailedFeedback: z.string()
    .min(1)
    .transform(validateMarkdownFormat)
    .describe('Detailed analysis of mistakes and learning points')
    .optional(),

  rubricScores: rubricScoresSchema
    .describe('Individual scores and feedback for each rubric criterion')
    .optional()
});

// Type assertion to ensure our schema matches our TypeScript type
type ValidatedFeedback = z.infer<typeof feedbackSchema>;
const _typeCheck: ValidatedFeedback extends QuestionFeedback ? true : false = true; 