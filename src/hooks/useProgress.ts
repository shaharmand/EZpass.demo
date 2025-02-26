import { useState, useEffect } from 'react';
import { useStudentPrep } from '../contexts/StudentPrepContext';
import { PrepStateManager } from '../services/PrepStateManager';
import type { StudentPrep } from '../types/prepState';

export const useProgress = (prepId: string) => {
    const { getPrep } = useStudentPrep();
    const [progress, setProgress] = useState<ReturnType<typeof PrepStateManager.getProgress> | null>(null);

    useEffect(() => {
        let isMounted = true;

        const updateProgress = async () => {
            try {
                const prep = await getPrep(prepId);
                if (prep && isMounted) {
                    setProgress(PrepStateManager.getProgress(prep));
                }
            } catch (error) {
                console.error('Failed to update progress:', error);
            }
        };

        // Initial update
        updateProgress();

        // Only set interval if we have progress and status is active
        if (progress?.metrics.status === 'active') {
            const interval = setInterval(updateProgress, 1000);
            return () => {
                isMounted = false;
                clearInterval(interval);
            };
        }

        return () => {
            isMounted = false;
        };
    }, [prepId, getPrep, progress?.metrics.status]);

    return progress;
};

// Make it a module by adding an empty export
export {}; 