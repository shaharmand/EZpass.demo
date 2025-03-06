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

// Key for localStorage
const PREP_STORAGE_KEY = 'active_preps';

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
        // Initialize weights from prep's subtopics
        const subTopicWeights = prep.exam.topics.flatMap((topic: Topic) => 
            topic.subTopics.map((st: SubTopic) => ({
                id: st.id,
                percentageOfTotal: st.percentageOfTotal || 0
            }))
        );
        
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
    static updateSelection(prep: StudentPrep, selection: TopicSelection): StudentPrep {
        // Initialize progress for any new subtopics
        const subTopicProgress = { ...prep.subTopicProgress };
        selection.subTopics.forEach(subtopicId => {
            if (!subTopicProgress[subtopicId]) {
                subTopicProgress[subtopicId] = {
                    subtopicId,
                    currentDifficulty: 1 as DifficultyLevel,
                    questionsAnswered: 0,
                    correctAnswers: 0,
                    totalQuestions: 20,
                    estimatedTimePerQuestion: 4,
                    lastAttemptDate: Date.now()
                };
            }
        });

        const updatedPrep: StudentPrep = {
            ...prep,
            selection,
            subTopicProgress
        };

        // Save to storage
        const preps = this.loadPreps();
        preps[updatedPrep.id] = updatedPrep;
        this.savePreps(preps);

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

        return updatedPrep;
    }

    // Add the missing updatePrep method
    static updatePrep(prep: StudentPrep): StudentPrep {
        // Save to storage
        const preps = this.loadPreps();
        preps[prep.id] = prep;
        this.savePreps(preps);
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
} 