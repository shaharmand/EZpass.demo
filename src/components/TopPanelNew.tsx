import React from 'react';
import { useExam } from '../contexts/ExamContext';
import { useStudentPrep } from '../contexts/StudentPrepContext';
import ProgressBar from './ProgressBar/ProgressBar';
import type { ProgressMetric } from './ProgressBar/ProgressBar';

const TopPanelNew: React.FC = () => {
  const { practiceState } = useExam();
  const { activePrep } = useStudentPrep();

  if (!practiceState || !activePrep) {
    return null;
  }

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

  const metrics: ProgressMetric[] = [
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
      total: 7200000, // 2 hours in milliseconds as target
      status: getSuccessRateLevel((practiceState.timeSpent / 7200000) * 100),
      tooltipContent: `זמן לימוד: ${formatStudyTime(practiceState.timeSpent)}`
    }
  ];

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e5e7eb',
      padding: '16px 24px'
    }}>
      <ProgressBar metrics={metrics} />
    </div>
  );
};

export default TopPanelNew; 