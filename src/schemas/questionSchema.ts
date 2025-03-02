import { z } from 'zod';
import type { RefinementCtx } from 'zod';
import { DifficultyLevel, QuestionType, SourceType } from '../types/question';
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
export const difficultySchema = z.number()
  .min(1)
  .max(5)
  .transform((n): DifficultyLevel => n as DifficultyLevel);

export const programmingLanguageSchema = z.enum(['java', 'c#', 'python'] as const);

export const questionTypeSchema = z.nativeEnum(QuestionType);

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

// Common schema for text with markdown format
const formattedTextSchema = z.object({
  text: z.string()
    .min(10, { message: "תוכן קצר מדי" })
    .refine(
      (text) => {
        // Validate markdown code blocks
        const codeBlockRegex = /```[\s\S]*?```/g;
        const matches = text.match(codeBlockRegex) || [];
        
        // Check if all code blocks are properly formatted
        for (const block of matches) {
          const lines = block.split('\n');
          
          // Must have at least opening, content, and closing
          if (lines.length < 3) {
            console.error('Code block validation error: Block too short', { block });
            return false;
          }
          
          // First line must be ```language or just ```
          if (!lines[0].match(/^```(java|python|javascript|typescript|c#|cpp|sql)?$/)) {
            console.error('Code block validation error: Invalid or unsupported language', { firstLine: lines[0] });
            return false;
          }
          
          // Last line must be ```
          if (lines[lines.length - 1] !== '```') {
            console.error('Code block validation error: Invalid closing line', { lastLine: lines[lines.length - 1] });
            return false;
          }
        }
        
        return true;
      },
      {
        message: "קוד חייב להיות בפורמט תקין עם שפה נתמכת"
      }
    )
    .refine(
      (text) => {
        // Find all math expressions (both inline and display)
        const mathRegex = MATH_FORMATTING_RULES.validationChecks.displayMath;
        const inlineMathRegex = MATH_FORMATTING_RULES.validationChecks.inlineMath;
        const mathMatches = [...(text.match(mathRegex) || []), ...(text.match(inlineMathRegex) || [])];
        let hasIssues = false;

        // Check each math expression
        for (const math of mathMatches) {
          // Remove the delimiters
          const content = math.replace(/^\$\$|\$\$$/g, '').replace(/^\$|\$$/g, '');
          
          // Check for Hebrew characters inside math
          if (MATH_FORMATTING_RULES.validationChecks.hebrewInMath.test(content)) {
            console.warn('Math validation warning: Hebrew characters found inside math delimiters', {
              mathExpression: math,
              content,
              suggestion: 'Move Hebrew text outside math delimiters',
              example: MATH_FORMATTING_RULES.examples.units,
              fix: 'Write Hebrew text before or after the math expression'
            });
            hasIssues = true;
          }

          // Check for \text{hebrew} pattern
          if (MATH_FORMATTING_RULES.validationChecks.hebrewInText.test(content)) {
            console.warn('Math validation warning: Hebrew text found in \\text command', {
              mathExpression: math,
              content,
              suggestion: 'Write Hebrew text outside math delimiters',
              example: MATH_FORMATTING_RULES.examples.units,
              fix: 'Remove \\text{} and write Hebrew text outside the math expression'
            });
            hasIssues = true;
          }

          // Check for Hebrew in subscripts
          if (MATH_FORMATTING_RULES.validationChecks.hebrewInSubscript.test(content)) {
            console.warn('Math validation warning: Hebrew text found in subscript', {
              mathExpression: math,
              content,
              suggestion: 'Use English subscripts and explain in Hebrew outside',
              example: '$v_{final}$ (מהירות סופית)',
              fix: 'Use English subscripts and provide Hebrew translation after'
            });
            hasIssues = true;
          }
        }

        if (hasIssues) {
          console.info('Math validation guidelines:', {
            rules: MATH_FORMATTING_RULES.rules,
            examples: MATH_FORMATTING_RULES.examples,
            criticalRules: [
              'NEVER put Hebrew text inside $...$ or $$...$$',
              'NEVER use \\text{} with Hebrew inside math',
              'Write all units in Hebrew AFTER the math block',
              'Use English subscripts for variables'
            ]
          });
        }

        // Always return true to not fail validation
        return true;
      },
      {
        message: "Math expressions should not contain Hebrew text. This is a warning only."
      }
    )
    .describe('Content text in markdown format. Use LaTeX within $$ for math formulas, code blocks with language specification for code.'),
  format: z.literal('markdown').describe('Format specification for content rendering')
});

// Source type schema
export const sourceTypeSchema = z.nativeEnum(SourceType);

// Metadata schema with comprehensive validation
export const metadataSchema = z.object({
  subjectId: z.string().min(1, { message: createValidationMessage.required('subjectId') }),
  domainId: z.string().min(1, { message: createValidationMessage.required('domainId') }),
  topicId: z.string().min(1, { message: createValidationMessage.required('topicId') }),
  subtopicId: z.string().min(1, { message: createValidationMessage.required('subtopicId') }),
  difficulty: difficultySchema,
  estimatedTime: z.number().min(1, { message: "זמן מוערך חייב להיות לפחות דקה אחת" }),
  source: z.object({
    sourceType: z.enum(['exam', 'book', 'author', 'ezpass'] as const, {
      required_error: "חובה לבחור סוג מקור",
      invalid_type_error: "סוג מקור לא חוקי"
    }),
    examTemplateId: z.string().optional(),
    year: z.number().min(1900).max(new Date().getFullYear() + 1).optional(),
    season: z.enum(['spring', 'summer'] as const).optional(),
    moed: z.enum(['a', 'b'] as const).optional(),
    order: z.number().min(1).optional(),
    authorName: z.string().min(2, { message: "שם המחבר חייב להכיל לפחות 2 תווים" }).optional(),
    bookName: z.string().min(2, { message: "שם הספר חייב להכיל לפחות 2 תווים" }).optional(),
    bookLocation: z.string().optional()
  }).superRefine((source, ctx) => {
    // First validate source type exists
    if (!source.sourceType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "חובה לבחור סוג מקור",
        path: ["sourceType"]
      });
      return; // Stop here since we can't validate further without source type
    }

    // Then validate required fields based on source type
    switch (source.sourceType) {
      case 'exam':
        if (!source.examTemplateId) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "תבנית מבחן חסרה",
            path: ["examTemplateId"]
          });
        }
        if (!source.year) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "שנה חסרה",
            path: ["year"]
          });
        }
        if (!source.season) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "תקופה חסרה",
            path: ["season"]
          });
        }
        if (!source.moed) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "מועד חסר",
            path: ["moed"]
          });
        }
        break;
      case 'book':
        if (!source.bookName) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "שם הספר חסר",
            path: ["bookName"]
          });
        }
        break;
      case 'author':
        if (!source.authorName) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "שם המחבר חסר",
            path: ["authorName"]
          });
        }
        break;
      case 'ezpass':
        // No additional fields required for ezpass
        break;
      default:
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "סוג מקור לא חוקי",
          path: ["sourceType"]
        });
    }
  }),
  programmingLanguage: z.enum(['java', 'c#', 'python'] as const).optional(),
  testCases: z.array(z.object({
    input: z.string().min(1, { message: "קלט חסר" }),
    expectedOutput: z.string().min(1, { message: "פלט צפוי חסר" })
  })).optional()
});

