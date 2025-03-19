import type { 
  FullAnswer, 
} from './question';

import type {
  QuestionFeedback
} from './feedback';

/**
 * Complete record of a question submission including context,
 * answer, feedback, and metadata for analysis and filtering.
 * 
 * This type is used to:
 * 1. Store complete submission history
 * 2. Enable filtering/analysis by various criteria
 * 3. Track progress and performance
 * 4. Power analytics dashboards
 */
interface QuestionSubmission {
  /** Unique identifier for the submission */
  id?: string;
  
  /** The question this submission is for */
  questionId: string;
  
  /** Optional reference to the prep/session this submission is part of */
  prepId?: string;
  
  answer: FullAnswer;  // Always interpreted in context of the referenced question
  
  /** 
   * Feedback received after submission
   * Only present after feedback is generated
   */
  feedback?: {
    /** The complete feedback content */
    data: QuestionFeedback;
    /** Timestamp when feedback was received */
    receivedAt: number;
  };

  /** 
   * Submission metadata for analysis
   * Used to track behavior and engagement
   */
  metadata: {
    /** When the submission was made */
    submittedAt: number;
    /** Time spent on this question in milliseconds */
    timeSpentMs: number;
    /** Self-reported confidence */
    confidence?: 'low' | 'medium' | 'high';
    /** Whether help was requested */
    helpRequested: boolean;
  };
}

/**
 * Helper to check if a submission has received feedback
 */
export function hasReceivedFeedback(submission: QuestionSubmission): boolean {
  return submission.feedback !== undefined;
}

/**
 * Helper to get time spent in minutes (rounded to 1 decimal)
 */
export function getTimeSpentMinutes(submission: QuestionSubmission): number {
  return Math.round((submission.metadata.timeSpentMs / 60000) * 10) / 10;
}

export type { QuestionSubmission }; 