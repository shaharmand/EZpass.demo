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
import { QuestionGenerationParams } from "../../types/questionGeneration";
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

  private convertToPromptParams(params: QuestionGenerationParams): QuestionPromptParams {
    return {
      type: params.type,
      topic: params.prompt,
      difficulty: params.difficulty,
      examType: 'standard', // Default value since it's required by QuestionPromptParams
      subject: params.subjectId,
      educationType: 'university' // Default value since it's required by QuestionPromptParams
    };
  }

  async generateQuestion(params: QuestionGenerationParams): Promise<Question> {
    try {
      // Convert params to QuestionPromptParams
      const promptParams = this.convertToPromptParams(params);

      // Build the complete prompt using our component system
      const promptBuilder = new QuestionPromptBuilder(promptParams);
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

      // Convert source to use string literals and enum values
      const source = params.source ? {
        type: params.source.type,
        creatorType: params.source.creatorType === 'ai' ? EzpassCreatorType.AI : EzpassCreatorType.HUMAN
      } : {
        type: 'ezpass' as const,
        creatorType: EzpassCreatorType.AI
      };

      // Ensure the metadata has the required answerFormat and source
      const questionWithFormat = {
        ...parsedQuestion,
        metadata: {
          ...parsedQuestion.metadata,
          answerFormat: params.answerFormat,
          source
        },
        evaluationGuidelines: {
          requiredCriteria: [],
          scoringMethod: 'sum',
          maxScore: 100
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

      return createdQuestion.data;
    } catch (error) {
      logger.error('Error generating question:', error);
      throw error;
    }
  }
}

export const questionGenerationService = new QuestionGenerationServiceV2(); 