import React, { useState } from 'react';
import { Typography, Progress, Button } from 'antd';
import { LockOutlined, GoogleOutlined, BookOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { 
  Question, 
  QuestionType,
  DatabaseQuestion
} from '../../types/question';
import { 
  QuestionFeedback,
  isBasicFeedback,
  LimitedQuestionFeedback
} from '../../types/feedback/types';
import { BinaryEvalLevel } from '../../types/feedback/levels';
import { getFeedbackColor, getFeedbackTitle } from '../../utils/feedbackStyles';
import { getFeedbackStatus } from '../../types/feedback/status';
import { AuthForms } from '../Auth/AuthForms';
import { MultipleChoiceFeedbackHeader } from './MultipleChoiceFeedbackHeader';
import { QuestionSubmission } from '../../types/submissionTypes';
import { JoinEZpassPlusDialog } from '../dialogs/JoinEZpassPlusDialog';

const { Text, Title } = Typography;

interface LimitedFeedbackContainerProps {
  question: Question;
  feedback: LimitedQuestionFeedback;
  selectedAnswer?: string;
  onShowUpgradeModal: () => void;
  isGuest: boolean;
}

export const LimitedFeedbackContainer: React.FC<LimitedFeedbackContainerProps> = ({
  question,
  feedback,
  selectedAnswer,
  onShowUpgradeModal,
  isGuest
}) => {
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const isMultipleChoice = question.metadata.type === QuestionType.MULTIPLE_CHOICE;

  const handleJoinClick = () => {
    setShowJoinDialog(true);
  };

  if (isGuest) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="guest-feedback-container"
      >
        <div className="guest-feedback-content">
          <Text className="guest-feedback-message">
            התחבר כדי לקבל משוב מפורט על התשובות שלך
          </Text>
          <div className="guest-feedback-auth">
            <AuthForms returnUrl={window.location.pathname} googleOnly />
          </div>
        </div>

        <style>
          {`
            .guest-feedback-container {
              background: white;
              border-radius: 12px;
              border: 1px solid #e5e7eb;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
              padding: 32px;
              text-align: center;
              margin: 20px 0;
            }

            .guest-feedback-content {
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 24px;
            }

            .guest-feedback-message {
              font-size: 18px;
              color: #374151;
              font-weight: 500;
            }

            .guest-feedback-auth {
              margin-top: 8px;
            }
          `}
        </style>
      </motion.div>
    );
  }

  // Create a mock submission for the header
  const mockSubmission: QuestionSubmission = {
    questionId: question.id,
    answer: {
      finalAnswer: selectedAnswer ? {
        type: 'multiple_choice',
        value: parseInt(selectedAnswer) as 1 | 2 | 3 | 4
      } : undefined,
      solution: { 
        text: selectedAnswer || '',
        format: 'markdown'
      }
    },
    metadata: {
      submittedAt: Date.now(),
      timeSpentMs: 0,
      helpRequested: false
    },
    feedback: {
      data: feedback,
      receivedAt: Date.now()
    }
  };

  // For logged-in users, show the header and blurred explanation
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="premium-feedback-container"
    >
      {isMultipleChoice && (
        <MultipleChoiceFeedbackHeader
          question={question}
          submission={mockSubmission}
          feedback={feedback}
        />
      )}

      <div className="feedback-preview-section">
        <div className="feedback-content">
          <div className="explanation-header">
            <Title level={5} className="explanation-title">
              <BookOutlined /> הסבר
            </Title>
          </div>
          {/* Blurred explanation area */}
          <div className="preview-content">
            <div className="preview-text">
              <p className="preview-paragraph-text">ההסבר המפורט מראה כיצד לגשת לפתרון השאלה בצורה מובנית ושיטתית.</p>
              <p className="preview-paragraph-text">נתחיל בניתוח הנתונים העיקריים:</p>
              <ul className="preview-list">
                <li className="preview-list-text">• ראשית, נבחן את המשמעות של כל מושג בשאלה</li>
                <li className="preview-list-text">• לאחר מכן, נראה את הקשר בין המרכיבים השונים</li>
                <li className="preview-list-text">• לבסוף, נסביר מדוע התשובה שנבחרה היא הנכונה</li>
              </ul>
            </div>
          </div>
          
          {/* Clear upgrade message */}
          <div className="upgrade-message">
            <Text strong className="upgrade-text">
              הצטרף לאיזיפס+ וקבל הסברים מפורטים לתשובות
            </Text>
            <Button 
              type="primary" 
              className="preview-upgrade-button"
              onClick={handleJoinClick}
            >
              הצטרף עכשיו
            </Button>
          </div>
        </div>
      </div>

      <JoinEZpassPlusDialog 
        open={showJoinDialog}
        onClose={() => setShowJoinDialog(false)}
      />

      <style>
        {`
          .premium-feedback-container {
            position: relative;
            margin: 20px 0;
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .feedback-preview-section {
            position: relative;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid #e5e7eb;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          }

          .feedback-content {
            position: relative;
            padding: 20px;
          }

          .explanation-header {
            margin-bottom: 12px;
            padding: 0 4px;
          }

          .explanation-title {
            margin: 0 !important;
            color: #111827 !important;
            font-size: 18px !important;
            font-weight: 600 !important;
            display: flex !important;
            align-items: center !important;
            gap: 8px !important;
          }

          .explanation-title svg {
            font-size: 18px;
            color: #6b7280;
          }

          .preview-content {
            filter: blur(2px);
            user-select: none;
            opacity: 0.7;
            margin-bottom: 16px;
            background: white;
            padding: 16px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
          }

          .preview-text {
            color: #4b5563;
            font-size: 16px;
            line-height: 1.5;
          }

          .preview-paragraph-text {
            margin-bottom: 12px;
            color: #4b5563;
          }

          .preview-list {
            list-style: none;
            padding-right: 16px;
            margin: 12px 0;
          }

          .preview-list-text {
            margin-bottom: 8px;
            color: #4b5563;
          }

          .preview-paragraph {
            display: none;
          }

          .preview-list-item {
            display: none;
          }

          .upgrade-message {
            text-align: center;
            padding: 16px 24px;
            background: #f8fafc;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
            position: relative;
            z-index: 2;
            margin: 0 auto;
            max-width: 100%;
          }

          .upgrade-text {
            font-size: 16px;
            color: #1e293b;
            font-weight: 500;
          }

          .preview-upgrade-button {
            background: #2563eb;
            border: none;
            height: 40px;
            padding: 0 24px;
            font-size: 14px;
            font-weight: 500;
            border-radius: 20px;
            box-shadow: 0 1px 2px rgba(37, 99, 235, 0.2);
            transition: all 0.2s ease;
            color: white;
          }

          .preview-upgrade-button:hover {
            background: #1d4ed8;
            transform: translateY(-1px);
            box-shadow: 0 2px 4px rgba(37, 99, 235, 0.3);
          }
        `}
      </style>
    </motion.div>
  );
}; 