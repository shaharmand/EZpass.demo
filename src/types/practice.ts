import type { Question, QuestionType, QuestionFeedback } from './question';

export type HelpType = 'hint' | 'solution' | 'explanation';

export interface HelpRequest {
  type: HelpType;
  timestamp: number;
}

export interface QuestionState {
  status: 'loading' | 'active' | 'submitted' | 'completed';
  feedback?: QuestionFeedback;
  currentAnswer?: string;
  correctAnswers: number;
  averageScore: number;
  helpRequests?: HelpRequest[];
  questionIndex: number;
}

export interface PracticeContainerProps {
  question: Question;
  onAnswer: (answer: string) => Promise<void>;
  onSkip: (reason: 'too_hard' | 'too_easy' | 'not_in_material') => Promise<void>;
  onHelp: () => Promise<void>;
  onNext: () => Promise<void>;
  onRetry: () => void;
  state: QuestionState;
}

export type SkipReason = 'too_hard' | 'too_easy' | 'not_in_material';

export type PracticeAction =
  | { type: 'SUBMIT_ANSWER'; answer: string }
  | { type: 'REQUEST_HELP' }
  | { type: 'SKIP_QUESTION'; reason: SkipReason }
  | { type: 'END_PRACTICE' };

export type PracticeEvent = 
  | { type: 'START_PRACTICE' }
  | { type: 'LOAD_QUESTION' }
  | { type: 'QUESTION_READY'; question: Question }
  | { type: 'SUBMIT_ANSWER'; answer: string }
  | { type: 'RECEIVE_FEEDBACK'; feedback: QuestionFeedback }
  | { type: 'SKIP_QUESTION'; reason: SkipReason }
  | { type: 'END_PRACTICE' }; 