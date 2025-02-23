import { z } from 'zod';
import { StructuredOutputParser } from 'langchain/output_parsers';
import { logger } from './logger';
import { ExamType } from '../types/examTemplate';

/**
 * Standard formatting instructions for all LLM responses
 */
export const MARKDOWN_GUIDELINES = `
All text fields must use markdown formatting with:
- Mathematical expressions in $...$ for inline and $$...$$ for block math
- Code in language-specific blocks with \`\`\`language
- Bold text with **emphasis**
- Lists with - or 1. prefixes
- RTL text should be properly formatted
- LaTeX commands should use single backslashes`;

/**
 * Standard language requirements for Hebrew LLM responses
 */
export const HEBREW_LANGUAGE_REQUIREMENTS = `
LANGUAGE REQUIREMENTS:
- Generate ALL content in Hebrew (עברית)
- Question text must be in Hebrew
- Options must be in Hebrew
- Solution explanation must be in Hebrew
- Keep mathematical terms and symbols in English/LaTeX
- Text direction should be RTL (right-to-left)

FORMATTING REQUIREMENTS:
1. Question Content:
   - Clear, unambiguous text in Hebrew
   - All necessary information included
   - Use markdown for formatting
   - For math: use LaTeX notation within $$ markers
   - Text should be RTL (right-to-left)

2. Code Content:
   - Clear problem specification in Hebrew
   - Use code blocks with language syntax
   - Include required imports/dependencies
   - Use markdown code blocks
   - Keep variable/function names in English
   - Write comments in Hebrew

3. Solution:
   - Detailed explanation in Hebrew
   - Complete solution process
   - Use markdown formatting
   - For math: use LaTeX notation
   - Highlight key points and common mistakes`;

/**
 * Builds an expert role description with exam context
 */
export function buildExpertRoleDescription(
  subject: string,
  examType: ExamType,
  examName: string
): string {
  // Exam-specific context - keep this minimal and focused
  let examContext = '';
  switch (examType) {
    case ExamType.MAHAT_EXAM:
      examContext = `This is a MAHAT exam, a technical college certification exam that requires demonstrating both theoretical knowledge and practical understanding of industry standards.`;
      break;
    case ExamType.BAGRUT_EXAM:
      examContext = `This is a Bagrut exam, the Israeli high school matriculation exam that tests comprehensive understanding of the curriculum.`;
      break;
    case ExamType.UNI_COURSE_EXAM  :
      examContext = `This is a university-level exam that requires demonstrating in-depth academic understanding.`;
      break;
    case ExamType.GOVERNMENT_EXAM:
      examContext = `This is a government certification exam that focuses on regulatory requirements and professional standards.`;
      break;
    default:
      examContext = `This is a professional certification exam that evaluates practical knowledge and industry standards.`;
  }

  // Common expert description that applies to all types
  return `You are an expert in ${subject}, specializing in ${examName}. ${examContext}

As a subject matter expert and experienced educator, your role is to provide detailed, structured, and instructive feedback. You have:
- Deep theoretical knowledge and practical experience in ${subject}
- Extensive familiarity with professional terminology, standards, and best practices
- Years of experience preparing and evaluating students
- Expert ability to identify knowledge gaps and misconceptions
- Strong track record of helping students improve their understanding and performance

When evaluating answers, you focus on:
- Accuracy and completeness of the response
- Proper use of professional terminology
- Understanding of core principles and their applications
- Connection to real-world scenarios and practical implications
- Common mistakes and how to avoid them
- Specific, actionable recommendations for improvement

Your feedback should be:
- Clear and well-structured
- Encouraging while maintaining high standards
- Focused on learning and improvement
- Rich with relevant examples and explanations
- Practical and immediately applicable`;
}

/**
 * Builds a system message for feedback generation based on subject and level
 */
export function buildSystemMessage(
  subject: string,
  examType: ExamType,
  examName: string
): string {
  let level: keyof typeof EXPERT_ROLES;
  
  // Determine education level based on exam type
  switch (examType) {
    case ExamType.MAHAT_EXAM:
    case ExamType.GOVERNMENT_EXAM:
      level = 'technical';
      break;
    case ExamType.BAGRUT_EXAM:
      level = 'high_school';
      break;
    case ExamType.UNI_COURSE_EXAM:
      level = 'university';
      break;
    default:
      level = 'professional';
  }

  const roleDescription = buildExpertRoleDescription(subject, examType, examName);
  return `${roleDescription}\n\nAs a ${level} educator in ${subject}, ${EXPERT_ROLES[level]}`;
}

/**
 * OpenAI model configurations for different use cases
 */
export const OPENAI_MODELS = {
  // For complex analysis requiring deep understanding
  analysis: {
    model: "gpt-4-0125-preview",  // Latest model with strongest analytical capabilities
    temperature: 0.1,
    response_format: { type: "json_object" }
  },
  
  // For standard feedback generation
  feedback: {
    model: "gpt-4-0125-preview",
    temperature: 0.2,  // Slightly more creative for feedback
    response_format: { type: "json_object" }
  },
  
  // For quick validations/simple feedback
  validation: {
    model: "gpt-3.5-turbo-0125",  // Faster, cheaper for simple tasks
    temperature: 0.1,
    response_format: { type: "json_object" }
  }
};

/**
 * Default configuration for OpenAI API calls
 */
export const OPENAI_CONFIG = OPENAI_MODELS.feedback; // Use feedback as default

/**
 * Builds a standard prompt with formatting guidelines
 */
export function buildPrompt(
  task: string,
  context: Record<string, string>,
  formatInstructions?: string
): string {
  return `${task}

CONTEXT:
${Object.entries(context)
  .map(([key, value]) => `${key}: ${value}`)
  .join('\n')}

${formatInstructions ? `RESPONSE FORMAT:
${formatInstructions}` : ''}`;
}

/**
 * Creates a parser for a Zod schema with standard error handling
 */
export function createParser<T extends z.ZodType>(
  schema: T,
  schemaName: string
): StructuredOutputParser<T> {
  try {
    return StructuredOutputParser.fromZodSchema(schema);
  } catch (error) {
    logger.error(`Failed to create parser for ${schemaName}`, { error });
    throw error;
  }
}

/**
 * Validates and processes an OpenAI response
 */
export async function processResponse<T>(
  response: string,
  schema: z.ZodType<T>,
  context: Record<string, string> = {}
): Promise<T> {
  try {
    // Parse JSON
    const parsed = JSON.parse(response);
    
    // Validate against schema
    const validated = schema.parse(parsed);
    
    logger.info('Successfully processed LLM response', {
      ...context,
      schema: schema.description
    });
    
    return validated;
  } catch (error) {
    logger.error('Failed to process LLM response', {
      error,
      response,
      ...context
    });
    throw error;
  }
}

export const EXPERT_ROLES = {
  high_school: "You are a teacher with extensive experience teaching high school students...",
  technical: "You are an instructor at a technical college...",
  university: "You are a professor at a leading university...",
  professional: "You are a senior professional with years of industry experience..."
} as const;

export type LevelType = keyof typeof EXPERT_ROLES; 