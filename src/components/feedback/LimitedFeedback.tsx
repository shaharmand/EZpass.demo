import React from 'react';
import { Question } from '../../types/question';
import { QuestionSubmission } from '../../types/submissionTypes';
import { Button } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { LimitedQuestionFeedback } from '../../types/feedback/types';

interface LimitedFeedbackProps {
  question: Question;
  submission: QuestionSubmission;
  onViewHistory: () => void;
  onShowUpgradeModal: () => void;
  isGuest: boolean;
}

export const LimitedFeedback: React.FC<LimitedFeedbackProps> = ({
  question,
  submission,
  onViewHistory,
  onShowUpgradeModal,
  isGuest
}) => {
  const feedback = submission.feedback?.data as LimitedQuestionFeedback;
  const selectedAnswer = submission.answer.finalAnswer?.type === 'multiple_choice' 
    ? String(submission.answer.finalAnswer.value) 
    : submission.answer.solution.text;

  return (
    <div className="limited-feedback">
      <div className="limited-feedback-content">
        <h3>משוב מוגבל</h3>
        <p>התשובה שלך נשמרה בהצלחה.</p>
        <div className="feedback-actions">
          <Button type="primary" onClick={onViewHistory}>
            <InfoCircleOutlined />
            <span>הצג היסטוריה</span>
          </Button>
          {isGuest && (
            <Button type="primary" onClick={onShowUpgradeModal}>
              <InfoCircleOutlined />
              <span>הצטרף ל-EZPass+</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}; 