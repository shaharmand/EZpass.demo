import { useEffect, useRef } from 'react';
import { useStudentPrep } from '../contexts/StudentPrepContext';

const TIMER_INTERVAL = 1000; // Update every second

export const usePracticeTimer = (prepId: string) => {
  const timerRef = useRef<NodeJS.Timeout>();
  const { activePrep } = useStudentPrep();

  useEffect(() => {
    // Only run timer when practice is active
    if (!activePrep || activePrep.state.status !== 'active') {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      return;
    }

    // Start timer
    timerRef.current = setInterval(() => {
      const now = Date.now();
      // Only access lastTick when in active state
      const lastActive = activePrep.state.status === 'active' 
        ? activePrep.state.lastTick 
        : now;
      const delta = now - lastActive;
      
      // Time updates are now handled directly in StudentPrepContext
      // through the setActivePrep state updates
    }, TIMER_INTERVAL);

    // Cleanup
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [activePrep?.state.status, prepId]);

  return {
    activeTime: activePrep?.state.status === 'active' 
      ? activePrep.state.activeTime 
      : activePrep?.state.status === 'paused' 
        ? activePrep.state.activeTime
        : activePrep?.state.status === 'completed'
          ? activePrep.state.activeTime
          : 0,
    isTracking: activePrep?.state.status === 'active'
  };
}; 