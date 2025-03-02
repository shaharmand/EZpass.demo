import React from 'react';
import { ArrowLeftOutlined, RedoOutlined } from '@ant-design/icons';
import { QuestionFeedback, isSuccessfulAnswer } from '../../types/question';
import './FeedbackActionBar.css';

interface FeedbackActionBarProps {
  feedback: QuestionFeedback;
  onRetry: () => void;
  onNext: () => void;
  showRetry: boolean;
}

export const FeedbackActionBar: React.FC<FeedbackActionBarProps> = ({
  feedback,
  onRetry,
  onNext,
  showRetry,
}) => {
  const isSuccess = isSuccessfulAnswer(feedback.evalLevel);

  return (
    <div className="feedback-action-bar">
      <div className="feedback-action-bar-content">
        {showRetry && (
          <button className="action-button retry-button" onClick={onRetry}>
            <RedoOutlined className="button-icon" />
            נסה שוב
          </button>
        )}
        <button 
          className={`action-button next-button ${isSuccess ? 'success' : 'error'}`} 
          onClick={onNext}
        >
          המשך
          <ArrowLeftOutlined className="button-icon" />
        </button>
      </div>
    </div>
  );
};

export default FeedbackActionBar; 