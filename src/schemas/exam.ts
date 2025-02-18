import { z } from 'zod';

// Constants that can be reused and validated against
export const EXAM_TYPES = ['bagrut', 'mahat'] as const;
export const PROGRAMMING_LANGUAGES = ['java', 'python', 'c#'] as const;
export const DIFFICULTY_LEVELS = [1, 2, 3, 4, 5] as const;

// Base schemas
export const examNamesSchema = z.object({
  short: z.string(),
  medium: z.string(),
  full: z.string()
});

export const topicSchema = z.object({
  topicId: z.string(),
  subTopics: z.array(z.string())
});

// Main exam schema
export const examSchema = z.object({
  id: z.string(),
  code: z.string(),
  names: examNamesSchema,
  exam_type: z.enum(EXAM_TYPES),
  difficulty: z.number().int().min(1).max(5),
  programming_language: z.enum(PROGRAMMING_LANGUAGES).optional(),
  topics: z.array(topicSchema)
});

// Exam list schemas
export const bagrutExamsSchema = z.object({
  exams: z.array(examSchema)
});

export const mahatExamsSchema = z.object({
  faculty: z.string(),
  exams: z.array(examSchema)
});

// Infer TypeScript types from schemas
export type ExamNames = z.infer<typeof examNamesSchema>;
export type Topic = z.infer<typeof topicSchema>;
export type Exam = z.infer<typeof examSchema>;
export type BagrutExams = z.infer<typeof bagrutExamsSchema>;
export type MahatExams = z.infer<typeof mahatExamsSchema>;

// Validation helper
export const validateExamData = (data: unknown, type: 'bagrut' | 'mahat'): BagrutExams | MahatExams => {
  try {
    return type === 'bagrut' 
      ? bagrutExamsSchema.parse(data)
      : mahatExamsSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation errors:', error.errors);
      throw new Error(`Invalid ${type} exam data: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}; 