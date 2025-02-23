import { DifficultyLevel } from 'src/types/question';
import { z } from 'zod';

// Re-export commonly used validation schemas from their domain files
export const difficultySchema = z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5)
]) as z.ZodType<DifficultyLevel>;
export const programmingLanguageSchema = z.enum(['java', 'c#', 'python'] as const);
export const questionTypeSchema = z.enum(['multiple_choice', 'open', 'code', 'step_by_step'] as const); 