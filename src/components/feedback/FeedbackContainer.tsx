import React, { useRef, useEffect } from 'react';
import type { Question, QuestionFeedback } from '../../types/question';
import { MultipleChoiceFeedback } from './MultipleChoiceFeedback';
import { Card, Space, Button, Tabs, Typography, Progress, Tooltip } from 'antd';
import { RedoOutlined, InfoCircleOutlined, CheckCircleOutlined, BookOutlined, ArrowLeftOutlined, StarOutlined } from '@ant-design/icons';
import { logger } from '../../utils/logger';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { motion, AnimatePresence } from 'framer-motion';

const { Text, Title } = Typography;

interface FeedbackContainerProps {
  question: Question;
  feedback: QuestionFeedback;
  onRetry?: () => void;
  onNext: () => void;
  selectedAnswer?: string;
}

const getScoreColor = (score: number) => {
  if (score >= 90) return '#10b981';
  if (score >= 80) return '#3b82f6';
  if (score >= 70) return '#f59e0b';
  return '#ef4444';
};

const getFeedbackTitle = (score: number, isCorrect: boolean) => {
  if (score >= 95) return 'מדהים! תשובה מושלמת!';
  if (score >= 90) return 'כל הכבוד! עבודה מצוינת!';
  if (score >= 80) return 'יופי! תשובה טובה מאוד';
  if (score >= 70) return 'כמעט שם... עוד קצת מאמץ';
  return 'אל דאגה, ננסה שוב יחד';
};

