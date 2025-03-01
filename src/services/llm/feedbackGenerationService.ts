import { OpenAIService } from './openAIService';
import { AnswerLevel } from '../../types/question';
import type { Question, QuestionFeedback } from '../../types/question';
import { logger } from '../../utils/logger';
import { buildPrompt, OPENAI_MODELS } from '../../utils/llmUtils';
import { buildFeedbackSystemMessage } from './aiSystemMessages';
import { HEBREW_LANGUAGE_REQUIREMENTS } from '../../utils/llmUtils';
import { ExamType } from '../../types/examTemplate';
import { feedbackSchema } from '../../schemas/feedbackSchema';
import { getExamInstitution } from '../../types/examTemplate';
import { FeedbackValidator } from './feedbackValidation';

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
      'Education Type': getExamInstitution(examType)
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
        educationType: getExamInstitution(examType)
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
          'Level': feedback.level,
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
   * Helper to check required fields and their format
   */
  private hasRequiredFields(feedback: any): boolean {
    // Check basic field types
    if (typeof feedback.score !== 'number' ||
        typeof feedback.assessment !== 'string' ||
        typeof feedback.coreFeedback !== 'string' ||
        typeof feedback.level !== 'string') {
      console.error('Missing or invalid basic field types:', {
        hasScore: typeof feedback.score === 'number',
        hasAssessment: typeof feedback.assessment === 'string',
        hasCoreFeedback: typeof feedback.coreFeedback === 'string',
        hasLevel: typeof feedback.level === 'string'
      });
      return false;
    }

    // Check core feedback contains all required symbols
    const requiredSymbols = ['✅', '❌', '⚠️', '🔹'];
    const missingSymbols = requiredSymbols.filter(symbol => !feedback.coreFeedback.includes(symbol));
    if (missingSymbols.length > 0) {
      console.error('Missing required symbols in coreFeedback:', missingSymbols);
      return false;
    }

    // Check assessment length (2-3 sentences)
    const sentences = feedback.assessment.split(/[.!?]+/).filter((s: string) => s.trim().length > 0);
    if (sentences.length < 2 || sentences.length > 3) {
      console.error('Assessment must be 2-3 sentences, found:', sentences.length);
      return false;
    }

    // Check markdown formatting in assessment and coreFeedback
    const hasMarkdown = (text: string) => /[*_`]/.test(text);
    if (!hasMarkdown(feedback.assessment) || !hasMarkdown(feedback.coreFeedback)) {
      console.error('Missing markdown formatting in assessment or coreFeedback');
      return false;
    }

    // Optional fields type check if present
    if (feedback.detailedFeedback !== undefined && typeof feedback.detailedFeedback !== 'string') {
      console.error('Invalid detailedFeedback type:', typeof feedback.detailedFeedback);
      return false;
    }

    if (feedback.rubricScores !== undefined) {
      if (typeof feedback.rubricScores !== 'object' || feedback.rubricScores === null) {
        console.error('Invalid rubricScores type:', typeof feedback.rubricScores);
        return false;
      }

      // Check each rubric score entry
      for (const [criterion, data] of Object.entries(feedback.rubricScores)) {
        const rubricData = data as { score?: number; feedback?: string };
        if (typeof rubricData !== 'object' || rubricData === null ||
            typeof rubricData.score !== 'number' || 
            typeof rubricData.feedback !== 'string' ||
            rubricData.score < 0 || rubricData.score > 100) {
          console.error('Invalid rubric score entry:', { criterion, data });
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Helper to calculate answer level based on score
   */
  private calculateAnswerLevel(score: number): AnswerLevel {
    if (score === 100) return AnswerLevel.PERFECT;
    if (score >= 95) return AnswerLevel.EXCELLENT;
    if (score >= 80) return AnswerLevel.GOOD;
    if (score >= 60) return AnswerLevel.PARTIAL;
    if (score >= 30) return AnswerLevel.WEAK;
    if (score > 0) return AnswerLevel.INSUFFICIENT;
    // For score = 0, we can't determine between IRRELEVANT/EMPTY/NO_UNDERSTANDING
    // This should be determined by the AI based on answer content
    return AnswerLevel.NO_UNDERSTANDING;
  }

  /**
   * Type guard for QuestionFeedback that ensures score matches level
   */
  private isValidFeedback(feedback: any): feedback is QuestionFeedback {
    return FeedbackValidator.validate(feedback);
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

Please evaluate this ${subject} question and provide detailed feedback. First determine the answer's level of correctness, then provide appropriate feedback based on that level.`,
      {
        'Question': question.content.text,
        'Student Answer': studentAnswer,
        'Correct Solution': question.solution?.text || 'No solution provided',
        'Question Type': question.type,
        'Rubric Assessment': JSON.stringify(question.evaluation?.rubricAssessment || null),
        'Required Elements': JSON.stringify(question.evaluation?.answerRequirements?.requiredElements || []),
        'Answer Levels': `The answer must be classified into one of these levels:

Passing Levels (Score > 0):
- PERFECT (100%): Complete and flawless answer
- EXCELLENT (95-99%): Nearly perfect with tiny imperfections
- GOOD (80-94%): Solid understanding with minor issues
- PARTIAL (60-79%): Basic understanding but significant gaps
- WEAK (30-59%): Major gaps but shows some understanding
- INSUFFICIENT (1-29%): Very limited understanding

Non-Passing Levels (Score = 0):
- NO_UNDERSTANDING: Student attempted but shows fundamental misconceptions
- IRRELEVANT: Answer discusses unrelated topics`,
        'Required Response Format': `{
          "level": "PERFECT" | "EXCELLENT" | "GOOD" | "PARTIAL" | "WEAK" | "INSUFFICIENT" | "NO_UNDERSTANDING" | "IRRELEVANT",
          "score": number,                // Score between 0-100, must match the level's range exactly
          "assessment": string,           // 1-2 sentence summary of the evaluation (will be shown as header)
          "coreFeedback": string,        // Main feedback explaining what was good/bad (shown in feedback tab)
                                        // When applicable, organize feedback using these symbols:
                                        // ✅ For correct elements and strong points
                                        // ❌ For mistakes and errors
                                        // ⚠️ For partially correct or needs improvement
                                        // 🔹 For important insights or learning points
          "detailedFeedback": string,    // In-depth analysis with specific improvement suggestions (shown in details tab)
          "rubricScores": {              // Scores for each criterion (shown in rubric breakdown)
            [criterionName: string]: {
              score: number,             // 0-100 score for this specific criterion
              feedback: string           // Specific feedback explaining the criterion score
            }
          }
        }

IMPORTANT VALIDATION RULES:
1. Score MUST match level ranges exactly:
   - PERFECT: score must be 100
   - EXCELLENT: score must be 95-99
   - GOOD: score must be 80-94
   - PARTIAL: score must be 60-79
   - WEAK: score must be 30-59
   - INSUFFICIENT: score must be 1-29
   - NO_UNDERSTANDING/IRRELEVANT: score must be 0

2. Assessment Requirements:
   - 1-2 sentences maximum
   - Should summarize the main evaluation points
   - Should match the tone of the level (praise for high scores, constructive for low scores)

3. Core Feedback Structure:
   - For partial or mixed performance (e.g., GOOD, PARTIAL levels), use the special symbols to clearly categorize different aspects
   - For extreme cases (PERFECT, NO_UNDERSTANDING), a clear narrative without symbols might be more appropriate
   - Always focus on being clear and helpful, using symbols only when they add value

4. All fields are mandatory and must be properly formatted

Example Response:
{
  "level": "PARTIAL",
  "score": 65,
  "assessment": "התשובה מראה הבנה בסיסית של נהלי הבטיחות באתר בנייה, אך חסרים מספר אלמנטים קריטיים וישנן כמה טעויות משמעותיות.",
  "coreFeedback": "✅ זיהית נכון את הצורך בציוד מגן אישי ואת חשיבות הגידור באתר\\n❌ לא התייחסת לנוהל עבודה בגובה ולא הזכרת את הצורך ברתמת בטיחות\\n⚠️ ההתייחסות לשילוט האזהרה הייתה חלקית - הזכרת את קיומו אך לא פירטת את המיקומים הנדרשים\\n🔹 חשוב להבין שעבודה בגובה מחייבת אישור מיוחד והדרכה ספציפית",
  "detailedFeedback": "ניתוח מפורט של תשובתך:\\n1. ציוד מגן אישי:\\n   - ציינת נכון: קסדה, נעלי בטיחות ואפוד זוהר\\n   - חסר: משקפי מגן וכפפות עבודה\\n\\n2. עבודה בגובה:\\n   - לא הוזכר כלל נושא רתמות הבטיחות\\n   - לא צוין הצורך באישור עבודה בגובה\\n   - חסר התייחסות למעקות תקניים\\n\\n3. שילוט וגידור:\\n   - הזכרת את הצורך בגידור, אך לא פירטת מפרט טכני\\n   - חסר פירוט של שילוט בכניסות ובאזורי סיכון\\n\\n4. המלצות לשיפור:\\n   - למד את נוהל עבודה בגובה על כל מרכיביו\\n   - הכר את כל פריטי ציוד המגן הנדרשים\\n   - התייחס לדרישות השילוט המדויקות",
  "rubricScores": {
    "personal_protection": {
      "score": 80,
      "feedback": "זיהוי טוב של רוב ציוד המגן האישי הנדרש, אך חסרים פריטים חשובים"
    },
    "height_safety": {
      "score": 40,
      "feedback": "חסר ידע מהותי בנושא בטיחות בעבודה בגובה"
    },
    "site_safety": {
      "score": 75,
      "feedback": "הבנה בסיסית של גידור ושילוט, אך חסר פירוט טכני"
    }
  }
}`,
        'Evaluation Process': `Evaluation Process:
1. First determine if the answer is relevant to the topic
2. For relevant answers, determine the level by comparing to the solution
3. Provide appropriate feedback for each section:
   - Assessment: Quick summary of overall performance
   - Core Feedback: Main points about what was good/bad
   - Detailed Feedback: In-depth analysis and improvement suggestions
   - Rubric Scores: Break down performance by criteria`
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