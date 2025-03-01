import React, { useRef, useEffect } from 'react';
import type { Question, QuestionFeedback } from '../../types/question';
import { MultipleChoiceFeedback } from './MultipleChoiceFeedback';
import { RubricFeedback } from './RubricFeedback';
import { Card, Space, Button, Tabs, Typography, Progress, Tooltip } from 'antd';
import { RedoOutlined, InfoCircleOutlined, CheckCircleOutlined, BookOutlined, ArrowLeftOutlined, StarOutlined } from '@ant-design/icons';
import { logger } from '../../utils/logger';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { motion, AnimatePresence } from 'framer-motion';
import { usePracticeAttempts } from '../../contexts/PracticeAttemptsContext';
import { AuthModal } from '../../components/Auth/AuthModal';
import { JoinEZPassPlusMessage } from './JoinEZPassPlusMessage';

const { Text, Title } = Typography;

interface FeedbackContainerProps {
  question: Question;
  feedback: QuestionFeedback;
  onRetry?: () => void;
  onNext: () => void;
  selectedAnswer?: string;
  showDetailedFeedback?: boolean;
}

const getFeedbackTitle = (score: number, isCorrect: boolean) => {
  if (score >= 90) return 'מצוין! 🎉';
  if (score >= 80) return 'כל הכבוד! 👏';
  if (score >= 60) return 'טוב! 👍';
  return 'המשך להתאמן 💪';
};

const getScoreColor = (score: number) => {
  if (score >= 90) return '#10b981';
  if (score >= 80) return '#3b82f6';
  if (score >= 60) return '#f59e0b';
  return '#ef4444';
};

export const FeedbackContainer: React.FC<FeedbackContainerProps> = ({
  question,
  feedback,
  onRetry,
  onNext,
  selectedAnswer,
  showDetailedFeedback = true
}) => {
  const feedbackRef = useRef<HTMLDivElement>(null);
  const { isGuestLimitExceeded } = usePracticeAttempts();
  const [showAuthModal, setShowAuthModal] = React.useState(false);

  useEffect(() => {
    if (feedbackRef.current) {
      const yOffset = -20;
      const y = feedbackRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }, [feedback]);

  const handleRetry = () => {
    logger.info('User clicked retry button', {
      questionId: question.id,
      feedbackType: question.type,
      wasCorrect: feedback.isCorrect,
      score: feedback.score
    });
    onRetry?.();
  };

  const shouldShowRetry = feedback.score < 80 && onRetry;
  const isHighScore = feedback.score >= 80;

  const renderFeedbackHeader = () => (
    <div className="feedback-header">
      <div className="feedback-header-content">
        <div className="score-section">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
          >
            <Progress
              type="circle"
              percent={feedback.score}
              format={(percent) => `${percent}%`}
              width={60}
              strokeColor={getScoreColor(feedback.score)}
            />
          </motion.div>
        </div>
        <div className="feedback-title-section">
          <Title level={4} className="feedback-title">
            {getFeedbackTitle(feedback.score, feedback.isCorrect)}
          </Title>
          {showDetailedFeedback && (
            <Text className="feedback-assessment">
              {feedback.assessment}
            </Text>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div ref={feedbackRef} className="feedback-container">
      {isGuestLimitExceeded ? (
        <>
          <div className="feedback-header guest-limit">
            <div className="feedback-header-content">
              <div className="feedback-title-section centered">
                <Title level={4} className="feedback-title neutral">
                  המשוב שלך מוכן!
                </Title>
                <Text className="feedback-assessment centered">
                  {question.type === 'multiple_choice' ? 
                    'התחבר כדי לצפות במשוב המלא כולל הסברים מפורטים למה נבחרה התשובה הנכונה' :
                    'התחבר כדי לצפות במשוב המלא ולקבל ניתוח מפורט של התשובה שלך'
                  }
                </Text>
              </div>
            </div>
          </div>
          <div className="guest-limit-container">
            <Button 
              type="primary" 
              size="large"
              onClick={() => setShowAuthModal(true)}
              className="guest-limit-button"
            >
              התחבר כדי לצפות במשוב
            </Button>
            {showAuthModal && (
              <AuthModal 
                open={true}
                onClose={() => setShowAuthModal(false)}
                returnUrl={window.location.pathname}
              />
            )}
          </div>
        </>
      ) : (
        <>
          {question.type === 'multiple_choice' ? (
            <MultipleChoiceFeedback
              question={question}
              feedback={feedback}
              selectedAnswer={selectedAnswer || ''}
              showDetailedFeedback={showDetailedFeedback}
              onRetry={onRetry}
            />
          ) : (
            <>
              {renderFeedbackHeader()}
              {showDetailedFeedback ? (
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
                            {feedback.rubricScores && (
                              <RubricFeedback 
                                rubricScores={feedback.rubricScores}
                                rubricAssessment={question.evaluation?.rubricAssessment}
                              />
                            )}
                          </div>
                        )
                      }
                    ]}
                  />
                </div>
              ) : (
                <JoinEZPassPlusMessage 
                  variant="full" 
                  questionType={question.type === 'code' ? 'other' : 'other'} 
                />
              )}
            </>
          )}
        </>
      )}

      <style>
        {`
          .feedback-container {
            width: 100%;
            max-width: 800px;
            margin: 0 auto;
          }

          .feedback-header {
            width: 100%;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
          }

          .feedback-header-content {
            display: flex;
            align-items: center;
            gap: 24px;
          }

          .score-section {
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .feedback-title-section {
            flex: 1;
          }

          .feedback-title {
            margin: 0 !important;
            font-size: 24px !important;
            color: #1f2937 !important;
          }

          .feedback-assessment {
            color: #4b5563;
            font-size: 15px;
            margin-top: 4px;
            display: block;
          }

          .feedback-content {
            background: #ffffff;
            border-radius: 12px;
            border: 1px solid #e5e7eb;
            overflow: hidden;
          }

          .feedback-tabs {
            padding: 16px;
          }

          .tab-label {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
          }

          .feedback-section {
            padding: 16px;
            background: #f8fafc;
            border-radius: 8px;
          }

          .guest-limit .feedback-title-section {
            text-align: center;
          }

          .guest-limit .feedback-title {
            color: #4b5563 !important;
            margin-bottom: 8px !important;
          }

          .guest-limit .feedback-assessment {
            text-align: center;
          }

          .guest-limit-container {
            display: flex;
            justify-content: center;
            margin-top: 24px;
          }

          .guest-limit-button {
            height: 44px;
            padding: 0 32px;
            font-size: 16px;
          }
        `}
      </style>
    </div>
  );
}; 