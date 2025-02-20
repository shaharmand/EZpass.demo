import { useMemo } from 'react';
import { useStudentPrep } from '../contexts/StudentPrepContext';
import type { ProgressMetric } from '../components/ProgressBar/ProgressBar';

export const usePracticeProgress = () => {
  const { activePrep, currentQuestion } = useStudentPrep();

  const getTrafficLight = (value: number, total: number): ProgressMetric['status'] => {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    if (percentage < 60) return 'red';
    if (percentage < 80) return 'yellow';
    return 'green';
  };

  const formatStudyTime = (milliseconds: number): string => {
    const minutes = Math.round(milliseconds / 1000 / 60);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return hours > 0 
      ? `${hours}h ${remainingMinutes}m`
      : `${remainingMinutes}m`;
  };

  const metrics = useMemo(() => {
    if (!activePrep) return null;

    // Get current progress
    const isCorrect = currentQuestion?.state.feedback?.isCorrect || false;
    const questionsAnswered = currentQuestion?.state.questionIndex || 0;
    const timeSpent = activePrep.state.status === 'active' ? activePrep.state.activeTime : 0;
    const targetQuestionsPerTopic = 3; // 3 questions per topic
    const totalTargetQuestions = activePrep.selection.topics.length * targetQuestionsPerTopic;

    return [
      {
        title: 'הצלחה',
        value: isCorrect ? 1 : 0,
        total: 1,
        status: getTrafficLight(isCorrect ? 1 : 0, 1),
        tooltipContent: isCorrect ? 'תשובה נכונה' : 'תשובה שגויה'
      },
      {
        title: 'כיסוי',
        value: questionsAnswered,
        total: totalTargetQuestions,
        status: getTrafficLight(questionsAnswered, totalTargetQuestions),
        tooltipContent: `${questionsAnswered} שאלות מתוך ${totalTargetQuestions}`
      },
      {
        title: 'זמן למידה',
        value: timeSpent,
        total: activePrep.selection.topics.length * 300000, // 5 minutes (300,000ms) per topic
        status: 'green',
        tooltipContent: `זמן למידה כולל: ${formatStudyTime(timeSpent)}`
      }
    ];
  }, [activePrep, currentQuestion]);

  return {
    metrics,
    isLoading: !activePrep || activePrep.state.status === 'initializing'
  };
}; 