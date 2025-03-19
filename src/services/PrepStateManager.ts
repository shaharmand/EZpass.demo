import type { StudentPrep, PrepState, TopicSelection, SubTopicProgress, QuestionHistoryEntry } from '../types/prepState';
import type { Topic, SubTopic } from '../types/subject';
import { QuestionType } from '../types/question';
import { DetailedEvalLevel } from '../types/feedback/levels';
import { DifficultyLevel } from '../types/question';
import { PrepProgressTracker, SubTopicProgressInfo, ProgressHeaderMetrics } from './PrepProgressTracker';
import { SetProgressTracker, SetProgress } from './SetProgressTracker';
import { FeedbackStatus } from '../types/feedback/status';
import type { ExamTemplate } from '../types/examTemplate';
import type { FullAnswer } from '../types/question';
import type { QuestionSubmission } from '../types/submissionTypes';
import { DetailedQuestionFeedback } from '../types/feedback/types';
import type { Question } from '../types/question';
import moment from 'moment';
import { QuestionSequencer } from '../services/QuestionSequencer';
import { getCurrentUserIdSync } from '../utils/authHelpers';
import { submissionStorage } from './submission/submissionStorage';
import { v4 as uuidv4 } from 'uuid';
import { 
    savePreparation, 
    getPreparationById, 
    getUserActivePreparation 
} from './preparationService';
import { User } from '@supabase/supabase-js';

// Key for localStorage
const PREP_STORAGE_KEY = 'active_preps';

// Add after the class definition but before any other code
const GUEST_PREP_KEY = 'guest_prep_id';
const GUEST_SEQUENCER_KEY = 'guest_sequencer_state';
const GUEST_SET_PROGRESS_KEY = 'guest_set_progress';
const GUEST_QUESTION_STATE_KEY = 'guest_question_state';

interface DetailedProgress {
  successRates: {
    multipleChoice: number;
    open: number;
    numerical: number;
    overall: number;
  };
  progressByType: {
    multipleChoice: number;
    open: number;
    numerical: number;
    total: number;
  };
  subTopicProgress: SubTopicProgressInfo[];
}

export type PrepStateStatus = 
    | { 
        status: 'active';
        startedAt: number;      // When this active session started
        activeTime: number;     // Accumulated time from previous active sessions
        lastTick: number;       // Last time we updated activeTime
        completedQuestions: number;
        correctAnswers: number;
        averageScore: number;
      }
    | { 
        status: 'paused';
        activeTime: number;     // Total accumulated active time
        pausedAt: number;       // When we paused
        completedQuestions: number;
        correctAnswers: number;
        averageScore: number;
      }
    | { 
        status: 'completed';
        activeTime: number;     // Final total active time
        completedAt: number;    // When completed
        completedQuestions: number;
        correctAnswers: number;
        averageScore: number;
      }
    | {
        status: 'error';
        error: string;
        activeTime: number;     // Keep track of time even in error
        completedQuestions: number;
        correctAnswers: number;
        averageScore: number;
      };

interface PrepCreationOptions {
  examDate?: number;
  customName?: string;
  includeInitialSet?: boolean;
}

export class PrepStateManager {
    private static progressTrackers: Map<string, PrepProgressTracker> = new Map();
    private static progressSubscribers: Map<string, Set<(progress: SetProgress) => void>> = new Map();
    private static prepStateSubscribers: Map<string, Set<(prep: StudentPrep) => void>> = new Map();
    private static examDateSubscribers: Map<string, Set<(prep: StudentPrep) => void>> = new Map();
    private static metricsSubscribers: Map<string, Set<(metrics: ProgressHeaderMetrics) => void>> = new Map();
    private static setTracker: SetProgressTracker = new SetProgressTracker();
    private static prepsCache: Record<string, StudentPrep> | null = null;
    private static lastLoadTime: number = 0;
    private static CACHE_TTL = 30000; // 30 second TTL for cache
    private static instance: PrepStateManager | null = null;
    private static memoizedPreps: Record<string, StudentPrep> | null = null;
    private topics: Topic[];

    // Internal state tracking
    private static questionResults: Map<string, Map<string, FeedbackStatus>> = new Map(); // prepId -> (questionId -> result)
    private static currentSets: Map<string, {
        questions: string[];
        currentIndex: number;
        completedInSet: number;
    }> = new Map();

    // Use in-memory storage for guest prep ID instead of localStorage
    private static _guestPrepId: string | null = null;

    // Define in-memory storage for guest data
    private static _guestSequencerState: any = null;
    private static _guestSetProgress: any = null;

    // Public accessor for setTracker
    static getSetTracker(): SetProgressTracker {
        return this.setTracker;
    }

    private constructor(examData: { topics: Topic[] }) {
        this.topics = examData.topics;
    }

    static getInstance(examData: { topics: Topic[] }): PrepStateManager {
        if (!this.instance) {
            this.instance = new PrepStateManager(examData);
        }
        return this.instance;
    }

