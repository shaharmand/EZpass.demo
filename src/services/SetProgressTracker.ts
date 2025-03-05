import { Question } from '../types/question';
import { PublicationStatusEnum } from '../types/question';
import { questionStorage } from '../services/admin/questionStorage';
import { EventEmitter } from 'events';
import { FeedbackStatus } from '../types/feedback/status';
import { QuestionFeedback } from '../types/feedback/types';
import { logger } from '../utils/logger';

/**
 * Question status in a set
 * Used for tracking question progress in a set of questions.
 * Questions beyond currentIndex are considered pending.
 */
export interface SetProgress {
    currentIndex: number;
    results: FeedbackStatus[];
}

export class SetProgressTracker {
    private static readonly SET_SIZE = 10;
    private setProgress: Map<string, SetProgress> = new Map();
    private eventEmitter = new EventEmitter();
    private instanceId: string;

    constructor() {
        this.instanceId = Math.random().toString(36).substring(7);
    }

    // Subscribe to progress changes
    onProgressChange(prepId: string, callback: (progress: SetProgress) => void) {
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
        return currentIndex + 1;
    }

    // Get array slot from display index
    private getArraySlot(displayIndex: number): number {
        return displayIndex - 1;
    }

    // Handle new question event
    handleNewQuestion(prepId: string): void {
        const progress = this.getProgress(prepId);
        progress.currentIndex++;
        this.eventEmitter.emit(`question:${prepId}`, progress.currentIndex);
    }

    // Handle feedback event
    handleFeedback(prepId: string, feedback: QuestionFeedback): void {
        const progress = this.getProgress(prepId);
        progress.results[progress.currentIndex] = feedback.status;
        this.eventEmitter.emit(`progress:${prepId}`, progress);
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
                currentIndex: -1,
                results: new Array(SetProgressTracker.SET_SIZE)
            };
            this.setProgress.set(prepId, progress);
        }
        return progress;
    }

    // Clear set progress
    clearSet(prepId: string): void {
        const progress = {
            currentIndex: -1,
            results: new Array(SetProgressTracker.SET_SIZE)
        };
        this.setProgress.set(prepId, progress);
        this.eventEmitter.emit(`question:${prepId}`, -1);
        this.eventEmitter.emit(`progress:${prepId}`, progress);
    }
} 