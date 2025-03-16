import React, { useState } from 'react';
import { Typography, Progress, Button, Divider } from 'antd';
import { LockOutlined, GoogleOutlined, BookOutlined, RocketOutlined, StarOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import styled from 'styled-components';
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

const { Text, Title, Paragraph } = Typography;

// Styled components for enhanced feedback display
const FeedbackWrapper = styled(motion.div)`
  margin: 24px 0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
`;

const GuestFeedbackContainer = styled.div`
  background: linear-gradient(to bottom, #ffffff, #f8fafc);
  padding: 32px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
`;

const GuestMessage = styled(Text)`
  font-size: 18px;
  color: #334155;
  font-weight: 500;
  max-width: 400px;
  margin: 0 auto;
`;

const AuthContainer = styled.div`
  margin-top: 8px;
  width: 100%;
  max-width: 320px;
`;

const PremiumFeedbackContainer = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
`;

const PreviewSection = styled.div`
  position: relative;
  background: white;
  overflow: hidden;
`;

const ExplanationHeader = styled.div`
  padding: 16px 24px;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
`;

const ExplanationTitle = styled(Title)`
  margin: 0 !important;
  color: #1e293b !important;
  font-size: 18px !important;
  font-weight: 600 !important;
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  
  svg {
    color: #3b82f6;
  }
`;

const PreviewContent = styled.div`
  filter: blur(3px);
  user-select: none;
  opacity: 0.7;
  padding: 24px;
  background: white;
  position: relative;
`;

const PreviewText = styled.div`
  color: #475569;
  font-size: 16px;
  line-height: 1.6;
`;

const PreviewParagraph = styled.p`
  margin-bottom: 16px;
  color: #475569;
`;

const PreviewList = styled.ul`
  list-style: none;
  padding-right: 20px;
  margin: 16px 0;
`;

const PreviewListItem = styled.li`
  margin-bottom: 10px;
  position: relative;
  
  &:before {
    content: "•";
    position: absolute;
    right: -20px;
    color: #3b82f6;
  }
`;

const UpgradeSection = styled.div`
  padding: 24px;
  background: linear-gradient(to bottom, #f1f5f9, #ffffff);
  border-top: 1px solid #e2e8f0;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
`;

const UpgradeMessage = styled(Text)`
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 4px !important;
`;

const UpgradeDescription = styled(Paragraph)`
  color: #64748b;
  font-size: 16px;
  max-width: 500px;
  margin: 0 auto 16px !important;
`;

const UpgradeButton = styled(Button)`
  height: 44px;
  font-size: 16px;
  font-weight: 600;
  padding: 0 24px;
  background: linear-gradient(90deg, #3b82f6, #2563eb);
  border: none;
  box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2);
  
  &:hover {
    background: linear-gradient(90deg, #2563eb, #1d4ed8);
    transform: translateY(-1px);
    box-shadow: 0 6px 8px rgba(37, 99, 235, 0.25);
  }
`;

const BenefitsList = styled.div`
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-top: 8px;
  flex-wrap: wrap;
`;

const BenefitItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #475569;
  font-size: 14px;
  
  svg {
    color: #3b82f6;
  }
`;

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
      <FeedbackWrapper
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <GuestFeedbackContainer>
          <GuestMessage>
            התחבר כדי לקבל משוב מפורט על התשובות שלך
          </GuestMessage>
          <AuthContainer>
            <AuthForms returnUrl={window.location.pathname} googleOnly />
          </AuthContainer>
        </GuestFeedbackContainer>
      </FeedbackWrapper>
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
    <FeedbackWrapper
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <PremiumFeedbackContainer>
        {isMultipleChoice && (
          <MultipleChoiceFeedbackHeader
            question={question}
            submission={mockSubmission}
            feedback={feedback}
          />
        )}

        <PreviewSection>
          <ExplanationHeader>
            <ExplanationTitle level={5}>
              <BookOutlined /> הסבר מפורט
            </ExplanationTitle>
          </ExplanationHeader>
          
          {/* Blurred explanation area */}
          <PreviewContent>
            <PreviewText>
              <PreviewParagraph>
                ההסבר המפורט מראה כיצד לגשת לפתרון השאלה בצורה מובנית ושיטתית.
              </PreviewParagraph>
              <PreviewParagraph>
                נתחיל בניתוח הנתונים העיקריים:
              </PreviewParagraph>
              <PreviewList>
                <PreviewListItem>ראשית, נבחן את המשמעות של כל מושג בשאלה</PreviewListItem>
                <PreviewListItem>לאחר מכן, נראה את הקשר בין המרכיבים השונים</PreviewListItem>
                <PreviewListItem>נסביר את הדרך לפתרון ואת השלבים המתמטיים</PreviewListItem>
                <PreviewListItem>לבסוף, נסביר מדוע התשובה שנבחרה היא הנכונה</PreviewListItem>
              </PreviewList>
              <PreviewParagraph>
                בנוסף, נציג טיפים ודגשים חשובים שיעזרו לך להתמודד עם שאלות דומות בעתיד.
              </PreviewParagraph>
            </PreviewText>
          </PreviewContent>
          
          {/* Upgrade section */}
          <UpgradeSection>
            <UpgradeMessage>
              <LockOutlined style={{ marginLeft: 8 }} /> שדרג לאיזיפס+ וקבל הסברים מפורטים
            </UpgradeMessage>
            <UpgradeDescription>
              קבל גישה להסברים מפורטים, פתרונות מלאים וניתוח מעמיק של כל שאלה
            </UpgradeDescription>
            
            <BenefitsList>
              <BenefitItem>
                <StarOutlined /> הסברים מפורטים
              </BenefitItem>
              <BenefitItem>
                <CheckCircleOutlined /> פתרונות מלאים
              </BenefitItem>
              <BenefitItem>
                <RocketOutlined /> טיפים לשיפור
              </BenefitItem>
            </BenefitsList>
            
            <UpgradeButton 
              type="primary" 
              size="large"
              onClick={handleJoinClick}
              icon={<RocketOutlined />}
            >
              הצטרף עכשיו
            </UpgradeButton>
          </UpgradeSection>
        </PreviewSection>
      </PremiumFeedbackContainer>

      <JoinEZpassPlusDialog 
        open={showJoinDialog}
        onClose={() => setShowJoinDialog(false)}
      />
    </FeedbackWrapper>
  );
}; 