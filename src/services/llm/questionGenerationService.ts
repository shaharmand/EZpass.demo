import OpenAI from 'openai';
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { questionSchema } from "../../schemas/questionSchema";
import { Question, QuestionType, QuestionFetchParams, DifficultyLevel, SourceType } from "../../types/question";
import { universalTopics } from "../universalTopics";
import type { Domain, Topic } from "../../types/subject";
import { logger } from '../../utils/logger';
import { CRITICAL_SECTIONS } from '../../utils/logger';
import { buildQuestionSystemMessage } from './aiSystemMessages';
import { QuestionIdGenerator } from '../../utils/questionIdGenerator';
import { questionStorage } from '../admin/questionStorage';

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

${metadataRequirements}

ANSWER REQUIREMENTS:
You MUST include a list of required elements that must be present in a complete answer. These will be used to evaluate student responses. For example:

For open questions:
- Key concepts that must be mentioned
- Required formulas or equations
- Critical analysis points
- Important conclusions

For code questions:
- Required functions/methods
- Essential algorithms
- Error handling
- Input validation
- Performance considerations

For step-by-step:
- All required calculation steps
- Specific formulas used
- Unit conversions
- Final answer with units

RUBRIC ASSESSMENT REQUIREMENTS:
You MUST include assessment criteria that sum to 100%. Include the following for each question:

2. For open questions:
   - Accuracy (40%): Correctness of the solution
   - Methodology (30%): Proper problem-solving approach
   - Clarity (30%): Clear and organized presentation

3. For code questions:
   - Functionality (40%): Code works as required
   - Efficiency (20%): Optimal solution and performance
   - Style (20%): Code organization and readability
   - Testing (20%): Handling edge cases

4. For step-by-step:
   - Process (40%): Following correct solution steps
   - Calculations (30%): Accurate computations
   - Validation (30%): Checking results at each step

${params.type === 'multiple_choice' ? `
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
` : params.type === 'code' ? `
CODE QUESTION REQUIREMENTS:

1. Question Content:
   - Clear problem specification in Hebrew
   - Input/output requirements
   - Constraints and edge cases
   - Use code blocks with language syntax
   - Include example inputs/outputs

2. Setup:
   - Provide necessary starter code
   - Specify language/framework versions
   - Include required imports/dependencies
   - Use markdown code blocks

3. Solution:
   - Complete working code solution
   - Detailed explanation in Hebrew
   - Time/space complexity analysis
   - Alternative approaches
   - Common pitfalls to avoid
` : params.type === 'open' ? `
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
` : `
STEP-BY-STEP QUESTION REQUIREMENTS:

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
`}

SCHEMA VALIDATION REQUIREMENTS:
${formatInstructions}

IMPORTANT: 
1. The response MUST include an evaluation object that contains:
   - rubricAssessment: An object with criteria that sum to exactly 100% weights
   - answerRequirements: An object with a list of requiredElements

Example structure:
{
  "evaluation": {
    "rubricAssessment": {
      "criteria": [
        {
          "name": "Accuracy",
          "description": "...",
          "weight": 40
        },
        // ... more criteria
      ]
    },
    "answerRequirements": {
      "requiredElements": [
        "First required element",
        "Second required element"
      ]
    }
  }
}`;
  }

  async generateQuestion(params: QuestionFetchParams): Promise<Question> {
    // Add detailed parameter logging
    logger.info('Generating question with parameters:', {
      topic: params.topic,
      subtopic: params.subtopic,
      difficulty: params.difficulty,
      type: params.type,
      subject: params.subject
    });

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

    try {
      // Generate question ID first
      const questionId = await QuestionIdGenerator.generateQuestionId(subject.code, domain.code);
      
      console.log('%c🎯 Generating Question:', 'color: #2563eb; font-weight: bold', {
        topic: params.topic,
        type: params.type,
        difficulty: params.difficulty,
        subject: params.subject,
        educationType: params.educationType
      });
      
      const systemPrompt = 'You are an expert educator specializing in creating high-quality exam questions. ' +
        'IMPORTANT: For ALL code examples in the response:\n' +
        '1. Include code as normal text in the markdown content\n' +
        '2. Do not use any special formatting or backticks\n' +
        '3. Code must be left-aligned and properly indented\n' +
        '4. Example of how to include code in markdown text:\n\n' +
        'Here is the code:\n\n' +
        'public class Example {\n' +
        '    public static void main(String[] args) {\n' +
        '        System.out.println("Hello");\n' +
        '    }\n' +
        '}\n';

      console.log('%c📋 System Message:', 'color: #059669; font-weight: bold', '\n' + systemPrompt);
      
      // Get subject and domain info for metadata requirements
      const subjectInfo = universalTopics.getSubjectForTopic(params.topic);
      const domainInfo = subjectInfo?.domains.find((d: Domain) => 
        d.topics.some((t: Topic) => t.id === params.topic)
      );

      if (!subjectInfo || !domainInfo) {
        throw new Error(`Invalid topic ID: ${params.topic} - Cannot find subject or domain`);
      }

      const metadataRequirements = `METADATA REQUIREMENTS:
