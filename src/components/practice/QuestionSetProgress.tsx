import React, { useEffect, useState } from 'react';
import { Typography } from 'antd';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { DailyLimitIndicator } from '../feedback/DailyLimitIndicator';
import { usePracticeAttempts, MAX_DETAILED_FEEDBACK_ATTEMPTS } from '../../contexts/PracticeAttemptsContext';
import { useStudentPrep } from '../../contexts/StudentPrepContext';
import { StudentPrep } from '../../types/prepState';
import { PrepStateManager } from '../../services/PrepStateManager';
import { SetQuestionStatus, SetProgress } from '../../services/SetProgressTracker';
import './QuestionSetProgress.css';

const { Text } = Typography;

interface QuestionSetProgressProps {
  questionId?: string;
  prepId: string;
  prep: StudentPrep;
}

const getResultColor = (result: SetQuestionStatus): string => {
  switch (result) {
    case SetQuestionStatus.SUCCESS: return 'success';
    case SetQuestionStatus.PARTIAL: return 'partial';
    case SetQuestionStatus.FAILURE: return 'fail';
    default: return '';
  }
};

const QuestionSetProgress: React.FC<QuestionSetProgressProps> = ({
  questionId,
  prepId,
  prep
}) => {
  const { userAttemptsCount } = usePracticeAttempts();
  const [progress, setProgress] = useState<SetProgress>({
    currentIndex: 0,
    results: new Array(10).fill('pending')
  });

  // Subscribe to both progress and question changes
  useEffect(() => {
    const onProgressChange = (newProgress: SetProgress) => {
      setProgress(newProgress);
    };

    const onQuestionChange = (index: number) => {
      setProgress(prev => ({
        ...prev,
        currentIndex: index
      }));
    };

    // Get initial state
    const initialProgress = PrepStateManager.getSetProgress(prep.id);
    if (initialProgress) {
      setProgress(initialProgress);
    }

    // Subscribe to changes
    PrepStateManager.subscribeToProgressChanges(prep.id, onProgressChange);
    PrepStateManager.subscribeToQuestionChanges(prep.id, onQuestionChange);

    // Cleanup subscriptions
    return () => {
      PrepStateManager.unsubscribeFromProgressChanges(prep.id, onProgressChange);
      PrepStateManager.unsubscribeFromQuestionChanges(prep.id, onQuestionChange);
    };
  }, [prep.id]);

  // Get display index from PrepStateManager
  const displayIndex = PrepStateManager.getDisplayIndex(prep.id);
  
  return (
    <div className="question-set-progress">
      <div className="progress-header">
        <div className="progress-left">
          {questionId ? (
            <Link to={`/admin/questions/${questionId}`} className="question-link">
              <div className="question-number">
                <Text>שאלה {displayIndex}</Text>
                <Text className="question-total">מתוך 10</Text>
                <ArrowLeftOutlined className="link-arrow" />
              </div>
            </Link>
          ) : (
            <Text className="progress-text">שאלה {displayIndex} מתוך 10</Text>
          )}
        </div>
        
        <div className="progress-right">
          <DailyLimitIndicator 
            current={userAttemptsCount} 
            max={MAX_DETAILED_FEEDBACK_ATTEMPTS}
          />
        </div>
      </div>

      <div className="progress-segments">
        {progress.results.map((result, index) => {
          const resultClass = getResultColor(result);
          const isCurrent = index === progress.currentIndex;
          
          return (
            <motion.div
              key={index}
              className={`progress-segment ${resultClass} ${isCurrent ? 'current' : ''}`}
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