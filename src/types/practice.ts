import type { Question, QuestionType, QuestionFeedback } from './question';
import { SkipReason } from './prepUI';

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
  onSkip: (reason: SkipReason) => Promise<void>;
  onHelp: () => Promise<void>;
  onNext: () => Promise<void>;
  onRetry: () => void;
  state: QuestionState;
}

export type PracticeAction =
  | { type: 'START_PRACTICE' }
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