import { OpenAIService } from './openAIService';
import type { Question, QuestionFeedback } from '../../types/question';
import { logger } from '../../utils/logger';
import { buildPrompt, OPENAI_MODELS } from '../../utils/llmUtils';
import { buildFeedbackSystemMessage } from './aiSystemMessages';
import { HEBREW_LANGUAGE_REQUIREMENTS } from '../../utils/llmUtils';
import { ExamType } from '../../types/exam';
import { feedbackSchema } from '../../schemas/feedback';

interface FeedbackParams {
  question: Question;
  studentAnswer: string;
  formalExamName: string;  // e.g. "Calculus 101", "Physics Bagrut", "Safety MAHAT"
  examType: ExamType;
  subject: string  // the subject of the question
}

export class FeedbackService {
  private openAI: OpenAIService;

  constructor(openAI?: OpenAIService) {
    this.openAI = openAI || new OpenAIService(process.env.REACT_APP_OPENAI_API_KEY || '');
  }

  /**
   * Maps exam type to education level
   */
  private getEducationType(examType: ExamType): 'high_school' | 'technical_college' | 'university' {
    switch (examType) {
      case ExamType.MAHAT:
        return 'technical_college';
      case ExamType.UNI:
      case ExamType.UNI_COURSE:
        return 'university';
      case ExamType.BAGRUT:
      case ExamType.ENTRY:
      case ExamType.GOVERNMENT:
      default:
        return 'high_school';
    }
  }

  /**
   * Generates feedback for a student's attempt at a question
   */
  async generateFeedback(params: FeedbackParams): Promise<QuestionFeedback> {
    const { question, studentAnswer, formalExamName, examType, subject } = params;
    
    // Initial log group with clear separation
    console.group('\n🎯 Feedback Generation Started shahar');
    console.log('\nQuestion Details:');
    console.log('-'.repeat(80));
    console.table({
      'ID': question.id,
      'Type': question.type,
      'Topic': question.metadata.topicId,
      'Difficulty': question.metadata.difficulty,
      'Language': question.metadata.programmingLanguage || 'N/A',
      'Exam': formalExamName,
      'Subject': subject,
      'Education Type': this.getEducationType(examType)
    });

    console.groupEnd();

    try {
      if (question.type === 'multiple_choice') {
        throw new Error('Multiple choice feedback should be handled by StudentPrepContext');
      }

      const prompt = this.buildPrompt(question, studentAnswer, subject);
      const systemMessage = buildFeedbackSystemMessage(subject, examType, formalExamName);
      const modelConfig = this.selectModelConfig(question);
      console.log('%c📋 System Message:', 'color: #059669; font-weight: bold', '\n' + systemMessage);
      console.log('%c📝 OpenAI Prompt:', 'color: #059669; font-weight: bold', '\n' + prompt);
  
      // Request details with better visual separation
      console.group('\n🎯 Generating Feedback shahar');
      console.log({
        questionId: question.id,
        type: question.type,
        topic: question.metadata.topicId,
        difficulty: question.metadata.difficulty,
        subject,
        educationType: this.getEducationType(examType)
      });

      // Send request to OpenAI
      const messages = [
        { role: 'system' as const, content: systemMessage },
        { role: 'user' as const, content: prompt }
      ];

      const response = await this.openAI.complete(prompt, {
        ...modelConfig,
        messages
      });

      // Raw response with clear separation
      console.log('%c📥 OpenAI Raw Response:', 'color: #059669; font-weight: bold', '\n' + response);

      let feedback: QuestionFeedback;
      try {
        feedback = JSON.parse(response);
        
        // Parsed feedback with clear structure
        console.group('\n✅ Parsed Feedback');
        console.log('\nBasic Information:');
        console.log('-'.repeat(80));
        console.table({
          'Question ID': question.id,
          'Is Correct': feedback.isCorrect,
          'Score': feedback.score
        });

        console.log('\nAssessment:');
        console.log('-'.repeat(80));
        console.log(feedback.assessment);

        console.log('\nCore Feedback:');
        console.log('-'.repeat(80));
        console.log(feedback.coreFeedback);

        if (feedback.detailedFeedback) {
          console.log('\nDetailed Feedback:');
          console.log('-'.repeat(80));
          console.log(feedback.detailedFeedback);
        }
        console.groupEnd();

        if (!this.isValidFeedback(feedback)) {
          console.group('\n❌ Validation Error');
          console.log('\nValidation Details:');
          console.log('-'.repeat(80));
          console.log('Required Fields Check:', this.hasRequiredFields(feedback));
          console.log('\nInvalid Feedback Structure:');
          console.log('-'.repeat(80));
          console.log(JSON.stringify(feedback, null, 2));
          console.groupEnd();
          throw new Error('Invalid feedback structure');
        }

      } catch (error: unknown) {
        console.group('\n❌ Parse Error');
        console.error('\nError Details:');
        console.log('-'.repeat(80));
        console.error('Message:', error instanceof Error ? error.message : 'Unknown error occurred');
        console.log('\nRaw Response:');
        console.log('-'.repeat(80));
        console.log(response);
        console.groupEnd();
        throw new Error('Invalid JSON response from AI');
      }

      return feedback;

    } catch (error: unknown) {
      console.group('\n❌ Error in Feedback Generation');
      console.error('\nError Details:');
      console.log('-'.repeat(80));
      console.error('Message:', error instanceof Error ? error.message : 'Unknown error occurred');
      console.log('\nQuestion Context:');
      console.log('-'.repeat(80));
      console.table({
        'ID': question.id,
        'Type': question.type,
        'Topic': question.metadata.topicId,
        'Answer Length': studentAnswer.length
      });
      console.groupEnd();
      throw error;
    }
  }

