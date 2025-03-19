import React, { useEffect, useState, useRef } from 'react';
import { Typography, Tooltip } from 'antd';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeftOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { usePracticeAttempts } from '../../contexts/PracticeAttemptsContext';
import { useStudentPrep } from '../../contexts/StudentPrepContext';
import { StudentPrep } from '../../types/prepState';
import { PrepStateManager } from '../../services/PrepStateManager';
import { SetProgress } from '../../services/SetProgressTracker';
import { FeedbackStatus } from '../../types/feedback/status';
import { useAuth } from '../../contexts/AuthContext';
import styled from 'styled-components';

const { Text } = Typography;

interface QuestionSetProgressProps {
  questionId?: string;
  prepId: string;
  prep: StudentPrep;
}

const ProgressContainer = styled.div.attrs({
  className: 'question-progress-bar'
})`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 24px;
  background: linear-gradient(to bottom, #ffffff, #f9fafb);
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  position: relative;
  
  &::after {
    content: none;
  }
`;

const QuestionText = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 180px;
  margin-right: 4px;
  position: relative;
  white-space: nowrap;
  background: #f8fafc;
  border-radius: 24px;
  padding: 4px 8px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
`;

const QuestionLabel = styled.span`
  font-size: 15px;
  font-weight: 600;
  color: #64748b;
  margin-right: 4px;
  padding-right: 4px;
`;

const CurrentQuestion = styled(motion.span)`
  font-size: 20px;
  font-weight: 700;
  color: #1e40af;
  line-height: 1;
  padding: 2px 8px;
  position: relative;
  background: white;
  border-radius: 16px;
  margin: 0 2px;
  border: 1px solid #bfdbfe;
  box-shadow: 0 1px 2px rgba(59, 130, 246, 0.1);
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 50%;
    background: linear-gradient(to bottom, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0));
    border-radius: 16px 16px 0 0;
    pointer-events: none;
  }
`;

const TotalQuestions = styled.span`
  font-size: 15px;
  font-weight: 500;
  color: #64748b;
  padding-left: 4px;
  border-left: 1px solid #e2e8f0;
  margin-left: 4px;
`;

const ProgressBar = styled.div`
  display: flex;
  flex: 1;
  gap: 4px;
  height: 12px;
`;

const ProgressSegment = styled(motion.div)<{ $status: string }>`
  flex: 1;
  height: 12px;
  border-radius: 2px;
  background: ${props => {
    switch (props.$status) {
      case 'success': return 'linear-gradient(135deg, #22c55e, #16a34a)';
      case 'partial': return 'linear-gradient(135deg, #f59e0b, #d97706)';
      case 'failure': return 'linear-gradient(135deg, #ef4444, #dc2626)';
      case 'current': return '#ffffff';
      default: return '#e2e8f0';
    }
  }};
  border: ${props => props.$status === 'current' ? '2px solid #1f2937' : 'none'};
  box-shadow: ${props => {
    switch (props.$status) {
      case 'success': return '0 2px 4px rgba(34, 197, 94, 0.3)';
      case 'partial': return '0 2px 4px rgba(245, 158, 11, 0.3)';
      case 'failure': return '0 2px 4px rgba(220, 38, 38, 0.3)';
      case 'current': return '0 0 0 2px rgba(0, 0, 0, 0.1)';
      default: return 'inset 0 2px 4px rgba(0, 0, 0, 0.08)';
    }
  }};
  transition: all 0.2s ease;
  position: relative;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => {
      switch (props.$status) {
        case 'success': return '0 4px 8px rgba(34, 197, 94, 0.4)';
        case 'partial': return '0 4px 8px rgba(245, 158, 11, 0.4)';
        case 'failure': return '0 4px 8px rgba(220, 38, 38, 0.4)';
        case 'current': return '0 0 0 2px rgba(0, 0, 0, 0.2), 0 4px 8px rgba(0, 0, 0, 0.1)';
        default: return 'inset 0 2px 4px rgba(0, 0, 0, 0.15), 0 4px 6px rgba(0, 0, 0, 0.05)';
      }
    }};
  }
  
  ${props => props.$status === 'current' && `
    &::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 4px;
      height: 4px;
      background: #1f2937;
      border-radius: 50%;
      transform: translate(-50%, -50%);
    }
  `}
`;

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

const getTooltipText = (status: string, index: number) => {
  const questionNumber = index + 1;
  switch (status) {
    case 'success': return `שאלה ${questionNumber}: תשובה נכונה`;
    case 'partial': return `שאלה ${questionNumber}: תשובה חלקית`;
    case 'failure': return `שאלה ${questionNumber}: תשובה שגויה`;
    case 'current': return `שאלה ${questionNumber}: שאלה נוכחית`;
    default: return `שאלה ${questionNumber}`;
  }
};

const QuestionSetProgress: React.FC<QuestionSetProgressProps> = ({
  questionId,
  prepId,
  prep
}) => {
  const [progress, setProgress] = useState<SetProgress>({
    currentIndex: 0,
    results: []
  });
  const prevIndexRef = useRef<number>(0);

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

  const currentIndex = PrepStateManager.getDisplayIndex(prep.id) - 1;
  const isIndexChanged = prevIndexRef.current !== currentIndex;
  
  // Update the ref after checking for changes
  useEffect(() => {
    prevIndexRef.current = currentIndex;
  }, [currentIndex]);
  
  return (
    <ProgressContainer>
      <QuestionText>
        <QuestionLabel>שאלה</QuestionLabel>
        <Tooltip title={`שאלה ${currentIndex + 1} מתוך 10 בסט הנוכחי`} placement="top">
          <CurrentQuestion
            key={currentIndex}
            initial={{ scale: isIndexChanged ? 1.2 : 1, y: isIndexChanged ? -5 : 0 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            whileHover={{ scale: 1.05, boxShadow: '0 2px 6px rgba(59, 130, 246, 0.2)' }}
          >
            {currentIndex + 1}
          </CurrentQuestion>
        </Tooltip>
        <TotalQuestions>מתוך 10</TotalQuestions>
      </QuestionText>
      <ProgressBar>
        {Array.from({ length: 10 }, (_, index) => {
          // Get result if it exists, otherwise undefined
          const result = progress.results[index];
          const status = getResultColor(result, index, currentIndex);
          const tooltipText = getTooltipText(status, index);
          
          return (
            <Tooltip key={index} title={tooltipText} placement="top">
              <ProgressSegment
                $status={status}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
              />
            </Tooltip>
          );
        })}
      </ProgressBar>
    </ProgressContainer>
  );
};

export default QuestionSetProgress;