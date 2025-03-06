import { z } from 'zod';
import type { RefinementCtx } from 'zod';
import { DifficultyLevel, QuestionType } from '../types/common';
import { SourceType, EzpassCreatorType } from '../types/question';
import { Topic } from '../types/subject';
import { universalTopics, universalTopicsV2 } from '../services/universalTopics';
import { createValidationMessage } from '../utils/validationMessages';
import { logger } from '../utils/logger';

// Centralized math formatting rules
export const MATH_FORMATTING_RULES = {
  rules: [
    'Keep Hebrew text outside math delimiters',
    'Use English/Latin characters for variable names and math symbols',
    'Use \\text{} only for English text within math',
    'For units, write them in Hebrew outside the math delimiters',
    'For display equations, use \\begin{align*} with &= for alignment',
    'For inline equations, use single $ delimiters',
    'For multi-line equations, use \\begin{align*} and \\end{align*}'
  ],
  examples: {
    displayEquation: '$$\\begin{align*} F_{max} &= \\frac{W}{FS} \\end{align*}$$',
    inlineEquation: 'כאשר $F_{max}$ הוא הכוח המקסימלי',
    units: '$F = 100$ ניוטון',
    badUnits: '$F = 100\\text{ ניוטון}$',
    multiLine: `$$\\begin{align*}
F_{max} &= \\frac{W}{FS} \\\\
&= 500 \\text{ N}
\\end{align*}$$`
  },
  validationChecks: {
    hebrewInMath: /[\u0590-\u05FF]/,
    hebrewInText: /\\text\{[^}]*[\u0590-\u05FF][^}]*\}/,
    hebrewInSubscript: /_{[^}]*[\u0590-\u05FF][^}]*}/,
    displayMath: /\$\$[\s\S]*?\$\$/g,
    inlineMath: /\$[^\$]*?\$/g
  }
};

// Core validation schemas for question-related types
export const difficultySchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5)
]) as z.ZodType<DifficultyLevel>;

export const programmingLanguageSchema = z.enum(['java', 'c#', 'python'] as const);

export const questionTypeSchema = z.nativeEnum(QuestionType, {
  required_error: "חובה לבחור סוג שאלה",
  invalid_type_error: "סוג שאלה לא חוקי"
});

// More question-specific schemas can be added here...

// Helper function to calculate string similarity
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1).fill(0).map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) {
    dp[i][0] = i;
  }
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j;
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j],     // deletion
          dp[i][j - 1],     // insertion
          dp[i - 1][j - 1]  // substitution
        );
      }
    }
  }

  return dp[m][n];
}

// Basic text schema with format
const formattedTextSchema = z.object({
  text: z.string(),
  format: z.literal('markdown'),
  options: z.array(z.object({
    text: z.string(),
    format: z.literal('markdown')
  })).optional()
});

// Source type schema
export const sourceTypeSchema = z.nativeEnum(SourceType, {
  required_error: "חובה לבחור סוג מקור",
  invalid_type_error: "סוג מקור לא חוקי"
});

const creatorTypeSchema = z.nativeEnum(EzpassCreatorType, {
  required_error: "חובה לבחור סוג יוצר",
  invalid_type_error: "סוג יוצר לא חוקי"
});

// Basic metadata schema
export const metadataSchema = z.object({
  subjectId: z.string(),
  domainId: z.string(),
  topicId: z.string(),
  subtopicId: z.string(),
  difficulty: difficultySchema,
  estimatedTime: z.number(),
  type: questionTypeSchema,
  source: z.object({
    type: z.enum(['exam', 'ezpass'] as const),
    creatorType: z.enum(['ai', 'human'] as const).optional()
  })
});

// Main question schema with basic structure validation
export const questionSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  content: formattedTextSchema,
  metadata: metadataSchema,
  schoolAnswer: z.object({
    finalAnswer: z.any().optional(),
    solution: formattedTextSchema
  }),
  evaluationGuidelines: z.object({
    requiredCriteria: z.array(z.object({
      name: z.string(),
      description: z.string(),
      weight: z.number()
    }))
  }).optional()
}); 