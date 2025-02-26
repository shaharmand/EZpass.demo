import React, { useEffect, useState } from 'react';
import { Typography, Tooltip } from 'antd';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useStudentPrep } from '../../contexts/StudentPrepContext';
import { PrepStateManager } from '../../services/PrepStateManager';
import type { StudentPrep } from '../../types/prepState';
import './QuestionSetProgress.css';

const { Text } = Typography;

interface QuestionSetProgressProps {
  currentQuestionIndex: number;
  totalQuestions: number;
  questionId?: string;
  prepId: string;
}

const QuestionSetProgress: React.FC<QuestionSetProgressProps> = ({
  currentQuestionIndex,
  totalQuestions,
  questionId,
  prepId
}) => {
  const { getPrep } = useStudentPrep();
  const [progress, setProgress] = useState<ReturnType<typeof PrepStateManager.getProgress> | null>(null);
  
  // Update progress every second if active
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
  
  // Adjust for 0-based index
  const displayIndex = currentQuestionIndex;
  
  if (!progress) return null;

  const { daily } = progress;
  
  return (
    <div className="question-set-progress">
      <div className="progress-header">
        {questionId ? (
          <Link to={`/questions/${questionId}`} className="question-link">
            <div className="question-number">
              <Text>שאלה {displayIndex}</Text>
              <Text className="question-total">מתוך {totalQuestions}</Text>
              <ArrowLeftOutlined className="link-arrow" />
            </div>
          </Link>
        ) : (
          <Text className="progress-text">שאלה {displayIndex} מתוך {totalQuestions}</Text>
        )}
        
        {/* Daily Progress Bars */}
        <div className="daily-progress">
          <div className="daily-header">
            <Text className="daily-title">מעקב יומי</Text>
          </div>
          
          <Tooltip title="כמות השאלות שפתרת היום לעומת היעד המומלץ להצלחה במבחן">
            <div className="daily-metric">
              <div className="daily-metric-header">
                <Text className="daily-label">שאלות</Text>
                <Text className="daily-value">{daily.questions.completed}/{daily.questions.goal}</Text>
              </div>
              <div className="daily-bar-container">
                <motion.div 
                  className="daily-bar questions"
                  initial={{ width: 0 }}
                  animate={{ 
                    width: `${Math.min((daily.questions.completed / daily.questions.goal) * 100, 100)}%`
                  }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>
          </Tooltip>

          <Tooltip title="כמות הדקות שלמדת היום לעומת היעד המומלץ להצלחה במבחן">
            <div className="daily-metric">
              <div className="daily-metric-header">
                <Text className="daily-label">דקות</Text>
                <Text className="daily-value">{daily.time.completed}/{daily.time.goal}</Text>
              </div>
              <div className="daily-bar-container">
                <motion.div 
                  className="daily-bar time"
                  initial={{ width: 0 }}
                  animate={{ 
                    width: `${Math.min((daily.time.completed / daily.time.goal) * 100, 100)}%`
                  }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>
          </Tooltip>
        </div>
      </div>

      <div className="progress-segments">
        {Array.from({ length: totalQuestions }).map((_, index) => (
          <motion.div
            key={index}
            className={`progress-segment ${index < displayIndex - 1 ? 'completed' : ''} ${index === displayIndex - 1 ? 'current' : ''}`}
            data-question={`שאלה ${index + 1}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          />
        ))}
      </div>
    </div>
  );
};

export default QuestionSetProgress;