// Multiple choice specific schema with enhanced validation
const multipleChoiceSchema = z.object({
  options: z.array(formattedTextSchema)
    .length(4)
    .refine(
      (options) => {
        // Check that options are sufficiently different
        const texts = options.map(opt => opt.text);
        for (let i = 0; i < texts.length; i++) {
          for (let j = i + 1; j < texts.length; j++) {
            const similarity = levenshteinDistance(texts[i], texts[j]) / Math.max(texts[i].length, texts[j].length);
            if (similarity > 0.8) { // If more than 80% similar
              return false;
            }
          }
        }
        return true;
      },
      {
        message: "האפשרויות חייבות להיות שונות מספיק זו מזו"
      }
    )
    .describe(`Exactly 4 options where:
- All options are plausible
- Similar length and structure
- No obviously wrong answers
- Distractors based on common mistakes`),
  correctOption: z.number().int().min(1).max(4)
    .describe('The correct option number (1-4)')
});

// Solution schema with enhanced validation
const solutionSchema = z.object({
  text: z.string()
    .describe(`Detailed solution explanation where:
- For multiple_choice: Explain why correct answer is right and others wrong
- For code: Include complete working solution
- For open: Provide model answer and evaluation criteria
- For step_by_step: Detail each step's solution and progression`),
  format: z.literal('markdown'),
  answer: z.string().optional()
});

