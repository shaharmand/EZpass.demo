import { Question, QuestionType } from '../../../../types/question';
import { createBasicFeedback } from '../../../../types/feedback/types';
import { logger } from '../../../../utils/logger';
import { MultipleChoiceAnswer } from '../../../../types/question';
import { QuestionFeedback } from '../../../../types/feedback/types';

/**
 * Service for generating basic feedback for multiple choice questions
 */
export class BasicFeedbackService {
  /**
   * Generate feedback for a multiple choice question
   */
  async generate(
    question: Question, 
    finalAnswer: { type: 'multiple_choice'; value: 1 | 2 | 3 | 4 }  // Use the existing type
  ): Promise<QuestionFeedback> {
    logger.info('Generating basic feedback for multiple choice question', {
      questionId: question.id,
      type: question.metadata.type
    });

    if (question.metadata.type !== QuestionType.MULTIPLE_CHOICE) {
      throw new Error('Basic feedback service only supports multiple choice questions');
    }

    const userChoice = finalAnswer.value;
    const correctAnswer = question.schoolAnswer.finalAnswer?.type === 'multiple_choice' 
      ? question.schoolAnswer.finalAnswer.value 
      : undefined;

    if (correctAnswer === undefined) {
      throw new Error('Invalid question format: missing correct answer');
    }

    const isCorrect = userChoice === correctAnswer;
    
    logger.info('Multiple choice answer validation', {
      questionId: question.id,
      userChoice,
      correctAnswer,
      isCorrect
    });

    return createBasicFeedback(
      isCorrect ? 100 : 0,
      question.schoolAnswer.solution.text || 'No explanation provided',
      isCorrect ? 'תשובה נכונה!' : 'תשובה שגויה'
    );
  }
} 