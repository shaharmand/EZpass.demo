import { z } from 'zod';
import { DifficultyLevel, ProgrammingLanguage, QuestionType } from '../types/question';

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
    .describe('Content text in markdown format. Use LaTeX within $$ for math formulas, code blocks with language specification for code.'),
  format: z.literal('markdown').describe('Format specification for content rendering')
});

// Metadata schema with specific requirements
const metadataSchema = z.object({
  topicId: z.string().describe('Main topic identifier from the curriculum (e.g., "linear_equations", "data_structures")'),
  subtopicId: z.string().optional().describe('Optional subtopic for more specific categorization'),
  difficulty: difficultySchema,
  estimatedTime: z.number().optional()
    .describe('Estimated time to solve in minutes, appropriate for the education level'),
  source: z.object({
    examType: z.string().describe('Origin of the question (e.g., "practice", "bagrut", "mahat")'),
    year: z.number().optional().describe('Year the question was used/created'),
    season: z.string().optional().describe('Season/term (e.g., "winter", "summer")'),
    moed: z.string().optional().describe('Specific exam instance (e.g., "a", "b")')
  }).optional().describe('Source information for tracking question origin')
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