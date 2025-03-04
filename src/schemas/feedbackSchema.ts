import { z } from 'zod';
import { validateMarkdownFormat } from '../utils/formatValidation';
import { EvalLevel, BinaryEvalLevel, DetailedEvalLevel } from '../types/feedback/levels';
import { SCORE_THRESHOLDS } from '../types/feedback/status';
import type { QuestionFeedback, LimitedQuestionFeedback, BasicQuestionFeedback, DetailedQuestionFeedback } from '../types/feedback/types';

// Base feedback schema with minimal common fields
const baseFeedbackSchema = z.object({
  score: z.number().min(0).max(100),
  evalLevel: z.custom<EvalLevel>(),
  message: z.string()
    .min(1)
    .max(200)
    .transform(validateMarkdownFormat)
    .describe('Short summary message')
});

// Schema for limited feedback
const limitedFeedbackSchema = z.object({
  type: z.literal('limited'),
  reason: z.literal('usage_limit_exceeded'),
  score: z.number().min(0).max(100),
  evalLevel: z.custom<EvalLevel>(),
  message: z.string()
    .min(1)
    .max(200)
    .transform(validateMarkdownFormat)
    .describe('Short summary message')
});

// Schema for basic feedback (multiple choice)
const basicFeedbackSchema = z.object({
  type: z.literal('basic'),
  score: z.number().min(0).max(100),
  evalLevel: z.custom<EvalLevel>(),
  message: z.string()
    .min(1)
    .max(200)
    .transform(validateMarkdownFormat)
    .describe('Short summary message'),
  basicExplanation: z.string()
    .min(1)
    .transform(validateMarkdownFormat)
    .describe('Basic solution explanation'),
  fullExplanation: z.string()
    .transform(validateMarkdownFormat)
    .describe('Optional in-depth discussion')
    .optional()
});

// Schema for criterion feedback
const criterionFeedbackSchema = z.object({
  score: z.number().min(0).max(100),
  feedback: z.string().min(1)
});

// Schema for detailed feedback
const detailedFeedbackSchema = z.object({
  type: z.literal('detailed'),
  score: z.number().min(0).max(100),
  evalLevel: z.custom<EvalLevel>(),
  message: z.string()
    .min(1)
    .max(200)
    .transform(validateMarkdownFormat)
    .describe('Short summary message'),
  coreFeedback: z.string()
    .min(1)
    .transform(validateMarkdownFormat)
    .describe('Main evaluation points'),
  detailedFeedback: z.string()
    .min(1)
    .transform(validateMarkdownFormat)
    .describe('Analysis of solution path'),
  criteriaFeedback: z.array(criterionFeedbackSchema)
});

// Combined feedback schema that accepts any valid feedback type
export const feedbackSchema = z.discriminatedUnion('type', [
  limitedFeedbackSchema,
  basicFeedbackSchema, 
  detailedFeedbackSchema
]);

// Type assertion to ensure our schema matches our TypeScript type
type ValidatedFeedback = z.infer<typeof feedbackSchema>;
type _SchemaMatchesType = ValidatedFeedback extends QuestionFeedback ? true : false;
type _TypeMatchesSchema = QuestionFeedback extends ValidatedFeedback ? true : false; 