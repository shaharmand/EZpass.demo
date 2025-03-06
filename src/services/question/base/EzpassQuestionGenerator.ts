import { Question, SourceType, EzpassCreatorType } from '../../../types/question';
import { QuestionGenerationRequirements } from '../../../types/questionGeneration';
import { IQuestionGenerator } from './IQuestionGenerator';
import { questionGenerationService } from '../../llm/QuestionGenerationV2';
import { ExamType } from '../../../types/examTemplate';
import { generateQuestionId } from '../../../utils/idGenerator';

export class EzpassQuestionGenerator implements IQuestionGenerator {
  async generate(params: QuestionGenerationRequirements): Promise<Question> {
    // Convert QuestionGenerationRequirements to QuestionPromptParams
    const promptParams = {
      subject: params.hierarchy.subject.id,
      domain: params.hierarchy.domain.id,
      topic: params.hierarchy.topic.id,
      subtopic: params.hierarchy.subtopic?.id,
      type: params.type,
      difficulty: params.difficulty,
      examType: ExamType.MAHAT_EXAM,
      estimatedTime: params.estimatedTime
    };

    // Generate the question using our V2 service
    const partialQuestion = await questionGenerationService.generateQuestion(promptParams);
    
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
} 