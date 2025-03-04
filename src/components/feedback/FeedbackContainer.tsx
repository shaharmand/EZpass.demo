import React, { useRef, useEffect, useState } from 'react';
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
import { 
  DetailedEvalLevel,
  BinaryEvalLevel
} from '../../types/feedback/levels';
import {
  FeedbackStatus,
  getFeedbackStatus
} from '../../types/feedback/status';
import { MultipleChoiceFeedback } from './MultipleChoiceFeedback';
import { RubricFeedback } from './RubricFeedback';
import { Card, Space, Button, Tabs, Typography, Progress, Tooltip } from 'antd';
import { InfoCircleOutlined, CheckCircleOutlined, LockOutlined } from '@ant-design/icons';
import { logger } from '../../utils/logger';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { motion } from 'framer-motion';
import { usePracticeAttempts } from '../../contexts/PracticeAttemptsContext';
import { AuthModal } from '../../components/Auth/AuthModal';
import { JoinEZPassPlusMessage } from './JoinEZPassPlusMessage';
import { getFeedbackColor, getFeedbackTitle } from '../../utils/feedbackStyles';
import { LimitedFeedbackContainer } from './LimitedFeedbackContainer';

const { Text, Title } = Typography;

interface FeedbackContainerProps {
  question: Question;
  feedback: QuestionFeedback;
  selectedAnswer?: string;
  showDetailedFeedback?: boolean;
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

      <style>
        {`
          .limited-feedback {
            position: relative;
          }

          .feedback-preview-section {
            position: relative;
            margin-top: 16px;
          }

          .preview-content {
            padding: 20px;
          }

          .preview-paragraph {
            height: 16px;
            background: #e5e7eb;
            border-radius: 4px;
            margin-bottom: 12px;
            width: 100%;
            opacity: 0.7;
          }

          .preview-paragraph.short {
            width: 70%;
          }

          .preview-list-item {
            height: 12px;
            background: #e5e7eb;
            border-radius: 4px;
            margin-bottom: 8px;
            width: 90%;
            opacity: 0.5;
          }

          .feedback-content.preview {
            position: relative;
            overflow: hidden;
            filter: blur(3px);
            user-select: none;
            pointer-events: none;
          }

          .upgrade-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(180deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.95) 100%);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 24px;
            text-align: center;
            backdrop-filter: blur(8px);
            border-radius: 12px;
            border: 1px solid #e5e7eb;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            transition: all 0.3s ease;
          }

          .upgrade-overlay:hover {
            background: linear-gradient(180deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.98) 100%);
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            transform: translateY(-1px);
          }

          .lock-icon {
            font-size: 32px;
            color: #2563eb;
            margin-bottom: 16px;
          }

          .upgrade-text {
            font-size: 18px;
            color: #1f2937;
            margin-bottom: 8px;
          }

          .upgrade-subtext {
            color: #6b7280;
            font-size: 14px;
          }
        `}
      </style>
    </div>
  );
};

const DetailedFeedback: React.FC<{ 
  feedback: DetailedQuestionFeedback;
  question: Question;
}> = ({ feedback, question }) => {
  return (
    <div className="detailed-feedback">
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
          <Text className="feedback-message">
            {feedback.message}
          </Text>
        </div>
      </div>
      <div className="feedback-content">
        <Tabs 
          defaultActiveKey="core"
          type="card"
          className="feedback-tabs"
          items={[
            {
              key: 'core',
              label: (
                <span className="tab-label">
                  <CheckCircleOutlined /> המשוב שלך
                </span>
              ),
              children: (
                <div className="feedback-section">
                  <MarkdownRenderer content={feedback.coreFeedback} />
                  {feedback.criteriaFeedback && question.evaluationGuidelines?.requiredCriteria && (
                    <RubricFeedback 
                      rubricScores={feedback.criteriaFeedback.reduce((acc, curr) => ({
                        ...acc,
                        [curr.criterionName]: {
                          score: curr.score,
                          feedback: curr.feedback
                        }
                      }), {})}
                      rubricAssessment={{
                        criteria: question.evaluationGuidelines.requiredCriteria
                      }}
                    />
                  )}
                </div>
              )
            }
          ]}
        />
      </div>
    </div>
  );
};

export const FeedbackContainer: React.FC<FeedbackContainerProps> = ({
  question,
  feedback,
  selectedAnswer,
  showDetailedFeedback = true
}) => {
  const { getFeedbackMode } = usePracticeAttempts();
  const feedbackMode = getFeedbackMode();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUpgradeMessage, setShowUpgradeMessage] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Create a submission object from the props
  const submission: QuestionSubmission = {
    questionId: question.id,
    answer: {
      finalAnswer: question.metadata.type === QuestionType.MULTIPLE_CHOICE ? {
        type: 'multiple_choice',
        value: parseInt(selectedAnswer || '1') as 1 | 2 | 3 | 4
      } : undefined,
      solution: {
        text: selectedAnswer || '',
        format: 'markdown'
      }
    },
    feedback: {
      data: feedback,
      receivedAt: Date.now()
    },
    metadata: {
      submittedAt: Date.now(),
      timeSpentMs: 0,
      helpRequested: false
    }
  };

  // For guests who haven't signed up
  if (feedbackMode === 'none') {
    return (
      <>
        <LimitedFeedbackContainer 
          feedback={feedback as LimitedQuestionFeedback}
          question={question}
          selectedAnswer={selectedAnswer}
          onShowUpgradeModal={() => {}}
          mode="guest"
        />
        <AuthModal
          open={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      </>
    );
  }

  // For users who exceeded their free feedback limit
  if (feedbackMode === 'limited') {
    return (
      <LimitedFeedbackContainer 
        feedback={feedback as LimitedQuestionFeedback}
        question={question}
        selectedAnswer={selectedAnswer}
        onShowUpgradeModal={() => {}}
        mode="limited"
      />
    );
  }

  // For users with remaining feedback attempts or paid users
  // First check if it's a multiple choice question and basic feedback
  if (question.metadata.type === QuestionType.MULTIPLE_CHOICE && isBasicFeedback(feedback)) {
    return (
      <MultipleChoiceFeedback
        question={question}
        submission={submission}
        showDetailedFeedback={showDetailedFeedback}
      />
    );
  }

  // For other question types, show detailed feedback if available
  if (isDetailedFeedback(feedback)) {
    return <DetailedFeedback feedback={feedback} question={question} />;
  }

  // For basic feedback, show the limited feedback view
  return (
    <LimitedFeedbackContainer
      question={question}
      feedback={feedback as LimitedQuestionFeedback}
      selectedAnswer={selectedAnswer}
      onShowUpgradeModal={() => window.open('https://ezpass.co.il/plus', '_blank')}
      mode="limited"
    />
  );
};