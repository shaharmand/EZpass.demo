import React from 'react';
import { Typography, Progress, Button, Modal } from 'antd';
import { LockOutlined, StarOutlined, TrophyOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { 
  Question, 
  QuestionType
} from '../../types/question';
import { 
  QuestionFeedback,
  isBasicFeedback,
  isDetailedFeedback
} from '../../types/feedback/types';
import { 
  BinaryEvalLevel,
  DetailedEvalLevel
} from '../../types/feedback/levels';
import { getFeedbackColor, getFeedbackTitle } from '../../utils/feedbackStyles';
import { usePracticeAttempts } from '../../contexts/PracticeAttemptsContext';
import { getFeedbackStatus } from '../../types/feedback/status';

const { Text, Title } = Typography;

interface LimitedFeedbackContainerProps {
  question: Question;
  feedback: QuestionFeedback;
  selectedAnswer?: string;
  onShowUpgradeModal: () => void;
  mode?: 'guest' | 'limited';
}

export const LimitedFeedbackContainer: React.FC<LimitedFeedbackContainerProps> = ({
  question,
  feedback,
  selectedAnswer,
  onShowUpgradeModal,
  mode = 'limited'
}) => {
  const { 
    attemptsCount, 
    MAX_DETAILED_FEEDBACK_ATTEMPTS: totalAllowed,
    userAttemptsCount
  } = usePracticeAttempts();

  const isMultipleChoice = question.metadata.type === QuestionType.MULTIPLE_CHOICE;
  const correctAnswerIndex = isMultipleChoice && question.schoolAnswer?.finalAnswer?.type === 'multiple_choice' ? 
    question.schoolAnswer.finalAnswer.value - 1 : -1;
  const correctAnswerText = correctAnswerIndex >= 0 ? 
    question.content.options?.[correctAnswerIndex]?.text : '';

  return (
    <div className="limited-feedback">
      {/* Progress Bar - Only show for limited users */}
      {mode === 'limited' && (
        <div className="feedback-progress">
          <div className="progress-text">
            <Text>נותרו לך {totalAllowed - userAttemptsCount} משובים מפורטים</Text>
            <Text type="secondary">מתוך {totalAllowed} המשובים החינמיים</Text>
          </div>
          <Progress 
            percent={(userAttemptsCount / totalAllowed) * 100} 
            showInfo={false}
            strokeColor="#2563eb"
            trailColor="#e2e8f0"
            strokeWidth={8}
          />
        </div>
      )}

      {/* Score and Basic Feedback - Only show for limited users */}
      {mode === 'limited' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="feedback-header"
        >
          <Progress
            type="circle"
            percent={feedback.score}
            format={(percent) => `${percent}%`}
            width={60}
            strokeColor={getFeedbackColor(getFeedbackStatus(feedback.score))}
          />
          <div className="feedback-title-section">
            <Title level={4} className="feedback-title">
              {getFeedbackTitle(feedback.score, feedback.evalLevel)}
            </Title>
            {/* For multiple choice, show correct answer */}
            {isMultipleChoice && isBasicFeedback(feedback) && (
              <Text className="feedback-basic-result">
                {feedback.evalLevel === BinaryEvalLevel.CORRECT ? 
                  'תשובה נכונה!' : 
                  `התשובה הנכונה היא: ${correctAnswerText}`
                }
              </Text>
            )}
            {/* For other questions, show just the message */}
            {!isMultipleChoice && (
              <Text className="feedback-message">
                {feedback.message}
              </Text>
            )}
          </div>
        </motion.div>
      )}

      {/* Blurred Preview Section - Show for both guest and limited */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="feedback-preview-section"
      >
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
          
          {/* Upgrade overlay with different messages for guest vs limited */}
          <motion.div 
            className="upgrade-overlay"
            whileHover={{ 
              scale: 1.02,
              transition: { duration: 0.2 }
            }}
            onClick={onShowUpgradeModal}
          >
            <LockOutlined className="lock-icon" />
            <Text strong className="upgrade-text">
              {mode === 'guest' ? (
                'צור חשבון חינמי כדי לראות את התוצאה שלך'
              ) : (
                isMultipleChoice ? 
                  'הסברים מפורטים על התשובה הנכונה' :
                  'ניתוח מפורט וטיפים לשיפור'
              )}
            </Text>
            <Text className="upgrade-subtext">
              {mode === 'guest' ? 
                'קבל גישה ל-5 משובים מפורטים חינם' :
                'הצטרף ל-EZPass+ כדי לקבל גישה מלאה'
              }
            </Text>
            <Button type="primary" className="preview-upgrade-button">
              {mode === 'guest' ? 'צור חשבון חינמי' : 'שדרג עכשיו'}
            </Button>
          </motion.div>
        </div>
      </motion.div>

      <style>
        {`
          .limited-feedback {
            position: relative;
          }

          .feedback-progress {
            margin-bottom: 20px;
            background: #f8fafc;
            padding: 16px;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
          }

          .progress-text {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
          }

          .feedback-header {
            width: 100%;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 24px;
          }

          .preview-content {
            padding: 20px;
            opacity: 0.7;
          }

          .preview-paragraph {
            height: 16px;
            background: #e5e7eb;
            border-radius: 4px;
            margin-bottom: 12px;
            width: 100%;
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
          }

          .feedback-content.preview {
            position: relative;
            overflow: hidden;
            filter: blur(3px);
            user-select: none;
          }

          .upgrade-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.98) 100%);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 24px;
            text-align: center;
            backdrop-filter: blur(8px);
            border-radius: 12px;
            border: 1px solid #e5e7eb;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            cursor: pointer;
            transition: all 0.3s ease;
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
            margin-bottom: 16px;
          }

          .preview-upgrade-button {
            background: #2563eb;
            border: none;
            height: 40px;
            padding: 0 24px;
            font-size: 16px;
            border-radius: 20px;
            box-shadow: 0 2px 4px rgba(37, 99, 235, 0.1);
          }
        `}
      </style>
    </div>
  );
}; 