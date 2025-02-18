import { ChatOpenAI } from "@langchain/openai";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { questionSchema } from "../../schemas/question";
import type { Question, QuestionFetchParams } from "../../types/question";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";

export class QuestionService {
  private llm: ChatOpenAI;
  private parser: StructuredOutputParser<typeof questionSchema>;
  private requestTracker = {
    lastRequestTime: 0,
    requestsInWindow: 0,
    windowStartTime: Date.now(),
    consecutiveFailures: 0,
    backoffTime: 0
  };

  private readonly RATE_LIMITS = {
    MIN_INTERVAL: 10000,
    MAX_REQUESTS_PER_MINUTE: 2,
    WINDOW_SIZE: 60000,
    BACKOFF_MULTIPLIER: 2,
    INITIAL_BACKOFF: 30000,
    MAX_BACKOFF: 300000
  };

  constructor() {
    let apiKey = process.env.REACT_APP_OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('OpenAI API key not found in environment variables');
    }

    if (apiKey.includes(' ')) {
      apiKey = apiKey.trim();
    }

    this.parser = StructuredOutputParser.fromZodSchema(questionSchema);
    
    this.llm = new ChatOpenAI({
      openAIApiKey: apiKey,
      modelName: "gpt-4-0125-preview",
      temperature: 0.7,
      modelKwargs: { response_format: { type: "json_object" } }
    });
  }

  private checkRateLimits(): boolean {
    const now = Date.now();
    
    if (this.requestTracker.backoffTime > 0) {
      if (now < this.requestTracker.backoffTime) {
        const waitTime = Math.ceil((this.requestTracker.backoffTime - now) / 1000);
        console.log(`In backoff period. Please wait ${waitTime} seconds.`);
        return false;
      }
      this.requestTracker.backoffTime = 0;
      this.requestTracker.consecutiveFailures = 0;
    }
    
    if (now - this.requestTracker.lastRequestTime < this.RATE_LIMITS.MIN_INTERVAL) {
      const waitTime = Math.ceil((this.RATE_LIMITS.MIN_INTERVAL - (now - this.requestTracker.lastRequestTime)) / 1000);
      console.log(`Too soon for new request. Please wait ${waitTime} seconds.`);
      return false;
    }

    if (now - this.requestTracker.windowStartTime >= this.RATE_LIMITS.WINDOW_SIZE) {
      this.requestTracker.windowStartTime = now;
      this.requestTracker.requestsInWindow = 0;
    }

    if (this.requestTracker.requestsInWindow >= this.RATE_LIMITS.MAX_REQUESTS_PER_MINUTE) {
      const waitTime = Math.ceil((this.RATE_LIMITS.WINDOW_SIZE - (now - this.requestTracker.windowStartTime)) / 1000);
      console.log(`Rate limit exceeded. Please wait ${waitTime} seconds for the next window.`);
      return false;
    }

    return true;
  }

  private updateRequestTracker(success: boolean, is429Error: boolean = false) {
    const now = Date.now();
    this.requestTracker.lastRequestTime = now;
    this.requestTracker.requestsInWindow++;
    
    if (success) {
      this.requestTracker.consecutiveFailures = 0;
      this.requestTracker.backoffTime = 0;
    } else {
      this.requestTracker.consecutiveFailures++;
      
      if (is429Error) {
        const backoffTime = Math.min(
          this.RATE_LIMITS.INITIAL_BACKOFF * Math.pow(this.RATE_LIMITS.BACKOFF_MULTIPLIER, this.requestTracker.consecutiveFailures - 1),
          this.RATE_LIMITS.MAX_BACKOFF
        );
        this.requestTracker.backoffTime = now + backoffTime;
        console.log(`429 detected. Setting backoff time to ${backoffTime/1000} seconds`);
      }
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
   - Complex problem broken into steps in Hebrew
   - Clear progression of difficulty
   - All necessary information upfront
   - Use markdown for formatting
   - For math: use LaTeX notation

2. Structure:
   - Logical sequence of steps
   - Each step builds on previous ones
   - Clear intermediate goals
   - Hints or guidance where needed

3. Solution:
   - Complete solution with all steps explained in Hebrew
   - Clear explanation of the progression
   - Alternative approaches where relevant
   - Common pitfalls to avoid
`}

METADATA REQUIREMENTS:
1. Difficulty: Match requested level ${params.difficulty}
2. EstimatedTime: Realistic time for ${params.educationType} level
3. Source: Use "practice" for examType
4. TopicId: Use "${params.topic}"
${params.subtopic ? `5. SubtopicId: Use "${params.subtopic}"` : ''}

SCHEMA VALIDATION REQUIREMENTS:
${formatInstructions}`;
  }

  async generateQuestion(params: QuestionFetchParams): Promise<Question> {
    if (!this.checkRateLimits()) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    try {
      console.log('%c🎯 Generating Question:', 'color: #2563eb; font-weight: bold', {
        topic: params.topic,
        type: params.type,
        difficulty: params.difficulty,
        subject: params.subject,
        educationType: params.educationType
      });
      
      const systemMessage = new SystemMessage(
        'You are an expert educator specializing in creating high-quality exam questions. ' +
        'Follow the format instructions exactly. The question type is a root-level property ' +
        'that determines the structure and requirements for the question. ' +
        'When including code blocks in the response, they must be properly escaped as part of the JSON string. Example:\n' +
        '{\n' +
        '  "content": {\n' +
        '    "text": "Here is a code example:\\\\n```python\\\\ndef hello():\\\\n    print(\\\\"world\\\\")\\\\n```"\n' +
        '  }\n' +
        '}\n' +
        'Note that in JSON strings, newlines need double backslashes (\\\\n) and quotes need double backslashes (\\\\")'
      );
      console.log('%c📋 System Message:', 'color: #059669; font-weight: bold', '\n' + systemMessage.content);
      
      const prompt = await this.buildPrompt(params);
      console.log('%c📝 OpenAI Prompt:', 'color: #059669; font-weight: bold', '\n' + prompt);
      
      const humanMessage = new HumanMessage(prompt);
      const response = await this.llm.invoke([systemMessage, humanMessage]);
      
      // PHASE 1: Immediate raw response analysis
      console.log('Raw OpenAI Response:', {
        content: response.content,
        type: typeof response.content,
        length: response.content?.length || 0,
        preview: typeof response.content === 'string' ? response.content.slice(0, 500) + '...' : 'Not a string'
      });

      // PHASE 2: Code block analysis (before any processing)
      const codeBlocks = typeof response.content === 'string' ? response.content.match(/```[\s\S]*?```/g) || [] : [];
      console.log('Code Block Analysis:', {
        totalBlocks: codeBlocks.length,
        blocks: codeBlocks.map(block => {
          const lines = block.split('\n');
          const matches = block.match(/```/g);
          return {
            hasUnescapedNewlines: block.includes('\n') && !block.includes('\\n'),
            hasUnescapedQuotes: block.includes('"') && !block.includes('\\"'),
            firstLine: lines[0],
            lastLine: lines[lines.length - 1],
            extraClosingMarkers: matches ? matches.length > 2 : false,
            rawBlock: block,
            lineCount: lines.length
          };
        })
      });

      // PHASE 3: Type check and content validation
      if (typeof response.content !== 'string') {
        throw new Error('Unexpected response format from OpenAI');
      }

      try {
        const parsedContent = JSON.parse(response.content);
        // Check for improperly escaped code blocks before parsing
        const codeBlockRegex = /```[\s\S]*?```/g;
        const codeBlocks = response.content.match(codeBlockRegex);
        
        if (codeBlocks) {
          for (const block of codeBlocks) {
            if (block.includes('\n') && !block.includes('\\n')) {
              console.error('%c⚠️ Detected improperly escaped newlines in code block:', 'color: #dc2626', block);
            }
            if (block.includes('"') && !block.includes('\\"')) {
              console.error('%c⚠️ Detected improperly escaped quotes in code block:', 'color: #dc2626', block);
            }
          }
        }

        // Pre-process the response to handle code blocks
        let processedContent = response.content;
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
          id: `generated_${Date.now()}`
        };

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

        return question;
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