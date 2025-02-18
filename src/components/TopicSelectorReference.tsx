// Reference implementation of the topic selection dialog and progress tracking
// This was previously used for hierarchical selection of institution/subject/topic/subtopic
// Keep as reference for future topic selection UI implementations

import React, { useMemo } from 'react';
import { useExam } from '../contexts/ExamContext';
import { useStudentPrep } from '../contexts/StudentPrepContext';
import ProgressBar from './ProgressBar/ProgressBar';
import type { ProgressMetric } from './ProgressBar/ProgressBar';

const TopicSelectorReference: React.FC = () => {
  const { practiceState } = useExam();
  const { activePrep } = useStudentPrep();

  if (!practiceState || !activePrep) {
    return null;
  }

  // Calculate statistics from answers array
  const stats = useMemo(() => {
    const correctAnswers = practiceState.answers.filter(a => a.isCorrect).length;
    const questionsAnswered = practiceState.answers.length;
    const totalTimeSpent = practiceState.answers.reduce((sum, a) => sum + a.timeTaken, 0);
    
    return {
      correctAnswers,
      questionsAnswered,
      totalTimeSpent
    };
  }, [practiceState.answers]);

  const getSuccessRateLevel = (percentage: number): 'low' | 'medium' | 'high' => {
    if (percentage < 60) return 'low';
    if (percentage < 80) return 'medium';
    return 'high';
  };

  const getTrafficLight = (value: number, total: number): 'red' | 'yellow' | 'green' => {
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

  const metrics: ProgressMetric[] = [
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
      status: 'green',
      tooltipContent: `זמן למידה כולל: ${formatStudyTime(stats.totalTimeSpent * 1000)}`
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <ProgressBar metrics={metrics} />
    </div>
  );
};

export default TopicSelectorReference; 