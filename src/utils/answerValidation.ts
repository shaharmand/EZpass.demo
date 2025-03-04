import { QuestionType } from '../types/question';

/**
 * Checks if an answer is effectively empty based on content and question type
 */
export function isEffectivelyEmpty(answer: string, questionType: QuestionType): { isEmpty: boolean; reason?: string } {
  // Trim and normalize whitespace
  const normalizedAnswer = answer.trim().replace(/\s+/g, ' ');
  
  // Basic empty check
  if (!normalizedAnswer) {
    return { isEmpty: true, reason: 'No answer provided' };
  }

  // Check for answers that are just punctuation or special characters
  if (/^[.,!?;:()[\]{}'"،、。]+$/.test(normalizedAnswer)) {
    return { isEmpty: true, reason: 'Answer contains only punctuation' };
  }

  // Check for meaningless repetitive characters
  if (/^(.)\1+$/.test(normalizedAnswer)) {
    return { isEmpty: true, reason: 'Answer contains only repeated characters' };
  }

  // Type-specific checks
  switch (questionType) {
    case QuestionType.MULTIPLE_CHOICE:
      // For multiple choice, answer should be a number 1-4
      if (!/^[1-4]$/.test(normalizedAnswer)) {
        return { isEmpty: true, reason: 'Invalid multiple choice answer (should be 1-4)' };
      }
      break;

    case QuestionType.OPEN:
    case QuestionType.NUMERICAL:
      // For text/numerical answers, check minimum meaningful length
      const words = normalizedAnswer.split(/\s+/);
      if (words.length < 3 && questionType === QuestionType.OPEN) {
        return { isEmpty: true, reason: 'Answer is too short (minimum 3 words required)' };
      }
      if (!/^-?\d*\.?\d+$/.test(normalizedAnswer) && questionType === QuestionType.NUMERICAL) {
        return { isEmpty: true, reason: 'Invalid numerical answer' };
      }
      break;
  }

  return { isEmpty: false };
}

/**
 * Throws an error if the answer is empty, with a descriptive message
 */
export function validateNonEmptyAnswer(answer: string, questionType: QuestionType): void {
  const { isEmpty, reason } = isEffectivelyEmpty(answer, questionType);
  if (isEmpty) {
    throw new Error(`Invalid answer: ${reason}`);
  }
} 