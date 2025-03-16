import React, { useRef } from 'react';
import { Question, QuestionType } from '../../types/question';
import { 
  QuestionFeedback, 
  BasicQuestionFeedback,
  DetailedQuestionFeedback,
  LimitedQuestionFeedback,
  isBasicFeedback, 
  isDetailedFeedback,
  isLimitedFeedback
} from '../../types/feedback/types';
import { QuestionSubmission } from '../../types/submissionTypes';
import { MultipleChoiceFeedback } from './MultipleChoiceFeedback';
import { DetailedFeedback } from './DetailedFeedback';
import { Card, Space, Button, Typography, Progress, Tooltip } from 'antd';
import { InfoCircleOutlined, CheckCircleOutlined, LockOutlined } from '@ant-design/icons';
import { logger } from '../../utils/logger';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { motion } from 'framer-motion';
import { usePracticeAttempts } from '../../contexts/PracticeAttemptsContext';
import { AuthModal } from '../../components/Auth/AuthModal';
import { JoinEZPassPlusMessage } from './JoinEZPassPlusMessage';
import { getFeedbackColor, getFeedbackTitle } from '../../utils/feedbackStyles';
import { LimitedFeedbackContainer } from './LimitedFeedbackContainer';
import { useAuth } from '../../contexts/AuthContext';
import './Feedback.css';

const { Text, Title } = Typography;

interface FeedbackContainerProps {
  question: Question;
  submission: QuestionSubmission;
  isLimitedFeedback?: boolean;
}

// This component shows the restricted version of feedback for free-tier users
const LimitedFeedback: React.FC<{ 
  feedback: QuestionFeedback;
  question: Question;
  selectedAnswer?: string;
}> = ({ feedback, question, selectedAnswer }) => {
  const isMultipleChoice = question.metadata.type === QuestionType.MULTIPLE_CHOICE;
  
  return (
    <div className="limited-feedback">
      {/* Clear Header Section */}
      <div className="feedback-header">
        <Progress
          type="circle"
          percent={feedback.score}
          format={(percent) => `${percent}%`}
          width={60}
          strokeColor={getFeedbackColor(feedback.evalLevel)}
        />
        <div className="feedback-title-section">
          <Title level={4} className="feedback-title">
            {getFeedbackTitle(feedback.score, feedback.evalLevel)}
          </Title>
          {/* Show the feedback message which already contains the properly formatted answer */}
          <Text className="feedback-message">
            {feedback.message}
          </Text>
        </div>
      </div>

      {/* Blurred Preview Section */}
      <div className="feedback-preview-section">
        <div className="feedback-content preview">
          {/* Fake content structure that's blurred */}
          <div className="preview-content">
            <div className="preview-paragraph" />
            <div className="preview-paragraph short" />
            <div className="preview-paragraph" />
            {isMultipleChoice && (
              <>
                <div className="preview-list-item" />
                <div className="preview-list-item" />
                <div className="preview-list-item" />
              </>
            )}
          </div>
          
          {/* Upgrade overlay */}
          <div className="upgrade-overlay">
            <LockOutlined className="lock-icon" />
            <Text strong className="upgrade-text">
              {isMultipleChoice ? 
                'הסברים מפורטים על התשובה הנכונה' :
                'ניתוח מפורט וטיפים לשיפור'
              }
            </Text>
            <Text className="upgrade-subtext">
              הצטרף ל-EZPass+ כדי לקבל גישה מלאה
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
};

export const FeedbackContainer: React.FC<FeedbackContainerProps> = ({
  question,
  submission,
  isLimitedFeedback = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const isGuest = !user;

  // Safety check - if no feedback data, don't render anything
  if (!submission.feedback?.data) {
    return null;
  }

  // If limited feedback is requested or user has exceeded their limit, show limited feedback
  if (isLimitedFeedback) {
    return (
      <LimitedFeedbackContainer
        question={question}
        feedback={submission.feedback.data as LimitedQuestionFeedback}
        selectedAnswer={submission.answer.finalAnswer?.type === 'multiple_choice' ? 
          String(submission.answer.finalAnswer.value) : 
          submission.answer.solution.text}
        onShowUpgradeModal={() => window.open('https://ezpass.co.il/plus', '_blank')}
        isGuest={isGuest}
      />
    );
  }

  // For multiple choice questions with basic feedback
  if (question.metadata.type === QuestionType.MULTIPLE_CHOICE && isBasicFeedback(submission.feedback.data)) {
    return (
      <MultipleChoiceFeedback
        question={question}
        submission={submission}
      />
    );
  }

  // For other question types with detailed feedback
  if (isDetailedFeedback(submission.feedback.data)) {
    return <DetailedFeedback feedback={submission.feedback.data} question={question} />;
  }

  // Fallback to limited feedback for basic feedback
  return (
    <LimitedFeedbackContainer
      question={question}
      feedback={submission.feedback.data as LimitedQuestionFeedback}
      selectedAnswer={submission.answer.finalAnswer?.type === 'multiple_choice' ? 
        String(submission.answer.finalAnswer.value) : 
        submission.answer.solution.text}
      onShowUpgradeModal={() => window.open('https://ezpass.co.il/plus', '_blank')}
      isGuest={isGuest}
    />
  );
};