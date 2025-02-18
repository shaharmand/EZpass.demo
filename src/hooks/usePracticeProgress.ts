import { useMemo } from 'react';
import { useExam } from '../contexts/ExamContext';
import type { ProgressMetric } from '../components/ProgressBar/ProgressBar';

export const usePracticeProgress = () => {
  const { practiceState } = useExam();

  // Debug logging for practice state
  console.log('usePracticeProgress:', {
    hasPracticeState: !!practiceState,
    practiceDetails: practiceState ? {
      answers: practiceState.answers.length,
      selectedTopics: practiceState.selectedTopics.length,
      currentIndex: practiceState.currentQuestionIndex,
      startTime: new Date(practiceState.startTime).toISOString()
    } : null
  });

  const stats = useMemo(() => {
    if (!practiceState) return null;

    const correctAnswers = practiceState.answers.filter(a => a.isCorrect).length;
    const questionsAnswered = practiceState.answers.length;
    const totalTimeSpent = practiceState.answers.reduce((sum, a) => sum + a.timeTaken, 0);
    
    const calculatedStats = {
      correctAnswers,
      questionsAnswered,
      totalTimeSpent
    };

    // Debug logging for stats calculation
    console.log('Stats Calculation:', calculatedStats);
    
    return calculatedStats;
  }, [practiceState?.answers]);

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

  const metrics: ProgressMetric[] | null = useMemo(() => {
    if (!practiceState || !stats) return null;

    const calculatedMetrics: ProgressMetric[] = [
      {
        title: 'הצלחה',
        value: stats.correctAnswers,
        total: stats.questionsAnswered,
        status: getTrafficLight(stats.correctAnswers, stats.questionsAnswered),
        tooltipContent: `${stats.correctAnswers} תשובות נכונות מתוך ${stats.questionsAnswered} שאלות`
      },
      {
        title: 'כיסוי',
        value: stats.questionsAnswered,
        total: practiceState.selectedTopics.length * 3, // 3 questions per topic
        status: getTrafficLight(stats.questionsAnswered, practiceState.selectedTopics.length * 3),
        tooltipContent: `${stats.questionsAnswered} שאלות מתוך ${practiceState.selectedTopics.length * 3}`
      },
      {
        title: 'זמן למידה',
        value: stats.totalTimeSpent,
        total: practiceState.selectedTopics.length * 300, // 5 minutes (300 seconds) per topic
        status: 'green' as const,
        tooltipContent: `זמן למידה כולל: ${formatStudyTime(stats.totalTimeSpent * 1000)}`
      }
    ];

    // Debug logging for metrics calculation
    console.log('Metrics Calculation:', calculatedMetrics);

    return calculatedMetrics;
  }, [practiceState, stats]);

  return {
    metrics,
    isLoading: !practiceState,
    hasProgress: !!stats && stats.questionsAnswered > 0
  };
}; 