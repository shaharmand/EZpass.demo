import { useEffect, useRef, useState } from 'react';
import { useStudentPrep } from '../contexts/StudentPrepContext';
import type { StudentPrep } from '../types/prepState';

const TIMER_INTERVAL = 1000; // Update every second

export const usePracticeTimer = (prepId: string) => {
  const timerRef = useRef<NodeJS.Timeout>();
  const { getPrep } = useStudentPrep();
  const [prep, setPrep] = useState<StudentPrep | null>(null);

  // Effect to load and keep prep state updated
  useEffect(() => {
    const loadPrep = async () => {
      const currentPrep = await getPrep(prepId);
      setPrep(currentPrep);
    };

    loadPrep();
  }, [prepId, getPrep]);

  useEffect(() => {
    // Only run timer when practice is active
    if (!prep || prep.state.status !== 'active') {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      return;
    }

    // Start timer
    timerRef.current = setInterval(async () => {
      const currentPrep = await getPrep(prepId);
      if (currentPrep) {
        setPrep(currentPrep);
      }
    }, TIMER_INTERVAL);

    // Cleanup
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [prep?.state.status, prepId, getPrep]);

  return {
    activeTime: prep?.state.status === 'active' 
      ? prep.state.activeTime 
      : prep?.state.status === 'paused' 
        ? prep.state.activeTime
        : prep?.state.status === 'completed'
          ? prep.state.activeTime
          : 0,
    isTracking: prep?.state.status === 'active'
  };
}; 