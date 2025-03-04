import React from 'react';
import { ArrowLeftOutlined, RedoOutlined } from '@ant-design/icons';
import { QuestionFeedback } from '../../types/feedback/types';
import { isSuccessfulAnswer } from '../../types/feedback/status';
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

  const handleRetry = () => {
    console.log('Retry button clicked', {
      score: feedback.score,
      evalLevel: feedback.evalLevel,
      isSuccess
    });
    onRetry();
  };

  const handleNext = () => {
    console.log('Next button clicked', {
      score: feedback.score,
      evalLevel: feedback.evalLevel,
      isSuccess
    });
    onNext();
  };

  return (
    <div className="feedback-action-bar">
      <div className="feedback-action-bar-content">
        <div className="action-buttons-container">
          {showRetry && (
            <button className="action-button retry-button" onClick={handleRetry}>
              <RedoOutlined className="button-icon" />
              נסה שוב
            </button>
          )}
          <button 
            className={`action-button next-button ${isSuccess ? 'success' : 'error'}`} 
            onClick={handleNext}
          >
            {isSuccess ? 'המשך' : 'הבא'}
            <ArrowLeftOutlined className="button-icon" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackActionBar; 