// Rubric assessment criteria schema with enhanced validation
const rubricCriterionSchema = z.object({
  name: z.string()
    .min(3, { message: "שם הקריטריון קצר מדי" })
    .describe('The name of the criterion (e.g., Accuracy, Completeness, Clarity)'),
  description: z.string()
    .min(20, { message: "תיאור הקריטריון קצר מדי" })
    .describe('Description of what this criterion evaluates'),
  weight: z.number()
    .min(5, { message: "משקל מינימלי לקריטריון הוא 5%" })
    .max(60, { message: "משקל מקסימלי לקריטריון הוא 60%" })
    .describe('Weight percentage of this criterion')
});

const rubricAssessmentSchema = z.object({
  criteria: z.array(rubricCriterionSchema)
    .min(3, { message: "נדרשים לפחות 3 קריטריונים" })
    .max(7, { message: "מקסימום 7 קריטריונים" })
    .refine(
      (criteria) => {
        const totalWeight = criteria.reduce((sum, criterion) => sum + criterion.weight, 0);
        return Math.abs(totalWeight - 100) < 0.001;
      },
      {
        message: "סכום המשקלים חייב להיות 100%"
      }
    )
    .describe('Array of assessment criteria with weights that must sum to 100')
});

// Answer requirements schema
const answerRequirementsSchema = z.object({
  requiredElements: z.array(z.string())
    .min(1, "Must specify at least one required element")
    .describe('Array of key elements that must be present in a complete answer')
});

