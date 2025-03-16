import React, { useEffect, useState } from 'react';
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

const ProgressContainer = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 0;
`;

const QuestionText = styled(Text)`
  font-size: 13px;
  font-weight: 500;
  color: #4b5563;
  background: #f3f4f6;
  padding: 4px 8px;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  white-space: nowrap;

  span {
    font-weight: 700;
    color: #1f2937;
  }
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
  
  return (
    <ProgressContainer>
      <QuestionText>שאלה <span>{currentIndex + 1}</span>/10</QuestionText>
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