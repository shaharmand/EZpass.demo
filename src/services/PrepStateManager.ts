import type { StudentPrep, PrepState, TopicSelection, SubTopicProgress, QuestionHistoryEntry } from '../types/prepState';
import type { Topic, SubTopic } from '../types/subject';
import { QuestionType } from '../types/question';
import { DetailedEvalLevel } from '../types/feedback/levels';
import { DifficultyLevel } from '../types/question';
import { PrepProgressTracker, SubTopicProgressInfo } from './PrepProgressTracker';
import { SetProgressTracker, SetProgress, SetQuestionStatus } from './SetProgressTracker';
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
    private static CACHE_TTL = 1000; // 1 second TTL
    private static instance: PrepStateManager | null = null;
    private topics: Topic[];

    // Internal state tracking
    private static questionResults: Map<string, Map<string, SetQuestionStatus>> = new Map(); // prepId -> (questionId -> result)
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
        
        const tracker = new PrepProgressTracker(subTopicWeights);

        // Add existing question history
        if ('questionHistory' in prep.state && prep.state.questionHistory) {
            prep.state.questionHistory.forEach(question => {
                const subTopic = prep.exam.topics
                    .flatMap(t => t.subTopics)
                    .find(st => st.id === question.questionId);

                tracker.addResult(
                    subTopic?.id || null,
                    question.type,
                    question.score,
                    question.timestamp,
                    question.questionId,
                    question.isCorrect
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
                averageScore: 0,
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
                averageScore: prep.state.averageScore,
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
                averageScore: prep.state.averageScore,
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
                averageScore: prep.state.averageScore,
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
                averageScore: prep.state.status === 'active' ? prep.state.averageScore : 0,
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
                averageScore: prep.state.averageScore
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

    // Get daily progress metrics
    static getDailyProgress(prep: StudentPrep) {
        let tracker = this.progressTrackers.get(prep.id);
        if (!tracker) {
            tracker = this.initializeProgressTracker(prep);
            this.progressTrackers.set(prep.id, tracker);
        }
        return {
            questionsAnswered: tracker.getCompletedQuestions(),
            averageScore: tracker.getAverageScore()
        };
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
    static getProgress(prep: StudentPrep) {
        let tracker = this.progressTrackers.get(prep.id);
        if (!tracker) {
            tracker = this.initializeProgressTracker(prep);
            this.progressTrackers.set(prep.id, tracker);
        }

        const now = Date.now();
        const activeTime = prep.state.status === 'active' 
            ? (prep.state as { activeTime: number; lastTick: number }).activeTime + (now - (prep.state as { lastTick: number }).lastTick)
            : (prep.state as { activeTime: number }).activeTime || 0;

        const subTopicProgress = tracker.getSubTopicProgressTable();
        const totalQuestions = 20 * subTopicProgress.length * 5; // 20 questions per level, 5 levels per subtopic
        
        return {
            metrics: {
                status: prep.state.status,
                activeTime
            },
            progress: {
                overall: tracker.getOverallProgress(),
                byType: {
                    multipleChoice: subTopicProgress.reduce((acc, st) => acc + st.multipleChoiceProgress, 0) / subTopicProgress.length,
                    open: subTopicProgress.reduce((acc, st) => acc + st.openProgress, 0) / subTopicProgress.length,
                    numerical: tracker.getNumericProgress()
                },
                bySubTopic: subTopicProgress
            },
            successRate: {
                overall: tracker.getCorrectAnswers() / Math.max(1, tracker.getCompletedQuestions()),
                byType: {
                    multipleChoice: tracker.getCorrectAnswers() / Math.max(1, tracker.getCompletedQuestions()),
                    open: tracker.getCorrectAnswers() / Math.max(1, tracker.getCompletedQuestions()),
                    numerical: tracker.getCorrectAnswers() / Math.max(1, tracker.getCompletedQuestions())
                }
            },
            completion: {
                questions: {
                    completed: tracker.getCompletedQuestions(),
                    correct: tracker.getCorrectAnswers(),
                    total: totalQuestions
                },
                time: {
                    completed: activeTime,
                    remaining: prep.goals.examDate - now
                }
            },
            overall: {
                time: {
                    completed: activeTime,
                    target: prep.goals.examDate - now
                }
            },
            weekly: {
                time: {
                    completed: activeTime,
                    target: Math.ceil((prep.goals.examDate - now) / Math.max(1, moment(prep.goals.examDate).diff(moment(), 'weeks')))
                }
            },
            daily: {
                time: {
                    completed: activeTime,
                    target: Math.ceil((prep.goals.examDate - now) / Math.max(1, moment(prep.goals.examDate).diff(moment(), 'days')))
                }
            }
        };
    }

    // Get detailed progress info - delegate to trackers
    static getDetailedProgress(prep: StudentPrep): DetailedProgress {
        let tracker = this.progressTrackers.get(prep.id);
        if (!tracker) {
            tracker = this.initializeProgressTracker(prep);
            this.progressTrackers.set(prep.id, tracker);
        }
        return {
            successRates: {
                multipleChoice: tracker.getSubTopicProgressTable().reduce((acc, st) => acc + st.multipleChoiceProgress, 0) / tracker.getSubTopicProgressTable().length,
                open: tracker.getSubTopicProgressTable().reduce((acc, st) => acc + st.openProgress, 0) / tracker.getSubTopicProgressTable().length,
                numerical: tracker.getNumericProgress(),
                overall: tracker.getOverallProgress()
            },
            progressByType: {
                multipleChoice: tracker.getSubTopicProgressTable().reduce((acc, st) => acc + st.multipleChoiceProgress, 0) / tracker.getSubTopicProgressTable().length,
                open: tracker.getSubTopicProgressTable().reduce((acc, st) => acc + st.openProgress, 0) / tracker.getSubTopicProgressTable().length,
                numerical: tracker.getNumericProgress(),
                total: tracker.getOverallProgress()
            },
            subTopicProgress: tracker.getSubTopicProgressTable()
        };
    }

    // Get set progress
    static getSetProgress(prepId: string): SetProgress | null {
        const progress = this.setTracker.getSetProgress(prepId);
        if (!progress) return null;
        
        return progress;
    }

    // Get header progress - overall metrics
    static getHeaderProgress(prep: StudentPrep) {
        let tracker = this.progressTrackers.get(prep.id);
        if (!tracker) {
            tracker = this.initializeProgressTracker(prep);
            this.progressTrackers.set(prep.id, tracker);
        }

        return {
            overall: tracker.getOverallProgress(),
            completed: tracker.getCompletedQuestions(),
            correct: tracker.getCorrectAnswers(),
            successRate: tracker.getCorrectAnswers() / Math.max(1, tracker.getCompletedQuestions()),
            remainingTime: prep.goals.examDate - Date.now()
        };
    }

    // Get question result at position
    static getQuestionResult(prepId: string, position: number): SetQuestionStatus {
        const progress = this.setTracker.getSetProgress(prepId);
        return progress?.results[position] || SetQuestionStatus.PENDING;
    }

    // Clear current set
    static clearSet(prepId: string): void {
        this.setTracker.clearSet(prepId);
    }

    // Check if current set is complete
    static isSetComplete(prepId: string): boolean {
        const progress = this.setTracker.getSetProgress(prepId);
        if (!progress) return false;
        return progress.results.every(result => result !== SetQuestionStatus.PENDING);
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
    static submitAnswer(
        prep: StudentPrep,
        submission: {
            questionId: string;
            answer: { text: string };
            subTopicId: string | null;
            type: QuestionType;
            evalDetail: DetailedEvalLevel;
            score: number;
            isCorrect: boolean;
            helpRequested: boolean;
            confidence?: 'low' | 'medium' | 'high';
        }
    ): StudentPrep {
        if (prep.state.status !== 'active') {
            throw new Error('Can only submit answers in active state');
        }

        // Update set progress with result
        this.getSetTracker().handleFeedback(prep.id, submission.score);

        // Create history entry
        const historyEntry: QuestionHistoryEntry = {
            questionId: submission.questionId,
            score: submission.score,
            isCorrect: submission.isCorrect,
            timestamp: Date.now(),
            type: submission.type,
            subTopicId: submission.subTopicId,
            answer: submission.answer.text,
            evalDetail: submission.evalDetail,
            confidence: submission.confidence,
            helpRequested: submission.helpRequested
        };

        // Update prep state
        const updatedPrep: StudentPrep = {
            ...prep,
            state: {
                ...prep.state,
                completedQuestions: prep.state.completedQuestions + 1,
                correctAnswers: prep.state.correctAnswers + (submission.isCorrect ? 1 : 0),
                averageScore: (
                    (prep.state.averageScore * prep.state.completedQuestions + submission.score) / 
                    (prep.state.completedQuestions + 1)
                ),
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
            submission.subTopicId,
            submission.type,
            submission.score,
            Date.now(),
            submission.questionId,
            submission.isCorrect
        );

        return this.updatePrep(updatedPrep);
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