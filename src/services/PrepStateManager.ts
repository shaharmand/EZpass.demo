import type { StudentPrep, TopicSelection } from '../types/prepState';
import { logPrepStateChange } from '../types/prepState';
import type { FormalExam } from '../types/shared/exam';

// Key for localStorage
const PREP_STORAGE_KEY = 'active_preps';

export type PrepState = 
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
    static createPrep(exam: FormalExam, selectedTopics?: TopicSelection): StudentPrep {
        // Load existing preps
        const preps = this.loadPreps();
        
        // Create new prep ID with timestamp to ensure uniqueness
        const prepId = `prep_${exam.id}_${Date.now()}`;
        
        // Create new prep
        const newPrep: StudentPrep = {
            id: prepId,
            exam,
            selection: selectedTopics || {
                topics: exam.topics.map(t => t.topicId),
                subTopics: exam.topics.flatMap(t => t.subTopics.map(st => st.id))
            },
            state: {
                status: 'active',
                startedAt: Date.now(),
                activeTime: 0,
                lastTick: Date.now()
            }
        };

        // Log the state change
        logPrepStateChange('Created New Active Prep', newPrep, null);

        // Save updated preps
        preps[prepId] = newPrep;
        this.savePreps(preps);

        return newPrep;
    }

    // Activate prep (start practicing)
    static activate(prep: StudentPrep): StudentPrep {
        if (prep.state.status !== 'not_started' && prep.state.status !== 'paused') {
            throw new Error('Can only activate from not_started or paused state');
        }

        const now = Date.now();
        const previousTime = prep.state.status === 'paused' ? prep.state.activeTime : 0;

        const newPrep: StudentPrep = {
            ...prep,
            state: {
                status: 'active' as const,
                startedAt: now,
                activeTime: previousTime,
                lastTick: now
            }
        };

        // Save to storage
        const preps = this.loadPreps();
        preps[newPrep.id] = newPrep;
        this.savePreps(preps);
        
        logPrepStateChange('Activated Prep', newPrep, null);
        return newPrep;
    }

    // Pause prep
    static pause(prep: StudentPrep): StudentPrep {
        // If already in a non-active state, return the prep as-is
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
                pausedAt: now
            }
        };

        // Save to storage
        const preps = this.loadPreps();
        preps[newPrep.id] = newPrep;
        this.savePreps(preps);
        
        logPrepStateChange('Paused Prep', newPrep, null);
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
                completedAt: now
            }
        };

        // Save to storage
        const preps = this.loadPreps();
        preps[newPrep.id] = newPrep;
        this.savePreps(preps);
        
        logPrepStateChange('Completed Prep', newPrep, null);
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
                activeTime
            }
        };

        // Save to storage
        const preps = this.loadPreps();
        preps[newPrep.id] = newPrep;
        this.savePreps(preps);
        
        logPrepStateChange('Error in Prep', newPrep, null);
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
                lastTick: now
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

    // Utility method to get total active time
    static getActiveTime(prep: StudentPrep): number {
        if (prep.state.status === 'active') {
            return prep.state.activeTime + (Date.now() - prep.state.lastTick);
        }
        return 'activeTime' in prep.state ? prep.state.activeTime : 0;
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
            default:
                return false;
        }
    }
} 