    private static initializeProgressTracker(prep: StudentPrep): PrepProgressTracker {
        // Initialize weights from prep's selected subtopics only
        const subTopicWeights = prep.exam.topics.flatMap((topic: Topic) => 
            topic.subTopics
                .filter((st: SubTopic) => prep.selection.subTopics.includes(st.id))
                .map((st: SubTopic) => ({
                    id: st.id,
                    percentageOfTotal: st.percentageOfTotal || 0
                }))
        );
        
        console.log('🎯 Initializing progress tracker:', {
            selectedTopics: prep.selection.subTopics.length,
            totalTopics: prep.exam.topics.flatMap(t => t.subTopics).length,
            timestamp: new Date().toISOString()
        });
        
        const tracker = new PrepProgressTracker(subTopicWeights, prep.goals.examDate);

        // Add existing question history
        if ('questionHistory' in prep.state && prep.state.questionHistory) {
            prep.state.questionHistory.forEach(historyEntry => {
                const subTopic = prep.exam.topics
                    .flatMap(t => t.subTopics)
                    .find(st => st.id === historyEntry.question.metadata.subtopicId);

                tracker.addResult(
                    subTopic?.id || null,
                    historyEntry.question.metadata.type,
                    historyEntry.submission.feedback?.data.score || 0,
                    historyEntry.submission.feedback?.receivedAt || Date.now(),
                    historyEntry.question.id,
                    historyEntry.submission.feedback?.data.isCorrect || false
                );
            });
        }

        return tracker;
    }

    // Load preps from storage
    private static loadPreps(): Record<string, StudentPrep> {
        const now = Date.now();
        if (this.prepsCache && now - this.lastLoadTime < this.CACHE_TTL) {
            return this.prepsCache;
        }

        // No longer using localStorage - returning empty object
        // We'll fetch preps directly from database when needed instead
        console.log('Removing localStorage dependency: loadPreps will no longer load from localStorage');
        this.prepsCache = {};
        this.lastLoadTime = now;
        return {};
    }

    // Save preps to storage
    private static savePreps(preps: Record<string, StudentPrep>): void {
        // No longer using localStorage for saving preps
        console.log('Removing localStorage dependency: savePreps will no longer save to localStorage');
        this.prepsCache = preps;
        this.lastLoadTime = Date.now();
    }

    // Get prep by ID
    static async getPrep(prepId: string): Promise<StudentPrep | null> {
        try {
            // Add stack trace for debugging
            const stackTrace = new Error().stack;
            const caller = stackTrace?.split('\n')[2]?.trim() || 'unknown';
            
            console.log('PREPARATION REQUEST:', {
                requestedId: prepId,
                caller,
                timestamp: new Date().toISOString()
            });
            
            // Validate prep ID - if it's a Promise, try to resolve it
            if (prepId && typeof prepId === 'object' && String(prepId).includes('[object Promise]')) {
                try {
                    const resolvedId = await (prepId as Promise<string>);
                    if (typeof resolvedId === 'string') {
                        prepId = resolvedId;
                    } else {
                        console.warn('Could not resolve prep ID from Promise:', prepId);
                        return null;
                    }
                } catch (error) {
                    console.warn('Error resolving prep ID from Promise:', error);
                    return null;
                }
            }
            
            // Ensure we have a valid prep ID
            if (!prepId || typeof prepId !== 'string') {
                console.warn('Invalid prep ID:', prepId);
                return null;
            }
            
            // Get prep from database
            const dbPrep = await getPreparationById(prepId);
            
            if (!dbPrep) {
                console.warn('Preparation not found in database:', prepId);
                return null;
            }
            
            // Log the preparation ID and associated exam name
            console.log('PREPARATION LOADED:', {
                preparationId: dbPrep.id,
                examId: dbPrep.exam?.id,
                examName: dbPrep.exam?.names?.medium || dbPrep.exam?.names?.full || 'Unknown',
                status: dbPrep.state?.status,
                timestamp: new Date().toISOString()
            });
            
            return dbPrep;
        } catch (error) {
            console.error('Error getting prep from database:', error);
            return null; // Don't fall back to local storage
        }
    }

    /*
     * Create a new preparation with the specified exam
     */
    static async createPrep(
        user: User | null,
        exam: ExamTemplate,
        options?: PrepCreationOptions
    ): Promise<string> {
        try {
            // Generate a uniqueId for this prep
            const prepId = uuidv4();
            
            // If no user, generate a guest id
            const guestId = user ? null : uuidv4();
            
            // Get all subTopic IDs from the exam
            const allSubTopicIds = exam.topics.flatMap(topic => 
                topic.subTopics.map(subTopic => subTopic.id)
            );

            console.log('Creating new preparation with all subtopics:', {
                examId: exam.id,
                totalSubTopics: allSubTopicIds.length,
                subTopicIds: allSubTopicIds
            });
            
            // Create the new preparation structure
            const newPrep: StudentPrep = {
                id: prepId,
                exam,
                selection: { subTopics: allSubTopicIds }, // Initialize with all subTopics selected
                goals: {
                    examDate: options?.examDate || (Date.now() + (4 * 7 * 24 * 60 * 60 * 1000))
                },
                state: {
                    status: 'active',
                    startedAt: Date.now(),
                    activeTime: 0,
                    lastTick: Date.now(),
                    completedQuestions: 0,
                    correctAnswers: 0,
                    questionHistory: []
                },
                subTopicProgress: {},
                userId: user?.id,
                guestId,
                metadata: {
                    examId: exam.id,
                    createdAt: Date.now()
                },
                focusedType: null,
                focusedSubTopic: null,
                customName: options?.customName
            };
            
            // Save to local storage
            const preps = this.loadPreps();
            preps[prepId] = newPrep;
            this.savePreps(preps);
            
            // Save to the database
            try {
                console.log('Saving newly created preparation to database:', {
                    prepId,
                    selectedSubTopics: newPrep.selection.subTopics.length
                });
                await this.updatePrep(newPrep);
            } catch (error) {
                console.error('Failed to save preparation to database:', error);
                // We continue since local storage update succeeded
            }
            
            return prepId;
        } catch (error) {
            console.error('Failed to create preparation:', error);
            throw error;
        }
    }

