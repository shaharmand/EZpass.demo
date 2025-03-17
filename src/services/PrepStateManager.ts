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

export class PrepStateManager {
    private static progressTrackers: Map<string, PrepProgressTracker> = new Map();
    private static progressSubscribers: Map<string, Set<(progress: SetProgress) => void>> = new Map();
    private static prepStateSubscribers: Map<string, Set<(prep: StudentPrep) => void>> = new Map();
    private static examDateSubscribers: Map<string, Set<(prep: StudentPrep) => void>> = new Map();
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
        if (this.prepsCache && (now - this.lastLoadTime) < this.CACHE_TTL) {
            return this.prepsCache;
        }

        try {
            const stored = localStorage.getItem(PREP_STORAGE_KEY);
            const preps = stored ? JSON.parse(stored) : {};
            
            // Ensure selections are arrays
            Object.values(preps).forEach((prep: any) => {
                if (prep.selection) {
                    prep.selection = {
                        topics: Array.isArray(prep.selection.topics) ? prep.selection.topics : [],
                        subTopics: Array.isArray(prep.selection.subTopics) ? prep.selection.subTopics : []
                    };
                }
            });

            this.prepsCache = preps;
            this.lastLoadTime = now;
            return preps as Record<string, StudentPrep>;
        } catch (error) {
            console.error('Error loading preps:', error);
            return {};
        }
    }

    // Save preps to storage
    private static savePreps(preps: Record<string, StudentPrep>): void {
        try {
            localStorage.setItem(PREP_STORAGE_KEY, JSON.stringify(preps));
            this.prepsCache = preps;
            this.lastLoadTime = Date.now();
        } catch (error) {
            console.error('Error saving preps:', error);
        }
    }

    // Get prep by ID
    static getPrep(prepId: string): StudentPrep | null {
        const preps = this.loadPreps();
        return preps[prepId] || null;
    }

    // Factory method to create new prep instance
    static createPrep(exam: ExamTemplate, selectedTopics?: TopicSelection): StudentPrep {
        if (!exam.topics || exam.topics.length === 0) {
            throw new Error('Cannot create prep: exam has no topics');
        }
        if (!exam.topics.every((t: Topic) => t.subTopics && t.subTopics.length > 0)) {
            throw new Error('Cannot create prep: some topics have no subtopics');
        }

        const preps = this.loadPreps();
        const prepId = `prep_${exam.id}_${Date.now()}`;
        
        // Calculate exam date (keeping this but not using it for calculations)
        const WEEKS_UNTIL_EXAM = 4;
        const examDate = Date.now() + (WEEKS_UNTIL_EXAM * 7 * 24 * 60 * 60 * 1000);
        
        const allExamSubtopics = exam.topics.flatMap(t => t.subTopics.map(st => st.id));
        const selectedSubTopics = selectedTopics?.subTopics || allExamSubtopics;
        
        // Initialize subtopic progress
        const subTopicProgress: Record<string, SubTopicProgress> = {};
        selectedSubTopics.forEach(subtopicId => {
            subTopicProgress[subtopicId] = {
                subtopicId,
                currentDifficulty: 1 as DifficultyLevel,
                questionsAnswered: 0,
                correctAnswers: 0,
                totalQuestions: 20,
                estimatedTimePerQuestion: 4,
                lastAttemptDate: Date.now()
            };
        });

        const newPrep: StudentPrep = {
            id: prepId,
            exam,
            selection: {
                subTopics: selectedSubTopics
            },
            goals: {
                examDate
            },
            focusedType: null,
            focusedSubTopic: null,
            subTopicProgress,
            state: {
                status: 'active' as const,
                startedAt: Date.now(),
                activeTime: 0,
                lastTick: Date.now(),
                completedQuestions: 0,
                correctAnswers: 0,
                questionHistory: []
            }
        };

        preps[prepId] = newPrep;
        this.savePreps(preps);

        return newPrep;
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
    static complete(prep: StudentPrep): StudentPrep {
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

        // Save to storage
        const preps = this.loadPreps();
        preps[newPrep.id] = newPrep;
        this.savePreps(preps);
        
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
    static updateTime(prep: StudentPrep): StudentPrep {
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

        // Save to storage
        const preps = this.loadPreps();
        preps[newPrep.id] = newPrep;
        this.savePreps(preps);
        
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
    static getFocusState(prepId: string): { focusedType: QuestionType | null, focusedSubTopic: string | null } | null {
        const prep = this.getPrep(prepId);
        if (!prep) return null;

        return {
            focusedType: prep.focusedType,
            focusedSubTopic: prep.focusedSubTopic
        };
    }

    // Update topic/subtopic selection for a prep
    static updateSelection(prepId: string, newSelection: StudentPrep['selection']): StudentPrep {
        console.log('🔄 PrepStateManager - Updating selection:', {
            oldSelection: this.getPrep(prepId)?.selection,
            newSelection,
            timestamp: new Date().toISOString()
        });

        const prep = this.getPrep(prepId);
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

        // Save the updated prep state
        const preps = this.loadPreps();
        preps[prepId] = updatedPrep;
        this.savePreps(preps);

        console.log('✅ PrepStateManager - Selection updated successfully:', {
            oldCount,
            newCount,
            timestamp: new Date().toISOString()
        });

        // Notify subscribers of the change
        this.notifyPrepStateChange(prepId, updatedPrep);

        return updatedPrep;
    }

    // Directly adjust difficulty level for a subtopic
    static adjustDifficulty(
        prep: StudentPrep,
        subtopicId: string,
        adjustment: 'increase' | 'decrease'
    ): StudentPrep {
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
        return this.updatePrep(prep);
    }

    // Submit answer
    static feedbackArrived(
        prep: StudentPrep,
        question: Question,
        submission: QuestionSubmission
    ): StudentPrep {
        if (prep.state.status !== 'active') {
            throw new Error('Can only submit answers in active state');
        }

        // Update set progress with result
        if (submission.feedback?.data) {
            this.getSetTracker().handleFeedback(prep.id, submission.feedback.data);
        }
        // Create history entry
        const historyEntry: QuestionHistoryEntry = {
            question: question,
            submission: submission
        };
        // Update prep state
        // Ensure feedback exists and has been received
        if (!submission.feedback?.data) {
          throw new Error('Cannot update prep state without feedback data');
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
            tracker = this.initializeProgressTracker(updatedPrep);
            this.progressTrackers.set(prep.id, tracker);
        }
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
        this.notifyPrepStateChange(updatedPrep.id, updatedPrep);

        return updatedPrep;
    }

    // Add the missing updatePrep method
    static updatePrep(prep: StudentPrep): StudentPrep {
        // Save to storage
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
        
        // Save to storage
        preps[prep.id] = prep;
        this.savePreps(preps);

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
        localStorage.setItem(GUEST_PREP_KEY, prepId);
    }

    // Get guest prep ID
    static getGuestPrepId(): string | null {
        return localStorage.getItem(GUEST_PREP_KEY);
    }

    // Clear guest prep ID
    static clearGuestPrepId(): void {
        localStorage.removeItem(GUEST_PREP_KEY);
    }

    // Migrate guest prep to user account
    static migrateGuestPrep(): string | null {
        const guestPrepId = localStorage.getItem(GUEST_PREP_KEY);
        if (!guestPrepId) {
            return null;
        }

        // Get the guest prep
        const guestPrep = this.getPrep(guestPrepId);
        if (!guestPrep) {
            localStorage.removeItem(GUEST_PREP_KEY);
            return null;
        }

        // Store the sequencer state before migration
        const sequencer = QuestionSequencer.getInstance();
        const sequencerState = {
            currentIndex: sequencer.getCurrentIndex(),
            questions: sequencer.getQuestions()
        };
        localStorage.setItem(GUEST_SEQUENCER_KEY, JSON.stringify(sequencerState));

        // Store set progress state
        const setProgress = this.getSetProgress(guestPrepId);
        if (setProgress) {
            localStorage.setItem(GUEST_SET_PROGRESS_KEY, JSON.stringify(setProgress));
        }

        // Create a new prep ID for the user
        const userPrepId = crypto.randomUUID();

        // Copy the prep to the new ID
        const preps = this.loadPreps();
        preps[userPrepId] = {
            ...guestPrep,
            id: userPrepId
        };
        this.savePreps(preps);

        // Update the set tracker for the new prep ID
        if (setProgress) {
            // First clear any existing progress for the new ID
            this.setTracker.clearSet(userPrepId);
            
            // Then replay the results to rebuild the state
            setProgress.results.forEach((result, index) => {
                if (result) {
                    // Move to the correct position
                    while (this.setTracker.getSetProgress(userPrepId).currentIndex < index) {
                        this.setTracker.handleNewQuestion(userPrepId);
                    }
                    // Add the result with a complete feedback object
                    const score = result === FeedbackStatus.SUCCESS ? 100 : 
                                result === FeedbackStatus.PARTIAL ? 75 : 0;
                                const evalLevel = result === FeedbackStatus.SUCCESS ? DetailedEvalLevel.PERFECT :
                                                result === FeedbackStatus.PARTIAL ? DetailedEvalLevel.GOOD :
                                                DetailedEvalLevel.POOR;
                                
                                this.setTracker.handleFeedback(userPrepId, {
                                    type: 'detailed',
                                    evalLevel,
                                    coreFeedback: '',
                                    detailedFeedback: '',
                                    criteriaFeedback: [],
                                    score,
                                    message: '',
                                    isCorrect: result === FeedbackStatus.SUCCESS,
                                    status: result
                                });
                }
            });
        }

        // Clean up guest prep
        delete preps[guestPrepId];
        this.savePreps(preps);
        localStorage.removeItem(GUEST_PREP_KEY);

        return userPrepId;
    }

    // Restore all states after migration
    static restoreAllStates(): void {
        // Restore sequencer state
        const sequencerStateJson = localStorage.getItem(GUEST_SEQUENCER_KEY);
        if (sequencerStateJson) {
            try {
                const sequencerState = JSON.parse(sequencerStateJson);
                const sequencer = QuestionSequencer.getInstance();
                sequencer.restoreState(sequencerState);
                localStorage.removeItem(GUEST_SEQUENCER_KEY);
            } catch (error) {
                console.error('Failed to restore sequencer state:', error);
            }
        }

        // Restore set progress state
        const setProgressJson = localStorage.getItem(GUEST_SET_PROGRESS_KEY);
        if (setProgressJson) {
            try {
                const setProgress = JSON.parse(setProgressJson);
                // The set progress will be restored when initializing with the new prep ID
                localStorage.removeItem(GUEST_SET_PROGRESS_KEY);
            } catch (error) {
                console.error('Failed to restore set progress state:', error);
            }
        }

        // Clean up any remaining guest state
        localStorage.removeItem(GUEST_QUESTION_STATE_KEY);
    }

    // Get selected topics count for a prep (subtopics only)
    static getSelectedTopicsCount(prep: StudentPrep): number {
        return prep.selection.subTopics.length;
    }

    // Get total topics count for a prep (all available subtopics in the exam)
    static getTotalTopicsCount(prep: StudentPrep): number {
        return prep.exam.topics?.reduce(
            (count: number, topic) => count + (topic.subTopics?.length || 0), 
            0
        ) || 0;
    }

    // Get both selected and total topics count (subtopics only)
    static getTopicsCounts(prep: StudentPrep): { selected: number; total: number } {
        const selected = this.getSelectedTopicsCount(prep);
        const total = this.getTotalTopicsCount(prep);
        
        console.log('📊 PrepStateManager - Getting subtopic counts:', {
            selected,
            total,
            timestamp: new Date().toISOString()
        });

        return { selected, total };
    }

    // Get topic counts by type (main topics vs subtopics)
    static getTopicCountsByType(prep: StudentPrep): {
        mainTopics: { selected: number; total: number };
        subtopics: { selected: number; total: number };
    } {
        // Count selected main topics (topics that have at least one selected subtopic)
        const selectedMainTopics = new Set(prep.selection.subTopics.map(id => 
            prep.exam.topics.find(t => 
                t.subTopics.some(st => st.id === id)
            )?.id
        )).size;

        const mainTopics = {
            selected: selectedMainTopics,
            total: prep.exam.topics.length
        };

        const subtopics = {
            selected: prep.selection.subTopics.length,
            total: this.getTotalTopicsCount(prep)
        };

        console.log('📊 PrepStateManager - Getting topic counts by type:', {
            mainTopics,
            subtopics,
            timestamp: new Date().toISOString()
        });

        return { mainTopics, subtopics };
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
    static updateExamDate(prepId: string, newDate: number): void {
        const prep = this.getPrep(prepId);
        if (!prep) {
            console.error('❌ PrepStateManager - Cannot update exam date: Prep not found:', prepId);
            return;
        }

        prep.goals.examDate = newDate;
        const preps = this.loadPreps();
        preps[prepId] = prep;
        this.savePreps(preps);

        // Notify subscribers of the change
        this.notifyPrepStateChange(prepId, prep);
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
} 