import type { Question, QuestionFeedback } from '../../types/question';
import { logger } from '../../utils/logger';
import { feedbackSchema } from '../../schemas/feedback';

/**
 * Service for generating feedback for multiple choice questions
 */
export class MultipleChoiceFeedbackService {
  /**
   * Generates feedback for a multiple choice question based on the selected option
   */
  generateFeedback(question: Question, selectedOption: number): QuestionFeedback {
    // Log raw input data immediately
    logger.info('Raw input data for feedback:', {
      rawSelectedOption: selectedOption,
      rawSelectedOptionType: typeof selectedOption,
      rawCorrectOption: question.correctOption,
      rawCorrectOptionType: typeof question.correctOption,
      rawOptions: question.options?.map((opt, idx) => `${idx + 1}: ${opt.text.substring(0, 30)}...`)
    });

    if (!question.correctOption) {
      throw new Error('Question does not have a correct option defined');
    }

    const isCorrect = selectedOption === question.correctOption;
    const score = isCorrect ? 100 : 0; // Binary scoring for multiple choice - full credit or none

    // Log the feedback generation
    logger.info('Generating multiple choice feedback', {
      questionId: question.id,
      selectedOption,
      correctOption: question.correctOption,
      isCorrect
    });

    // Create the feedback object
    const feedback = {
      isCorrect,
      score,
      assessment: this.generateAssessment(isCorrect, selectedOption, question.correctOption),
      coreFeedback: this.generateCoreFeedback(isCorrect, selectedOption, question),
      detailedFeedback: this.generateDetailedFeedback(question, selectedOption)
    };

    // Validate using Zod schema
    try {
      return feedbackSchema.parse(feedback);
    } catch (error) {
      logger.error('Invalid feedback format', { error, feedback });
      throw new Error('Failed to generate valid feedback format');
    }
  }

  private generateAssessment(isCorrect: boolean, selected: number, correct: number): string {
    if (isCorrect) {
      return 'תשובה נכונה!';
    }
    return `תשובה לא נכונה`;
  }

  private generateCoreFeedback(isCorrect: boolean, selected: number, question: Question): string {
    // We already validated these in generateFeedback
    if (!question.options || !question.correctOption) return '';

    const selectedText = question.options[selected - 1]?.text || '';
    const correctText = question.options[question.correctOption - 1]?.text || '';

    let feedback;
    if (isCorrect) {
      feedback = `<span style="color: #22c55e; font-size: 1.2em">✓ תשובה נכונה!</span>\n\n` +
             `בחרת נכון באפשרות ${selected}: <span style="color: #22c55e">${selectedText}</span>\n\n` +
             `### הסבר\n${question.solution.text}`;
    } else {
      feedback = `<span style="color: #ef4444; font-size: 1.2em">✗ תשובה שגויה</span>\n\n` +
           `בחרת באפשרות ${selected}: <span style="color: #ef4444">${selectedText}</span>\n` +
           `התשובה הנכונה היא אפשרות ${question.correctOption}: <span style="color: #22c55e">${correctText}</span>\n\n` +
           `### הסבר\n${question.solution.text}`;
    }

    logger.info('Generated core feedback:', {
      isCorrect,
      selected,
      questionId: question.id,
      feedbackLength: feedback.length,
      feedbackPreview: feedback.substring(0, 100) + '...'
    });

    return feedback;
  }

  private generateDetailedFeedback(question: Question, selected: number): string {
    return '<span style="color: #6b7280; font-style: italic">כרגע לא בשימוש. בעתיד נוסיף ניתוח מפורט של כל אפשרות, כולל הסבר מדוע כל אחת מהאפשרויות האחרות אינה נכונה, ודוגמאות נגדיות ספציפיות.</span>';
  }
} 