import React, { useEffect, useState } from 'react';
import { Typography, Modal } from 'antd';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeftOutlined } from '@ant-design/icons';
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

// Helper function to count results
const countResults = (results: FeedbackStatus[]) => {
  return results.reduce((counts, status) => {
    if (status === FeedbackStatus.SUCCESS) counts.success++;
    else if (status === FeedbackStatus.FAILURE) counts.failure++;
    else if (status === FeedbackStatus.PARTIAL) counts.partial++;
    return counts;
  }, { success: 0, failure: 0, partial: 0 });
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

  // Handle set completion
  useEffect(() => {
    const onSetComplete = (results: FeedbackStatus[]) => {
      const counts = countResults(results);
      
      Modal.success({
        icon: null,
        title: (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            marginBottom: '24px'
          }}>
            <div style={{ 
              width: '40px',
              height: '40px',
              background: '#22c55e',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ color: 'white', fontSize: '24px' }}>✓</span>
            </div>
            <div style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: '20px' }}>🎯</span>
              <span style={{ fontSize: '18px', fontWeight: 500 }}>סיימת סט של 10 שאלות!</span>
            </div>
          </div>
        ),
        content: (
          <div style={{ textAlign: 'right', direction: 'rtl' }}>
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ 
                margin: '0 0 16px 0', 
                fontSize: '16px', 
                fontWeight: 500,
                color: '#64748b'
              }}>
                תוצאות הסט הנוכחי:
              </h3>
              
              <div style={{ 
                background: '#f8fafc', 
                padding: '16px', 
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}>
                {/* Correct */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#16a34a', fontSize: '16px' }}>✓</span>
                    <span>נכון</span>
                  </div>
                  <span>{counts.success} מתוך 10</span>
                </div>

                {/* Wrong */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#dc2626', fontSize: '16px' }}>✕</span>
                    <span>לא נכון</span>
                  </div>
                  <span>{counts.failure} מתוך 10</span>
                </div>

                {/* Partial */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#d97706', fontSize: '16px' }}>〽️</span>
                    <span>חלקי</span>
                  </div>
                  <span>{counts.partial} מתוך 10</span>
                </div>
              </div>
            </div>

            {/* Main Score Section - Matching Practice Header Style */}
            <div style={{ 
              background: '#f8fafc', 
              padding: '16px', 
              borderRadius: '12px',
              marginBottom: '24px'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '12px' 
              }}>
                <span style={{ fontWeight: 500 }}>ציון</span>
                <span style={{ fontWeight: 500 }}>{Math.round((counts.success / 10) * 100)}%</span>
              </div>
              <div style={{ 
                height: '8px', 
                background: '#e2e8f0',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  width: `${(counts.success / 10) * 100}%`,
                  height: '100%',
                  background: '#22c55e',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          </div>
        ),
        okButtonProps: {
          style: {
            background: '#2563eb',
            borderRadius: '8px',
            height: '40px',
            padding: '0 24px',
            fontSize: '14px',
            fontWeight: 500,
            border: 'none',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 'auto'
          }
        },
        okText: 'המשך לשאלה הבאה',
        className: 'rtl',
        width: 400,
        maskClosable: true,
        centered: true
      });
    };

    // Subscribe to set completion
    PrepStateManager.getSetTracker().onSetComplete(prep.id, onSetComplete);

    return () => {
      PrepStateManager.getSetTracker().offSetComplete(prep.id, onSetComplete);
    };
  }, [prep.id, prep.state]);

  const currentIndex = PrepStateManager.getDisplayIndex(prep.id) - 1;
  
  return (
    <div className="question-set-progress">
      <div className="progress-header">
        <div className="progress-left">
          {questionId ? (
            <Link to={`/admin/questions/${questionId}`} className="question-link" target="_blank" rel="noopener noreferrer">
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