    // This method is no longer used for localStorage access
    static getPrepStorageKey(prepId: string): string {
        return `prep_${prepId}`;
    }

    /**
     * Method previously used to save to localStorage
     * Now just logs a message since we're moving away from client-side storage
     */
    private static saveToLocalStorage(prep: StudentPrep): void {
        console.log('Removing localStorage dependency: saveToLocalStorage no longer saves to localStorage');
    }

    // Activate prep (start practicing)
    static activate(prep: StudentPrep): StudentPrep {
        if (prep.state.status !== 'paused') {
            throw new Error('Can only activate from paused state');
        }

        const now = Date.now();
        const previousTime = prep.state.activeTime;

        const newPrep: StudentPrep = {
            ...prep,
            state: {
                status: 'active' as const,
                startedAt: now,
                activeTime: previousTime,
                lastTick: now,
                completedQuestions: prep.state.completedQuestions,
                correctAnswers: prep.state.correctAnswers,
                questionHistory: prep.state.questionHistory
            }
        };

        // Save to storage
        const preps = this.loadPreps();
        preps[newPrep.id] = newPrep;
        this.savePreps(preps);
        
        return newPrep;
    }

    // Pause prep
    static pause(prep: StudentPrep): StudentPrep {
        if (prep.state.status !== 'active') {
            console.warn('Attempted to pause prep that was not active:', prep.state.status);
            return prep;
        }

        const now = Date.now();
        const newActiveTime = prep.state.activeTime + (now - prep.state.lastTick);

        const newPrep: StudentPrep = {
            ...prep,
            state: {
                status: 'paused' as const,
                activeTime: newActiveTime,
                pausedAt: now,
                completedQuestions: prep.state.completedQuestions,
                correctAnswers: prep.state.correctAnswers,
                questionHistory: prep.state.questionHistory
            }
        };

        // Save to storage
        const preps = this.loadPreps();
        preps[newPrep.id] = newPrep;
        this.savePreps(preps);
        
        return newPrep;
    }

    // Complete prep
    static async complete(prep: StudentPrep): Promise<StudentPrep> {
        if (prep.state.status !== 'active') {
            throw new Error('Can only complete from active state');
        }

        const now = Date.now();
        const finalActiveTime = prep.state.activeTime + (now - prep.state.lastTick);

        const newPrep: StudentPrep = {
            ...prep,
            state: {
                status: 'completed' as const,
                activeTime: finalActiveTime,
                completedAt: now,
                completedQuestions: prep.state.completedQuestions,
                correctAnswers: prep.state.correctAnswers,
                questionHistory: prep.state.questionHistory
            }
        };

        // Save to local storage
        const preps = this.loadPreps();
        preps[newPrep.id] = newPrep;
        this.savePreps(preps);
        
        // Save to database
        try {
            await savePreparation(newPrep);
        } catch (error) {
            console.error('Error saving completed prep to database:', error);
            // Continue even if database save fails - we have local storage backup
        }
        
        return newPrep;
    }

    // Handle errors
    static setError(prep: StudentPrep, error: string): StudentPrep {
        const activeTime = prep.state.status === 'active' 
            ? prep.state.activeTime + (Date.now() - prep.state.lastTick)
            : prep.state.status === 'paused' || prep.state.status === 'completed'
                ? prep.state.activeTime 
                : 0;

        const newPrep: StudentPrep = {
            ...prep,
            state: {
                status: 'error' as const,
                error,
                activeTime,
                completedQuestions: prep.state.status === 'active' ? prep.state.completedQuestions : 0,
                correctAnswers: prep.state.status === 'active' ? prep.state.correctAnswers : 0,
                questionHistory: prep.state.status === 'active' ? prep.state.questionHistory : []
            }
        };

        // Save to storage
        const preps = this.loadPreps();
        preps[newPrep.id] = newPrep;
        this.savePreps(preps);
        
        return newPrep;
    }

