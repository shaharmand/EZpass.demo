import React, { useEffect } from 'react';
import { Card, Space, Typography, Divider, Progress } from 'antd';
import { CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons';
import { Question, QuestionFeedback, FeedbackMessages } from '../../types/question';
import ReactMarkdown from 'react-markdown';
import { logger } from '../../utils/logger';
import { motion } from 'framer-motion';

const { Text, Title } = Typography;

interface MultipleChoiceFeedbackProps {
  question: Question;
  feedback: QuestionFeedback;
}

export const MultipleChoiceFeedback: React.FC<MultipleChoiceFeedbackProps> = ({
  question,
  feedback,
}) => {
  useEffect(() => {
    logger.info('Rendering multiple choice feedback', {
      questionId: question.id,
      isCorrect: feedback.isCorrect,
      score: feedback.score,
      feedbackLength: feedback.coreFeedback.length
    });
  }, [question.id, feedback]);

  // Get the selected and correct answer texts
  const selectedOption = question.options?.[parseInt(feedback.answer || '1') - 1]?.text || '';
  const correctOption = question.options?.[question.correctOption ? question.correctOption - 1 : 0]?.text || '';

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#10b981';
    if (score >= 80) return '#3b82f6';
    if (score >= 70) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="multiple-choice-feedback">
      {/* Score Display */}
      <div className="score-display">
        <div className="score-circle">
          <Progress
            type="circle"
            percent={feedback.score}
            format={(percent) => `${percent}%`}
            width={80}
            strokeColor={getScoreColor(feedback.score)}
          />
        </div>
        <div className="score-text">
          <Title level={4} className={feedback.isCorrect ? 'success' : 'error'}>
            {feedback.isCorrect ? 'תשובה נכונה!' : 'תשובה שגויה'}
          </Title>
          <Text>{feedback.assessment.replace(/^(תשובה נכונה!?|תשובה שגויה\.?)\s*/i, '')}</Text>
        </div>
      </div>

      {/* Answer Comparison */}
      <div className="answer-comparison">
        {!feedback.isCorrect ? (
          <div className="answer-item">
            <div className="answer-box incorrect">
              <div className="answer-header">
                <CloseCircleFilled className="error-icon" />
                <Text strong>התשובה שלך:</Text>
              </div>
              <div className="answer-content">
                <ReactMarkdown>{selectedOption}</ReactMarkdown>
              </div>
            </div>
            <div className="answer-box correct">
              <div className="answer-header">
                <CheckCircleFilled className="success-icon" />
                <Text strong>התשובה הנכונה:</Text>
              </div>
              <div className="answer-content">
                <ReactMarkdown>{correctOption}</ReactMarkdown>
              </div>
            </div>
          </div>
        ) : (
          <div className="answer-item single-answer">
            <div className="answer-box correct">
              <div className="answer-header">
                <CheckCircleFilled className="success-icon" />
                <Text strong>התשובה שלך:</Text>
              </div>
              <div className="answer-content">
                <ReactMarkdown>{selectedOption}</ReactMarkdown>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Explanation */}
      <div className="feedback-details">
        <div className="detailed-feedback">
          <ReactMarkdown>{feedback.coreFeedback}</ReactMarkdown>
        </div>
      </div>

      <style>
        {`
          .multiple-choice-feedback {
            padding: 12px;
            background: #ffffff;
            border-radius: 12px;
            display: grid;
            grid-template-columns: minmax(0, 1fr);
            gap: 16px;
          }

          .score-display {
            display: flex;
            align-items: center;
            gap: 24px;
            padding: 20px;
            background: #f8fafc;
            border-radius: 12px;
            border: 1px solid #e5e7eb;
          }

          .score-circle {
            flex-shrink: 0;
          }

          .score-text {
            flex: 1;
          }

          .score-text h4 {
            margin: 0 0 8px 0;
            font-size: 26px;
            font-weight: 600;
            line-height: 1.2;
          }

          .score-text h4.success {
            color: #10b981;
            background: linear-gradient(45deg, #10b981, #34d399);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }

          .score-text h4.error {
            color: #ef4444;
            background: linear-gradient(45deg, #ef4444, #f87171);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }

          .score-text .ant-typography {
            color: #64748b;
            font-size: 15px;
            line-height: 1.5;
          }

          /* Make the score circle match the new hierarchy */
          :global(.ant-progress-text) {
            font-size: 24px !important;
            font-weight: 600 !important;
          }

          .answer-comparison {
            margin-top: 8px;
          }

          .answer-item {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 12px;
          }

          .answer-item.single-answer {
            grid-template-columns: minmax(0, 1fr);
          }

          .answer-box {
            padding: 12px;
            border-radius: 8px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            display: flex;
            flex-direction: column;
            gap: 8px;
            min-width: 0;
          }

          .answer-header {
            display: flex;
            align-items: center;
            gap: 8px;
            padding-bottom: 8px;
            border-bottom: 1px solid rgba(0,0,0,0.05);
            font-size: 14px;
            white-space: nowrap;
          }

          .answer-content {
            padding: 8px;
            font-size: 15px;
            line-height: 1.5;
            overflow-wrap: break-word;
            min-height: 24px;
            display: flex;
            align-items: center;
          }

          .answer-box.correct {
            background: #f0fdf4;
            border-color: #86efac;
          }

          .answer-box.incorrect {
            background: #fef2f2;
            border-color: #fecaca;
          }

          .success-icon {
            font-size: 16px;
            color: #10b981;
          }

          .error-icon {
            font-size: 16px;
            color: #ef4444;
          }

          .feedback-details {
            background: #f8fafc;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
            padding: 16px;
          }

          .detailed-feedback {
            color: #1f2937;
            font-size: 15px;
          }

          .detailed-feedback p {
            margin: 0;
            line-height: 1.5;
          }
        `}
      </style>
    </div>
  );
}; 