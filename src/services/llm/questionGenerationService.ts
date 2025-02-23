import OpenAI from 'openai';
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { questionSchema } from "../../schemas/questionSchema";
import type { Question, QuestionType, QuestionFetchParams, DifficultyLevel } from "../../types/question";

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

  private questionCache: Map<string, Question> = new Map();

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

  private async buildPrompt(params: QuestionFetchParams): Promise<string> {
    const formatInstructions = await this.parser.getFormatInstructions();
    
    return `Generate a ${params.type} question in ${params.subject} for ${params.educationType} students.

LANGUAGE REQUIREMENTS:
- Generate ALL content in Hebrew (עברית)
- Question text must be in Hebrew
- Options must be in Hebrew
- Solution explanation must be in Hebrew
- Keep mathematical terms and symbols in English/LaTeX
- Text direction should be RTL (right-to-left)

CONTEXT:
- Topic: ${params.topic}
${params.subtopic ? `- Subtopic: ${params.subtopic}\n` : ''}- Difficulty: Level ${params.difficulty} (1=easiest to 5=hardest)
- Education Type: ${params.educationType}
- Subject: ${params.subject}

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
   - Use LaTeX for mathematical notation
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

METADATA REQUIREMENTS:
1. Difficulty: Match requested level ${params.difficulty}
2. EstimatedTime: Realistic time for ${params.educationType} level
3. Source: Use "practice" for examType
4. TopicId: Use "${params.topic}"
${params.subtopic ? `5. SubtopicId: Use "${params.subtopic}"` : ''}

SCHEMA VALIDATION REQUIREMENTS:
${formatInstructions}

IMPORTANT: 
1. The response MUST include a rubricAssessment object with criteria that sum to exactly 100% weights.
2. The response MUST include an answerRequirements object with a list of requiredElements that specify key components needed in a complete answer.`;
  }

  async generateQuestion(params: QuestionFetchParams): Promise<Question> {
    try {
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
      
      const prompt = await this.buildPrompt(params);
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
          id: `generated_${Date.now()}`,
          answerRequirements: {
            requiredElements: [
              "Key concepts that must be mentioned",
              "Required formulas or equations",
              "Critical analysis points",
              "Important conclusions"
            ]
          }
        };

        // Cache the new question
        const generatedQuestion = {
          ...question,
          metadata: {
            ...question.metadata,
            difficulty: question.metadata.difficulty as DifficultyLevel
          }
        };
        this.questionCache.set(generatedQuestion.id, generatedQuestion);

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

  async getQuestion(questionId: string): Promise<Question> {
    try {
      // Check if question exists in cache
      const cachedQuestion = this.questionCache.get(questionId);
      if (cachedQuestion) {
        return cachedQuestion;
      }

      // If questionId starts with 'generated_', parse the timestamp
      // and check if it's a reasonable time (last 24 hours)
      if (questionId.startsWith('generated_')) {
        const timestamp = parseInt(questionId.replace('generated_', ''));
        const isRecentQuestion = Date.now() - timestamp < 24 * 60 * 60 * 1000; // 24 hours
        
        if (!isRecentQuestion) {
          throw new Error('Question not found or expired');
        }
      }

      throw new Error('Question not found and cannot be regenerated');
    } catch (error) {
      console.error('Error getting question:', error);
      throw error instanceof Error ? error : new Error('Failed to get question');
    }
  }
}

export const questionService = new QuestionService(); 