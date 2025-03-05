import React, { useEffect, useState } from 'react';
import { Typography } from 'antd';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { DailyLimitIndicator } from '../feedback/DailyLimitIndicator';
import { usePracticeAttempts } from '../../contexts/PracticeAttemptsContext';
import { useStudentPrep } from '../../contexts/StudentPrepContext';
import { StudentPrep } from '../../types/prepState';
import { PrepStateManager } from '../../services/PrepStateManager';
import { SetProgress } from '../../services/SetProgressTracker';
import { FeedbackStatus } from '../../types/feedback/status';
import { useAuth } from '../../contexts/AuthContext';
import './QuestionSetProgress.css';

const { Text } = Typography;

interface QuestionSetProgressProps {
  questionId?: string;
  prepId: string;
  prep: StudentPrep;
}

const getResultColor = (result: FeedbackStatus | undefined, index: number, currentIndex: number): string => {
  // For questions that have been answered (past questions)
  if (index < currentIndex) {
    if (result) {
      switch (result) {
        case FeedbackStatus.SUCCESS: return 'success';
        case FeedbackStatus.PARTIAL: return 'partial';
        case FeedbackStatus.FAILURE: return 'failure';
      }
    }
    return 'pending';  // For past questions without results
  }
  
  // For the current question
  if (index === currentIndex) {
    return 'current';
  }
  
  // For future questions
  return 'pending';
};

const QuestionSetProgress: React.FC<QuestionSetProgressProps> = ({
  questionId,
  prepId,
  prep
}) => {
  const { getCurrentAttempts, getMaxAttempts } = usePracticeAttempts();
  const { user } = useAuth();
  const [progress, setProgress] = useState<SetProgress>({
    currentIndex: 0,
    results: []
  });

  // Subscribe to progress changes to get actual results
  useEffect(() => {
    const onProgressChange = (newProgress: SetProgress) => {
      setProgress(newProgress);
    };

    // Get initial state
    const initialProgress = PrepStateManager.getSetProgress(prep.id);
    if (initialProgress) {
      setProgress(initialProgress);
    }

    // Subscribe to changes
    PrepStateManager.subscribeToProgressChanges(prep.id, onProgressChange);

    return () => {
      PrepStateManager.unsubscribeFromProgressChanges(prep.id, onProgressChange);
    };
  }, [prep.id]);

  const currentIndex = PrepStateManager.getDisplayIndex(prep.id) - 1; // 0-based index
  
  return (
    <div className="question-set-progress">
      <div className="progress-header">
        <div className="progress-left">
          {questionId ? (
            <Link to={`/admin/questions/${questionId}`} className="question-link">
              <div className="question-number">
                <Text>שאלה {currentIndex + 1}</Text>
                <Text className="question-total">מתוך 10</Text>
                <ArrowLeftOutlined className="link-arrow" />
              </div>
            </Link>
          ) : (
            <Text className="progress-text">שאלה {currentIndex + 1} מתוך 10</Text>
          )}
        </div>
        
        <div className="progress-right">
          {user && (
            <DailyLimitIndicator 
              current={getCurrentAttempts()} 
              max={getMaxAttempts()}
            />
          )}
        </div>
      </div>

      <div className="progress-segments">
        {Array.from({ length: 10 }, (_, index) => {
          // Get result if it exists, otherwise undefined
          const result = progress.results[index];
          const resultClass = getResultColor(result, index, currentIndex);
          
          return (
            <motion.div
              key={index}
              className={`progress-segment ${resultClass}`}
              data-question={`שאלה ${index + 1}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default QuestionSetProgress;