import React, { useEffect } from 'react';
import { Card, Space, Typography, Divider, Button } from 'antd';
import { CheckCircleFilled, CloseCircleFilled, StarOutlined, RedoOutlined } from '@ant-design/icons';
import { Question, QuestionFeedback, FeedbackMessages } from '../../types/question';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { logger } from '../../utils/logger';
import { motion, AnimatePresence } from 'framer-motion';
import { JoinEZPassPlusMessage } from './JoinEZPassPlusMessage';

const { Text, Title } = Typography;

interface MultipleChoiceFeedbackProps {
  question: Question;
  feedback: QuestionFeedback;
  selectedAnswer: string;
  showDetailedFeedback?: boolean;
  onRetry?: () => void;
}

export const MultipleChoiceFeedback: React.FC<MultipleChoiceFeedbackProps> = ({
  question,
  feedback,
  selectedAnswer,
  showDetailedFeedback = true,
  onRetry
}) => {
  useEffect(() => {
    // Component mount/update log with more prominent message
    console.log('🎯 MULTIPLE CHOICE FEEDBACK RECEIVED:', {
      questionId: question.id,
      feedbackData: {
        isCorrect: feedback?.isCorrect,
        score: feedback?.score,
        allFeedbackKeys: Object.keys(feedback || {}),
        fullFeedback: feedback // Log the entire feedback object
      },
      questionData: {
        correctOption: question.correctOption,
        totalOptions: question.options?.length,
        options: question.options?.map((opt, idx) => `${idx + 1}: ${opt.text.substring(0, 30)}...`)
      }
    });

    // Log raw incoming data with more detail
    console.log('📝 RAW FEEDBACK DATA:', {
      answer: {
        value: selectedAnswer,
        type: typeof selectedAnswer,
        isValid: typeof selectedAnswer === 'string' ? 
          parseInt(selectedAnswer) >= 1 && parseInt(selectedAnswer) <= 4 : false
      },
      correctOption: {
        value: question.correctOption,
        type: typeof question.correctOption
      },
      isCorrect: feedback?.isCorrect,
      score: feedback?.score,
      fullFeedbackObject: JSON.stringify(feedback, null, 2) // Log stringified feedback for better visibility
    });

    // Get the selected and correct answer texts
    const selectedOptionIndex = parseInt(selectedAnswer || '1') - 1;
    const correctOptionIndex = question.correctOption ? question.correctOption - 1 : 0;

    // Log option processing
    logger.info('Processing options:', {
      selectedOptionRaw: selectedAnswer,
      selectedOptionIndex,
      selectedOptionText: question.options?.[selectedOptionIndex]?.text,
      correctOptionRaw: question.correctOption,
      correctOptionIndex,
      correctOptionText: question.options?.[correctOptionIndex]?.text
    });

    // Log the actual user choice for debugging
    logger.info('User choice debug:', {
      rawAnswer: selectedAnswer,
      rawAnswerType: typeof selectedAnswer,
      parsedAnswer: selectedAnswer ? parseInt(selectedAnswer) : 'no answer provided',
      isNumber: selectedAnswer ? !isNaN(parseInt(selectedAnswer)) : false,
      answerRange: selectedAnswer ? (parseInt(selectedAnswer) >= 1 && parseInt(selectedAnswer) <= 4) : false,
      totalOptions: question.options?.length || 0,
      isCorrect: feedback.isCorrect
    });
  }, [question.id, feedback, question.options, question.correctOption, selectedAnswer]);

  // Get the selected and correct answer texts and numbers - with validation
  const selectedOptionNumber = !isNaN(parseInt(selectedAnswer)) ? parseInt(selectedAnswer) : null;
  const correctOptionNumber = question.correctOption || 0;

  const selectedOption = selectedOptionNumber !== null && question.options && 
    selectedOptionNumber > 0 && selectedOptionNumber <= question.options.length
    ? question.options[selectedOptionNumber - 1]?.text || ''
    : '';
  const correctOption = question.options?.[correctOptionNumber - 1]?.text || '';

  return (
    <div className="multiple-choice-feedback">
      {/* Integrated Title and Answer Section */}
      <div className="feedback-section">
        <div className="title-display">
          <Title level={4} className={feedback.isCorrect ? 'success' : 'error'}>
            {feedback.isCorrect ? 'תשובה נכונה!' : 'תשובה שגויה'}
          </Title>
        </div>

        <div className="answer-comparison">
          {!feedback.isCorrect ? (
            <div className="answer-item">
              <div className="answer-box">
                <div className="answer-label">התשובה שלך</div>
                <div className="answer-content incorrect">
                  <span className="option-number">{selectedOptionNumber}</span>
                  <span className="option-text">{selectedOption}</span>
                </div>
              </div>
              <div className="answer-box">
                <div className="answer-label">התשובה הנכונה</div>
                <div className="answer-content correct">
                  <span className="option-number">{correctOptionNumber}</span>
                  <span className="option-text">{correctOption}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="answer-item single-answer">
              <div className="answer-box">
                <div className="answer-label">התשובה שלך</div>
                <div className="answer-content correct">
                  <span className="option-number">{selectedOptionNumber}</span>
                  <span className="option-text">{selectedOption}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Explanation */}
      <div className="feedback-details">
        <Title level={5} className="explanation-title">הסבר</Title>
        <div className="detailed-feedback">
          {showDetailedFeedback ? (
            <MarkdownRenderer content={feedback.coreFeedback} />
          ) : (
            <div className="limited-feedback">
              <div className="limited-feedback-content">
                <StarOutlined className="star-icon" />
                <Text>הצטרף לאיזיפס פלוס וקבל הסברים מפורטים לתשובה, עזרה והנחיה אישיים ותכני לימוד מותאמים לצרכיך</Text>
                <Button type="primary" className="join-button">
                  הצטרף עכשיו
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>
        {`
          .multiple-choice-feedback {
            padding: 16px;
            background: #ffffff;
            border-radius: 12px;
            display: flex;
            flex-direction: column;
            gap: 20px;
          }

          .feedback-section {
            background: #f8fafc;
            border-radius: 12px;
            border: 1px solid #e5e7eb;
            overflow: hidden;
          }

          .title-display {
            padding: 20px;
            text-align: center;
            border-bottom: 1px solid #e5e7eb;
          }

          .title-display h4 {
            margin: 0;
            font-size: 26px;
            font-weight: 600;
            line-height: 1.2;
          }

          .title-display h4.success {
            color: #10b981;
            background: linear-gradient(45deg, #10b981, #34d399);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }

          .title-display h4.error {
            color: #ef4444;
            background: linear-gradient(45deg, #ef4444, #f87171);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }

          .answer-comparison {
            padding: 16px;
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
            background: #f8fafc;
            border-radius: 8px;
            padding: 12px;
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .answer-label {
            color: #4b5563;
            font-size: 14px;
            font-weight: 500;
          }

          .answer-content {
            padding: 12px;
            font-size: 15px;
            line-height: 1.5;
            display: flex;
            align-items: center;
            gap: 12px;
            border-radius: 6px;
          }

          .answer-content.correct {
            background: #f0fdf4;
            border: 1px solid #86efac;
          }

          .answer-content.incorrect {
            background: #fef2f2;
            border: 1px solid #fecaca;
          }

          .option-number {
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            font-weight: 500;
          }

          .correct .option-number {
            color: #10b981;
            background: #dcfce7;
            border: 1px solid #86efac;
          }

          .incorrect .option-number {
            color: #ef4444;
            background: #fee2e2;
            border: 1px solid #fecaca;
          }

          .option-text {
            flex: 1;
          }

          .correct .option-text {
            color: #10b981;
          }

          .incorrect .option-text {
            color: #ef4444;
          }

          .feedback-details {
            background: #f8fafc;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .explanation-title {
            margin: 0 !important;
            color: #4b5563 !important;
            font-size: 18px !important;
            font-weight: 600 !important;
          }

          .detailed-feedback {
            color: #1f2937;
            font-size: 15px;
            line-height: 1.6;
            padding-top: 4px;
          }

          .detailed-feedback p {
            margin: 0;
          }

          .limited-feedback {
            background: #f0f9ff;
            border-radius: 8px;
            padding: 20px;
          }

          .limited-feedback-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 16px;
            text-align: center;
          }

          .star-icon {
            font-size: 24px;
            color: #3b82f6;
          }

          .join-button {
            height: 40px;
            padding: 0 32px;
            border-radius: 20px;
            font-size: 15px;
            font-weight: 500;
            background: #3b82f6;
            border: none;
            box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
            transition: all 0.3s ease;
          }

          .join-button:hover {
            background: #2563eb;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
          }
        `}
      </style>
    </div>
  );
}; 