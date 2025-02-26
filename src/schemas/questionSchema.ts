import { z } from 'zod';
import { DifficultyLevel, ProgrammingLanguage, QuestionType, SourceType } from '../types/question';
import { universalTopics } from '../services/universalTopics';

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

export const questionTypeSchema = z.enum(['multiple_choice', 'open', 'code', 'step_by_step'] as const);

// More question-specific schemas can be added here...

// Common schema for text with markdown format
const formattedTextSchema = z.object({
  text: z.string()
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
          if (!lines[0].match(/^```[a-z]*$/)) {
            console.error('Code block validation error: Invalid opening line', { firstLine: lines[0] });
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
        message: "Text must be valid markdown with properly formatted code blocks"
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
const sourceTypeSchema = z.nativeEnum(SourceType);

// Metadata schema with specific requirements and topic validation
const metadataSchema = z.object({
  topicId: z.string().describe('Main topic identifier from the curriculum (e.g., "linear_equations", "data_structures")'),
  subtopicId: z.string().optional().describe('Optional subtopic for more specific categorization'),
  difficulty: difficultySchema,
  estimatedTime: z.number().optional()
    .describe('Estimated time to solve in minutes, appropriate for the education level'),
  source: z.object({
    sourceType: sourceTypeSchema.describe('Type of the source'),
    examTemplateId: z.string().optional().describe('ID of the exam template if source is exam'),
    year: z.number().optional().describe('Year the question was used/created'),
    season: z.string().optional().describe('Season/term (e.g., "winter", "summer")'),
    moed: z.string().optional().describe('Specific exam instance (e.g., "a", "b")'),
    authorName: z.string().optional().describe('Author name if source is author'),
    bookName: z.string().optional().describe('Book name if source is book'),
    bookLocation: z.string().optional().describe('Book location/reference if source is book')
  })
  .refine(
    (source) => {
      switch (source.sourceType) {
        case 'exam':
          return !!source.examTemplateId;
        case 'book':
          return !!source.bookName;
        case 'author':
          return !!source.authorName;
        case 'ezpass':
          return true;
        default:
          return false;
      }
    },
    {
      message: "Required fields missing for the specified source type"
    }
  )
  .describe('Source information for tracking question origin')
});

// Multiple choice specific schema
const multipleChoiceSchema = z.object({
  options: z.array(formattedTextSchema).length(4)
    .describe(`Exactly 4 options where:
- All options are plausible
- Similar length and structure
- No obviously wrong answers
- Distractors based on common mistakes`),
  correctOption: z.number().int().min(1).max(4)
    .describe('The correct option number (1-4)')
});

// Solution schema with type-specific requirements
const solutionSchema = z.object({
  text: z.string().describe(`Detailed solution explanation where:
- For multiple_choice: Explain why correct answer is right and others wrong
- For code: Include complete working solution with complexity analysis
- For open: Provide model answer and evaluation criteria
- For step_by_step: Detail each step's solution and progression`),
  format: z.literal('markdown'),
  answer: z.string().optional().describe(`Optional final answer, present only when there's a distinct final answer separate from solution steps.
Not needed for questions where:
- The answer is simple (e.g., multiple choice)
- The solution steps ARE the answer`)
});

// Rubric assessment criteria schema
const rubricCriterionSchema = z.object({
  name: z.string().min(1).describe('The name of the criterion (e.g., Accuracy, Completeness, Clarity)'),
  description: z.string().min(1).describe('Description of what this criterion evaluates'),
  weight: z.number().min(0).max(100).describe('Weight percentage of this criterion')
});

const rubricAssessmentSchema = z.object({
  criteria: z.array(rubricCriterionSchema)
    .min(1)
    .refine(
      (criteria) => {
        const totalWeight = criteria.reduce((sum, criterion) => sum + criterion.weight, 0);
        return Math.abs(totalWeight - 100) < 0.001; // Allow for small floating point differences
      },
      {
        message: "The sum of all criteria weights must equal 100%"
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

// Main question schema that matches our Question type exactly
export const questionSchema = z.object({
  id: z.string().describe('Unique identifier for the question, generated at runtime'),
  type: questionTypeSchema,
  content: formattedTextSchema.describe(`Question content with requirements varying by type:
- multiple_choice: Clear, unambiguous text with all necessary information
- code: Problem specification with input/output requirements and constraints
- open: Focused problem statement with clear deliverables
- step_by_step: Progressive problem with clear steps and progression`),
  metadata: metadataSchema,
  options: z.array(formattedTextSchema).length(4).optional()
    .describe('For multiple choice only: Exactly 4 options, all plausible, similar structure, based on common mistakes'),
  correctOption: z.number().int().min(1).max(4).optional()
    .describe('For multiple choice only: The correct option number (1-4)'),
  rubricAssessment: rubricAssessmentSchema,
  solution: z.object({
    text: z.string().describe('Complete solution explanation in markdown format'),
    format: z.literal('markdown').describe('Format specification for solution rendering')
  }).describe('Complete solution and explanation for the question')
}); 