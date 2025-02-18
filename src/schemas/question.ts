import { z } from 'zod';

const markdownFormat = z.literal('markdown');

const contentSchema = z.object({
  text: z.string(),
  format: markdownFormat
});

const optionSchema = z.object({
  text: z.string(),
  format: markdownFormat
});

const solutionStepSchema = z.object({
  text: z.string(),
  key_point: z.string().optional()
});

// Define different answer schemas based on question type
const multipleChoiceAnswerSchema = z.object({
  value: z.object({
    text: z.string(),
    format: markdownFormat
  }),
  options: z.array(optionSchema).length(4), // Exactly 4 options
  correctOption: z.number().int().min(1).max(4) // Must be integer 1-4
});

const openAnswerSchema = z.object({
  value: z.object({
    text: z.string().min(10), // Minimum length for meaningful answer
    format: markdownFormat
  }),
  acceptableVariations: z.array(z.string()).optional()
});

const codeAnswerSchema = z.object({
  value: z.object({
    text: z.string(),
    format: markdownFormat
  }),
  testCases: z.array(z.object({
    input: z.string(),
    output: z.string()
  })).optional()
});

const stepByStepAnswerSchema = z.object({
  value: z.object({
    text: z.string(), // Final answer (number, formula, or specific result)
    format: markdownFormat
  })
});

// Common metadata schema
const metadataSchema = z.object({
  difficulty: z.number().min(1).max(5),
  depth: z.number().min(1).max(5), // 1: Basic, 5: Advanced
  estimatedTime: z.number().min(1).max(60),
  source: z.object({
    examType: z.string(),
    year: z.number(),
    season: z.string().optional(),
    moed: z.string().optional()
  }).optional()
});

// Base question schema
const baseQuestionSchema = z.object({
  content: contentSchema,
  solution: z.object({
    text: z.string(),
    format: markdownFormat,
    steps: z.array(solutionStepSchema).optional()
  }),
  metadata: metadataSchema
});

// Create type-specific question schemas
const multipleChoiceQuestionSchema = baseQuestionSchema.extend({
  answer: multipleChoiceAnswerSchema
});

const openQuestionSchema = baseQuestionSchema.extend({
  answer: openAnswerSchema
});

const codeQuestionSchema = baseQuestionSchema.extend({
  answer: codeAnswerSchema
});

const stepByStepQuestionSchema = baseQuestionSchema.extend({
  answer: stepByStepAnswerSchema
});

// Export the combined schema that validates based on question type
export const questionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('multiple_choice'), ...multipleChoiceQuestionSchema.shape }),
  z.object({ type: z.literal('open'), ...openQuestionSchema.shape }),
  z.object({ type: z.literal('code'), ...codeQuestionSchema.shape }),
  z.object({ type: z.literal('step_by_step'), ...stepByStepQuestionSchema.shape })
]); 