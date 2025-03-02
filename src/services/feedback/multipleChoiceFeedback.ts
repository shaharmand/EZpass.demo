import type { Question, BasicQuestionFeedback } from '../../types/question';
import { BinaryEvalLevel } from '../../types/question';
import { logger } from '../../utils/logger';

/**
 * Service for generating feedback for multiple choice questions
 */
export class MultipleChoiceFeedbackService {
  /**
   * Generates feedback for a multiple choice question based on the selected option
   */
  generateFeedback(question: Question, selectedOption: number): BasicQuestionFeedback {
    // Log raw input data immediately
    logger.debug('Multiple choice answer validation', {
      rawSelectedOption: selectedOption,
      rawSelectedOptionType: typeof selectedOption,
      rawCorrectOption: question.answer.finalAnswer.type === 'multiple_choice' ? question.answer.finalAnswer.value : null,
      rawCorrectOptionType: question.answer.finalAnswer.type === 'multiple_choice' ? typeof question.answer.finalAnswer.value : null,
      rawOptions: question.content.options?.map((opt, idx) => `${idx + 1}: ${opt.text.substring(0, 30)}...`)
    });

    if (question.answer.finalAnswer.type !== 'multiple_choice') {
      throw new Error('Question is not a multiple choice question');
    }

    const correctOption = question.answer.finalAnswer.value;
    const isCorrect = selectedOption === correctOption;
    const score = isCorrect ? 100 : 0; // Binary scoring for multiple choice - full credit or none

    // Log the feedback generation
    logger.info('Generating multiple choice feedback', {
      questionId: question.id,
      selectedOption,
      correctOption,
      isCorrect
    });

    // Create and return the feedback object with correct type
    return {
      score,
      evalLevel: { 
        type: 'binary', 
        level: isCorrect ? BinaryEvalLevel.CORRECT : BinaryEvalLevel.INCORRECT 
      },
      message: isCorrect ? 'תשובה נכונה!' : 'תשובה שגויה',
      basicExplanation: this.generateCoreFeedback(isCorrect, selectedOption, question)
    };
  }

  private generateAssessment(isCorrect: boolean, selected: number, correct: number): string {
    if (isCorrect) {
      return 'תשובה נכונה!';
    }
    return `תשובה לא נכונה`;
  }

  private generateCoreFeedback(isCorrect: boolean, selected: number, question: Question): string {
    if (question.answer.finalAnswer.type !== 'multiple_choice' || !question.content.options) {
      return '';
    }

    const correctOption = question.answer.finalAnswer.value;
    const selectedText = question.content.options[selected - 1]?.text || '';
    const correctText = question.content.options[correctOption - 1]?.text || '';

    // Use the solution text as the explanation
    const explanation = question.answer.solution.text || 'אין הסבר זמין כרגע';

    let feedback;
    if (isCorrect) {
      feedback = `<span style="color: #22c55e; font-size: 1.2em">✓ תשובה נכונה!</span>\n\n` +
             `בחרת נכון באפשרות ${selected}: <span style="color: #22c55e">${selectedText}</span>\n\n` +
             `### הסבר\n${explanation}`;
    } else {
      feedback = `<span style="color: #ef4444; font-size: 1.2em">✗ תשובה שגויה</span>\n\n` +
           `בחרת באפשרות ${selected}: <span style="color: #ef4444">${selectedText}</span>\n` +
           `התשובה הנכונה היא אפשרות ${correctOption}: <span style="color: #22c55e">${correctText}</span>\n\n` +
           `### הסבר\n${explanation}`;
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