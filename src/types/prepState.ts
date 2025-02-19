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

import type { Question, QuestionFeedback } from './question';
import type { FormalExam } from './shared/exam';
import type { HelpRequest, PracticeQuestion, SkipReason } from './prepUI';

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
    topics: string[];     // Array of selected topicIds
    subTopics: string[];  // Array of selected subtopicIds
}

// Main prep interface
export interface StudentPrep {
    // Core identity
    id: string;
    
    // Practice context
    exam: FormalExam;
    selection: TopicSelection;
    
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
      }
    | { 
        status: 'paused';
        activeTime: number;     // Total accumulated active time
        pausedAt: number;       // When we paused
      }
    | { 
        status: 'completed';
        activeTime: number;     // Final total active time
        completedAt: number;    // When completed
      }
    | {
        status: 'error';
        error: string;
        activeTime: number;     // Keep track of time even in error
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

// Logging utilities
export const logPrepStateChange = (
    action: string,
    prep: StudentPrep | null,
    question: PracticeQuestion | null
) => {
    console.group(`🔄 Prep State Change: ${action}`);
    console.log('Timestamp:', new Date().toISOString());
    console.log('Prep State:', {
        id: prep?.id,
        status: prep?.state.status,
        totalTime: prep ? getActiveTime(prep.state) : 0,
        lastUpdate: prep ? getLastTimestamp(prep.state) : null,
        examId: prep?.exam.id,
        selection: prep?.selection ? {
            topics: prep.selection.topics,
            subTopics: prep.selection.subTopics
        } : null
    });
    console.log('Active Question:', question ? {
        id: question.question.id,
        status: question.state.status,
        topic: question.question.metadata.topicId,
        hasAnswer: !!question.state.currentAnswer,
        hasFeedback: !!question.state.feedback
    } : 'None');
    console.groupEnd();
};

export const logQuestionStateChange = (
    action: string,
    question: PracticeQuestion | null,
    prep: StudentPrep | null
) => {
    console.group(`📝 Question State Change: ${action}`);
    console.log('Timestamp:', new Date().toISOString());
    console.log('Question State:', question ? {
        id: question.question.id,
        status: question.state.status,
        topic: question.question.metadata.topicId,
        startedAt: question.state.startedAt ? new Date(question.state.startedAt).toISOString() : null,
        submittedAt: question.state.submittedAnswer ? new Date(question.state.submittedAnswer.timestamp).toISOString() : null,
        hasAnswer: !!question.state.currentAnswer,
        hasFeedback: !!question.state.feedback
    } : 'None');
    console.log('Prep Context:', {
        id: prep?.id,
        status: prep?.state.status,
        totalTime: prep ? getActiveTime(prep.state) : 0
    });
    console.groupEnd();
}; 