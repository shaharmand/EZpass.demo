import React from 'react';
import { ArrowLeftOutlined, RedoOutlined } from '@ant-design/icons';
import { QuestionFeedback } from '../../types/feedback/types';
import { isSuccessfulAnswer } from '../../types/feedback/status';
import { usePrepState } from '../../hooks/usePrepState';
import { PrepStateManager } from '../../services/PrepStateManager';
import './FeedbackActionBar.css';

interface FeedbackActionBarProps {
  feedback: QuestionFeedback;
  onRetry: () => void;
  onNext: () => void;
  showRetry: boolean;
  prepId: string;
}

export const FeedbackActionBar: React.FC<FeedbackActionBarProps> = ({
  feedback,
  onRetry,
  onNext,
  showRetry,
  prepId
}) => {
  const isSuccess = isSuccessfulAnswer(feedback.evalLevel);
  const prep = usePrepState(prepId);
  const metrics = prep ? PrepStateManager.getHeaderMetrics(prep) : null;

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
        <div className="feedback-metrics">
          {metrics && (
            <div className="metrics-display">
              <div className="metric-item">
                <span className="metric-label">שאלות שנענו:</span>
                <span className="metric-value">{metrics.questionsAnswered}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">ציון:</span>
                <span className="metric-value">{metrics.successRate.toFixed(1)}%</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">התקדמות:</span>
                <span className="metric-value">{metrics.overallProgress.toFixed(1)}%</span>
              </div>
            </div>
          )}
        </div>
        <div className="feedback-action-buttons-container">
          {showRetry && (
            <button className="feedback-action-button feedback-retry-button" onClick={handleRetry}>
              <RedoOutlined className="feedback-button-icon" />
              נסה שוב
            </button>
          )}
          <button 
            className={`feedback-action-button feedback-next-button ${isSuccess ? 'success' : 'error'}`} 
            onClick={handleNext}
          >
            {isSuccess ? 'המשך' : 'הבא'}
            <ArrowLeftOutlined className="feedback-button-icon" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackActionBar; 