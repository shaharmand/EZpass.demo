import { OpenAIService } from './openAIService';
import { 
  DetailedEvalLevel,
  type DetailedQuestionFeedback,
  type QuestionFeedback,
  type BasicQuestionFeedback,
  BinaryEvalLevel,
  QuestionType,
  type EvalLevel,
  type Question
} from '../../types/question';
import { logger } from '../../utils/logger';
import { buildPrompt, OPENAI_MODELS } from '../../utils/llmUtils';
import { buildFeedbackSystemMessage } from './aiSystemMessages';
import { ExamType } from '../../types/examTemplate';
import { getExamInstitution } from '../../types/examTemplate';
import { FeedbackValidator } from './feedbackValidation';

interface FeedbackParams {
  question: Question;
  studentAnswer: string;
  formalExamName: string;
  examType: ExamType;
  subject: string
}

export class FeedbackService {
  private openAI: OpenAIService;

  constructor(openAI?: OpenAIService) {
    this.openAI = openAI || new OpenAIService(process.env.REACT_APP_OPENAI_API_KEY || '');
  }

  /**
   * Main feedback generation method that handles both basic and detailed feedback
   */
  async generateFeedback(params: FeedbackParams): Promise<QuestionFeedback> {
    const { question } = params;

    // Early validation of required fields
    if (!question.answer) {
      throw new Error('Question is missing required answer field - this might be an old format question that needs migration');
    }

    if (!question.answer.solution) {
      throw new Error('Question is missing required solution field - this might be an old format question that needs migration');
    }

    // For multiple choice, generate basic feedback
    if (question.metadata.type === QuestionType.MULTIPLE_CHOICE) {
      return this.generateBasicFeedback(params);
    }

    // For other types, generate detailed feedback
    return this.generateDetailedFeedback(params);
  }

  /**
   * Generates basic feedback for multiple choice questions
   */
  private async generateBasicFeedback(params: FeedbackParams): Promise<BasicQuestionFeedback> {
    const { question, studentAnswer } = params;
    
    // Early validation for multiple choice
    if (!question.answer.finalAnswer || question.answer.finalAnswer.type !== 'multiple_choice') {
      throw new Error('Multiple choice question is missing required finalAnswer field or has wrong type');
    }

    // Get correct answer from question
    const correctAnswer = question.answer.finalAnswer.value;

    // Compare student answer with correct answer
    const isCorrect = parseInt(studentAnswer, 10) === correctAnswer;

    return {
      score: isCorrect ? 100 : 0,
      evalLevel: {
        type: 'binary',
        level: isCorrect ? BinaryEvalLevel.CORRECT : BinaryEvalLevel.INCORRECT
      },
      message: isCorrect ? 'תשובה נכונה!' : 'תשובה שגויה',
      basicExplanation: question.answer.solution.text || 'No explanation provided',
      fullExplanation: question.answer.solution.text || undefined
    };
  }

  /**
   * Generates detailed feedback for a student's attempt at a question using AI
   */
  private async generateDetailedFeedback(params: FeedbackParams): Promise<DetailedQuestionFeedback> {
    const { question, studentAnswer, formalExamName, examType, subject } = params;
    
    // Early validation for required fields
    if (!question.answer.solution.text) {
      throw new Error('Question is missing required solution text - cannot generate detailed feedback');
    }

    // Initial log group with clear separation
    console.group('\n🎯 Detailed Feedback Generation Started');
    console.log('\nQuestion Details:');
    console.log('-'.repeat(80));
    console.table({
      'ID': question.id,
      'Type': question.metadata.type,
      'Topic': question.metadata.topicId,
      'Difficulty': question.metadata.difficulty,
      'Exam': formalExamName,
      'Subject': subject,
      'Education Type': getExamInstitution(examType)
    });
    console.groupEnd();

    try {
      const prompt = this.buildPrompt(question, studentAnswer, subject);
      const systemMessage = buildFeedbackSystemMessage(subject, examType, formalExamName);
      const modelConfig = this.selectModelConfig(question);

      // Send request to OpenAI
      const messages = [
        { role: 'system' as const, content: systemMessage },
        { role: 'user' as const, content: prompt }
      ];

      const response = await this.openAI.complete(prompt, {
        ...modelConfig,
        messages
      });

      let feedback: DetailedQuestionFeedback;
      try {
        const aiResponse = JSON.parse(response);
        
        // Transform AI response to proper feedback format
        feedback = {
          score: aiResponse.score,
          evalLevel: {
            type: 'detailed',
            level: aiResponse.level as DetailedEvalLevel
          },
          message: aiResponse.assessment,
          coreFeedback: aiResponse.coreFeedback,
          detailedFeedback: aiResponse.detailedFeedback,
          rubricScores: aiResponse.rubricScores
        };

        this.logFeedback(feedback);
        return feedback;

      } catch (error: unknown) {
        console.error('Failed to parse AI response:', error instanceof Error ? error.message : 'Unknown error');
        throw new Error('Invalid JSON response from AI');
      }

    } catch (error: unknown) {
      console.error('Error generating detailed feedback:', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  private logFeedback(feedback: DetailedQuestionFeedback) {
    console.group('\n✅ Parsed Detailed Feedback');
    console.log('\nBasic Information:');
    console.table({
      'Level': feedback.evalLevel.level,
      'Score': feedback.score
    });

    console.log('\nMessage:', feedback.message);
    console.log('\nCore Feedback:', feedback.coreFeedback);
    console.log('\nDetailed Feedback:', feedback.detailedFeedback);
    
    if (feedback.rubricScores) {
      console.log('\nRubric Scores:');
      console.table(feedback.rubricScores);
    }
    
    console.groupEnd();
  }

  /**
   * Selects appropriate model configuration based on question characteristics
   */
  private selectModelConfig(question: Question) {
    const config = question.metadata.type === QuestionType.OPEN
      ? { ...OPENAI_MODELS.analysis, response_format: { type: 'json_object' as const } }
      : { ...OPENAI_MODELS.feedback, response_format: { type: 'json_object' as const } };

    logger.info('Selected model config', {
      questionId: question.id,
      type: question.metadata.type,
      model: config.model,
      temperature: config.temperature
    });

    return config;
  }

  /**
   * Builds the prompt for feedback generation
   */
  private buildPrompt(question: Question, studentAnswer: string, subject: string): string {
    logger.info('Building detailed feedback prompt', {
      questionId: question.id,
      type: question.metadata.type,
      subject
    });

    return buildPrompt(
      `בדיקת תשובה מפורטת - ${subject}

Please evaluate this ${subject} question and provide detailed feedback with rubric-based assessment.`,
      {
        'Question': question.content.text,
        'Student Answer': studentAnswer,
        'Correct Solution': question.answer.solution.text || 'No solution provided',
        'Question Type': question.metadata.type,
        'Rubric Assessment': JSON.stringify(question.evaluation?.rubricAssessment || null),
        'Required Elements': JSON.stringify(question.evaluation?.answerRequirements?.requiredElements || []),
        'Required Response Format': `{
          "level": "${Object.values(DetailedEvalLevel).join('" | "')}", // One of the detailed evaluation levels
          "score": number,                // Score between 0-100, must match the level's range
          "assessment": string,           // 2-3 sentence summary of the evaluation
          "coreFeedback": string,        // Main feedback with ✅❌⚠️🔹 symbols
          "detailedFeedback": string,    // In-depth analysis
          "rubricScores": {              // Required criterion scores
            [criterionName: string]: {
              score: number,             // 0-100 score for this criterion
              feedback: string           // Specific feedback for this criterion
            }
          }
        }`
      }
    );
  }
} 