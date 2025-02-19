/**
 * Exam Preparation UI Types
 * 
 * This file contains types specific to the UI components of the exam preparation system.
 * It focuses on:
 * - UI component props
 * - User interaction types (skip reasons, help types)
 * - Event and action types for UI state management
 * 
 * Core state management types belong in prepState.ts
 */

import type { Question, QuestionFeedback } from './question';
import type { QuestionState, QuestionStatus } from './prepState';

// Help request tracking
export type HelpType = 'hint' | 'solution' | 'explanation' | 'teach';

export interface HelpRequest {
  type: HelpType;
  timestamp: number;
}

// Separate skip tracking from feedback
export type SkipReason = 'too_hard' | 'too_easy' | 'not_in_material';

// Practice question - simplified to just combine question with its state
export interface PracticeQuestion {
    question: Question;  // The full question object with all metadata
    state: QuestionState;
}

// UI Event Types
export type PrepEvent = 
  | { type: 'ANSWER_SUBMITTED'; answer: string }
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
  onAnswer: (answer: string) => Promise<void>;
  onSkip: (reason: SkipReason) => Promise<void>;
  onHelp: () => void;
  onNext: () => void;
  onRetry: () => void;
  state: {
    status: QuestionStatus;
    feedback?: QuestionFeedback;
    questionIndex: number;
    correctAnswers: number;
    averageScore: number;
  };
} 