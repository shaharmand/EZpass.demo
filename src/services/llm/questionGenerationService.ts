import OpenAI from 'openai';
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { questionSchema } from "../../schemas/questionSchema";
import { 
  Question, 
  QuestionType, 
  QuestionFetchParams, 
  DifficultyLevel, 
  SourceType, 
  EzpassCreatorType,
  PublicationStatusEnum,
  EMPTY_EVALUATION_GUIDELINES,
  FinalAnswerType,
  AnswerFormatRequirements,
  FullAnswer
} from "../../types/question";
import { universalTopics } from "../universalTopics";
import type { Domain, Topic } from "../../types/subject";
import { logger } from '../../utils/logger';
import { CRITICAL_SECTIONS } from '../../utils/logger';
import { buildQuestionSystemMessage } from './aiSystemMessages';
import { questionStorage } from '../admin/questionStorage';
import { ExamType } from '../../types/examTemplate';
import { generateQuestionId } from '../../utils/idGenerator';

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export class QuestionService {
  private llm: OpenAI;
  private parser: StructuredOutputParser<typeof questionSchema>;
  private requestTracker = {
    total: 0,
    success: 0,
    failures: 0,
    lastRequest: 0,
    rateLimitHits: 0
  };

  private readonly RATE_LIMITS = {
    requestsPerMinute: 20,
    cooldownPeriod: 60000, // 1 minute in milliseconds
    maxConsecutiveFailures: 3
  };

  // Cache only for questions generated in current session
  private generationCache: Map<string, Question> = new Map();

  constructor() {
    this.llm = openai;
    this.parser = StructuredOutputParser.fromZodSchema(questionSchema);
  }

  private checkRateLimits(): boolean {
    const now = Date.now();
    const timeSinceLastRequest = now - this.requestTracker.lastRequest;

    // If we've hit rate limits recently, enforce a cooldown
    if (this.requestTracker.rateLimitHits > 0) {
      if (timeSinceLastRequest < this.RATE_LIMITS.cooldownPeriod) {
        return false;
      }
      // Reset rate limit counter after cooldown
      this.requestTracker.rateLimitHits = 0;
    }

    // Check if we're within the requests per minute limit
    if (this.requestTracker.total >= this.RATE_LIMITS.requestsPerMinute) {
      if (timeSinceLastRequest < this.RATE_LIMITS.cooldownPeriod) {
        this.requestTracker.rateLimitHits++;
        return false;
      }
      // Reset counter after cooldown
      this.requestTracker.total = 0;
    }

    return true;
  }

  private updateRequestTracker(success: boolean, is429Error: boolean = false) {
    this.requestTracker.total++;
    this.requestTracker.lastRequest = Date.now();

    if (success) {
      this.requestTracker.success++;
      this.requestTracker.failures = 0; // Reset consecutive failures
    } else {
      this.requestTracker.failures++;
      if (is429Error) {
        this.requestTracker.rateLimitHits++;
      }
    }

    // Log if we're approaching limits
    if (this.requestTracker.total > this.RATE_LIMITS.requestsPerMinute * 0.8) {
      console.warn('Approaching rate limit:', {
        total: this.requestTracker.total,
        limit: this.RATE_LIMITS.requestsPerMinute
      });
    }
  }

  private async buildPrompt(params: QuestionFetchParams, metadataRequirements: string): Promise<string> {
    const formatInstructions = await this.parser.getFormatInstructions();
    
    return `Generate a ${params.type} question in ${params.subject} for ${params.educationType} students.

METADATA REQUIREMENTS:
- Always include creatorType: "ai" in the source object
- Source object must have both sourceType and creatorType fields
${metadataRequirements}

LANGUAGE REQUIREMENTS:
- Generate ALL content in Hebrew (עברית)
- Question text must be in Hebrew
- Options must be in Hebrew
- Solution explanation must be in Hebrew
- Keep mathematical terms and symbols in English/LaTeX
- Text direction should be RTL (right-to-left)
- For math formulas:
  - Use $...$ for inline math
  - Use $$...$$ for display math (centered)
  - NEVER include Hebrew text inside math delimiters
  - Use English/Latin characters for variables
  - Write units in Hebrew OUTSIDE the math delimiters
  - Basic LaTeX commands:
    - Fractions: \frac{a}{b}
    - Square root: \sqrt{x}
    - Powers: x^2 or x_n
    - Greek letters: \alpha, \beta, \theta
    
  CRITICAL RULES FOR HEBREW AND MATH:
  1. NEVER put Hebrew text inside $...$ or $$...$$
  2. NEVER use \text{} with Hebrew inside math
  3. Write all units in Hebrew AFTER the math block
  4. Use English subscripts for variables
  
  EXAMPLES:
  ❌ WRONG: $v_{סופי}$ - Hebrew subscript inside math
  ✅ RIGHT: $v_{final}$ (מהירות סופית)
  
  ❌ WRONG: $$F = ma \text{ניוטון}$$ - Hebrew unit inside math
  ✅ RIGHT: $$F = ma$$ ניוטון
  
  ❌ WRONG: $\text{מהירות} = v$ - Hebrew text inside math
  ✅ RIGHT: מהירות = $v$
  
  ❌ WRONG: $$\frac{\text{כוח}}{\text{שטח}}$$ - Hebrew fractions
  ✅ RIGHT: יחס בין כוח לשטח: $$\frac{F}{A}$$

DIFFICULTY LEVEL SCALE:
1 (קל מאוד): Basic concept, single step
2 (קל): Simple problem, 2 steps
3 (בינוני): Multiple concepts, 3-4 steps
4 (קשה): Complex analysis, multiple approaches
5 (קשה מאוד): Advanced integration of concepts

${params.type === QuestionType.MULTIPLE_CHOICE ? `
MULTIPLE CHOICE QUESTION REQUIREMENTS:

1. Question Content:
   - Clear, unambiguous question text in Hebrew
   - All necessary information included
   - No trick questions or misleading wording
   - Use markdown for formatting
   - For math: use LaTeX notation within $$ markers
   - Text should be RTL (right-to-left)

2. Options:
   - Exactly 4 options (no more, no less)
   - All options in Hebrew
   - One clearly correct answer
   - Plausible distractors based on common mistakes
   - All options similar in length and structure
   - Options in markdown format
   - CorrectOption must be 1, 2, 3, or 4

3. Solution:
   - Explain why the correct answer is right (in Hebrew)
   - Point out why other options are incorrect
   - Include complete solution process
   - Highlight common misconceptions
` : params.type === QuestionType.OPEN ? `
OPEN QUESTION REQUIREMENTS:

1. Question Content:
   - Clear, focused problem statement in Hebrew
   - All necessary context provided
   - Specific deliverables required
   - Use markdown for formatting
   - For math: use LaTeX notation

2. Structure:
   - Break down into sub-questions if needed
   - Clear evaluation criteria
   - Word/length guidelines if applicable

3. Solution:
   - Comprehensive model answer in Hebrew
   - Multiple valid approaches if applicable
   - Evaluation rubric/criteria
   - Common mistakes to avoid
` : params.type === QuestionType.NUMERICAL ? `
NUMERICAL QUESTION REQUIREMENTS:

1. Question Content:
   - Mathematical/physical problem requiring numerical or formula solution in Hebrew
   - Clear progression from given values to final answer
   - All equations, units and constants provided upfront
   - Use LaTeX notation for math formulas:
     - Display equations: $$\begin{align*} F_{max} &= \frac{W}{FS} \end{align*}$$
     - Inline equations: כאשר $F_{max}$ הוא הכוח המקסימלי
   - Include diagrams/figures when relevant

2. Structure:
   - Break down complex calculation into clear steps
   - Each step yields intermediate numerical result
   - Show units and significant figures
   - Guide student through mathematical reasoning
   - Provide validation checks for intermediate results

3. Solution:
   - Complete step-by-step calculation in Hebrew
   - Show all mathematical work and unit conversions
   - Explain each mathematical operation and formula used
   - Include numerical answer with correct units
   - Common calculation mistakes to watch for
` : ''}

SCHEMA VALIDATION REQUIREMENTS:
${formatInstructions}

Required fields and structure:
{
  "type": "${params.type}",
  "content": {
    "text": "Your question text here",
    "format": "markdown"
  },
  "metadata": {
    "type": "${params.type}",
    "difficulty": "${params.difficulty}",
    "answerFormat": {
      "format": "markdown"
    },
    "source": {
      "sourceType": "ezpass",
      "creatorType": "ai"
    }
  },
  "solution": {
    "text": "Step by step solution here",
    "format": "markdown"
  }
}

IMPORTANT: Focus on generating high-quality question content and solution. The system will handle other metadata fields.
`;
  }

  private async generateQuestionId(subjectId: string, domainId: string): Promise<string> {
    // Get next available number from storage
    const nextNumber = await questionStorage.getNextQuestionId(subjectId, domainId);
    
    // Format the ID: XXX-YYY-NNNNNN
    return `${subjectId}-${domainId}-${String(nextNumber).padStart(6, '0')}`;
  }

  async generateQuestion(params: QuestionFetchParams): Promise<Question> {
    try {
      // Check rate limits
      if (!this.checkRateLimits()) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }

      // Get subject and domain info for ID generation
      const subject = universalTopics.getSubjectForTopic(params.topic);
      if (!subject) {
        throw new Error(`Subject not found for topic ${params.topic}`);
      }

      const domain = subject.domains.find(d => 
        d.topics.some(t => t.id === params.topic)
      );
      if (!domain) {
        throw new Error(`Domain not found for topic ${params.topic}`);
      }

      // Generate question ID
      const questionId = await generateQuestionId(subject.code, domain.code);

      // Build metadata requirements
      const metadataRequirements = `
METADATA REQUIREMENTS:
The metadata object MUST follow this exact structure:
{
  "metadata": {
    "subjectId": "${subject.code}",
    "domainId": "${domain.code}",
    "topicId": "${params.topic}",
    "subtopicId": "${params.subtopic || ''}",
    "type": "${params.type}",
    "difficulty": "${params.difficulty}",
    "estimatedTime": 10,
    "answerFormat": {
      "format": "markdown",
      "requirements": {
        "maxLength": 1000,
        "minLength": 50
      }
    },
    "source": {
      "type": "ezpass",
      "creatorType": "ai"
    }
  }
}

IMPORTANT: ALL fields shown above are REQUIRED and must be included exactly as shown.
`;

      // Build the prompt
      const prompt = await this.buildPrompt(params, metadataRequirements);

      // Get response from OpenAI
      const response = await this.llm.chat.completions.create({
        model: 'gpt-4-0125-preview',
        messages: [
          {
            role: 'system',
            content: buildQuestionSystemMessage(
              params.subject,
              ExamType.UNI_COURSE_EXAM, // Use proper enum value
              params.subject // Use subject name as exam name
            )
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      // Log raw response for debugging
      logger.debug('📥 Raw OpenAI Response:', {
        content: response.choices[0].message.content,
        usage: response.usage,
        model: response.model,
        tokens: {
          prompt: response.usage?.prompt_tokens,
          completion: response.usage?.completion_tokens,
          total: response.usage?.total_tokens
        }
      });

      // Parse and validate the response
      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }

      // Analyze response for debugging
      const analysis = {
        originalLength: content.length,
        cleanedLength: content.length,
        hasLeadingWhitespace: /^\s/.test(content),
        hasTrailingWhitespace: /\s$/.test(content),
        hasBOM: content.charCodeAt(0) === 0xFEFF,
        firstChar: content[0],
        lastChar: content[content.length - 1]
      };
      logger.debug('📥 Response Analysis:', analysis);

      try {
        const parsedQuestion = await this.parser.parse(content);
        
        // Ensure creatorType is set to AI
        if (!parsedQuestion.metadata?.source) {
          parsedQuestion.metadata = {
            ...parsedQuestion.metadata,
            source: {
              type: 'ezpass' as const,
              creatorType: EzpassCreatorType.AI
            }
          };
        }

        // Add required properties
        const answerFormat: AnswerFormatRequirements = {
          hasFinalAnswer: params.type === QuestionType.MULTIPLE_CHOICE || params.type === QuestionType.NUMERICAL,
          finalAnswerType: params.type === QuestionType.MULTIPLE_CHOICE ? 'multiple_choice' as const : 
                         params.type === QuestionType.NUMERICAL ? 'numerical' as const : 
                         'none' as const,
          requiresSolution: true
        };

        const metadata = {
          subjectId: subject.code,
          domainId: domain.code,
          topicId: params.topic,
          subtopicId: params.subtopic,
          type: params.type,
          difficulty: params.difficulty,
          estimatedTime: 10,
          answerFormat,
          source: {
            type: 'ezpass' as const,
            creatorType: EzpassCreatorType.AI
          }
        } satisfies Question['metadata'];

        const schoolAnswer: FullAnswer = {
          finalAnswer: answerFormat.finalAnswerType !== 'none' ? (
            answerFormat.finalAnswerType === 'multiple_choice' && parsedQuestion.correctOption 
              ? { type: 'multiple_choice' as const, value: parsedQuestion.correctOption as 1 | 2 | 3 | 4 }
              : answerFormat.finalAnswerType === 'numerical' && parsedQuestion.solution?.text
              ? { 
                  type: 'numerical' as const, 
                  value: 0, // Will be extracted from solution text by validation
                  tolerance: 0.01, // Default 1% tolerance
                  unit: undefined // Will be extracted from solution text by validation
                }
              : undefined
          ) : undefined,
          solution: {
            text: parsedQuestion.solution.text,
            format: 'markdown'
          }
        };

        const question: Question = {
          id: questionId,
          content: {
            text: parsedQuestion.content.text,
            format: 'markdown',
            ...(params.type === QuestionType.MULTIPLE_CHOICE && parsedQuestion.options ? {
              options: parsedQuestion.options.map((opt: { text: string; format: string }) => ({
                text: opt.text,
                format: 'markdown'
              }))
            } : {})
          },
          metadata,
          schoolAnswer,
          evaluationGuidelines: EMPTY_EVALUATION_GUIDELINES
        };

        return question;
      } catch (parseError) {
        logger.error('📋 Schema Validation Error:', parseError);
        
        // Try to extract the question data even if validation fails
        try {
          const jsonData = JSON.parse(content);
          
          // Ensure creatorType is set
          if (jsonData.metadata?.source) {
            jsonData.metadata.source.creatorType = EzpassCreatorType.AI;
          }
          
          // Add required properties
          const answerFormat: AnswerFormatRequirements = {
            hasFinalAnswer: params.type === QuestionType.MULTIPLE_CHOICE || params.type === QuestionType.NUMERICAL,
            finalAnswerType: params.type === QuestionType.MULTIPLE_CHOICE ? 'multiple_choice' as const : 
                           params.type === QuestionType.NUMERICAL ? 'numerical' as const : 
                           'none' as const,
            requiresSolution: true
          };

          const metadata = {
            subjectId: subject.code,
            domainId: domain.code,
            topicId: params.topic,
            subtopicId: params.subtopic,
            type: params.type,
            difficulty: params.difficulty,
            estimatedTime: 10,
            answerFormat,
            source: {
              type: 'ezpass' as const,
              creatorType: EzpassCreatorType.AI
            }
          } satisfies Question['metadata'];

          const schoolAnswer: FullAnswer = {
            finalAnswer: answerFormat.finalAnswerType !== 'none' ? (
              answerFormat.finalAnswerType === 'multiple_choice' && jsonData.correctOption 
                ? { type: 'multiple_choice' as const, value: jsonData.correctOption as 1 | 2 | 3 | 4 }
                : answerFormat.finalAnswerType === 'numerical' && jsonData.solution?.text
                ? { 
                    type: 'numerical' as const, 
                    value: 0, // Will be extracted from solution text by validation
                    tolerance: 0.01, // Default 1% tolerance
                    unit: undefined // Will be extracted from solution text by validation
                  }
                : undefined
            ) : undefined,
            solution: {
              text: jsonData.solution.text,
              format: 'markdown'
            }
          };

          const question: Question = {
            id: questionId,
            content: {
              text: jsonData.content.text,
              format: 'markdown',
              ...(params.type === QuestionType.MULTIPLE_CHOICE && jsonData.options ? {
                options: jsonData.options.map((opt: { text: string; format: string }) => ({
                  text: opt.text,
                  format: 'markdown'
                }))
              } : {})
            },
            metadata: {
              subjectId: subject.code,
              domainId: domain.code,
              topicId: params.topic,
              subtopicId: params.subtopic,
              type: params.type,
              difficulty: params.difficulty,
              estimatedTime: 10,
              answerFormat: {
                hasFinalAnswer: params.type === QuestionType.MULTIPLE_CHOICE || params.type === QuestionType.NUMERICAL,
                finalAnswerType: params.type === QuestionType.MULTIPLE_CHOICE ? 'multiple_choice' as const : 
                               params.type === QuestionType.NUMERICAL ? 'numerical' as const : 
                               'none' as const,
                requiresSolution: true
              },
              source: {
                type: 'ezpass' as const,
                creatorType: EzpassCreatorType.AI
              }
            },
            schoolAnswer: {
              finalAnswer: metadata.answerFormat.finalAnswerType !== 'none' ? (
                metadata.answerFormat.finalAnswerType === 'multiple_choice' && jsonData.correctOption 
                  ? { type: 'multiple_choice' as const, value: jsonData.correctOption as 1 | 2 | 3 | 4 }
                  : metadata.answerFormat.finalAnswerType === 'numerical' && jsonData.solution?.text
                  ? { 
                      type: 'numerical' as const, 
                      value: 0, // Will be extracted from solution text by validation
                      tolerance: 0.01, // Default 1% tolerance
                      unit: undefined // Will be extracted from solution text by validation
                    }
                  : undefined
              ) : undefined,
              solution: {
                text: jsonData.solution.text,
                format: 'markdown'
              }
            },
            evaluationGuidelines: EMPTY_EVALUATION_GUIDELINES
          } satisfies Question;
          
          // Try parsing again with fixed data
          const parsedQuestion = await this.parser.parse(JSON.stringify(question));
          return question; // Return the original typed question instead of the parsed one
        } catch (jsonError) {
          logger.error('❌ Final Parse Error:', {
            error: parseError,
            processedContent: content
          });
          throw parseError;
        }
      }
    } catch (error) {
      logger.error('❌ Error generating question:', error);
      throw error;
    }
  }
}

export const questionService = new QuestionService(); 