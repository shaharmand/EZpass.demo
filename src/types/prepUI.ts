/**
 * Exam Preparation UI Types
 * 
 * This file contains types specific to the UI components of the exam preparation system.
 * Distinguishes between:
 * - Static question data (Question from ./question)
 * - Dynamic practice session state
 * - UI events and actions
 */

import type { Question, QuestionFeedback, FilterState } from './question';
import type { QuestionStatus } from './prepState';

// Help request tracking
export type HelpType = 'hint' | 'solution' | 'explanation' | 'teach';

export interface HelpRequest {
  type: HelpType;
  timestamp: number;
}

// Separate skip tracking from feedback
export type SkipReason = 'too_hard' | 'too_easy' | 'not_in_material' | 'filter_change';

// Practice session status (different from DB QuestionStatus)
export type QuestionPracticeStatus = 
  | 'idle'             // Question loaded but not started
  | 'active'           // User is working on the question
  | 'submitted'        // Answer submitted, waiting for feedback
  | 'receivedFeedback' // Feedback received, can retry or move on

// Answer types based on question type
export type QuestionAnswer = 
  | { type: 'multiple_choice'; selectedOption: number }
  | { type: 'open'; markdownText: string }
  | { type: 'code'; codeText: string }
  | { type: 'step_by_step'; markdownText: string };

// Single submission within a practice session
export interface QuestionSubmission {
  answer: QuestionAnswer;
  feedback: QuestionFeedback;
  submittedAt: number;  // More specific than generic timestamp
}

// Dynamic state for a question being practiced
export interface QuestionPracticeState {
  status: QuestionPracticeStatus;
  currentAnswer: QuestionAnswer | null;  // null when no answer started
  practiceStartedAt: number;            // When user started this practice session
  lastSubmittedAt?: number;            // When last submission was made
  submissions: QuestionSubmission[];
  helpRequests: HelpRequest[];
}

// Combines static question data with dynamic practice state
export interface ActivePracticeQuestion {
  question: Question;  // The static question data
  practiceState: QuestionPracticeState;  // The dynamic state during practice
}

// UI Event Types
export type PrepEvent = 
  | { type: 'ANSWER_SUBMITTED'; answer: QuestionAnswer }
  | { type: 'QUESTION_SKIPPED'; reason: SkipReason }
  | { type: 'HELP_REQUESTED'; helpType: HelpType }
  | { type: 'RETRY_REQUESTED' }
  | { type: 'NEXT_REQUESTED' };

// UI Action Types
export type PrepAction = 
  | { type: 'START_PREP' }
  | { type: 'PAUSE_PREP' }
  | { type: 'RESUME_PREP' }
  | { type: 'END_PREP' }
  | { type: 'SET_QUESTION'; question: Question }
  | PrepEvent;

// UI Component Props
export interface PracticeContainerProps {
  question: Question;
  onAnswer: (answer: QuestionAnswer) => Promise<void>;
  onSkip: (reason: SkipReason, filters?: FilterState) => Promise<void>;
  onHelp: (type: HelpType) => void;  // Make help type explicit
  onNext: () => void;
  onRetry: () => void;
  state: QuestionPracticeState;
} 