    // Update time while active
    static async updateTime(prep: StudentPrep): Promise<StudentPrep> {
        if (prep.state.status !== 'active') {
            return prep;
        }

        const now = Date.now();
        const newPrep = {
            ...prep,
            state: {
                ...prep.state,
                activeTime: prep.state.activeTime + (now - prep.state.lastTick),
                lastTick: now,
                completedQuestions: prep.state.completedQuestions,
                correctAnswers: prep.state.correctAnswers,
            }
        };

        // Save to local storage
        const preps = this.loadPreps();
        preps[newPrep.id] = newPrep;
        this.savePreps(preps);
        
        // Save to database at a lower frequency to avoid too many writes
        // We'll save every 60 seconds to the database
        const SAVE_INTERVAL = 60000; // 60 seconds
        if (now - (prep.state.lastTick || 0) > SAVE_INTERVAL) {
            try {
                await savePreparation(newPrep);
            } catch (error) {
                console.error('Error updating time in database:', error);
                // Continue even if database save fails - we have local storage backup
            }
        }
        
        return newPrep;
    }

    // Delete prep
    static deletePrep(prepId: string): void {
        const preps = this.loadPreps();
        delete preps[prepId];
        this.savePreps(preps);
    }

   

    // Validate state transition
    static validateTransition(from: PrepStateStatus['status'], to: PrepStateStatus['status']): boolean {
        switch (from) {
            case 'active':
                return ['paused', 'completed', 'error'].includes(to);
            case 'paused':
                return ['active', 'completed', 'error'].includes(to);
            case 'completed':
                return ['error'].includes(to);
            case 'error':
                return false;
            default:
                return false; // Handle any other cases
        }
    }
    // Get progress info - delegate to trackers
    static getHeaderMetrics(prep: StudentPrep): ProgressHeaderMetrics {
        if (!prep) {
            throw new Error('Cannot get header metrics: prep is null');
        }

        let tracker = this.progressTrackers.get(prep.id);
        if (!tracker) {
            tracker = this.initializeProgressTracker(prep);
            this.progressTrackers.set(prep.id, tracker);
        }

        return tracker.getLatestMetrics();
    }

    // Get set progress
    static getSetProgress(prepId: string): SetProgress | null {
        const progress = this.setTracker.getSetProgress(prepId);
        if (!progress) return null;
        
        return progress;
    }

    // Get question result at position
    static getQuestionResult(prepId: string, position: number): FeedbackStatus | undefined {
        const progress = this.getSetProgress(prepId);
        return progress?.results[position];
    }

    // Clear current set
    static clearSet(prepId: string): void {
        this.setTracker.clearSet(prepId);
    }

    // Check if current set is complete
    static isSetComplete(prepId: string): boolean {
        const setProgress = this.getSetProgress(prepId);
        if (!setProgress) return false;
        return setProgress.results.every(result => result !== undefined);
    }

    // Get current focus state
    static async getFocusState(prepId: string): Promise<{ focusedType: QuestionType | null, focusedSubTopic: string | null } | null> {
        try {
            const prep = await this.getPrep(prepId);
            if (!prep) return null;

            return {
                focusedType: prep.focusedType,
                focusedSubTopic: prep.focusedSubTopic
            };
        } catch (error) {
            console.error('Error getting focus state:', error);
            return null;
        }
    }

