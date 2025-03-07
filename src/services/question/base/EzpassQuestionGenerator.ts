import { Question, SourceType, EzpassCreatorType, QuestionType } from '../../../types/question';
import { QuestionGenerationRequirements, QuestionGenerationParams } from '../../../types/questionGeneration';
import { IQuestionGenerator } from './IQuestionGenerator';
import { questionGenerationService } from '../../llm/QuestionGenerationV2';
import { ExamType } from '../../../types/examTemplate';
import { generateQuestionId } from '../../../utils/idGenerator';

export class EzpassQuestionGenerator implements IQuestionGenerator {
  async generate(params: QuestionGenerationRequirements): Promise<Question> {
    // Convert QuestionGenerationRequirements to QuestionGenerationParams
    const generationParams: QuestionGenerationParams = {
      type: params.type,
      prompt: this.buildPrompt(params),
      subjectId: params.hierarchy.subject.id,
      domainId: params.hierarchy.domain.id,
      topicId: params.hierarchy.topic.id,
      subtopicId: params.hierarchy.subtopic?.id,
      difficulty: params.difficulty,
      estimatedTime: params.estimatedTime,
      answerFormat: {
        hasFinalAnswer: params.type !== QuestionType.OPEN,
        finalAnswerType: params.type === QuestionType.MULTIPLE_CHOICE ? 'multiple_choice' :
                        params.type === QuestionType.NUMERICAL ? 'numerical' : 'none',
        requiresSolution: true
      },
      source: {
        type: 'ezpass',
        creatorType: 'ai'
      }
    };

    // Generate the question using our V2 service
    const partialQuestion = await questionGenerationService.generateQuestion(generationParams);
    
    // Ensure we have a complete question by providing defaults for any missing fields
    const question: Question = {
      id: partialQuestion.id || await generateQuestionId(params.subject, params.hierarchy.domain.id),
      name: partialQuestion.name || `${params.type} Question - ${params.hierarchy.topic.id}`,
      content: partialQuestion.content || {
        text: '',
        format: 'markdown',
        options: []
      },
      metadata: {
        subjectId: params.subject,
        domainId: params.hierarchy.domain.id,
        topicId: params.hierarchy.topic.id,
        subtopicId: params.hierarchy.subtopic?.id || '',
        type: params.type,
        difficulty: params.difficulty,
        estimatedTime: params.estimatedTime,
        answerFormat: partialQuestion.metadata?.answerFormat || {
          hasFinalAnswer: true,
          finalAnswerType: params.type,
          requiresSolution: true
        },
        source: {
          type: 'ezpass' as const,
          creatorType: EzpassCreatorType.AI
        }
      },
      schoolAnswer: partialQuestion.schoolAnswer || {
        finalAnswer: null,
        solution: {
          text: '',
          format: 'markdown'
        }
      },
      evaluationGuidelines: partialQuestion.evaluationGuidelines || {
        requiredCriteria: [],
        optionalCriteria: [],
        scoringMethod: 'sum',
        maxScore: 100
      }
    };

    return question;
  }

  private buildPrompt(params: QuestionGenerationRequirements): string {
    return `Generate a ${params.type.toLowerCase()} question about ${params.hierarchy.topic.name} in ${params.hierarchy.subject.name}${params.hierarchy.subtopic ? `, focusing on ${params.hierarchy.subtopic.name}` : ''}.`;
  }
} 