import { ChatOpenAI } from "@langchain/openai";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { questionSchema } from "../../schemas/questionSchema";
import { QuestionPromptBuilder, QuestionPromptParams } from './prompts/QuestionPromptBuilder';
import { 
  Question, 
  QuestionType, 
  EzpassCreatorType,
  AnswerContentGuidelines
} from "../../types/question";
import { logger } from '../../utils/logger';
import { questionStorage } from '../admin/questionStorage';

export class QuestionGenerationServiceV2 {
  private llm: ChatOpenAI;
  private parser: StructuredOutputParser<typeof questionSchema>;

  constructor() {
    this.llm = new ChatOpenAI({
      openAIApiKey: process.env.REACT_APP_OPENAI_API_KEY,
      modelName: 'gpt-4-0125-preview',
      temperature: 0.7
    });
    this.parser = StructuredOutputParser.fromZodSchema(questionSchema);
  }

  async generateQuestion(params: QuestionPromptParams): Promise<Question> {
    try {
      // Build the complete prompt using our component system
      const promptBuilder = new QuestionPromptBuilder(params);
      const prompt = promptBuilder.build();
      
      // Get format instructions for the parser
      const formatInstructions = await this.parser.getFormatInstructions();

      // Log the full prompt for debugging
      logger.debug('Full generation prompt:', prompt);

      // Generate the question using LangChain
      const response = await this.llm.invoke([
        new SystemMessage(prompt),
        new HumanMessage(formatInstructions)
      ]);

      // Parse and validate the response
      const content = response.content;
      if (typeof content !== 'string') {
        throw new Error('Unexpected response format from LLM');
      }

      // Parse the response into our Question type
      const parsedQuestion = await this.parser.parse(content);

      // Ensure the metadata has the required answerFormat and source
      const questionWithFormat = {
        ...parsedQuestion,
        metadata: {
          ...parsedQuestion.metadata,
          answerFormat: {
            hasFinalAnswer: params.type !== QuestionType.OPEN,
            finalAnswerType: params.type === QuestionType.MULTIPLE_CHOICE ? ('multiple_choice' as const) : 
                           params.type === QuestionType.NUMERICAL ? ('numerical' as const) : ('none' as const),
            requiresSolution: true
          },
          source: {
            type: 'ezpass' as const,
            creatorType: 'ai' as EzpassCreatorType
          }
        },
        evaluationGuidelines: {
          requiredCriteria: [],
          optionalCriteria: [],
          scoringMethod: 'sum',
          maxScore: params.totalPoints || 100
        } as AnswerContentGuidelines
      };

      // Create the question in storage
      const createdQuestion = await questionStorage.createQuestion({
        question: questionWithFormat,
        import_info: {
          system: 'ezpass',
          originalId: questionWithFormat.id,
          importedAt: new Date().toISOString()
        }
      });

      return createdQuestion;
    } catch (error) {
      logger.error('Error generating question:', error);
      throw error;
    }
  }
}

export const questionGenerationService = new QuestionGenerationServiceV2(); 