export const FeedbackContainer: React.FC<FeedbackContainerProps> = ({
  question,
  feedback,
  onRetry,
  onNext,
  selectedAnswer
}) => {
  const feedbackRef = useRef<HTMLDivElement>(null);

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
          <Text className="feedback-assessment">
            {feedback.assessment}
          </Text>
        </div>
      </div>
    </div>
  );

  return (
    <div ref={feedbackRef} className="feedback-container">
      {question.type === 'multiple_choice' ? (
        <MultipleChoiceFeedback
          question={question}
          feedback={feedback}
          selectedAnswer={selectedAnswer || ''}
        />
      ) : (
        <>
          {renderFeedbackHeader()}
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
                    </div>
                  )
                },
                {
                  key: 'detailed',
                  label: (
                    <span className="tab-label">
                      <BookOutlined /> רוצה להבין יותר?
                    </span>
                  ),
                  children: (
                    <div className="feedback-section">
                      <MarkdownRenderer content={feedback.detailedFeedback || 'אין ניתוח מעמיק זמין.'} />
                    </div>
                  )
                },
                {
                  key: 'solution',
                  label: (
                    <span className="tab-label">
                      <StarOutlined /> תשובת בית-ספר
                    </span>
                  ),
                  children: (
                    <div className="feedback-section">
                      <div className="solution-header">
                        <InfoCircleOutlined className="info-icon" />
                        <Tooltip title="כאן תוכל/י למצוא את הפתרון המלא כפי שהיה נכתב בספר לימוד או במדריך למורה. זה יכול לעזור להבין את דרך החשיבה המצופה.">
                          <Text>פתרון מלא</Text>
                        </Tooltip>
                      </div>
                      {question.solution ? (
                        <>
                          <div className="solution-steps">
                            <MarkdownRenderer content={question.solution.text} />
                          </div>
                          {question.solution.answer && (
                            <div className="final-answer">
                              <Text strong>התשובה הרשמית:</Text>
                              <div className="final-answer-content">
                                <MarkdownRenderer content={question.solution.answer} />
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <Text>אין פתרון זמין כרגע.</Text>
                      )}
                    </div>
                  )
                }
              ]}
            />
          </div>
        </>
      )}

      <div className="action-buttons-container">
        <div className="action-buttons">
          {shouldShowRetry && (
            <Button
              type="primary"
              icon={<RedoOutlined />}
              onClick={handleRetry}
              size="large"
              className="retry-button"
            >
              נסה שוב
            </Button>
          )}
          <Button
            type={isHighScore ? "primary" : "default"}
            onClick={onNext}
            size="large"
            icon={<ArrowLeftOutlined />}
            className={`next-button ${isHighScore ? 'high-score' : 'low-score'}`}
          >
            המשך לשאלה הבאה
          </Button>
        </div>
      </div>

      <style>
        {`
          .feedback-container {
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            overflow: hidden;
            display: flex;
            flex-direction: column;
          }

          .feedback-header {
            padding: 24px;
            border-bottom: 1px solid #e5e7eb;
            background: ${feedback.isCorrect ? '#f0fdf4' : '#fef2f2'};
          }

          .feedback-header-content {
            display: flex;
            gap: 24px;
            align-items: center;
          }

          .score-section {
            flex-shrink: 0;
          }

          .feedback-title-section {
            flex-grow: 1;
          }

          .feedback-title {
            margin: 0 !important;
            padding: 0 !important;
            color: ${feedback.isCorrect ? '#059669' : '#dc2626'} !important;
            font-weight: 600;
            font-size: 20px !important;
            line-height: 1.3 !important;
          }

          .feedback-assessment {
            display: block;
            margin-top: 8px;
            color: #4b5563;
            font-size: 15px;
            line-height: 1.5;
          }

          .feedback-content {
            padding: 24px 20px;
          }

          .feedback-tabs {
            margin-top: 0;
          }

          .feedback-tabs .ant-tabs-nav {
            margin-bottom: 16px;
            background: #f8fafc;
            padding: 8px 8px 0;
            border-radius: 8px;
          }

          .feedback-tabs .ant-tabs-tab {
            margin: 0 4px;
            padding: 12px 20px;
            font-size: 15px;
            border-radius: 8px 8px 0 0;
            background: #f3f4f6;
            border: 1px solid #e5e7eb;
            border-bottom: none;
          }

          .feedback-tabs .ant-tabs-tab-active {
            background: white !important;
            border-color: #e5e7eb !important;
          }

          .tab-label {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 15px;
            color: #4b5563;
          }

          .ant-tabs-tab-active .tab-label {
            color: #2563eb;
            font-weight: 500;
          }

          .feedback-section {
            padding: 20px;
            background: #f8fafc;
            border-radius: 12px;
            font-size: 15px;
            line-height: 1.6;
            border: 1px solid #e5e7eb;
          }

          .solution-steps {
            color: #1f2937;
          }

          .final-answer {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
          }

          .final-answer-content {
            margin-top: 8px;
            padding: 12px 16px;
            background: white;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
            color: #1f2937;
            font-weight: 500;
          }

          .action-buttons-container {
            padding: 12px 16px;
            border-top: 1px solid #e5e7eb;
            display: flex;
            justify-content: space-between;
          }

          .action-buttons {
            display: flex;
            gap: 12px;
            flex-direction: row;
            width: 100%;
            justify-content: ${shouldShowRetry ? 'space-between' : 'flex-end'};
          }

          .retry-button {
            height: 40px;
            min-width: 140px;
            border-radius: 20px;
            font-size: 15px;
            font-weight: 500;
            background: #2563eb;
            border: none;
            color: white;
            box-shadow: 0 2px 8px rgba(37, 99, 235, 0.2);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .retry-button:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
            background: #2563eb;
          }

          .next-button {
            height: 40px;
            min-width: 160px;
            border-radius: 20px;
            font-size: 15px;
            font-weight: 500;
            transition: all 0.3s ease;
          }

          .next-button.high-score {
            background: linear-gradient(45deg, #059669, #10b981);
            border: none;
            color: white;
            box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2);
          }

          .next-button.high-score:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
            background: linear-gradient(45deg, #047857, #059669);
          }

          .next-button.low-score {
            background: #f3f4f6;
            border: 1px solid #d1d5db;
            color: #6b7280;
          }

          .next-button.low-score:hover {
            background: #e5e7eb;
            border-color: #9ca3af;
            color: #4b5563;
            transform: translateY(-1px);
          }

          .solution-header {
            margin-bottom: 16px;
            padding: 12px 16px;
            background: #f0f9ff;
            border-radius: 8px;
            border: 1px solid #bae6fd;
            color: #0369a1;
            font-size: 14px;
            line-height: 1.5;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .info-icon {
            font-size: 16px;
            color: #0369a1;
          }
        `}
      </style>
    </div>
  );
}; 