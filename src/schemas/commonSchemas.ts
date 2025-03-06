import { DifficultyLevel } from '../types/common';
import { z } from 'zod';
import { QuestionType } from '../types/common';

// Re-export commonly used validation schemas from their domain files
export const difficultySchema = z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5)
]) as z.ZodType<DifficultyLevel>;
export const programmingLanguageSchema = z.enum(['java', 'c#', 'python'] as const);
export const questionTypeSchema = z.nativeEnum(QuestionType); 