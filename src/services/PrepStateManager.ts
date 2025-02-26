import type { StudentPrep, TopicSelection } from '../types/prepState';
import type { ExamTemplate } from '../types/examTemplate';
import type { Topic } from '../types/subject';

// Key for localStorage
const PREP_STORAGE_KEY = 'active_preps';

export type PrepState = 
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
    // Load preps from storage
    private static loadPreps(): Record<string, StudentPrep> {
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
            
            return preps as Record<string, StudentPrep>;
        } catch (error) {
            console.error('Error loading preps:', error);
            return {};
        }
    }

    // Save preps to storage
    private static savePreps(preps: Record<string, StudentPrep>): void {
        try {
            // No need for conversion, just save directly
            localStorage.setItem(PREP_STORAGE_KEY, JSON.stringify(preps));
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
        // Validate exam has topics
        if (!exam.topics || exam.topics.length === 0) {
            throw new Error('Cannot create prep: exam has no topics');
        }
        if (!exam.topics.every((t: Topic) => t.subTopics && t.subTopics.length > 0)) {
            throw new Error('Cannot create prep: some topics have no subtopics');
        }

        // Load existing preps
        const preps = this.loadPreps();
        
        // Create new prep ID with timestamp to ensure uniqueness
        const prepId = `prep_${exam.id}_${Date.now()}`;
        
        // Calculate study goals
        const TOTAL_HOURS = 50;
        const WEEKS_UNTIL_EXAM = 4;
        const examDate = Date.now() + (WEEKS_UNTIL_EXAM * 7 * 24 * 60 * 60 * 1000); // 4 weeks from now
        
        // Create new prep
        const newPrep: StudentPrep = {
            id: prepId,
            exam,
            selection: selectedTopics || {
                subTopics: exam.topics.flatMap(t => t.subTopics.map(st => st.id))
            },
            goals: {
                examDate,
                totalHours: TOTAL_HOURS,
                weeklyHours: TOTAL_HOURS / WEEKS_UNTIL_EXAM,
                dailyHours: TOTAL_HOURS / (WEEKS_UNTIL_EXAM * 7),
                questionGoal: selectedTopics?.subTopics.length ? selectedTopics.subTopics.length * 50 : exam.topics.reduce((acc, topic) => acc + topic.subTopics.length, 0) * 50
            },
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

        // Save updated preps
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

    // Helper to get active time
    static getActiveTime(prep: StudentPrep): number {
        if (prep.state.status === 'active') {
            return prep.state.activeTime + (Date.now() - prep.state.lastTick);
        }
        if ('activeTime' in prep.state) {
            return prep.state.activeTime;
        }
        return 0;
    }

    // Get daily progress metrics
    static getDailyProgress(prep: StudentPrep) {
        // Calculate days until exam
        const daysUntilExam = Math.max(1, Math.ceil((prep.goals.examDate - Date.now()) / (24 * 60 * 60 * 1000)));
        
        // Calculate daily goals
        const dailyQuestionsGoal = Math.ceil(prep.goals.questionGoal / daysUntilExam);
        const dailyTimeGoalMinutes = Math.ceil((prep.goals.totalHours * 60) / daysUntilExam);

        // Calculate last 24 hours progress
        const last24Hours = Date.now() - (24 * 60 * 60 * 1000);
        const questionsAnsweredToday = prep.state.status !== 'initializing' && prep.state.status !== 'not_started'
            ? prep.state.questionHistory?.filter(q => q.timestamp >= last24Hours).length || 0
            : 0;

        // Calculate daily time progress in minutes
        const dailyTimeProgress = Math.round(this.getActiveTime(prep) / (60 * 1000));

        return {
            questionsAnsweredToday,
            dailyQuestionsGoal,
            dailyTimeProgress,
            dailyTimeGoalMinutes,
            isDailyTimeGoalExceeded: dailyTimeProgress > dailyTimeGoalMinutes,
            isQuestionsGoalExceeded: questionsAnsweredToday > dailyQuestionsGoal
        };
    }

    // Validate state transition
    static validateTransition(from: PrepState['status'], to: PrepState['status']): boolean {
        switch (from) {
            case 'active':
                return ['paused', 'completed', 'error'].includes(to);
            case 'paused':
                return ['active', 'error'].includes(to);
            case 'completed':
                return ['error'].includes(to);
            case 'error':
                return false;
        }
    }

    // Update prep progress
    static updateProgress(prep: StudentPrep, isCorrect: boolean, score: number, questionId: string): StudentPrep {
        if (prep.state.status !== 'active') {
            throw new Error('Can only update progress in active state');
        }

        // Always add to question history
        const questionHistory = [
            ...prep.state.questionHistory,
            {
                questionId,
                score,
                isCorrect,
                timestamp: Date.now()
            }
        ];

        // Check if this is the first submission for this question
        const isFirstSubmission = !prep.state.questionHistory.some(q => q.questionId === questionId);
        
        // Only update metrics if this is the first submission
        const completedQuestions = isFirstSubmission ? prep.state.completedQuestions + 1 : prep.state.completedQuestions;
        const correctAnswers = isFirstSubmission && isCorrect ? prep.state.correctAnswers + 1 : prep.state.correctAnswers;
        const averageScore = isFirstSubmission ? 
            Math.round(((prep.state.averageScore * (completedQuestions - 1)) + score) / completedQuestions) :
            prep.state.averageScore;

        const now = Date.now();
        const newPrep: StudentPrep = {
            ...prep,
            state: {
                status: 'active',
                startedAt: prep.state.startedAt,
                activeTime: prep.state.activeTime + (now - prep.state.lastTick),
                lastTick: now,
                completedQuestions,
                correctAnswers,
                averageScore,
                questionHistory
            }
        };

        // Save to storage
        const preps = this.loadPreps();
        preps[newPrep.id] = newPrep;
        this.savePreps(preps);

        return newPrep;
    }

    // Skip current question (don't count it)
    static skipQuestion(prep: StudentPrep): StudentPrep {
        if (prep.state.status !== 'active') {
            throw new Error('Can only skip question in active state');
        }
        
        // No need to update state or save to storage for skipping
        // Just return the prep as is
        return prep;
    }

    // Move to next question
    static moveToNextQuestion(prep: StudentPrep): StudentPrep {
        if (prep.state.status !== 'active') {
            throw new Error('Can only move to next question in active state');
        }

        const completedQuestions = prep.state.completedQuestions + 1;
        
        const newPrep: StudentPrep = {
            ...prep,
            state: {
                ...prep.state,
                completedQuestions
            }
        };

        // Save to storage
        const preps = this.loadPreps();
        preps[newPrep.id] = newPrep;
        this.savePreps(preps);

        return newPrep;
    }

    // Update prep
    static updatePrep(prep: StudentPrep): StudentPrep {
        // Save to storage
        const preps = this.loadPreps();
        preps[prep.id] = prep;
        this.savePreps(preps);
        
        return prep;
    }

    // Comprehensive progress calculation - Single source of truth
    static getProgress(prep: StudentPrep) {
        const now = Date.now();
        const activeTime = this.getActiveTime(prep);
        const daysUntilExam = Math.max(1, Math.ceil((prep.goals.examDate - now) / (24 * 60 * 60 * 1000)));
        const weeksUntilExam = Math.max(1, Math.ceil(daysUntilExam / 7));
        const last24Hours = now - (24 * 60 * 60 * 1000);

        // Daily progress
        const dailyProgress = {
            questions: {
                completed: prep.state.status !== 'initializing' && prep.state.status !== 'not_started'
                    ? prep.state.questionHistory?.filter(q => q.timestamp >= last24Hours).length || 0
                    : 0,
                goal: Math.ceil(prep.goals.questionGoal / daysUntilExam)
            },
            time: {
                completed: Math.round(activeTime / (60 * 1000)), // Convert to minutes
                goal: Math.ceil((prep.goals.totalHours * 60) / daysUntilExam) // Convert hours to minutes
            }
        };

        // Weekly progress
        const weeklyProgress = {
            questions: {
                completed: prep.state.status !== 'initializing' && prep.state.status !== 'not_started'
                    ? prep.state.questionHistory?.filter(q => q.timestamp >= (now - 7 * 24 * 60 * 60 * 1000)).length || 0
                    : 0,
                goal: Math.ceil(prep.goals.questionGoal / weeksUntilExam)
            },
            time: {
                completed: Math.round(activeTime / (60 * 60 * 1000)), // Convert to hours
                goal: Math.ceil(prep.goals.totalHours / weeksUntilExam)
            }
        };

        // Overall progress
        const overallProgress = {
            questions: {
                completed: prep.state.status !== 'initializing' && prep.state.status !== 'not_started'
                    ? prep.state.completedQuestions || 0
                    : 0,
                goal: prep.goals.questionGoal
            },
            time: {
                completed: Math.round(activeTime / (60 * 60 * 1000)), // Convert to hours
                goal: prep.goals.totalHours
            },
            accuracy: prep.state.status !== 'initializing' && prep.state.status !== 'not_started'
                ? Math.round(prep.state.averageScore || 0)
                : 0
        };

        return {
            daily: dailyProgress,
            weekly: weeklyProgress,
            overall: overallProgress,
            metrics: {
                daysUntilExam,
                weeksUntilExam,
                activeTime,
                lastActiveTime: prep.state.status === 'active' ? prep.state.lastTick : null,
                status: prep.state.status
            }
        };
    }
} 