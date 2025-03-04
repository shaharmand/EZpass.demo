import type { Question } from '../../types/question';
import { BinaryEvalLevel } from '../../types/feedback/levels';
import { logger } from '../../utils/logger';
import { createBasicFeedback } from '../../types/feedback/types';

/**
 * Service for generating feedback for multiple choice questions
 */
export class MultipleChoiceFeedbackService {
  generate(question: Question, selectedOption: number) {
    logger.info('Generating multiple choice feedback', {
      questionId: question.id,
      rawSelectedOption: selectedOption,
      rawSelectedOptionType: typeof selectedOption,
      rawCorrectOption: question.schoolAnswer.finalAnswer?.type === 'multiple_choice' ? question.schoolAnswer.finalAnswer.value : null,
      rawCorrectOptionType: question.schoolAnswer.finalAnswer?.type === 'multiple_choice' ? typeof question.schoolAnswer.finalAnswer.value : null,
      rawOptions: question.content.options?.map((opt, idx) => `${idx + 1}: ${opt.text.substring(0, 30)}...`)
    });

    if (question.schoolAnswer.finalAnswer?.type !== 'multiple_choice') {
      throw new Error('Question is not a multiple choice question');
    }

    const correctOption = question.schoolAnswer.finalAnswer.value;
    const isCorrect = selectedOption === correctOption;
    const score = isCorrect ? 100 : 0; // Binary scoring for multiple choice - full credit or none

    return createBasicFeedback(
      score,
      this.generateCoreFeedback(isCorrect, selectedOption, question)
    );
  }

  private generateCoreFeedback(isCorrect: boolean, selected: number, question: Question): string {
    if (question.schoolAnswer.finalAnswer?.type !== 'multiple_choice' || !question.content.options) {
      return '';
    }

    const correctOption = question.schoolAnswer.finalAnswer.value;
    const selectedText = question.content.options[selected - 1]?.text || '';
    const correctText = question.content.options[correctOption - 1]?.text || '';

    // Use the solution text as the explanation
    const explanation = question.schoolAnswer.solution.text || 'אין הסבר זמין כרגע';

    let feedback;
    if (isCorrect) {
      feedback = `✅ תשובה נכונה!\n\n${explanation}`;
    } else {
      feedback = `❌ תשובה שגויה.\n\nבחרת: ${selectedText}\n\nהתשובה הנכונה היא: ${correctText}\n\n${explanation}`;
    }

    return feedback;
  }

  private generateDetailedFeedback(question: Question, selected: number): string {
    return '<span style="color: #6b7280; font-style: italic">כרגע לא בשימוש. בעתיד נוסיף ניתוח מפורט של כל אפשרות, כולל הסבר מדוע כל אחת מהאפשרויות האחרות אינה נכונה, ודוגמאות נגדיות ספציפיות.</span>';
  }
} 