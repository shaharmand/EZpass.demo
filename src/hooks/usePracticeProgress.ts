import { useMemo } from 'react';
import { useExam } from '../contexts/ExamContext';
import { useStudentPrep } from '../contexts/StudentPrepContext';
import type { ProgressMetric } from '../components/ProgressBar/ProgressBar';

const TARGET_STUDY_TIME = 7200000; // 2 hours in milliseconds

const getSuccessRateLevel = (percentage: number): 'low' | 'medium' | 'high' => {
  if (percentage < 60) return 'low';
  if (percentage < 80) return 'medium';
  return 'high';
};

const getTrafficLight = (value: number, total: number): 'red' | 'yellow' | 'green' => {
  const percentage = (value / total) * 100;
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

export const usePracticeProgress = () => {
  const { practiceState } = useExam();
  const { activePrep } = useStudentPrep();

  const metrics = useMemo<ProgressMetric[]>(() => {
    if (!practiceState || !activePrep) return [];

    return [
      {
        title: 'הצלחה',
        value: practiceState.correctAnswers,
        total: practiceState.questionsAnswered,
        status: getTrafficLight(practiceState.correctAnswers, practiceState.questionsAnswered),
        tooltipContent: `${practiceState.correctAnswers} תשובות נכונות מתוך ${practiceState.questionsAnswered} שאלות`
      },
      {
        title: 'כיסוי',
        value: practiceState.answeredQuestions.length,
        total: activePrep.content.selectedTopics.length,
        status: getTrafficLight(
          practiceState.answeredQuestions.length,
          activePrep.content.selectedTopics.length
        ),
        tooltipContent: `${practiceState.answeredQuestions.length} שאלות מתוך ${activePrep.content.selectedTopics.length} נושאים נבחרים`
      },
      {
        title: 'זמן לימוד',
        value: practiceState.timeSpent,
        total: TARGET_STUDY_TIME,
        status: getSuccessRateLevel((practiceState.timeSpent / TARGET_STUDY_TIME) * 100),
        tooltipContent: `זמן לימוד: ${formatStudyTime(practiceState.timeSpent)}`
      }
    ];
  }, [practiceState, activePrep]);

  return {
    metrics,
    isLoading: !practiceState || !activePrep
  };
}; 