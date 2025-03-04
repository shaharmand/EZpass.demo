/**
 * Exam Preparation State Management Types
 * 
 * This file contains types for managing the core exam preparation session state and lifecycle.
 * It is primarily used by StudentPrepContext and PrepStateManager for:
 * - Managing preparation session lifecycle (start, pause, resume, complete)
 * - Tracking question states and progress during preparation
 * - Managing preparation time and progress toward exam date
 * - Handling help requests and error states
 * - Maintaining preparation session persistence
 * 
 * The types here should NOT contain UI-specific concerns - those belong in prepUI.ts
 */

import type { 
  Question, 
  QuestionFeedback, 
  QuestionType,
  DifficultyLevel 
} from './question';
import type { ExamTemplate } from './examTemplate';
import type { ActivePracticeQuestion, SkipReason } from './prepUI';
import type { Topic } from './subject';
import type { DetailedEvalLevel } from './feedback/levels';

// Core prep states
export type PrepStatus = 'initializing' | 'not_started' | 'active' | 'paused' | 'completed' | 'error';

// Core question status
export type QuestionStatus = 
  | 'loading'    // Initial loading
  | 'active'     // Question is being answered
  | 'submitted'  // Answer submitted, waiting for feedback
  | 'completed'  // Has feedback and done

// Main question state
export interface QuestionState {
    // Core state
    status: QuestionStatus;
    startedAt: number;
    lastUpdatedAt: number;  // Track last state update
    questionIndex?: number; // Track question number in sequence
    
    // User interaction
    currentAnswer?: string;  // Current input/draft
    submittedAnswer?: {     // Final submitted answer
        text: string;
        timestamp: number;
    };
    
    // Progress tracking
    correctAnswers: number;  // Number of correct answers
    averageScore: number;   // Average score so far
    
    // Skip tracking
    skipInfo?: {
        reason: SkipReason;
        timestamp: number;
    };
    
    // Help tracking
    helpRequests: HelpRequest[];
    
    // Feedback (only present after submission)
    feedback?: QuestionFeedback;
    
    // Error state if needed
    error?: {
        message: string;
        timestamp: number;
    };
}

export interface TopicSelection {
    subTopics: string[];  // Array of selected subtopicIds
}

export interface QuestionHistoryEntry {
    questionId: string;
    score: number;
    isCorrect: boolean;
    timestamp: number;
    type: QuestionType;
    subTopicId: string | null;
    answer: string;
    evalDetail: DetailedEvalLevel;
    confidence?: 'low' | 'medium' | 'high';
    helpRequested: boolean;
}

// Main prep interface
export interface StudentPrep {
    // Core identity
    id: string;
    
    // Practice context
    exam: ExamTemplate;
    selection: TopicSelection;
    
    // Custom exam name (optional)
    customName?: string | null;
    
    // Study goals - simplified to just exam date
    goals: {
        examDate: number;        // Target exam date (timestamp)
    };

    // User's current focus state
    focusedType: QuestionType | null;
    focusedSubTopic: string | null;  // subtopic ID
    
    // Progress tracking per subtopic
    subTopicProgress: Record<string, SubTopicProgress>;
    
    // Complete state management
    state: PrepState;
}

// State definitions
export type PrepState = 
    | { 
        status: 'initializing';
      }
    | { 
        status: 'not_started';
      }
    | { 
        status: 'active';
        startedAt: number;      // When this active session started
        activeTime: number;     // Accumulated time from previous active sessions
        lastTick: number;       // Last time we updated activeTime
        completedQuestions: number; // Track number of completed questions
        correctAnswers: number;     // Track number of correct answers
        averageScore: number;       // Track average score
        questionHistory: QuestionHistoryEntry[];
      }
    | { 
        status: 'paused';
        activeTime: number;     // Total accumulated active time
        pausedAt: number;       // When we paused
        completedQuestions: number;
        correctAnswers: number;
        averageScore: number;
        questionHistory: QuestionHistoryEntry[];
      }
    | { 
        status: 'completed';
        activeTime: number;     // Final total active time
        completedAt: number;    // When completed
        completedQuestions: number;
        correctAnswers: number;
        averageScore: number;
        questionHistory: QuestionHistoryEntry[];
      }
    | {
        status: 'error';
        error: string;
        activeTime: number;     // Keep track of time even in error
        completedQuestions: number;
        correctAnswers: number;
        averageScore: number;
        questionHistory: QuestionHistoryEntry[];
      };

// Helper to safely get activeTime from any prep state
export const getActiveTime = (state: PrepState): number => {
    if ('activeTime' in state) {
        return state.activeTime;
    }
    return 0;
};

// Helper to safely get timestamp from any prep state
export const getLastTimestamp = (state: PrepState): number | null => {
    if (state.status === 'active' && 'lastTick' in state) {
        return state.lastTick;
    }
    if (state.status === 'paused' && 'pausedAt' in state) {
        return state.pausedAt;
    }
    if (state.status === 'completed' && 'completedAt' in state) {
        return state.completedAt;
    }
    return null;
};

export type HelpType = 'explanation' | 'guidance' | 'stuck' | 'teach';

export interface HelpRequest {
  timestamp: number;
  type: HelpType;
}

export interface SubTopicProgress {
  subtopicId: string;
  currentDifficulty: DifficultyLevel;
  questionsAnswered: number;
  correctAnswers: number;
  totalQuestions: number;  // 20 questions per level as mentioned
  estimatedTimePerQuestion: number;  // 4 minutes per question as mentioned
  lastAttemptDate?: number;
} 