// Main question schema with ALL validations that ALWAYS run
export const questionSchema = z.object({
  id: z.string().min(1, { message: "מזהה שאלה חסר" }),
  type: questionTypeSchema,
  content: formattedTextSchema,
  metadata: z.object({
    subjectId: z.string().min(1, { message: createValidationMessage.required('subjectId') }),
    domainId: z.string().min(1, { message: createValidationMessage.required('domainId') }),
    topicId: z.string().min(1, { message: createValidationMessage.required('topicId') }),
    subtopicId: z.string().min(1, { message: createValidationMessage.required('subtopicId') }),
    difficulty: difficultySchema,
    estimatedTime: z.number().min(1, { message: "זמן מוערך חייב להיות לפחות דקה אחת" }),
    source: z.object({
      sourceType: z.enum(['exam', 'book', 'author', 'ezpass'] as const, {
        required_error: "חובה לבחור סוג מקור",
        invalid_type_error: "סוג מקור לא חוקי"
      }),
      examTemplateId: z.string().optional(),
      year: z.number().min(1900).max(new Date().getFullYear() + 1).optional(),
      season: z.enum(['spring', 'summer'] as const).optional(),
      moed: z.enum(['a', 'b'] as const).optional(),
      order: z.number().min(1).optional(),
      authorName: z.string().min(2, { message: "שם המחבר חייב להכיל לפחות 2 תווים" }).optional(),
      bookName: z.string().min(2, { message: "שם הספר חייב להכיל לפחות 2 תווים" }).optional(),
      bookLocation: z.string().optional()
    }).superRefine((source, ctx) => {
      // First validate source type exists
      if (!source.sourceType) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "חובה לבחור סוג מקור",
          path: ["sourceType"]
        });
        return; // Stop here since we can't validate further without source type
      }

      // Then validate required fields based on source type
      switch (source.sourceType) {
        case 'exam':
          if (!source.examTemplateId) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "תבנית מבחן חסרה",
              path: ["examTemplateId"]
            });
          }
          if (!source.year) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "שנה חסרה",
              path: ["year"]
            });
          }
          if (!source.season) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "תקופה חסרה",
              path: ["season"]
            });
          }
          if (!source.moed) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "מועד חסר",
              path: ["moed"]
            });
          }
          break;
        case 'book':
          if (!source.bookName) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "שם הספר חסר",
              path: ["bookName"]
            });
          }
          break;
        case 'author':
          if (!source.authorName) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "שם המחבר חסר",
              path: ["authorName"]
            });
          }
          break;
        case 'ezpass':
          // No additional fields required for ezpass
          break;
        default:
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "סוג מקור לא חוקי",
            path: ["sourceType"]
          });
      }
    }),
    programmingLanguage: z.enum(['java', 'c#', 'python'] as const).optional(),
    testCases: z.array(z.object({
      input: z.string().min(1, { message: "קלט חסר" }),
      expectedOutput: z.string().min(1, { message: "פלט צפוי חסר" })
    })).optional()
  }),
  options: z.array(formattedTextSchema)
    .length(4, { message: "חובה להזין בדיוק 4 אפשרויות" })
    .optional(),
  correctOption: z.number().int().min(1).max(4, { 
    message: "התשובה הנכונה חייבת להיות מספר בין 1 ל-4" 
  }).optional(),
  solution: z.object({
    text: z.string().min(10, { message: "הפתרון קצר מדי" }),
    format: z.literal('markdown'),
    answer: z.string().optional()
  })
}).superRefine((data, ctx) => {
  // Topic hierarchy validations ALWAYS run
  const subject = universalTopicsV2.getSubjectSafe(data.metadata.subjectId);
  if (!subject) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `נושא רחב לא קיים: ${data.metadata.subjectId}`,
      path: ["metadata", "subjectId"]
    });
    // If subject doesn't exist, add errors for all dependent fields
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `לא ניתן לאמת תחום - נושא רחב לא קיים`,
      path: ["metadata", "domainId"]
    });
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `לא ניתן לאמת נושא - נושא רחב לא קיים`,
      path: ["metadata", "topicId"]
    });
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `לא ניתן לאמת תת-נושא - נושא רחב לא קיים`,
      path: ["metadata", "subtopicId"]
    });
    return; // Stop here since we can't validate further without subject
  }

  const domain = universalTopicsV2.getDomainSafe(data.metadata.subjectId, data.metadata.domainId);
  if (!domain) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `תחום '${data.metadata.domainId}' לא קיים בנושא '${subject.name}'`,
      path: ["metadata", "domainId"]
    });
    // If domain doesn't exist, add errors for dependent fields
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `לא ניתן לאמת נושא - תחום לא קיים`,
      path: ["metadata", "topicId"]
    });
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `לא ניתן לאמת תת-נושא - תחום לא קיים`,
      path: ["metadata", "subtopicId"]
    });
    return; // Stop here since we can't validate further without domain
  }

  const topic = universalTopicsV2.getTopicSafe(data.metadata.subjectId, data.metadata.domainId, data.metadata.topicId);
  if (!topic) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `נושא '${data.metadata.topicId}' לא קיים בתחום '${domain.name}'`,
      path: ["metadata", "topicId"]
    });
    // If topic doesn't exist, add error for subtopic
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `לא ניתן לאמת תת-נושא - נושא לא קיים`,
      path: ["metadata", "subtopicId"]
    });
    return; // Stop here since we can't validate further without topic
  }

  const subtopic = universalTopicsV2.getSubTopicSafe(data.metadata.subjectId, data.metadata.domainId, data.metadata.topicId, data.metadata.subtopicId);
  if (!subtopic) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `תת-נושא '${data.metadata.subtopicId}' לא קיים בנושא '${topic.name}'`,
      path: ["metadata", "subtopicId"]
    });
  }

  // Type-specific validations
  switch (data.type) {
    case QuestionType.MULTIPLE_CHOICE:
      if (!data.options) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "שאלת רב-ברירה חייבת לכלול אפשרויות",
          path: ['options']
        });
      } else if (data.options.length !== 4) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "שאלת רב-ברירה חייבת לכלול בדיוק 4 אפשרויות",
          path: ['options']
        });
      }
      if (!data.correctOption) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "שאלת רב-ברירה חייבת לכלול תשובה נכונה",
          path: ['correctOption']
        });
      } else if (data.correctOption < 1 || data.correctOption > 4) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "התשובה הנכונה חייבת להיות מספר בין 1 ל-4",
          path: ['correctOption']
        });
      }
      break;

    case QuestionType.NUMERICAL:
      // Add any numerical question specific validations here
      break;

    case QuestionType.OPEN:
      // Add any open question specific validations here
      break;
  }
}); 