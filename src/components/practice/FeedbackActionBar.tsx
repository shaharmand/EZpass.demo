import React from 'react';
import { Space } from 'antd';
import { RedoOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { AnswerLevel } from '../../types/question';
import './FeedbackActionBar.css';

interface FeedbackActionBarProps {
  onRetry: () => void;
  onNext: () => void;
  isLastQuestion?: boolean;
  answerLevel: AnswerLevel;
}

export const FeedbackActionBar: React.FC<FeedbackActionBarProps> = ({
  onRetry,
  onNext,
  isLastQuestion = false,
  answerLevel
}) => {
  // Only show retry for non-perfect answers
  const showRetry = answerLevel !== AnswerLevel.PERFECT;
  
  // Success styles for good or perfect answers
  const isSuccess = answerLevel === AnswerLevel.PERFECT || answerLevel === AnswerLevel.GOOD;

  return (
    <div className="feedback-action-bar">
      <div className="feedback-action-bar-content">
        {showRetry && (
          <button 
            className="action-button retry-button"
            onClick={onRetry}
          >
            <RedoOutlined className="button-icon" />
            נסה שוב
          </button>
        )}
        <button 
          className={`action-button next-button ${isSuccess ? 'success' : ''}`}
          onClick={onNext}
        >
          {isLastQuestion ? 'סיים' : 'המשך לשאלה הבאה'}
          <ArrowLeftOutlined className="button-icon" />
        </button>
      </div>
    </div>
  );
};

export default FeedbackActionBar; 