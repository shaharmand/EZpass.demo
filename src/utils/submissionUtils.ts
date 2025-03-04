import type { Question, FullAnswer } from '../types/question';
import type { QuestionSubmission } from '../types/submissionTypes';
import type { QuestionFeedback } from '../types/feedback';

interface CreateSubmissionParams {
  question: Question;
  answer: FullAnswer;
  startTime: number;
  confidence?: 'low' | 'medium' | 'high';
  helpRequested: boolean;
}

/**
 * Creates a new submission record from user input and question context
 */
export function createSubmission({
  question,
  answer,
  startTime,
  confidence,
  helpRequested
}: CreateSubmissionParams): QuestionSubmission {
  return {
    questionId: question.id,
    answer,
    metadata: {
      submittedAt: Date.now(),
      timeSpentMs: Date.now() - startTime,
      confidence,
      helpRequested
    }
  };
}

/**
 * Adds feedback to an existing submission
 */
export function addFeedbackToSubmission(
  submission: QuestionSubmission, 
  feedback: QuestionFeedback
): QuestionSubmission {
  return {
    ...submission,
    feedback: {
      data: feedback,
      receivedAt: Date.now()
    }
  };
}

/**
 * Gets a formatted time string for display
 * Returns: "X min Y sec" or "< 1 min" for very short times
 */
export function getFormattedTimeSpent(submission: QuestionSubmission): string {
  const minutes = Math.floor(submission.metadata.timeSpentMs / 60000);
  const seconds = Math.floor((submission.metadata.timeSpentMs % 60000) / 1000);

  if (minutes === 0) {
    return '< 1 min';
  }

  if (seconds === 0) {
    return `${minutes} min`;
  }

  return `${minutes} min ${seconds} sec`;
} 