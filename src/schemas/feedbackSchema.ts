import { z } from 'zod';
import { validateMarkdownFormat } from '../utils/formatValidation';
import { BasicAnswerLevel, DetailedEvalLevel } from '../types/question';
import type { QuestionFeedback } from '../types/question';

// Base feedback schema with minimal common fields
const baseFeedbackSchema = {
  score: z.number().min(0).max(100),
  assessment: z.string()
    .min(1)
    .max(200)
    .transform(validateMarkdownFormat)
    .describe('Short evaluation summary (2-3 sentences, with markdown)')
};

// Schema for basic feedback (multiple choice, yes/no, etc)
const basicFeedbackSchema = z.object({
  level: z.nativeEnum(BasicAnswerLevel),
  ...baseFeedbackSchema,
  basicExplanation: z.string()
    .min(1)
    .transform(validateMarkdownFormat)
    .describe('Basic solution explanation (e.g. why this answer is correct)'),
  fullExplanation: z.string()
    .min(1)
    .transform(validateMarkdownFormat)
    .describe('Optional in-depth discussion of the topic and related concepts')
    .optional()
}).refine(data => {
  if (data.level === BasicAnswerLevel.CORRECT) return data.score === 100;
  if (data.level === BasicAnswerLevel.INCORRECT) return data.score === 0;
  return false;
}, {
  message: "Score must match the basic answer level (100 for CORRECT, 0 for INCORRECT)"
});

// Schema for detailed feedback (open ended, code, etc)
const detailedFeedbackSchema = z.object({
  level: z.nativeEnum(DetailedEvalLevel),
  ...baseFeedbackSchema,
  coreFeedback: z.string()
    .min(1)
    .transform(validateMarkdownFormat)
    .describe('Main evaluation and key points'),
  detailedFeedback: z.string()
    .min(1)
    .transform(validateMarkdownFormat)
    .describe('Required detailed analysis'),
  rubricScores: z.record(z.object({
    score: z.number().min(0).max(100),
    feedback: z.string().min(1)
  }))
}).refine(data => {
  switch (data.level) {
    case DetailedEvalLevel.PERFECT:
      return data.score === 100;
    case DetailedEvalLevel.EXCELLENT:
      return data.score >= 90 && data.score <= 99;
    case DetailedEvalLevel.VERY_GOOD:
      return data.score >= 80 && data.score <= 89;
    case DetailedEvalLevel.GOOD:
      return data.score >= 70 && data.score <= 79;
    case DetailedEvalLevel.FAIR:
      return data.score >= 55 && data.score <= 69;
    case DetailedEvalLevel.POOR:
      return data.score < 55 && data.score > 0;
    case DetailedEvalLevel.IRRELEVANT:
      return data.score === 0;
    default:
      return false;
  }
}, {
  message: "Score must match the detailed answer level ranges"
});

// Combined feedback schema that accepts either basic or detailed feedback
export const feedbackSchema = z.union([basicFeedbackSchema, detailedFeedbackSchema]);

// Type assertion to ensure our schema matches our TypeScript type
type ValidatedFeedback = z.infer<typeof feedbackSchema>;
type _SchemaMatchesType = ValidatedFeedback extends QuestionFeedback ? true : false;
type _TypeMatchesSchema = QuestionFeedback extends ValidatedFeedback ? true : false; 