    // Update topic/subtopic selection for a prep
    static async updateSelection(prepId: string, newSelection: StudentPrep['selection']): Promise<StudentPrep> {
        console.log('🔄 PrepStateManager - Updating selection:', {
            oldSelection: this.getPrep(prepId).then(prep => prep?.selection),
            newSelection,
            timestamp: new Date().toISOString()
        });

        const prep = await this.getPrep(prepId);
        if (!prep) {
            console.error('❌ PrepStateManager - Cannot update selection: Prep not found:', prepId);
            throw new Error(`Cannot update selection: Prep not found: ${prepId}`);
        }

        const oldCount = prep.selection.subTopics.length;
        const updatedPrep = {
            ...prep,
            selection: newSelection
        };
        const newCount = updatedPrep.selection.subTopics.length;

        // Save to local storage
        const preps = this.loadPreps();
        preps[prepId] = updatedPrep;
        this.savePreps(preps);

        // Save to database
        try {
            await this.updatePrep(updatedPrep);
            console.log('✅ PrepStateManager - Selection updated successfully:', {
                oldCount,
                newCount,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('❌ PrepStateManager - Failed to save selection to database:', error);
            // We continue since local storage update succeeded
        }

        // Notify subscribers of the change
        this.notifyPrepStateChange(prepId, updatedPrep);

        return updatedPrep;
    }

    // Directly adjust difficulty level for a subtopic
    static async adjustDifficulty(
        prep: StudentPrep,
        subtopicId: string,
        adjustment: 'increase' | 'decrease'
    ): Promise<StudentPrep> {
        if (prep.state.status !== 'active') {
            throw new Error('Can only adjust difficulty in active state');
        }

        const subtopicProgress = prep.subTopicProgress[subtopicId];
        if (!subtopicProgress) {
            throw new Error(`No progress found for subtopic ${subtopicId}`);
        }

        // Adjust by one level at a time
        const currentDifficulty = subtopicProgress.currentDifficulty;
        if (adjustment === 'increase') {
            subtopicProgress.currentDifficulty = Math.min(5, currentDifficulty + 1) as DifficultyLevel;
        } else {
            subtopicProgress.currentDifficulty = Math.max(1, currentDifficulty - 1) as DifficultyLevel;
        }

        // Update last attempt date
        subtopicProgress.lastAttemptDate = Date.now();

        // Save changes
        return await this.updatePrep(prep);
    }

    // Submit answer
    static feedbackArrived(
        prep: StudentPrep,
        question: Question,
        submission: QuestionSubmission
    ): StudentPrep {
        console.log('🎯 PrepStateManager.feedbackArrived - Starting:', {
            prepId: prep.id,
            questionId: question.id,
            hasFeedback: !!submission.feedback?.data,
            timestamp: new Date().toISOString()
        });

        if (prep.state.status !== 'active') {
            throw new Error('Can only submit answers in active state');
        }

        // Update set progress with result
        if (submission.feedback?.data) {
            console.log('📊 PrepStateManager.feedbackArrived - Updating set progress:', {
                prepId: prep.id,
                score: submission.feedback.data.score,
                isCorrect: submission.feedback.data.isCorrect,
                timestamp: new Date().toISOString()
            });
            this.getSetTracker().handleFeedback(prep.id, submission.feedback.data);
        }
        
        // Create history entry
        const historyEntry: QuestionHistoryEntry = {
            question: question,
            submission: submission
        };
        
        // Ensure feedback exists and has been received
        if (!submission.feedback?.data) {
          throw new Error('Cannot update prep state without feedback data');
        }

        // Save submission to database if user is logged in
        const userId = getCurrentUserIdSync();
        if (userId) {
            // Don't await this - we want it to happen in the background
            submissionStorage.saveSubmission(submission, userId)
                .then(() => {
                    console.log('✅ Submission saved to database successfully', {
                        questionId: question.id,
                        userId
                    });
                })
                .catch(error => {
                    console.error('❌ Failed to save submission to database', {
                        error,
                        questionId: question.id,
                        userId
                    });
                });
        }
        
        const updatedPrep: StudentPrep = {
            ...prep,
            state: {
                ...prep.state,
                completedQuestions: prep.state.completedQuestions + 1,
                correctAnswers: prep.state.correctAnswers + (submission.feedback.data.isCorrect ? 1 : 0),
                questionHistory: [...prep.state.questionHistory, historyEntry]
            } as PrepState
        };

        // Let PrepProgressTracker handle all progress tracking
        let tracker = this.progressTrackers.get(prep.id);
        if (!tracker) {
            console.log('🔄 PrepStateManager.feedbackArrived - Creating new progress tracker:', {
                prepId: prep.id,
                timestamp: new Date().toISOString()
            });
            tracker = this.initializeProgressTracker(updatedPrep);
            this.progressTrackers.set(prep.id, tracker);
        }

        console.log('📈 PrepStateManager.feedbackArrived - Adding result to tracker:', {
            prepId: prep.id,
            subTopicId: question.metadata.subtopicId,
            questionType: question.metadata.type,
            score: submission.feedback?.data.score,
            isCorrect: submission.feedback?.data.isCorrect,
            timestamp: new Date().toISOString()
        });

        tracker.addResult(
            question.metadata.subtopicId || null,
            question.metadata.type,
            submission.feedback?.data.score || 0,
            Date.now(),
            question.id,
            submission.feedback?.data.isCorrect || false
        );

        // Save to storage
        const preps = this.loadPreps();
        preps[updatedPrep.id] = updatedPrep;
        this.savePreps(preps);

        // Notify subscribers of the change
        console.log('🔔 PrepStateManager.feedbackArrived - Notifying subscribers:', {
            prepId: updatedPrep.id,
            subscriberCount: this.prepStateSubscribers.get(updatedPrep.id)?.size || 0,
            timestamp: new Date().toISOString()
        });
        this.notifyPrepStateChange(updatedPrep.id, updatedPrep);

        return updatedPrep;
    }

    // Add the missing updatePrep method
    static async updatePrep(prep: StudentPrep): Promise<StudentPrep> {
        // Save to local storage
        const preps = this.loadPreps();
        const oldPrep = preps[prep.id];
        
        // Check if exam date or selection has changed
        if (oldPrep && (
            oldPrep.goals.examDate !== prep.goals.examDate ||
            JSON.stringify(oldPrep.selection) !== JSON.stringify(prep.selection)
        )) {
            // Reinitialize progress tracker with new exam date or selection
            const tracker = this.initializeProgressTracker(prep);
            this.progressTrackers.set(prep.id, tracker);
        }
        
        // Save to local storage
        preps[prep.id] = prep;
        this.savePreps(preps);

        // Save to database
        try {
            await savePreparation(prep);
        } catch (error) {
            console.error('Error updating prep in database:', error);
            // Continue even if database save fails - we have local storage backup
        }

        // Notify subscribers of the change
        this.notifyPrepStateChange(prep.id, prep);

        return prep;
    }

    // Get active time for prep
    static getActiveTime(prep: StudentPrep): number {
        if (!prep) return 0;
        
        const now = Date.now();
        return prep.state.status === 'active' 
            ? (prep.state as { activeTime: number; lastTick: number }).activeTime + (now - (prep.state as { lastTick: number }).lastTick)
            : (prep.state as { activeTime: number }).activeTime || 0;
    }

    // Get current question from set
    static getCurrentQuestion(prepId: string): string | null {
        // We don't track questions anymore - this should be handled by the context
        return null;
    }

    // Get set progress metrics
    static getSetProgressMetrics(prepId: string): {
        currentQuestion: number;
    } {
        const progress = this.setTracker.getSetProgress(prepId);
        return {
            currentQuestion: progress ? progress.currentIndex + 1 : 1
        };
    }

    // In handleSubmission method
    async handleSubmission(prep: StudentPrep, submission: QuestionSubmission): Promise<void> {
        // Create history entry
        // ... rest of the method ...
    }

    // Subscribe to progress changes
    static subscribeToProgressChanges(prepId: string, callback: (progress: SetProgress) => void): void {
        this.setTracker.onProgressChange(prepId, callback);
    }

    // Subscribe to question changes
    static subscribeToQuestionChanges(prepId: string, callback: (index: number) => void): void {
        this.setTracker.onQuestionChange(prepId, callback);
    }

    // Unsubscribe from progress changes
    static unsubscribeFromProgressChanges(prepId: string, callback: (progress: SetProgress) => void): void {
        this.setTracker.offProgressChange(prepId, callback);
    }

    // Unsubscribe from question changes
    static unsubscribeFromQuestionChanges(prepId: string, callback: (index: number) => void): void {
        this.setTracker.offQuestionChange(prepId, callback);
    }

    // Get current index in set
    static getCurrentSetIndex(prepId: string): number {
        const progress = this.setTracker.getSetProgress(prepId);
        return progress ? progress.currentIndex : 0;
    }

    // Get display index (1-based) for current question
    static getDisplayIndex(prepId: string): number {
        const progress = this.setTracker.getSetProgress(prepId);
        return progress ? this.setTracker.getDisplayIndex(progress.currentIndex) : 1;
    }

    // Get set progress with questions
    static getSetProgressWithQuestions(prepId: string): SetProgress | null {
        return this.setTracker.getSetProgress(prepId);
    }

    // Store guest prep ID
    static storeGuestPrepId(prepId: string): void {
        console.log('Using in-memory storage instead of localStorage for guest prep ID');
        this._guestPrepId = prepId;
    }

    // Get guest prep ID
    static getGuestPrepId(): string | null {
        return this._guestPrepId;
    }

    // Clear guest prep ID
    static clearGuestPrepId(): void {
        this._guestPrepId = null;
    }

    // Migrate guest prep to user account
    static async migrateGuestPrep(): Promise<string | null> {
        const guestPrepId = this.getGuestPrepId();
        if (!guestPrepId) {
            return null;
        }

        // Get the guest prep
        const guestPrep = await this.getPrep(guestPrepId);
        if (!guestPrep) {
            this.clearGuestPrepId();
            return null;
        }

        // Store the sequencer state before migration
        const sequencer = QuestionSequencer.getInstance();
        this._guestSequencerState = {
            currentIndex: sequencer.getCurrentIndex(),
            questions: sequencer.getQuestions()
        };

        // Store set progress state
        const setProgress = this.getSetProgress(guestPrepId);
        if (setProgress) {
            this._guestSetProgress = setProgress;
        }

        // Create a new prep ID for the user
        const userPrepId = crypto.randomUUID();

        // Copy the prep to the new ID
        const preps = this.loadPreps();
        preps[userPrepId] = {
            ...guestPrep,
            id: userPrepId,
            userId: getCurrentUserIdSync() || null // Attach the user ID
        };
        this.savePreps(preps);

        // Create the progress tracker for the new prep
        if (!this.progressTrackers.has(userPrepId)) {
            this.progressTrackers.set(userPrepId, this.initializeProgressTracker(preps[userPrepId]));
        }

        // Clear guest prep ID
        this.clearGuestPrepId();

        return userPrepId;
    }

    // Restore all states after migration
    static restoreAllStates(): void {
        // Restore sequencer state
        if (this._guestSequencerState) {
            try {
                const sequencer = QuestionSequencer.getInstance();
                sequencer.restoreState(this._guestSequencerState);
                this._guestSequencerState = null;
            } catch (error) {
                console.error('Failed to restore sequencer state:', error);
            }
        }

        // Restore set progress state
        if (this._guestSetProgress) {
            try {
                // The set progress will be restored when initializing with the new prep ID
                this._guestSetProgress = null;
            } catch (error) {
                console.error('Failed to restore set progress state:', error);
            }
        }

        // Clean up any remaining guest state
        console.log('Using in-memory storage instead of localStorage for guest states');
    }

    // Get the number of selected subtopics in a prep
    static getSelectedTopicsCount(prep: StudentPrep): number {
        if (!prep?.selection?.subTopics) return 0;
        return prep.selection.subTopics.length;
    }

    // Get the total number of subtopics available in the exam
    static getTotalTopicsCount(prep: StudentPrep): number {
        if (!prep?.exam?.topics) return 0;
        
        return prep.exam.topics.reduce((total, topic) => {
            return total + (topic.subTopics?.length || 0);
        }, 0);
    }

    // Get counts for both selected and total topics
    static getTopicsCounts(prep: StudentPrep): { selected: number; total: number } {
        if (!prep) {
            return {
                selected: 0,
                total: 0
            };
        }
        
        return {
            selected: this.getSelectedTopicsCount(prep),
            total: this.getTotalTopicsCount(prep)
        };
    }

    // Get counts broken down by main topics and subtopics
    static getTopicCountsByType(prep: StudentPrep): {
        mainTopics: { selected: number; total: number };
        subtopics: { selected: number; total: number };
    } {
        if (!prep?.exam?.topics) {
            return {
                mainTopics: { selected: 0, total: 0 },
                subtopics: { selected: 0, total: 0 }
            };
        }
        
        const totalMainTopics = prep.exam.topics.length;
        const totalSubtopics = this.getTotalTopicsCount(prep);
        
        // Count selected main topics (a main topic is selected if any of its subtopics is selected)
        const selectedMainTopics = prep.exam.topics.reduce((count, topic) => {
            // Check if any subtopic of this topic is selected
            const hasSelectedSubtopic = topic.subTopics.some(subtopic => 
                prep.selection.subTopics.includes(subtopic.id)
            );
            return hasSelectedSubtopic ? count + 1 : count;
        }, 0);
        
        return {
            mainTopics: {
                selected: selectedMainTopics,
                total: totalMainTopics
            },
            subtopics: {
                selected: this.getSelectedTopicsCount(prep),
                total: totalSubtopics
            }
        };
    }

    // Subscribe to exam date changes
    static subscribeToExamDateChanges(prepId: string, callback: (prep: StudentPrep) => void): void {
        if (!this.examDateSubscribers.has(prepId)) {
            this.examDateSubscribers.set(prepId, new Set());
        }
        this.examDateSubscribers.get(prepId)!.add(callback);
    }

    // Unsubscribe from exam date changes
    static unsubscribeFromExamDateChanges(prepId: string, callback: (prep: StudentPrep) => void): void {
        const subscribers = this.examDateSubscribers.get(prepId);
        if (subscribers) {
            subscribers.delete(callback);
        }
    }

    // Update exam date and notify subscribers
    static async updateExamDate(prepId: string, newDate: number): Promise<void> {
        const loadedPrep = await this.getPrep(prepId);
        if (!loadedPrep) {
            console.error('❌ PrepStateManager - Cannot update exam date: Prep not found:', prepId);
            return;
        }

        loadedPrep.goals.examDate = newDate;
        const preps = this.loadPreps();
        preps[prepId] = loadedPrep;
        this.savePreps(preps);

        // Notify subscribers of the change
        this.notifyPrepStateChange(prepId, loadedPrep);
    }

    // Subscribe to any prep state changes
    static subscribeToPrepStateChanges(prepId: string, callback: (prep: StudentPrep) => void): void {
        if (!this.prepStateSubscribers.has(prepId)) {
            this.prepStateSubscribers.set(prepId, new Set());
        }
        this.prepStateSubscribers.get(prepId)!.add(callback);
    }

    // Unsubscribe from prep state changes
    static unsubscribeFromPrepStateChanges(prepId: string, callback: (prep: StudentPrep) => void): void {
        const subscribers = this.prepStateSubscribers.get(prepId);
        if (subscribers) {
            subscribers.delete(callback);
        }
    }

    // Helper method to notify subscribers of prep state changes
    private static notifyPrepStateChange(prepId: string, updatedPrep: StudentPrep): void {
        console.log('🔔 PrepStateManager - Notifying subscribers of prep state change:', {
            prepId,
            subscriberCount: this.prepStateSubscribers.get(prepId)?.size || 0,
            timestamp: new Date().toISOString()
        });

        const subscribers = this.prepStateSubscribers.get(prepId);
        if (subscribers) {
            subscribers.forEach(callback => {
                console.log('📨 PrepStateManager - Sending update to subscriber:', {
                    prepId,
                    timestamp: new Date().toISOString()
                });
                try {
                    callback(updatedPrep);
                    console.log('✅ PrepStateManager - Update sent successfully to subscriber:', {
                        prepId,
                        timestamp: new Date().toISOString()
                    });
                } catch (error) {
                    console.error('❌ PrepStateManager - Error sending update to subscriber:', {
                        prepId,
                        error: error instanceof Error ? error.message : 'Unknown error',
                        timestamp: new Date().toISOString()
                    });
                }
            });
        } else {
            console.log('⚠️ PrepStateManager - No subscribers found for prep:', {
                prepId,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Load submissions for a question from the database
     * @param questionId ID of the question to load submissions for
     * @returns Array of submissions or empty array if no submissions or not logged in
     */
    static async loadSubmissionsFromDatabase(questionId: string): Promise<QuestionSubmission[]> {
        const userId = getCurrentUserIdSync();
        if (!userId) {
            return [];
        }
        
        try {
            const submissions = await submissionStorage.getSubmissionsForQuestion(questionId, userId);
            return submissions;
        } catch (error) {
            console.error('Failed to load submissions from database:', error);
            return [];
        }
    }
    
    /**
     * Get the latest submission for a question from the database
     * @param questionId ID of the question to get submission for
     * @returns Latest submission or null if no submissions or not logged in
     */
    static async getLatestSubmissionFromDatabase(questionId: string): Promise<QuestionSubmission | null> {
        const userId = getCurrentUserIdSync();
        if (!userId) {
            return null;
        }
        
        try {
            return await submissionStorage.getLatestSubmission(questionId, userId);
        } catch (error) {
            console.error('Failed to get latest submission from database:', error);
            return null;
        }
    }
    
    /**
     * Initialize question practice state from database submissions
     * @param questionId ID of the question to initialize state for
     * @returns Initial question practice state based on database submissions
     */
    static async initializeQuestionPracticeState(questionId: string): Promise<{
        status: 'viewing' | 'practicing' | 'submitted' | 'reviewed';
        currentAnswer: any | null;
        practiceStartedAt: number;
        submissions: QuestionSubmission[];
        lastSubmittedAt?: number;
    }> {
        try {
            const submissions = await this.loadSubmissionsFromDatabase(questionId);
            
            if (submissions.length > 0) {
                // Sort submissions by timestamp to get the latest one
                const sortedSubmissions = [...submissions].sort(
                    (a, b) => (b.metadata?.submittedAt || 0) - (a.metadata?.submittedAt || 0)
                );
                
                const latestSubmission = sortedSubmissions[0];
                
                return {
                    status: 'reviewed',
                    currentAnswer: null,
                    practiceStartedAt: Date.now(),
                    submissions: sortedSubmissions,
                    lastSubmittedAt: latestSubmission.metadata?.submittedAt
                };
            }
            
            // No submissions found - fresh start
            return {
                status: 'viewing',
                currentAnswer: null,
                practiceStartedAt: Date.now(),
                submissions: []
            };
        } catch (error) {
            console.error('Failed to initialize question practice state:', error);
            
            // Fallback to empty state
            return {
                status: 'viewing',
                currentAnswer: null,
                practiceStartedAt: Date.now(),
                submissions: []
            };
        }
    }

    // Get the user's most recent preparation (from DB)
    static async getUserActivePreparation(): Promise<StudentPrep | null> {
        try {
            // Get active preparation directly from database
            const activePrep = await getUserActivePreparation();
            
            // Return preparation directly without updating local storage
            return activePrep;
        } catch (error) {
            console.error('Error getting active preparation from database:', error);
            return null;
        }
    }

    // Record question completion and update state
    static async recordQuestionCompletion(
        prep: StudentPrep, 
        question: any, 
        wasCorrect: boolean,
        historyEntry: QuestionHistoryEntry
    ): Promise<StudentPrep> {
        if (!prep) {
            throw new Error('Cannot record question completion: prep is null');
        }

        if (prep.state.status !== 'active') {
            console.warn('Recording question completion on non-active prep state', {
                prepId: prep.id,
                status: prep.state.status
            });
        }

        // Handle different state types for better TypeScript type safety
        const completedQuestions = prep.state.status === 'active' && 'completedQuestions' in prep.state
            ? prep.state.completedQuestions + 1 
            : 'completedQuestions' in prep.state ? prep.state.completedQuestions : 0;
            
        const correctAnswers = prep.state.status === 'active' && wasCorrect && 'correctAnswers' in prep.state
            ? prep.state.correctAnswers + 1
            : 'correctAnswers' in prep.state ? prep.state.correctAnswers : 0;
            
        const questionHistory = prep.state.status === 'active' && 'questionHistory' in prep.state
            ? [...(prep.state.questionHistory || []), historyEntry]
            : 'questionHistory' in prep.state ? prep.state.questionHistory || [] : [];

        // Create updated prep with the new completed question and result
        const updatedPrep = {
            ...prep,
            state: {
                ...prep.state,
                completedQuestions,
                correctAnswers,
                questionHistory
            }
        };

        // Save to local storage
        const preps = this.loadPreps();
        preps[prep.id] = updatedPrep;
        this.savePreps(preps);

        // Save to database
        try {
            await this.updatePrep(updatedPrep);
        } catch (error) {
            console.error('Error saving question completion to database:', error);
            // Continue even if database save fails
        }

        // Notify subscribers
        this.notifyPrepStateChange(prep.id, updatedPrep);

        return updatedPrep;
    }

    // Subscribe to metrics changes
    static subscribeToMetricsChanges(prepId: string, callback: (metrics: ProgressHeaderMetrics) => void): void {
        let tracker = this.progressTrackers.get(prepId);
        if (!tracker) {
            const prep = this.loadPreps()[prepId];
            if (prep) {
                tracker = this.initializeProgressTracker(prep);
                this.progressTrackers.set(prepId, tracker);
            }
        }
        
        if (tracker) {
            tracker.subscribeToMetrics(callback);
        }
    }

    // Unsubscribe from metrics changes
    static unsubscribeFromMetricsChanges(prepId: string, callback: (metrics: ProgressHeaderMetrics) => void): void {
        const tracker = this.progressTrackers.get(prepId);
        if (tracker) {
            tracker.unsubscribeFromMetrics(callback);
        }
    }
} 