1. Difficulty: Use exactly ${params.difficulty} (no other value is acceptable)
2. EstimatedTime: MUST provide a numeric value in minutes (e.g., 15 for a 15-minute question). Choose a realistic time for ${params.educationType} level.
3. SubjectId: Use "${subjectInfo.id}"
4. DomainId: Use "${domainInfo.id}"
5. TopicId: Use "${params.topic}"
${params.subtopic ? `6. SubtopicId: Use "${params.subtopic}"` : ''}
7. Type: Use "${params.type}"
8. Source: Use sourceType "${SourceType.Ezpass}"

IMPORTANT: You MUST include all of the above metadata fields in your response, using the exact values provided. The response will be rejected if any fields are missing or have incorrect values.`;
      
      const prompt = await this.buildPrompt(params, metadataRequirements);
      console.log('%c📝 OpenAI Prompt:', 'color: #059669; font-weight: bold', '\n' + prompt);
      
      const response = await this.llm.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        model: "gpt-4-turbo-preview",
        temperature: 0.7,
        response_format: { type: "json_object" }
      });

      // Log the raw response for debugging
      console.log('%c📥 Raw OpenAI Response:', 'color: #059669; font-weight: bold', {
        content: response.choices[0].message.content,
        usage: response.usage,
        model: response.model,
        tokens: {
          prompt: response.usage?.prompt_tokens,
          completion: response.usage?.completion_tokens,
          total: response.usage?.total_tokens
        }
      });

      // PHASE 1: Immediate raw response analysis
      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('Unexpected response format from OpenAI');
      }

      // Clean up the response content
      let cleanContent = content
        .trim() // Remove leading/trailing whitespace and newlines
        .replace(/^\uFEFF/, ''); // Remove BOM if present

      // Log the raw response and any potential issues
      console.log('%c📥 Response Analysis:', 'color: #059669; font-weight: bold', {
        originalLength: content.length,
        cleanedLength: cleanContent.length,
        hasLeadingWhitespace: content.startsWith(' ') || content.startsWith('\n'),
        hasTrailingWhitespace: content.endsWith(' ') || content.endsWith('\n'),
        hasBOM: content.startsWith('\uFEFF'),
        hasBackticks: cleanContent.includes('`'),
        preview: cleanContent.slice(0, 100) + '...'
      });

      // If we still find any backticks, that's an error
      if (cleanContent.includes('`')) {
        console.error('%c❌ Found backticks in response despite instructions:', 'color: #dc2626', 
          cleanContent.match(/`[^`]*`/g)
        );
        throw new Error('Response contains backticks despite instructions to use plain text');
      }

      try {
        // Try parsing the cleaned content
        const parsedContent = JSON.parse(cleanContent);
        
        // No special processing needed anymore, just use the content as is
        let processedContent = cleanContent;

        // Pre-process the response to handle code blocks
        try {
          // First try to parse as is
          await this.parser.parse(processedContent);
        } catch (error: any) {
          console.error('%c🔄 JSON Parse Error:', 'color: #dc2626', {
            error: error.message,
            content: processedContent
          });

          // Check if this is a math formula validation error
          if (error.message.includes('Math expressions must not contain Hebrew text')) {
            // Log warning instead of throwing error
            console.warn('%c⚠️ Math Formula Warning:', 'color: #f59e0b; font-weight: bold', {
              message: 'Found Hebrew text in math expressions - This may affect rendering',
              details: {
                mathExpressions: processedContent.match(/\$\$[\s\S]*?\$\$|\$[^\$]*?\$/g) || [],
                suggestions: [
                  'Move Hebrew text outside math delimiters',
                  'Use English/Latin subscripts for variables',
                  'Write units in Hebrew outside the math',
                  'Use \\begin{align*} for multi-line equations'
                ],
                examples: {
                  variables: '$F_{max}$ (כוח מקסימלי)',
                  units: '$$v = 5$$ מטר לשנייה',
                  multiLine: '$$\\begin{align*} F &= ma \\\\ m &= 5 \\end{align*}$$ כאשר:'
                }
              }
            });
            // Continue processing instead of throwing error
            processedContent = cleanContent;
          }
          
          try {
            // Try to parse as JSON first to validate structure
            const parsedJson = JSON.parse(processedContent);
            
            // If JSON parsing succeeds but Zod fails, it's a schema validation error
            console.error('%c📋 Schema Validation Error:', 'color: #dc2626', error);
            
            // Pre-process code blocks in the content
            if (parsedJson.content?.text) {
              // Only clean up empty blocks and normalize newlines
              parsedJson.content.text = parsedJson.content.text
                // Remove empty code blocks
                .replace(/```\s*```/g, '')
                // Remove multiple consecutive newlines
                .replace(/\n{3,}/g, '\n\n');
              
              processedContent = JSON.stringify(parsedJson, null, 2);
              console.log('%c📝 Processed Content:', 'color: #059669', processedContent);
              
              // Try parsing again with processed content
              await this.parser.parse(processedContent);
            } else {
              throw error;
            }
          } catch (jsonError) {
            // If JSON parsing fails, try to process the content
            processedContent = processedContent
              .replace(/^\uFEFF/, '')
              .trim()
              .replace(/```[\s\S]*?```/g, (match: string) => {
                const [firstLine, ...rest] = match.split('\n');
                const content = rest.slice(0, -1).join('\\n');
                return `${firstLine}\\n${content}\\n\`\`\``;
              });

            console.log('%c📝 Processed Content:', 'color: #059669', processedContent);
            
            // Try parsing again after processing
            try {
              await this.parser.parse(processedContent);
            } catch (finalError: any) {
              console.error('%c❌ Final Parse Error:', 'color: #dc2626', {
                error: finalError.message,
                processedContent
              });
              throw finalError;
            }
          }
        }

        // Parse and validate with Zod schema
        const parsed = await this.parser.parse(processedContent);
        
        // Additional validation for type-specific fields
        if (parsed.type === 'multiple_choice') {
          if (!parsed.options || parsed.options.length !== 4) {
            throw new Error('Multiple choice questions must have exactly 4 options');
          }
          if (!parsed.correctOption || parsed.correctOption < 1 || parsed.correctOption > 4) {
            throw new Error('Multiple choice questions must have a valid correctOption (1-4)');
          }
        } else {
          // For non-multiple choice questions, these fields should not be present
          if (parsed.options || parsed.correctOption) {
            throw new Error(`${parsed.type} questions should not have options or correctOption fields`);
          }
        }

        // Validate metadata matches request
        if (parsed.metadata.topicId !== params.topic) {
          throw new Error('Generated question topic does not match requested topic');
        }
        if (parsed.metadata.difficulty !== params.difficulty) {
          throw new Error('Generated question difficulty does not match requested difficulty');
        }
        if (params.subtopic && parsed.metadata.subtopicId !== params.subtopic) {
          throw new Error('Generated question subtopic does not match requested subtopic');
        }

        this.updateRequestTracker(true);
        
        // Add runtime ID
        const question = {
          ...parsed,
          id: questionId,
          answerRequirements: {
            requiredElements: [
              "Key concepts that must be mentioned",
              "Required formulas or equations",
              "Critical analysis points",
              "Important conclusions"
            ]
          }
        };

        // After successful generation and parsing, save with generated ID
        const generatedQuestion = {
          ...question,
          metadata: {
            subjectId: subjectInfo.id,
            domainId: domainInfo.id,
            topicId: params.topic,
            subtopicId: params.subtopic,
            difficulty: params.difficulty,
            estimatedTime: parsed.metadata.estimatedTime,
            source: {
              sourceType: SourceType.Ezpass
            }
          }
        };

        logger.info('Generated question ready for storage:', {
          id: generatedQuestion.id,
          type: generatedQuestion.type,
          metadata: {
            subjectId: generatedQuestion.metadata.subjectId,
            domainId: generatedQuestion.metadata.domainId,
            topicId: generatedQuestion.metadata.topicId,
            difficulty: generatedQuestion.metadata.difficulty
          },
          contentLength: generatedQuestion.content.text.length,
          solutionLength: generatedQuestion.solution.text.length
        });

        // Save to database with 'generated' status
        await questionStorage.saveQuestion(generatedQuestion, 'generated');

        // Cache the question
        this.generationCache.set(generatedQuestion.id, generatedQuestion);

        console.log('%c✅ Question Generated Successfully:', 'color: #059669; font-weight: bold', {
          id: question.id,
          type: question.type,
          topic: question.metadata.topicId,
          difficulty: question.metadata.difficulty,
          estimatedTime: question.metadata.estimatedTime,
          hasOptions: question.type === 'multiple_choice' ? question.options?.length : 'N/A',
          contentLength: question.content.text.length,
          solutionLength: question.solution.text.length
        });

        return generatedQuestion;
      } catch (error) {
        console.error('%c❌ Error generating question:', 'color: #dc2626; font-weight: bold', error);
        const is429Error = error instanceof Error && error.message.includes('429');
        this.updateRequestTracker(false, is429Error);
        
        if (error instanceof Error) {
          if (error.message.includes('401')) {
            throw new Error('Authentication failed. Please check your API key.');
          }
          if (error.message.includes('429')) {
            throw new Error('OpenAI rate limit exceeded. Please try again in a few minutes.');
          }
        }
        
        throw error;
      }
    } catch (error) {
      console.error('%c❌ Error generating question:', 'color: #dc2626; font-weight: bold', error);
      const is429Error = error instanceof Error && error.message.includes('429');
      this.updateRequestTracker(false, is429Error);
      
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          throw new Error('Authentication failed. Please check your API key.');
        }
        if (error.message.includes('429')) {
          throw new Error('OpenAI rate limit exceeded. Please try again in a few minutes.');
        }
      }
      
      throw error;
    }
  }
}

export const questionService = new QuestionService(); 