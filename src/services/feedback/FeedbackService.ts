import { OpenAIService } from '../llm/openAIService';
import { 
  DetailedEvalLevel,
  BinaryEvalLevel,
  type DetailedQuestionFeedback,
  type BasicQuestionFeedback,
  type QuestionFeedback,
  type Question,
  QuestionType
} from '../../types/question';
import { logger } from '../../utils/logger';
import { buildPrompt, OPENAI_MODELS } from '../../utils/llmUtils';
import { buildFeedbackSystemMessage } from '../llm/aiSystemMessages';
import { ExamType } from '../../types/examTemplate';
import { getExamInstitution } from '../../types/examTemplate';
import { FeedbackValidator } from '../llm/feedbackValidation';

interface FeedbackParams {
  question: Question;
  studentAnswer: string;
  formalExamName: string;  // e.g. "Calculus 101", "Physics Bagrut", "Safety MAHAT"
  examType: ExamType;
  subject: string  // the subject of the question
}

export class FeedbackService {
  constructor(private openAIService: OpenAIService) {}

  async generateFeedback(question: Question, userAnswer: string): Promise<QuestionFeedback> {
    try {
      switch (question.metadata.type) {
        case QuestionType.MULTIPLE_CHOICE:
          return this.generateMultipleChoiceFeedback(question, userAnswer);
        case QuestionType.NUMERICAL:
          return this.generateNumericalFeedback(question, userAnswer);
        case QuestionType.OPEN:
          return this.generateOpenFeedback(question, userAnswer);
        default:
          throw new Error(`Unsupported question type: ${question.metadata.type}`);
      }
    } catch (error) {
      logger.error('Error generating feedback:', error);
      throw error;
    }
  }

  private async generateMultipleChoiceFeedback(question: Question, userAnswer: string): Promise<BasicQuestionFeedback> {
    const userChoice = parseInt(userAnswer);
    const correctAnswer = question.answer.finalAnswer.type === 'multiple_choice' ? question.answer.finalAnswer.value : null;

    if (!correctAnswer) {
      throw new Error('Invalid question format: missing correct answer for multiple choice');
    }

    const isCorrect = userChoice === correctAnswer;
    const feedback: BasicQuestionFeedback = {
      score: isCorrect ? 100 : 0,
      evalLevel: { type: 'binary', level: isCorrect ? BinaryEvalLevel.CORRECT : BinaryEvalLevel.INCORRECT },
      message: isCorrect ? 'תשובה נכונה!' : 'תשובה שגויה',
      basicExplanation: question.answer.solution.text
    };

    return feedback;
  }

  private async generateNumericalFeedback(question: Question, userAnswer: string): Promise<DetailedQuestionFeedback> {
    if (question.metadata.type !== QuestionType.NUMERICAL || question.answer.finalAnswer.type !== 'numerical') {
      throw new Error('Invalid question format for numerical feedback');
    }

    const userValue = parseFloat(userAnswer);
    const correctValue = question.answer.finalAnswer.value;
    const tolerance = question.answer.finalAnswer.tolerance;

    const difference = Math.abs(userValue - correctValue);
    const isWithinTolerance = difference <= tolerance;

    let evalLevel: DetailedEvalLevel;
    let score: number;

    if (isWithinTolerance) {
      evalLevel = DetailedEvalLevel.PERFECT;
      score = 100;
    } else if (difference <= tolerance * 2) {
      evalLevel = DetailedEvalLevel.VERY_GOOD;
      score = 85;
    } else if (difference <= tolerance * 3) {
      evalLevel = DetailedEvalLevel.GOOD;
      score = 75;
    } else {
      evalLevel = DetailedEvalLevel.POOR;
      score = 0;
    }

    return {
      score,
      evalLevel: { type: 'detailed', level: evalLevel },
      message: isWithinTolerance ? 'תשובה נכונה!' : 'תשובה שגויה',
      coreFeedback: `התשובה הנכונה היא ${correctValue}${question.answer.finalAnswer.unit || ''}`,
      detailedFeedback: question.answer.solution.text,
      rubricScores: {
        accuracy: {
          score,
          feedback: isWithinTolerance ? 'התשובה בטווח הדיוק הנדרש' : 'התשובה מחוץ לטווח הדיוק הנדרש'
        }
      }
    };
  }

  private async generateOpenFeedback(question: Question, userAnswer: string): Promise<DetailedQuestionFeedback> {
    if (question.metadata.type !== QuestionType.OPEN) {
      throw new Error('Invalid question format for open feedback');
    }

    // For now, just provide a basic response for open questions
    return {
      score: 0,
      evalLevel: { type: 'detailed', level: DetailedEvalLevel.FAIR },
      message: 'תשובה התקבלה',
      coreFeedback: 'הערכת תשובות פתוחות עדיין לא זמינה',
      detailedFeedback: question.answer.solution.text,
      rubricScores: {
        content: {
          score: 0,
          feedback: 'הערכה אוטומטית לא זמינה כרגע'
        }
      }
    };
  }

  /**
   * Generates detailed feedback using AI for non-multiple choice questions
   */
  private async generateDetailedFeedback(params: FeedbackParams): Promise<DetailedQuestionFeedback> {
    const { question, studentAnswer, formalExamName, examType, subject } = params;
    
    // Initial log group with clear separation
    console.group('\n🎯 Detailed Feedback Generation Started');
    console.log('\nQuestion Details:');
    console.log('-'.repeat(80));
    console.table({
      'ID': question.id,
      'Type': question.metadata.type,
      'Topic': question.metadata.topicId,
      'Difficulty': question.metadata.difficulty,
      'Language': 'N/A',
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

      const response = await this.openAIService.complete(prompt, {
        ...modelConfig,
        messages
      });

      let feedback: DetailedQuestionFeedback;
      try {
        feedback = JSON.parse(response);
        this.logFeedback(feedback);

        // Validate the feedback structure
        if (!FeedbackValidator.validateDetailedFeedback(feedback)) {
          throw new Error('Invalid detailed feedback structure from AI');
        }

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
      'Score': feedback.score,
      'Evaluation Level': feedback.evalLevel.type === 'detailed' ? feedback.evalLevel.level : feedback.evalLevel.level
    });

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
    const config = question.metadata.type === QuestionType.OPEN || question.metadata.type === QuestionType.NUMERICAL
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
          "score": number,                // Score between 0-100, must match the level's range
          "evalLevel": {                  // Evaluation level with type and level
            "type": "binary" | "detailed",
            "level": string
          },
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