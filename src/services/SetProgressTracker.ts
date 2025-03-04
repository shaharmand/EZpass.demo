import { Question } from '../types/question';
import { PublicationStatusEnum } from '../types/question';
import { questionStorage } from '../services/admin/questionStorage';
import { EventEmitter } from 'events';
import { getFeedbackStatus, FeedbackStatus } from '../types/feedback/status';
import { logger } from '../utils/logger';

/**
 * Question status in a set, extending FeedbackStatus to include pending state.
 * Used for tracking question progress in a set of questions.
 * 
 * Mapping rules:
 * - PENDING: Question not yet answered
 * - SUCCESS: Perfect answer (80-100%)
 * - PARTIAL: Partially correct (70-79%)
 * - FAILURE: Incorrect answer (<70%)
 */
export enum SetQuestionStatus {
  PENDING = 'PENDING',    // Question not yet answered
  SUCCESS = 'SUCCESS',    // Perfect answer (80-100%)
  PARTIAL = 'PARTIAL',    // Partially correct (70-79%)
  FAILURE = 'FAILURE'     // Incorrect answer (<70%)
}

export interface SetProgress {
    currentIndex: number;
    results: SetQuestionStatus[];
}

export class SetProgressTracker {
    private static readonly SET_SIZE = 10;
    private setProgress: Map<string, SetProgress> = new Map();
    private eventEmitter = new EventEmitter();
    private instanceId: string;

    constructor() {
        this.instanceId = Math.random().toString(36).substring(7);
        console.log('SetProgressTracker: Created new instance', { instanceId: this.instanceId });
    }

    // Subscribe to progress changes
    onProgressChange(prepId: string, callback: (progress: SetProgress) => void) {
        console.log('SetProgressTracker: Subscribing to progress changes', { 
            prepId, 
            instanceId: this.instanceId 
        });
        this.eventEmitter.on(`progress:${prepId}`, callback);
        // Send initial state if exists
        const progress = this.getProgress(prepId);
        if (progress) {
            callback(progress);
        }
    }

    // Subscribe to question changes
    onQuestionChange(prepId: string, callback: (index: number) => void) {
        this.eventEmitter.on(`question:${prepId}`, callback);
        // Send initial index if exists
        const progress = this.getProgress(prepId);
        if (progress) {
            callback(progress.currentIndex);
        }
    }

    // Unsubscribe from all changes
    offProgressChange(prepId: string, callback: (progress: SetProgress) => void) {
        this.eventEmitter.off(`progress:${prepId}`, callback);
    }

    offQuestionChange(prepId: string, callback: (index: number) => void) {
        this.eventEmitter.off(`question:${prepId}`, callback);
    }

    // Get display index (1-based) and array slot (0-based)
    getDisplayIndex(currentIndex: number): number {
        // currentIndex is 0-based for array slots
        // display should be 1-based for user
        return currentIndex + 1;
    }

    // Get array slot from display index
    private getArraySlot(displayIndex: number): number {
        // displayIndex is 1-based from user
        // array slot should be 0-based
        return displayIndex - 1;
    }

    // Handle new question event
    handleNewQuestion(prepId: string): void {
        // First thing: increment the current index - this is the core responsibility of the tracker
        const progress = this.getProgress(prepId);
        progress.currentIndex++;
        
        console.log('SetProgressTracker: Handling new question', { 
            prepId, 
            currentIndex: progress.currentIndex  // 0-based array slot
        });
        
        // Notify of question change
        this.eventEmitter.emit(`question:${prepId}`, progress.currentIndex);
        console.log('SetProgressTracker: Emitted question change', { 
            prepId, 
            currentIndex: progress.currentIndex  // 0-based array slot
        });
    }

    // Handle feedback event
    handleFeedback(prepId: string, score: number): void {
        console.log('SetProgressTracker: Handling feedback', { prepId, score });
        const progress = this.getProgress(prepId);
        
        // Use the proper function to get status
        const status = getFeedbackStatus(score);
        
        // Map FeedbackStatus to SetQuestionStatus
        let result: SetQuestionStatus;
        switch (status) {
            case FeedbackStatus.SUCCESS:
                result = SetQuestionStatus.SUCCESS;
                break;
            case FeedbackStatus.PARTIAL:
                result = SetQuestionStatus.PARTIAL;
                break;
            case FeedbackStatus.FAILURE:
                result = SetQuestionStatus.FAILURE;
                break;
            default:
                result = SetQuestionStatus.FAILURE;
        }
        
        console.log('SetProgressTracker: Setting result', { 
            prepId, 
            currentIndex: progress.currentIndex,  // 0-based
            score,
            status,
            result 
        });
        
        progress.results[progress.currentIndex] = result;
        
        // Notify of progress change
        this.eventEmitter.emit(`progress:${prepId}`, progress);
        console.log('SetProgressTracker: Emitted progress change', { 
            prepId, 
            currentIndex: progress.currentIndex,  // 0-based
            displayIndex: this.getDisplayIndex(progress.currentIndex),  // 1-based for display
            results: progress.results 
        });
    }

    // Get current progress state
    getSetProgress(prepId: string): SetProgress {
        return this.getProgress(prepId);
    }

    // Initialize or get progress
    private getProgress(prepId: string): SetProgress {
        let progress = this.setProgress.get(prepId);
        if (!progress) {
            progress = {
                currentIndex: -1,  // Start at 0
                results: new Array(SetProgressTracker.SET_SIZE).fill(SetQuestionStatus.PENDING)
            };
            this.setProgress.set(prepId, progress);
        }
        return progress;
    }

    // Clear set progress
    clearSet(prepId: string): void {
        console.log('SetProgressTracker: Clearing set', { prepId });
        const progress = {
            currentIndex: -1,  // Start at 0
            results: new Array(SetProgressTracker.SET_SIZE).fill(SetQuestionStatus.PENDING)
        };
        this.setProgress.set(prepId, progress);
        
        // Notify both changes
        this.eventEmitter.emit(`question:${prepId}`, -1);
        this.eventEmitter.emit(`progress:${prepId}`, progress);
        console.log('SetProgressTracker: Set cleared and notifications sent', { 
            prepId, 
            progress,
            displayIndex: this.getDisplayIndex(progress.currentIndex)  // 1-based for display
        });
    }
} 