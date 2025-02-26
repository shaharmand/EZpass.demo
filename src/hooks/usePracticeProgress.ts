import { useMemo } from 'react';
import { useStudentPrep } from '../contexts/StudentPrepContext';
import type { ProgressMetrics } from '../components/PracticeHeaderProgress/PracticeHeaderProgress';

type ProgressStatus = 'red' | 'yellow' | 'green';

export const usePracticeProgress = () => {
  const { currentQuestion } = useStudentPrep();
  
  const getTrafficLight = (value: number, total: number): ProgressStatus => {
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
    if (!currentQuestion) return null;

    // Get current progress
    const isCorrect = currentQuestion.state.feedback?.isCorrect || false;
    const questionsAnswered = currentQuestion.state.questionIndex || 0;
    const timeSpent = currentQuestion.state.startedAt ? Date.now() - currentQuestion.state.startedAt : 0;
    const targetQuestionsPerTopic = 3; // 3 questions per topic
    const totalTargetQuestions = 10; // Fixed to 10 questions per practice session

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
        total: 1800000, // 30 minutes target time
        status: 'green',
        tooltipContent: `זמן למידה כולל: ${formatStudyTime(timeSpent)}`
      }
    ];
  }, [currentQuestion]);

  return {
    metrics,
    isLoading: false // Never show loading in the header - let PracticePage handle loading states
  };
}; 