  /**
   * Helper to check required fields
   */
  private hasRequiredFields(feedback: any): boolean {
    return typeof feedback.isCorrect === 'boolean' &&
      typeof feedback.score === 'number' &&
      typeof feedback.assessment === 'string' &&
      typeof feedback.coreFeedback === 'string';
  }

  /**
   * Type guard for QuestionFeedback
   */
  private isValidFeedback(feedback: any): feedback is QuestionFeedback {
    // Check required fields
    const hasRequiredFields = this.hasRequiredFields(feedback);

    if (!hasRequiredFields) return false;

    // Check score range
    if (feedback.score < 0 || feedback.score > 100) return false;

    // Check optional fields
    if (feedback.answer !== undefined && typeof feedback.answer !== 'string') return false;
    if (feedback.detailedFeedback !== undefined && typeof feedback.detailedFeedback !== 'string') return false;

    return true;
  }

  /**
   * Maps legacy exam types to core types
   */
  private mapExamType(examType?: string): ExamType {
    if (!examType) return ExamType.BAGRUT; // Default to BAGRUT if no type specified
    
    switch (examType) {
      case ExamType.UNI_COURSE:
        return ExamType.UNI;
      case ExamType.UNI_PSYCHOMETRIC:
      case ExamType.UNI_AMIR:
      case ExamType.UNI_YAEL:
        return ExamType.ENTRY;
      case ExamType.MINISTRY_LABOR:
      case ExamType.MINISTRY_TRANSPORT:
      case ExamType.MINISTRY_HEALTH:
      case ExamType.PRIVATE_CERTIFICATION:
        return ExamType.GOVERNMENT;
      default:
        // If it's already a core type, return as is
        if (Object.values(ExamType).includes(examType as ExamType)) {
          return examType as ExamType;
        }
        return ExamType.BAGRUT; // Default fallback
    }
  }

  /**
   * Selects appropriate model configuration based on question characteristics
   */
  private selectModelConfig(question: Question) {
    // Use analysis model for complex questions, feedback model for simple ones
    const config = question.type === 'step_by_step' || question.type === 'code' 
      ? { ...OPENAI_MODELS.analysis, response_format: { type: 'json_object' as const } }
      : { ...OPENAI_MODELS.feedback, response_format: { type: 'json_object' as const } };

    logger.info('Selected model config', {
      questionId: question.id,
      type: question.type,
      model: config.model,
      temperature: config.temperature
    });

    return config;
  }

  /**
   * Builds the prompt for feedback generation
   */
  private buildPrompt(question: Question, studentAnswer: string, subject: string): string {
    logger.info('Building feedback prompt', {
      questionId: question.id,
      type: question.type,
      subject
    });
    const prompt = buildPrompt(
      `בדיקת תשובה - ${subject}

Please evaluate this ${subject} question and provide detailed feedback.`,
      {
        'Question': question.content.text,
        'Student Answer': studentAnswer,
        'Correct Solution': question.solution.text,
        'Question Type': question.type,
        'Rubric Assessment': JSON.stringify(question.rubricAssessment),
        'Required Elements': JSON.stringify(question.answerRequirements.requiredElements),
        'Required Response Format': `{
          "isCorrect": boolean,           // Whether the answer is fundamentally correct
          "score": number,                // Score between 0-100, calculated based on rubric weights
          "assessment": string,           // Short evaluation summary (2-3 sentences, with markdown)
          "coreFeedback": string,         // משוב מפורט עם Markdown, כולל **שימוש חובה** בסמלים מתאימים:\n- ✅ עבור חלקים נכונים\n- ❌ עבור טעויות קריטיות\n- ⚠️ עבור חלקים נכונים חלקית\n- 🔹 עבור תובנות חשובות
          "detailedFeedback": string,     // In-depth analysis of concepts (with markdown)
          "rubricScores": {               // Individual scores for each rubric criterion
            [criterionName: string]: {
              score: number,              // Score 0-100 for this criterion
              feedback: string            // Specific feedback for this criterion
            }
          }
        }`
      }
    );

    logger.info('Built feedback prompt', {
      questionId: question.id,
      promptLength: prompt.length,
      answerLength: studentAnswer.length,
      subject
    });

    return prompt;
  }
} 