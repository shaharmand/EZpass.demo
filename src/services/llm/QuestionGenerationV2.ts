import { ChatOpenAI } from "@langchain/openai";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { questionSchema } from "../../schemas/questionSchema";
import { QuestionPromptBuilder, QuestionPromptParams } from './prompts/QuestionPromptBuilder';
import { 
  Question, 
  QuestionType, 
  EzpassCreatorType,
  AnswerContentGuidelines,
  QuestionFetchParams
} from "../../types/question";
import { ImportInfo } from "../../scripts/import/types/importTypes";
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

  async generateQuestion(params: QuestionFetchParams): Promise<Question> {
    try {
      // Convert params to a prompt string
      const prompt = `Generate a ${params.difficulty} level ${params.type} question about ${params.topic} in ${params.subject}.
      Use the following parameters:
      - Subject: ${params.subject}
      - Domain: ${params.domainId}
      - Topic: ${params.topic}
      - Subtopic: ${params.subtopic || 'none'}
      - Difficulty: ${params.difficulty}
      - Answer Format: ${params.type}
      - Education Type: ${params.educationType}
      - Exam Type: ${params.examType}`;

      const messages = [
        new SystemMessage("You are an expert question generator for educational content."),
        new HumanMessage(prompt)
      ];

      const response = await this.llm.invoke(messages);
      const parsedOutput = await this.parser.invoke(response.content as string);

      // Add metadata required by Question type
      const question: Question = {
        ...parsedOutput,
        metadata: {
          ...parsedOutput.metadata,
          answerFormat: {
            hasFinalAnswer: params.type !== QuestionType.OPEN,
            finalAnswerType: params.type === QuestionType.MULTIPLE_CHOICE ? 'multiple_choice' :
                           params.type === QuestionType.NUMERICAL ? 'numerical' : 'none',
            requiresSolution: true
          },
          source: {
            type: 'ezpass' as const,
            creatorType: EzpassCreatorType.AI
          }
        },
        evaluationGuidelines: {
          requiredCriteria: [
            {
              name: 'Basic Understanding',
              description: 'Shows understanding of core concepts',
              weight: 100
            }
          ]
        }
      };

      // Add import info
      const importInfo: ImportInfo = {
        importMetadata: {
          importedAt: new Date().toISOString(),
          importScript: 'question-generation-v2'
        },
        source: {
          name: 'ezpass',
          files: [],
          format: 'ai-generated'
        },
        originalData: {
          prompt,
          model: this.llm.modelName,
          params: params
        }
      };

      // Create the question in storage
      const createdQuestion = await questionStorage.createQuestion({
        question,
        import_info: importInfo
      });

      return createdQuestion.data;
    } catch (error) {
      logger.error('Failed to generate question:', error);
      throw error;
    }
  }
}

export const questionGenerationService = new QuestionGenerationServiceV2(); 