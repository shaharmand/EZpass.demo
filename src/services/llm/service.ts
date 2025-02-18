import { ChatOpenAI } from "@langchain/openai";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { questionSchema } from "../../schemas/question";
import type { Question, QuestionFetchParams } from "../../types/question";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { FORMATTING_GUIDELINES } from './prompts';
import { LOG_STYLES } from '../../utils/logStyles';

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
    const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not found');
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

  private transformToQuestion(parsed: any, params: QuestionFetchParams): Question {
    // Let the parser handle most of the validation
    const question: Question = {
      id: `generated_${Date.now()}`,
      content: {
        text: parsed.content.text,
        format: 'markdown'
      },
      metadata: {
        topicId: params.topic,
        subtopicId: params.subtopic,
        type: params.type === 'multiple_choice' ? 'multiple_choice' : 'essay',
        difficulty: Number(params.difficulty),
        source: typeof parsed.metadata?.source === 'object' ? 
          JSON.stringify(parsed.metadata.source) : 
          String(parsed.metadata?.source || '')
      },
      solution: {
        text: parsed.solution.text,
        format: 'markdown',
        steps: parsed.solution.steps
      }
    };

    // Add multiple choice specific fields if applicable
    if (params.type === 'multiple_choice') {
      question.options = parsed.answer.options?.map((opt: any) => opt.text);
      question.correctOption = parsed.answer.correctOption;
    }

    return question;
  }

  async generateQuestion(params: QuestionFetchParams): Promise<Question> {
    if (!this.checkRateLimits()) {
      throw new Error('Rate limit exceeded. Please wait before requesting another question.');
    }

    try {
      const messages = [
        new SystemMessage(
          `You are an expert educator specializing in ${params.subject} for ${params.educationType} students in Israel. 
Your expertise includes:
- Deep understanding of the Israeli education system and curriculum requirements
- Extensive experience in creating high-quality ${params.type} questions
- Mastery of pedagogical principles for ${params.educationType} level
- Expertise in writing clear, precise technical content in Hebrew (RTL)

Follow these strict formatting rules:
1. Question Structure:
   - Write all text in Hebrew (RTL)
   - Use clear, age-appropriate language
   - Include precise, unambiguous instructions
   - For code questions, include example inputs/outputs

2. Mathematical Expressions:
   - Use $$...$$ for display math (centered equations)
   - Use $...$ for inline math
   - ALWAYS use LaTeX for numbers, variables, and operations
   - Never write mathematical expressions in plain text

3. Code Formatting:
   - Use \`\`\`language\\n code \\n\`\`\` for code blocks
   - Use \`code\` for inline code references
   - Include comments in Hebrew
   - For Python, use proper indentation

4. Response Format:
   - Return a JSON object with:
     * content: The question text with proper formatting
     * answer: { value: { text, format: "markdown" } }
     * solution: { text, format: "markdown", steps: [] }
     * metadata: { difficulty, estimatedTime, cognitiveLevel }

5. Question Guidelines for ${params.type}:
   - Difficulty ${params.difficulty}: ${getDifficultyGuidelines(params.difficulty)}
   - Topic ${params.topic}: Follow curriculum standards
   - Type: ${getTypeGuidelines(params.type)}
`
        ),
        new HumanMessage(
          `Generate a ${params.type} question in ${params.subject} for ${params.educationType} students.
Topic: ${params.topic}
${params.subtopic ? `Subtopic: ${params.subtopic}\n` : ''}
Difficulty level: ${typeof params.difficulty === 'object' ? `${params.difficulty.min}-${params.difficulty.max}` : params.difficulty.toString()}`
        )
      ];

      console.group('%c🔍 Question Generation Request:', LOG_STYLES.title);
      console.log('%cParameters:', LOG_STYLES.info, params);
      console.log('%cPrompt:', LOG_STYLES.info, messages.map(m => m.content).join('\n\n'));
      
      const response = await this.llm.call(messages);
      
      try {
        const content = typeof response.content === 'string' ? 
          response.content : 
          JSON.stringify(response.content);
          
        const parsedQuestion = await this.parser.parse(content);
        console.log('%cParsed question:', LOG_STYLES.success, parsedQuestion);

        // Type guard for multiple choice questions
        if (params.type === 'multiple_choice' && 
            (!('type' in parsedQuestion) || 
             parsedQuestion.type !== 'multiple_choice' ||
             !('options' in parsedQuestion.answer) || 
             !Array.isArray(parsedQuestion.answer.options) ||
             parsedQuestion.answer.options.length !== 4 ||
             !('correctOption' in parsedQuestion.answer))) {
          throw new Error('Multiple choice question must have exactly 4 options and a correct option number');
        }

        // Add generated ID and metadata
        const question: Question = {
          id: `generated_${Date.now()}`,
          ...parsedQuestion,
          metadata: {
            topicId: params.topic,
            subtopicId: params.subtopic,
            type: params.type === 'code' ? 'open' : params.type,
            difficulty: typeof params.difficulty === 'number' ? params.difficulty : 3,
            estimatedTime: parsedQuestion.metadata?.estimatedTime || 15,
            cognitiveLevel: parsedQuestion.metadata?.cognitiveLevel || 'application',
            source: {
              examType: 'practice',
              year: new Date().getFullYear()
            }
          }
        };

        this.updateRequestTracker(true);
        return question;
      } catch (parseError) {
        console.error('%cParsing failed:', LOG_STYLES.error, response.content, parseError);
        this.updateRequestTracker(false);
        throw new Error('Failed to parse response: ' + parseError.message);
      }
    } catch (error: any) {
      console.error('%c❌ Question generation failed:', LOG_STYLES.error, error);
      
      const is429Error = error.message?.includes('429') || error.response?.status === 429;
      this.updateRequestTracker(false, is429Error);
      
      if (is429Error) {
        throw new Error('OpenAI rate limit exceeded. The system will automatically wait before trying again.');
      }
      
      throw error;
    }
  }
}

function getDifficultyGuidelines(difficulty: number | { min: number; max: number }): string {
  const level = typeof difficulty === 'object' ? Math.ceil((difficulty.min + difficulty.max) / 2) : difficulty;
  switch(level) {
    case 1: return "Basic recall and understanding, direct application";
    case 2: return "Simple problem solving, basic concept connections";
    case 3: return "Multiple concept application, moderate analysis";
    case 4: return "Complex problem solving, deep analysis";
    case 5: return "Advanced synthesis, creative problem solving";
    default: return "Balanced difficulty, clear learning objectives";
  }
}

function getTypeGuidelines(type: string): string {
  switch(type) {
    case 'multiple_choice':
      return "4 options, one correct answer, clear distractors";
    case 'open':
      return "Clear problem statement, structured solution steps";
    case 'code':
      return "Include setup code, test cases, example inputs/outputs";
    default:
      return "Clear instructions and evaluation criteria";
  }
}

export const questionService = new QuestionService(); 