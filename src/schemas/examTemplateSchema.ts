import { z } from 'zod';
import { ExamType, ExamInstitutionType } from '../types/examTemplate';
import { QuestionType } from '../types/question';
import { difficultySchema, programmingLanguageSchema } from './questionSchema';

// Base schema for exam names
export const examNamesSchema = z.object({
  short: z.string(),
  medium: z.string(), 
  full: z.string()
});

// Topic schema
const topicSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  order: z.number(),
  subTopics: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    order: z.number()
  }))
});

// Question type schema using the enum from types/question
const questionTypeSchema = z.nativeEnum(QuestionType);

// Main exam template schema
export const examTemplateSchema = z.object({
  id: z.string(),
  code: z.string(),
  names: examNamesSchema,
  examType: z.nativeEnum(ExamType),
  institutionType: z.nativeEnum(ExamInstitutionType).optional(),
  difficulty: difficultySchema,
  maxDifficulty: difficultySchema.optional(),
  programmingLanguage: programmingLanguageSchema.optional(),
  subjectId: z.string(),
  domainId: z.string(),
  topics: z.array(topicSchema),
  allowedQuestionTypes: z.array(questionTypeSchema),
  calculatorAllowed: z.boolean().optional(),
  allowedMaterials: z.array(z.string()).optional(),
  duration: z.number(),
  totalQuestions: z.number(),
  sections: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    questionCount: z.number(),
    topics: z.array(topicSchema).optional(),
    allowedQuestionTypes: z.array(questionTypeSchema).optional()
  })).optional()
});

// Infer type from schema
export type ValidatedExam = z.infer<typeof examTemplateSchema>;

// Validation helper
export const validateExamTemplate = (data: unknown): ValidatedExam => {
  try {
    return examTemplateSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation errors:', error.errors);
      throw new Error(`Invalid exam template data: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
};